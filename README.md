# 🎶 Blind-Test Party Web

Application web de Blind-Test multijoueur en temps réel avec **Écran Hôte (TV/PC)** et **Manettes Joueurs (Smartphones)** inspirée de l'esprit festif de Jackbox, Kahoot et Gartic Phone.

---

## 🚀 Lancement Rapide

1. **Installer les dépendances** :
   ```bash
   npm install
   ```

2. **Démarrer le serveur** :
   ```bash
   npm start
   ```

3. **Ouvrir le jeu** :
   - **🖥️ Écran TV / PC (Hôte)** : Rendez-vous sur [http://localhost:3000/host](http://localhost:3000/host)
   - **📱 Smartphones (Joueurs)** : Scannez le **QR Code** affiché sur l'écran TV avec l'appareil photo du téléphone (ou ouvrez l'adresse réseau locale affichée, ex: `http://192.168.1.XX:3000`).

---

## 🕹️ Architecture & Fonctionnement

### Modèle 3 Piliers (Party-Game en Temps Réel)
- **Serveur (Node.js + Express + Socket.IO)** :
  - Arbitre la partie en temps réel, synchronise les chronomètres, valide les réponses et calcule les points.
  - Gestion sécurisée des comptes, des sessions, de la progression (XP, niveaux) et des succès.
  - Détection automatique de l'IP Wi-Fi/Ethernet locale pour une connexion mobile instantanée sans configuration.
- **Écran Hôte (TV / PC)** :
  - Diffuse le flux audio Deezer (extraits de 30 secondes).
  - Affiche le code du salon et le QR code de connexion rapide.
  - Visualisation en direct : vinyle animé, compte à rebours circulaire, état de réponse des joueurs et pseudos complets.
  - Révèle la pochette d'album, le titre, l'artiste et le classement dynamique entre chaque manche.
  - Célèbre les gagnants sur un podium final avec feux d'artifice de confettis.
  - Contrôle total pour l'hôte : personnalisation de la durée (10s, 20s, 30s), du nombre de manches (5 à 20) et possibilité d'interrompre une partie en cours pour revenir au salon.
- **Manette Joueur (Smartphone)** :
  - Interface tactile ultra-réactive conçue pour mobile avec design moderne et fluide.
  - 4 grands boutons colorés sans spoil de la bonne réponse.
  - Retour haptique (vibrations) et indicateurs de série (*streak* 🔥).
  - Notifications toasts en direct lors des gains de succès ou montées de niveau.
  - **Zéro décalage audio** : aucun son n'est joué sur les smartphones, tout provient du système sonore de l'écran hôte.

---

## 🎖️ Système de Comptes, Niveaux & Succès

Les joueurs peuvent rejoindre en **mode Invité** express ou créer un **Compte joueur** persistant :

### Niveaux & Titres Honorifiques
Accumulez de l'XP à chaque manche et en fin de partie pour gravir les échelons du Niveau 1 au Niveau 15 :
- 🎵 **Niveau 1** : Novice de la Musique
- 🎧 **Niveau 3** : Oreille Attentive
- ⚡ **Niveau 5** : Buzzer Express
- 💿 **Niveau 7** : Chasseur de Hits
- 🎷 **Niveau 9** : Maestro des Blind-Tests
- 👑 **Niveau 15** : Dieu du Blind-Test

### Succès & Trophées
16 succès thématiques déblocables avec récompenses d'XP :
- ⚡ **Buzzer Éclair** : Répondre correctement en moins de 3 secondes.
- 🔥 **En Plein Feu** : Réaliser une série de 3 bonnes réponses d'affilée.
- 🎯 **Sans Faute** : Trouver toutes les musiques d'une partie sans aucune erreur.
- 🥇 **Numéro 1** : Remporter sa première partie de blind-test.
- 🏆 **Légende Vivante** : Atteindre un total de 10 victoires.

---

## 🎼 Thèmes Inclus & Personnalisation

L'application intègre une sélection variée de playlists Deezer prêtes à l'emploi (sans clé API requise) :

| Thème | Description |
| :--- | :--- |
| 🏰 **Disney & Enfance** | Catalogue enrichi de classiques Disney (Le Roi Lion, Aladdin, Tarzan, Mulan, Vaiana...) |
| ⚡ **Openings d'Animés** | Catalogue étendu d'animés cultes (Naruto, SNK, One Piece, Death Note, Demon Slayer, JJK...) |
| 🎤 **Rap Français** | Des classiques 90s/2000s aux bangers actuels (Booba, PNL, Ninho, Gazo, Damso, SDM...) |
| 💾 **Années 2000 FR** | Les tubes francophones cultes des années 2000 |
| 🪩 **Années 80 FR** | Les pépites et hymnes francophones des années 80 |
| 🎸 **Rock / Métal** | AC/DC, Metallica, Nirvana, Linkin Park et les hymnes rock intemporels |
| 💾 **Années 2000** | Les hits internationaux incontournables des années 2000 |
| 🪩 **Années 80** | Disco, synthwave et légendes des années 80 |
| 🔥 **Pop & Hits** | Les plus grands succès radio internationaux actuels |
| 🔗 **Playlist Personnalisée** | Collez n'importe quel lien ou identifiant de playlist publique Deezer ! |

---

## 🛡️ Sécurité & Confidentialité (Privacy-by-Design)

Le projet intègre des normes de sécurité et de confidentialité rigoureuses :

1. **Zéro Donnée Personnelle (RGPD)** :
   - Aucun nom, prénom, email, numéro de téléphone ou coordonnée n'est collecté.
   - Aucun traceur publicitaire ou outil analytique tiers (pas de Google Analytics, Meta Pixel, etc.).
   - Les adresses IP ne sont jamais persistées sur disque.
2. **Cryptographie & Mots de Passe** :
   - Mots de passe salés individuellement avec un sel cryptographique aléatoire de 128 bits.
   - Hachage cryptographique **PBKDF2** (SHA-512, 10 000 itérations).
   - Les condensats de mot de passe, sels et jetons de session ne sont jamais exposés aux clients.
3. **Exclusion Git Étanche** :
   - Le dossier `data/*` est entièrement exclu du versionnement Git pour protéger les données locales de compte.
4. **Protections Anti-Abus & Robustesse** :
   - **Rate Limiting** : Limiteur de débit à fenêtre glissante sur l'authentification (HTTP et Socket.IO) anti force-brute.
   - **Protection DoS** : Limite stricte de taille des requêtes JSON (`limit: '10kb'`).
   - **Protection XSS & Injections** : Validation regex stricte des pseudonymes (2 à 16 caractères) et échappement HTML systématique sur toutes les vues.
   - **En-têtes HTTP sécurisés** : `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection`.

---

## 🏆 Système de Calcul des Scores

$$\text{Score} = 500 + \left(500 \times \left(1 - \frac{\text{Temps de réponse}}{\text{Durée manche}}\right)\right) + \text{Bonus Streak}$$

* **Score de base + Rapidité** : Jusqu'à 1000 points par manche selon votre réactivité.
* **Bonus Série (Streak)** : +50 points par bonne réponse consécutive (jusqu'à +200 pts bonus).
* **Mauvaise réponse** : 0 point et réinitialisation de la série en cours.

---

## 🛠️ Structure du Projet

```
blind-test/
├── package.json               # Dépendances du projet (Express, Socket.IO, QRCode, Cors)
├── README.md                  # Documentation du projet
├── data/
│   ├── .gitkeep               # Structure de répertoire suivie par Git
│   └── accounts.json          # Stockage local des comptes (ignoré par Git)
├── src/
│   ├── server.js              # Serveur Express, WebSocket, en-têtes de sécurité et routes
│   ├── config/
│   │   ├── themes.js          # Configuration des thèmes & playlists Deezer
│   │   ├── levels.js          # Courbe d'XP, titres et badges des niveaux 1 à 15
│   │   ├── achievements.js    # Définition des 16 succès et récompenses
│   │   ├── animeCatalog.js    # Catalogue et associations des génériques d'animés
│   │   └── disneyCatalog.js   # Catalogue et associations des films Disney
│   ├── middleware/
│   │   └── rateLimiter.js     # Limiteur de débit à fenêtre glissante anti force-brute
│   └── services/
│       ├── deezerService.js   # Client Deezer API avec mise en cache et filtrage audio
│       ├── roomManager.js     # Gestion des salons, manches, scores et chronomètres
│       └── accountManager.js  # Gestion des comptes, PBKDF2, sessions et progression XP
├── public/
│   ├── css/
│   │   └── style.css          # Design sombre moderne, responsive et composants UI
│   ├── js/
│   │   ├── host.js            # Logique écran TV/PC (audio, timers, révélations, podium)
│   │   └── player.js          # Logique manette mobile (boutons QCM, profils, succès)
│   ├── host.html              # Vue grand écran hôte
│   └── index.html             # Vue joueur smartphone
└── tests/
    ├── test-accounts.js       # Test unitaire et d'intégration des comptes et niveaux
    ├── test-security.js       # Banc d'audit de sécurité (RGPD, Git, rate limit, DoS, XSS)
    ├── test-game.js           # Simulation automatique d'une partie multijoueur
    ├── test-disney.js         # Test automatique du mode Disney
    └── test-rap.js            # Test automatique du mode Rap Français
```

---

## 🧪 Tests Automatisés

Vous pouvez exécuter les suites de tests à tout moment :

```bash
# Tester le système de comptes, XP et succès
node tests/test-accounts.js

# Exécuter l'audit automatisé de sécurité et conformité
node tests/test-security.js

# Simuler une partie multijoueur complète
node tests/test-game.js
```
