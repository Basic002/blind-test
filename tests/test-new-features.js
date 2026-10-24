const { io } = require('socket.io-client');
const { THEMES } = require('../src/config/themes');
const { getTracksForTheme } = require('../src/services/deezerService');
const { ANIME_CATALOG } = require('../src/config/animeCatalog');
const { DISNEY_CATALOG } = require('../src/config/disneyCatalog');

async function runTests() {
  console.log('========================================================');
  console.log('🧪 TEST DES NOUVELLES FONCTIONNALITÉS DU BLIND TEST');
  console.log('========================================================\n');

  // 1. Vérification des nouvelles catégories dans THEMES
  console.log('1. Vérification des catégories 80s FR et 2000s FR...');
  const theme80FR = THEMES.find(t => t.id === '80s-fr');
  const theme2000FR = THEMES.find(t => t.id === '2000s-fr');

  if (!theme80FR) throw new Error('Thème 80s-fr manquant dans THEMES !');
  if (!theme2000FR) throw new Error('Thème 2000s-fr manquant dans THEMES !');
  console.log(`   ✅ Thème 80s-fr trouvé : "${theme80FR.name}" (${theme80FR.playlistId})`);
  console.log(`   ✅ Thème 2000s-fr trouvé : "${theme2000FR.name}" (${theme2000FR.playlistId})`);

  // 2. Vérification de l'expansion des catalogues Anime et Disney
  console.log('\n2. Vérification des bases de données Anime et Disney...');
  console.log(`   Catalog Anime : ${ANIME_CATALOG.length} morceaux (attendu > 50)`);
  console.log(`   Catalog Disney : ${DISNEY_CATALOG.length} morceaux (attendu > 50)`);
  if (ANIME_CATALOG.length < 50) throw new Error('Catalogue Anime insuffisant');
  if (DISNEY_CATALOG.length < 50) throw new Error('Catalogue Disney insuffisant');
  console.log('   ✅ Catalogues agrandis avec succès !');

  // 3. Chargement réel des playlists 80s FR et 2000s FR
  console.log('\n3. Chargement des morceaux 80s FR et 2000s FR...');
  const tracks80 = await getTracksForTheme('80s-fr');
  const tracks2000 = await getTracksForTheme('2000s-fr');
  console.log(`   ✅ 80s FR : ${tracks80.length} morceaux récupérés.`);
  console.log(`   ✅ 2000s FR : ${tracks2000.length} morceaux récupérés.`);

  // 4. Test du serveur Socket.IO : Quitter en pleine partie (Hôte) & Musique jusqu'à la fin du timer
  console.log('\n4. Démarrage de la simulation serveur...');
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
  p1.emit('join_room', { roomCode: roomData.roomCode, nickname: 'Testeur', avatar: '⚡' });
  await new Promise(r => p1.on('join_success', r));
  console.log('   ✅ Joueur Testeur connecté');

  // Test 4A: Musique qui continue jusqu'à la fin du timer (même si tout le monde a répondu)
  console.log('\n5. Test : La musique continue quand tout le monde a répondu...');
  host.emit('update_settings', { themeId: '80s-fr', totalRounds: 2, roundDuration: 3, revealDuration: 2 });
  host.emit('start_game');

  const [hostRound1, p1Round1] = await Promise.all([
    new Promise(r => host.once('round_start_host', r)),
    new Promise(r => p1.once('round_start_player', r))
  ]);

  const answerStart = Date.now();
  // Player answers immediately (after 100ms)
  setTimeout(() => {
    p1.emit('submit_answer', { optionId: p1Round1.options[0].id, clientTimestamp: Date.now() });
  }, 100);

  // Measure time until round_ended_host is emitted
  const hostRevealData = await new Promise(r => host.once('round_ended_host', r));
  const elapsed = Date.now() - answerStart;
  console.log(`   Temps écoulé avant la fin de manche : ${elapsed}ms (durée configurée : 3000ms)`);
  if (elapsed < 2800) {
    throw new Error(`La manche s'est terminée trop vite (${elapsed}ms). La musique n'a pas continué jusqu'au bout du timer !`);
  }
  console.log('   ✅ La musique continue jusqu\'à la fin du chrono même avec toutes les réponses soumises !');

  // Test 4B: Host quitte en pleine partie
  console.log('\n6. Test : L\'hôte quitte en pleine partie...');
  // Wait for round 2 to start
  await new Promise(r => host.once('round_start_host', r));
  console.log('   Manche 2 en cours...');

  const backToLobbyPromise = Promise.all([
    new Promise(r => host.once('back_to_lobby', r)),
    new Promise(r => p1.once('back_to_lobby', r))
  ]);

  // Host emits host_quit_game
  host.emit('host_quit_game');

  await backToLobbyPromise;
  console.log('   ✅ Hôte et Joueur sont retournés avec succès au salon d\'attente (back_to_lobby reçu) !');

  host.disconnect();
  p1.disconnect();

  console.log('\n🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !');
  process.exit(0);
}

runTests().catch(err => {
  console.error('\n❌ ERREUR LORS DU TEST :', err);
  process.exit(1);
});
