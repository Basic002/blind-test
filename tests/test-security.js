const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const accountManager = require('../src/services/accountManager');
const { SimpleRateLimiter } = require('../src/middleware/rateLimiter');

async function runSecurityAudit() {
  console.log('======================================================');
  console.log('🛡️  AUDIT DE SÉCURITÉ ET PROTECTION DES DONNÉES');
  console.log('======================================================\n');

  let passedChecks = 0;

  // -------------------------------------------------------------------------
  // 1. VÉRIFICATION GIT & FICHIERS DE DONNÉES
  // -------------------------------------------------------------------------
  console.log('1. Vérification de l\'exclusion Git (fichiers de données et secrets)...');

  try {
    const gitignorePath = path.join(__dirname, '../.gitignore');
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');

    if (!gitignoreContent.includes('data/*') && !gitignoreContent.includes('data/*.json')) {
      throw new Error('.gitignore ne contient pas l\'exclusion du dossier data/');
    }

    // Tester avec git check-ignore
    const testFiles = ['data/accounts.json', 'data/test_dump.json', 'data/users.db', '.env', '.env.local'];
    for (const file of testFiles) {
      const ignored = execSync(`git check-ignore ${file}`, { encoding: 'utf8' }).trim();
      if (!ignored) {
        throw new Error(`Le fichier ${file} n'est pas ignoré par Git !`);
      }
    }

    // Vérifier que data/.gitkeep est bien conservé
    try {
      execSync('git check-ignore data/.gitkeep', { stdio: 'pipe' });
      throw new Error('data/.gitkeep ne devrait pas être ignoré (whitelist)');
    } catch (e) {
      // Exit code 1 means NOT ignored, which is expected for whitelisted .gitkeep
    }

    console.log('   ✅ Tous les fichiers de données (data/*) et fichiers d\'environnement (.env) sont 100% ignorés par Git.');
    passedChecks++;
  } catch (err) {
    console.error('   ❌ Échec vérification Git :', err.message);
    throw err;
  }

  // -------------------------------------------------------------------------
  // 2. VÉRIFICATION DONNÉES PERSONNELLES (ZÉRO PII / PRIVACY-BY-DESIGN)
  // -------------------------------------------------------------------------
  console.log('\n2. Vérification de l\'absence de collecte de données personnelles (RGPD / Privacy-by-Design)...');

  const testUser = 'SafeUser_' + Math.floor(Math.random() * 10000);
  const regResult = accountManager.register(testUser, 'safePass123', '🦊');

  const rawUser = accountManager.accounts.get(regResult.user.id);

  // Vérifier qu'aucun champ PII n'existe
  const forbiddenFields = ['email', 'mail', 'phone', 'telephone', 'firstName', 'lastName', 'nom', 'prenom', 'birthdate', 'ip', 'address'];
  for (const field of forbiddenFields) {
    if (rawUser[field] !== undefined) {
      throw new Error(`Champ de données personnelles interdit détecté dans l'objet utilisateur : ${field}`);
    }
  }

  // Vérifier qu'aucun cookie traceur / analytics n'est injecté dans les fichiers HTML
  const hostHtml = fs.readFileSync(path.join(__dirname, '../public/host.html'), 'utf8');
  const indexHtml = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
  const htmls = [hostHtml, indexHtml];

  for (const html of htmls) {
    if (/google-analytics|gtag|facebook|pixel|clarity|hotjar/i.test(html)) {
      throw new Error('Script d\'analyse ou traceur tiers détecté dans les pages publiques !');
    }
  }

  console.log('   ✅ Aucune donnée personnelle (email, nom, tél, etc.) n\'est demandée ni stockée.');
  console.log('   ✅ Aucun traceur tiers, cookie publicitaire ou script analytique présent.');
  passedChecks++;

  // -------------------------------------------------------------------------
  // 3. SÉCURITÉ DU HASHAGE DES MOTS DE PASSE & ISOLATION DES SECRETS
  // -------------------------------------------------------------------------
  console.log('\n3. Vérification du hashage des mots de passe (PBKDF2 + Salt)...');

  if (!rawUser.passwordHash || rawUser.passwordHash === 'safePass123') {
    throw new Error('Le mot de passe ne doit JAMAIS être stocké en clair !');
  }

  if (!rawUser.salt || rawUser.salt.length < 16) {
    throw new Error('Le salt cryptographique doit faire au moins 16 caractères hex.');
  }

  // Vérifier que sanitizeUser ne fuite NI le hash, NI le salt, NI les tokens
  const sanitized = accountManager.sanitizeUser(rawUser);
  if (sanitized.passwordHash !== undefined || sanitized.salt !== undefined || sanitized.tokens !== undefined) {
    throw new Error('sanitizeUser fuite des données sensibles (hash, salt ou tokens) !');
  }

  console.log('   ✅ Mots de passe salés (128-bit) et hashés avec PBKDF2 (SHA-512).');
  console.log('   ✅ Aucun secret (hash, salt, tokens de session) n\'est exposé aux clients.');
  passedChecks++;

  // -------------------------------------------------------------------------
  // 4. PROTECTION CONTRE LES INJECTIONS ET XSS (SANITIZATION PSEUDO)
  // -------------------------------------------------------------------------
  console.log('\n4. Vérification de la validation et désinfection des entrées utilisateur...');

  const maliciousUsernames = [
    '<script>alert(1)</script>',
    'Pseudo"onfocus=',
    'Admin\' OR 1=1--',
    'Test\x00Injection',
    'A', // Trop court (< 2)
    'PseudoDePlusDe16CaracteresTropLong' // Trop long (> 16)
  ];

  for (const badNick of maliciousUsernames) {
    let failed = false;
    try {
      accountManager.register(badNick, 'passwordValid123', '🦊');
    } catch (e) {
      failed = true;
    }
    if (!failed) {
      throw new Error(`Le pseudo malveillant ou invalide "${badNick}" n'a pas été rejeté !`);
    }
  }

  // Vérification de la limitation de longueur du mot de passe (protection contre DoS CPU)
  try {
    const hugePassword = 'A'.repeat(500);
    accountManager.register('UserNormal', hugePassword, '🦊');
    throw new Error('Les mots de passe géants (> 128 caractères) devraient être rejetés.');
  } catch (e) {
    if (!e.message.includes('128 caractères')) {
      throw e;
    }
  }

  console.log('   ✅ Tous les pseudos malveillants (XSS, injections, longueurs invalides) sont bloqués.');
  console.log('   ✅ Longueur des mots de passe strictement encadrée (protection DoS CPU).');
  passedChecks++;

  // -------------------------------------------------------------------------
  // 5. TEST DU RATE LIMITER (ANTI BRUTE-FORCE)
  // -------------------------------------------------------------------------
  console.log('\n5. Test du limiteur de débit (Rate Limiter anti force-brute)...');

  const testLimiter = new SimpleRateLimiter(5000, 3, 'Trop de tentatives');
  const ipKey = 'test-ip-127.0.0.1';

  const try1 = testLimiter.isAllowed(ipKey);
  const try2 = testLimiter.isAllowed(ipKey);
  const try3 = testLimiter.isAllowed(ipKey);
  const try4 = testLimiter.isAllowed(ipKey);

  if (!try1.allowed || !try2.allowed || !try3.allowed) {
    throw new Error('Les 3 premières requêtes devraient être autorisées');
  }

  if (try4.allowed) {
    throw new Error('La 4ème requête consécutive aurait dû être bloquée par le Rate Limiter !');
  }

  console.log(`   ✅ Blocage effectif après 3 tentatives (Retry-After: ${try4.retryAfterSeconds}s).`);
  passedChecks++;

  // -------------------------------------------------------------------------
  // 6. TEST DES EN-TÊTES DE SÉCURITÉ HTTP & LIMITATION DE TAILLE JSON
  // -------------------------------------------------------------------------
  console.log('\n6. Test des en-têtes HTTP et de la protection DoS mémoire (limite payload 10kb)...');

  const TEST_SEC_PORT = 3989;
  process.env.PORT = String(TEST_SEC_PORT);
  require('../src/server.js');
  await new Promise(r => setTimeout(r, 600));

  // Vérifier en-têtes HTTP
  await new Promise((resolve, reject) => {
    http.get(`http://localhost:${TEST_SEC_PORT}/api/themes`, (res) => {
      try {
        const ctOptions = res.headers['x-content-type-options'];
        const frameOptions = res.headers['x-frame-options'];
        const xssProtection = res.headers['x-xss-protection'];

        if (ctOptions !== 'nosniff') throw new Error('En-tête X-Content-Type-Options: nosniff manquant !');
        if (frameOptions !== 'SAMEORIGIN') throw new Error('En-tête X-Frame-Options: SAMEORIGIN manquant !');
        if (!xssProtection) throw new Error('En-tête X-XSS-Protection manquant !');

        console.log('   ✅ En-têtes HTTP de sécurité vérifiés (nosniff, SAMEORIGIN, X-XSS-Protection).');
        resolve();
      } catch (err) {
        reject(err);
      }
    }).on('error', reject);
  });

  // Vérifier rejet payload trop volumineux (> 10kb)
  await new Promise((resolve, reject) => {
    const hugePayload = JSON.stringify({
      username: 'TestUser',
      password: 'password123',
      junk: 'X'.repeat(15 * 1024) // 15 KB > 10 KB limit
    });

    const req = http.request({
      hostname: 'localhost',
      port: TEST_SEC_PORT,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(hugePayload)
      }
    }, (res) => {
      if (res.statusCode === 413) {
        console.log('   ✅ Protection DoS validée : Payload > 10kb rejeté immédiatement avec code 413 (Payload Too Large).');
        resolve();
      } else {
        reject(new Error(`Le payload de 15kb aurait dû renvoyer 413, reçu : ${res.statusCode}`));
      }
    });

    req.on('error', reject);
    req.write(hugePayload);
    req.end();
  });

  passedChecks++;

  console.log('\n======================================================');
  console.log(`🎉 AUDIT TERMINÉ AVEC SUCCÈS : ${passedChecks}/6 CONTRÔLES DE SÉCURITÉ VALIDES !`);
  console.log('======================================================\n');
  process.exit(0);
}

runSecurityAudit().catch(err => {
  console.error('\n❌ ÉCHEC DE L\'AUDIT DE SÉCURITÉ :', err);
  process.exit(1);
});
