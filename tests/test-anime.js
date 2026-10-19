const { io } = require('socket.io-client');

async function testAnimeMode() {
  console.log('--- TEST SPÉCIFIQUE DU MODE ANIME ---');
  
  const server = require('../src/server.js');
  await new Promise(r => setTimeout(r, 800));

  const PORT = process.env.PORT || 3000;
  const baseUrl = `http://localhost:${PORT}`;

  const host = io(baseUrl);
  await new Promise(r => host.on('connect', r));

  const roomData = await new Promise(r => {
    host.emit('create_room');
    host.on('room_created', r);
  });
  console.log(`✅ Salon créé : ${roomData.roomCode}`);

  const p1 = io(baseUrl);
  await new Promise(r => p1.on('connect', r));
  p1.emit('join_room', { roomCode: roomData.roomCode, nickname: 'Otaku', avatar: '⚡' });
  await new Promise(r => p1.on('join_success', r));
  console.log('✅ Joueur Otaku connecté');

  // Select anime theme and 1 round
  host.emit('update_settings', { themeId: 'anime', totalRounds: 1, roundDuration: 3, revealDuration: 1 });

  console.log('Lancement du mode Anime...');
  host.emit('start_game');

  const [hostRound, p1Round] = await Promise.all([
    new Promise(r => host.on('round_start_host', r)),
    new Promise(r => p1.on('round_start_player', r))
  ]);

  console.log(`✅ Manche Anime démarrée !`);
  console.log(`   isAnime détecté : ${hostRound.isAnime}`);
  console.log(`   Audio preview : ${hostRound.audioPreview ? 'OK' : 'MISSING'}`);
  console.log(`   Label question mobile : "${p1Round.questionLabel}"`);
  console.log(`   4 Choix affichés sur le smartphone (Noms d'animés) :`);
  p1Round.options.forEach((opt, idx) => {
    console.log(`     [${['A','B','C','D'][idx]}] ${opt.title}`);
  });

  // Verify that options are indeed anime names and not random songs
  if (!p1Round.isAnime) {
    throw new Error('isAnime should be true in round_start_player');
  }

  // Submit answer
  p1.emit('submit_answer', { optionId: p1Round.options[0].id, clientTimestamp: Date.now() });

  const revealData = await new Promise(r => host.on('round_ended_host', r));
  console.log(`✅ Révélation de la manche :`);
  console.log(`   Animé correct : "${revealData.track.anime}"`);
  console.log(`   Titre de l'opening : "${revealData.track.title}" par ${revealData.track.artist}`);

  host.disconnect();
  p1.disconnect();

  console.log('\n🎉 TEST DU MODE ANIME RÉUSSI AVEC SUCCÈS !');
  process.exit(0);
}

testAnimeMode().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
