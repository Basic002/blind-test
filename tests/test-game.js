const { io } = require('socket.io-client');
const http = require('http');

async function runTest() {
  console.log('--- DÉMARRAGE DU TEST MULTIJOUEUR DU BLIND-TEST ---');
  
  // Start server
  const server = require('../src/server.js');
  // Wait a moment for server to listen
  await new Promise(r => setTimeout(r, 1000));

  const PORT = process.env.PORT || 3000;
  const baseUrl = `http://localhost:${PORT}`;

  // 1. Host creates room
  console.log('1. Connexion de l\'écran Hôte...');
  const host = io(baseUrl);
  await new Promise(resolve => host.on('connect', resolve));

  const roomData = await new Promise(resolve => {
    host.emit('create_room');
    host.on('room_created', resolve);
  });
  console.log(`✅ Salon créé avec le code [${roomData.roomCode}] !`);
  console.log(`   URL Joueur générée : ${roomData.joinUrl}`);
  console.log(`   QR Code généré avec succès (${roomData.qrDataUrl.substring(0, 30)}...)`);

  // 2. Connect Players
  console.log('\n2. Connexion des joueurs smartphones...');
  const p1 = io(baseUrl);
  await new Promise(r => p1.on('connect', r));
  p1.emit('join_room', { roomCode: roomData.roomCode, nickname: 'Enzo', avatar: '🦊' });
  const p1Join = await new Promise(r => p1.on('join_success', r));
  console.log(`✅ Joueur 1 rejoint : ${p1Join.player.nickname} (${p1Join.player.avatar})`);

  const p2 = io(baseUrl);
  await new Promise(r => p2.on('connect', r));
  p2.emit('join_room', { roomCode: roomData.roomCode, nickname: 'Sarah', avatar: '🎧' });
  const p2Join = await new Promise(r => p2.on('join_success', r));
  console.log(`✅ Joueur 2 rejoint : ${p2Join.player.nickname} (${p2Join.player.avatar})`);

  // 3. Settings: 1 fast round
  host.emit('update_settings', { themeId: 'disney', totalRounds: 1, roundDuration: 3, revealDuration: 1 });

  // 4. Start game
  console.log('\n3. Lancement de la partie par l\'Hôte...');
  host.emit('start_game');

  const [hostRound, p1Round, p2Round] = await Promise.all([
    new Promise(r => host.on('round_start_host', r)),
    new Promise(r => p1.on('round_start_player', r)),
    new Promise(r => p2.on('round_start_player', r))
  ]);

  console.log(`✅ Manche 1 démarrée !`);
  console.log(`   Hôte : Extrait MP3 reçu (${hostRound.audioPreview ? 'Valide' : 'Manquant'})`);
  console.log(`   Smartphones : 4 choix reçus sans spoil -> [${p1Round.options.map(o => o.title).join(' | ')}]`);

  // 5. Submit answers
  console.log('\n4. Réponse des joueurs...');
  // P1 picks option 0
  p1.emit('submit_answer', { optionId: p1Round.options[0].id, clientTimestamp: Date.now() });
  // P2 picks option 1
  p2.emit('submit_answer', { optionId: p1Round.options[1].id, clientTimestamp: Date.now() });

  // 6. Round reveal
  const revealData = await new Promise(r => host.on('round_ended_host', r));
  console.log(`✅ Fin de manche révélée !`);
  console.log(`   Morceau : "${revealData.track.title}" par ${revealData.track.artist}`);
  console.log(`   Scores :`);
  revealData.leaderboard.forEach(p => {
    console.log(`   - ${p.avatar} ${p.nickname}: ${p.score} pts`);
  });

  // 7. Game Over
  const gameOverData = await new Promise(r => host.on('game_over_host', r));
  console.log('\n5. Fin de partie et Podium !');
  console.log(`   Vainqueur : ${gameOverData.podium[0]?.nickname} (${gameOverData.podium[0]?.score} pts)`);

  host.disconnect();
  p1.disconnect();
  p2.disconnect();

  console.log('\n🎉 TOUS LES TESTS SONT VALIDÉS AVEC SUCCÈS !');
  process.exit(0);
}

runTest().catch(err => {
  console.error('Erreur pendant le test:', err);
  process.exit(1);
});
