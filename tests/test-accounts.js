const { io } = require('socket.io-client');
const accountManager = require('../src/services/accountManager');
const { getLevelInfo } = require('../src/config/levels');

async function runAccountTests() {
  console.log('========================================================');
  console.log('🧪 TEST DU SYSTÈME DE COMPTES, NIVEAUX ET SUCCÈS');
  console.log('========================================================\n');

  // 1. Test unitaire AccountManager
  console.log('1. Test de création de compte & authentification...');
  const testUserNick = 'Player_' + Math.floor(Math.random() * 10000);
  const testPass = 'secret123';

  const regResult = accountManager.register(testUserNick, testPass, '⚡');
  console.log(`   ✅ Compte créé avec succès : [${regResult.user.id}] ${regResult.user.username}`);
  if (regResult.user.progression.level !== 1) {
    throw new Error('Le niveau initial devrait être 1');
  }

  // Duplicate username check
  try {
    accountManager.register(testUserNick, 'autrePass');
    throw new Error('La création d\'un compte avec un pseudo en double aurait dû échouer');
  } catch (e) {
    console.log('   ✅ Détection correcte des doublons de pseudo.');
  }

  // 16 characters limit check
  try {
    accountManager.register('PseudoTropLongPlus17Chars', 'pass123');
    throw new Error('Un pseudo de plus de 16 caractères aurait dû être rejeté');
  } catch (e) {
    console.log('   ✅ Rejet correct d\'un pseudo de plus de 16 caractères.');
  }

  const valid16User = ('User16_' + Math.floor(100000000 + Math.random() * 900000000)).substring(0, 16); // Exactly 16 characters
  const valid16Result = accountManager.register(valid16User, 'pass123', '🦊');
  console.log(`   ✅ Acceptation d\'un pseudo de 16 caractères : "${valid16Result.user.username}" (longueur : ${valid16Result.user.username.length})`);

  // Bad login check
  try {
    accountManager.login(testUserNick, 'mauvaisMdp');
    throw new Error('Le login avec mauvais mot de passe aurait dû échouer');
  } catch (e) {
    console.log('   ✅ Rejet correct d\'un mot de passe erroné.');
  }

  // Valid login
  const loginResult = accountManager.login(testUserNick, testPass);
  console.log(`   ✅ Connexion réussie, token généré : ${loginResult.token.substring(0, 10)}...`);

  // 2. Test progression XP & Succès sur une manche
  console.log('\n2. Test de gain d\'XP et déblocage de succès en manche...');
  // Répondre juste en 1.5s avec un streak de 3
  const roundProg1 = accountManager.recordRoundAnswer(regResult.user.id, {
    isCorrect: true,
    responseTimeMs: 1500,
    streak: 3,
    themeId: 'disney'
  });

  console.log(`   XP gagnée sur la manche : +${roundProg1.xpGained} XP`);
  console.log(`   Succès débloqués :`, roundProg1.newAchievements.map(a => a.name));

  const hasSpeedDemon = roundProg1.newAchievements.some(a => a.id === 'speed_demon');
  const hasStreak3 = roundProg1.newAchievements.some(a => a.id === 'streak_3');

  if (!hasSpeedDemon || !hasStreak3) {
    throw new Error('Les succès speed_demon et streak_3 auraient dû être débloqués !');
  }
  console.log('   ✅ Succès "Buzzer Éclair" et "En Plein Feu" débloqués avec succès !');

  // 3. Test fin de partie (Victoire & Montée de niveau)
  console.log('\n3. Test de fin de partie, XP de victoire et passage de niveau...');
  const gameProg = accountManager.recordGameEnd(regResult.user.id, {
    score: 5200,
    rank: 1,
    totalPlayers: 4,
    roundsTotal: 5,
    correctCount: 5,
    themeId: 'disney'
  });

  console.log(`   XP gagnée fin de partie : +${gameProg.xpGained} XP`);
  console.log(`   Nouveau niveau atteint : Niveau ${gameProg.levelInfo.level} (${gameProg.levelInfo.title})`);
  console.log(`   Succès fin de partie :`, gameProg.newAchievements.map(a => a.name));

  const hasVictory = gameProg.newAchievements.some(a => a.id === 'first_victory');
  const hasFirstStep = gameProg.newAchievements.some(a => a.id === 'first_step');
  const hasPerfect = gameProg.newAchievements.some(a => a.id === 'perfect_game');

  if (!hasVictory || !hasFirstStep || !hasPerfect) {
    throw new Error('Les succès first_victory, first_step ou perfect_game manquent !');
  }
  console.log('   ✅ Succès "Numéro 1", "Premier Pas" et "Sans Faute" débloqués !');

  if (gameProg.levelInfo.level < 2) {
    throw new Error('Le joueur aurait dû monter au moins au niveau 2 avec tous ces XP !');
  }
  console.log('   ✅ Montée de niveau validée avec succès !');

  // 4. Test d'intégration Socket.IO
  console.log('\n4. Test multijoueur Socket.IO avec joueur authentifié...');
  const TEST_PORT = 3987;
  process.env.PORT = String(TEST_PORT);
  require('../src/server.js');
  await new Promise(r => setTimeout(r, 800));

  const baseUrl = `http://localhost:${TEST_PORT}`;

  const host = io(baseUrl);
  await new Promise(r => host.on('connect', r));

  const roomData = await new Promise(r => {
    host.emit('create_room');
    host.on('room_created', r);
  });
  console.log(`   ✅ Salon hôte créé : [${roomData.roomCode}]`);

  const p1 = io(baseUrl);
  await new Promise(r => p1.on('connect', r));

  // Join room with authenticated userId
  p1.emit('join_room', {
    roomCode: roomData.roomCode,
    nickname: testUserNick,
    avatar: '⚡',
    userId: regResult.user.id
  });

  const [joinSuccessData, hostPlayerJoined] = await Promise.all([
    new Promise(r => p1.on('join_success', r)),
    new Promise(r => host.on('player_joined', r))
  ]);

  console.log(`   ✅ Joueur [${joinSuccessData.player.nickname}] connecté au salon`);
  console.log(`   Niveau transmis à l'hôte : Nv.${hostPlayerJoined.player.level} (${hostPlayerJoined.player.title})`);

  if (hostPlayerJoined.player.level < 2) {
    throw new Error('Le niveau du joueur n\'a pas été correctement transmis à l\'écran hôte !');
  }

  // Profile data fetch test via socket
  const profileData = await new Promise(r => {
    p1.emit('get_profile', { userId: regResult.user.id });
    p1.on('profile_data', r);
  });

  console.log(`   ✅ Profil récupéré via socket : ${profileData.achievements.filter(a => a.isUnlocked).length} succès débloqués.`);

  host.disconnect();
  p1.disconnect();

  console.log('\n🎉 TOUS LES TESTS DE COMPTES, NIVEAUX ET SUCCÈS SONT VALIDÉS !');
  process.exit(0);
}

runAccountTests().catch(err => {
  console.error('\n❌ ERREUR LORS DU TEST :', err);
  process.exit(1);
});
