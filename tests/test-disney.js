const { io } = require('socket.io-client');
const { THEMES } = require('../src/config/themes');
const { getTracksForTheme } = require('../src/services/deezerService');

async function testDisneyMode() {
  console.log('--- TEST DU NOUVEAU MODE DISNEY & DE LA CATÉGORIE ROCK/MÉTAL ---');
  
  // 1. Verify Rock/Métal theme in themes config
  const rockTheme = THEMES.find(t => t.id === 'rock');
  console.log(`1. Vérification thème Rock : Nom="${rockTheme?.name}", PlaylistId="${rockTheme?.playlistId}"`);
  if (rockTheme?.name !== 'Rock/Métal') {
    throw new Error('Le thème Rock devrait s\'appeler Rock/Métal');
  }

  // Check if Rock/Métal tracks load
  console.log('   Chargement des morceaux Rock/Métal...');
  const rockTracks = await getTracksForTheme('rock');
  console.log(`   ✅ Morceaux Rock/Métal chargés : ${rockTracks.length} pistes.`);

  // 2. Test Disney Mode simulation
  console.log('\n2. Démarrage de la simulation multijoueur Disney...');
  const PORT = process.env.PORT || 3000;
  const http = require('http');
  const isRunning = await new Promise(resolve => {
    const req = http.get(`http://localhost:${PORT}`, () => resolve(true));
    req.on('error', () => resolve(false));
  });

  if (!isRunning) {
    require('../src/server.js');
    await new Promise(r => setTimeout(r, 800));
  } else {
    console.log(`   (Serveur déjà actif sur http://localhost:${PORT})`);
  }
  const baseUrl = `http://localhost:${PORT}`;

  const host = io(baseUrl);
  await new Promise(r => host.on('connect', r));

  const roomData = await new Promise(r => {
    host.emit('create_room');
    host.on('room_created', r);
  });
  console.log(`   ✅ Salon créé : [${roomData.roomCode}]`);

  const p1 = io(baseUrl);
  await new Promise(r => p1.on('connect', r));
  p1.emit('join_room', { roomCode: roomData.roomCode, nickname: 'MickeyFan', avatar: '🏰' });
  await new Promise(r => p1.on('join_success', r));
  console.log('   ✅ Joueur MickeyFan connecté');

  // Select Disney theme, 1 round, fast timer
  host.emit('update_settings', { themeId: 'disney', totalRounds: 1, roundDuration: 3, revealDuration: 1 });

  console.log('\n3. Lancement de la manche Disney...');
  host.emit('start_game');

  const [hostRound, p1Round] = await Promise.all([
    new Promise(r => host.on('round_start_host', r)),
    new Promise(r => p1.on('round_start_player', r))
  ]);

  console.log(`   ✅ Manche Disney démarrée !`);
  console.log(`      isDisney détecté : ${hostRound.isDisney}`);
  console.log(`      Extrait audio preview : ${hostRound.audioPreview ? 'OK' : 'MANQUANT'}`);
  console.log(`      Question affichée sur la manette : "${p1Round.questionLabel}"`);
  console.log(`      4 Choix sur le smartphone (Noms de films Disney) :`);
  p1Round.options.forEach((opt, idx) => {
    console.log(`        [${['A','B','C','D'][idx]}] ${opt.title}`);
  });

  if (!p1Round.isDisney) {
    throw new Error('isDisney doit être vrai pour la manche Disney');
  }

  // Submit answer
  p1.emit('submit_answer', { optionId: p1Round.options[0].id, clientTimestamp: Date.now() });

  const revealData = await new Promise(r => host.on('round_ended_host', r));
  console.log(`\n4. Révélation de la manche :`);
  console.log(`   Film Disney correct : "${revealData.track.disney}"`);
  console.log(`   Titre de la chanson : "${revealData.track.title}" par ${revealData.track.artist}`);

  if (!revealData.track.disney) {
    throw new Error('revealData.track.disney doit être renseigné');
  }

  host.disconnect();
  p1.disconnect();

  console.log('\n🎉 TOUS LES TESTS SONT VALIDÉS AVEC SUCCÈS !');
  process.exit(0);
}

testDisneyMode().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
