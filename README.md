# 🎶 Blind-Test Party Web

Application web de Blind-Test multijoueur en temps réel avec **Écran Hôte (TV/PC)** et **Manettes Joueurs (Smartphones)**.

---

## 🚀 Lancement Rapide

1. **Installer les dépendances** (si ce n'est pas déjà fait) :
   ```bash
   npm install
   ```

2. **Démarrer le serveur** :
   ```bash
   npm start
   ```

3. **Ouvrir le jeu** :
   - **🖥️ Écran TV / PC (Hôte)** : Rendez-vous sur [http://localhost:3000/host](http://localhost:3000/host)
   - **📱 Smartphones (Joueurs)** : Scannez simplement le **QR Code** affiché sur l'écran TV avec l'appareil photo du téléphone (ou ouvrez l'adresse locale affichée, ex: `http://192.168.1.XX:3000`).

---

## 🕹️ Comment ça marche ?

### 1. Modèle 3 Piliers (Jackbox / Kahoot)
- **Serveur (Node.js + Socket.io)** : Arbitre la partie, synchronise les chronomètres, valide les réponses et calcule les points selon la rapidité.
- **Écran Hôte (TV / PC)** :
  - Diffuse le son MP3 de 30 secondes via l'API Deezer.
  - Affiche le code du salon et le QR code de connexion instantanée.
  - Affiche l'animation vinyle, le compte à rebours et la jauge de réponses en direct.
  - Révèle la pochette d'album et le classement entre chaque manche.
  - Célèbre les gagnants sur un podium final avec feux d'artifice de confettis !
- **Manette Joueur (Smartphone)** :
  - Interface tactile minimaliste et fluide.
  - Choix de pseudo et d'avatar (🦊, 🐯, 🚀, 🎧, ⚡...).
  - 4 grands boutons de couleur (Rouge, Bleu, Jaune, Vert) sans aucun spoil de la bonne réponse.
  - Retour haptique (vibrations) et badges de séries de victoires (*streak* 🔥).
  - **Aucun son ne sort du smartphone** pour éviter tout décalage sonore.

---

## 🎼 Thèmes Inclus & Personnalisation

L'application intègre des playlists Deezer sans avoir besoin de clé API :

| Thème | Description |
| :--- | :--- |
| 🏰 **Disney & Enfance** | Devine le nom du film Disney culte (Le Roi Lion, Aladdin, Tarzan, Mulan, Vaiana...) |
| ⚡ **Openings d'Animés** | Devine l'animé culte (Naruto, SNK, One Piece, Death Note, Demon Slayer...) |
| 🎤 **Rap Français** | Toutes les générations : classiques 90s/2000s aux bangers actuels (Booba, PNL, Ninho, Gazo, Damso, SDM...) |
| 🎸 **Rock/Métal** | AC/DC, Metallica, Nirvana, Linkin Park et les hymnes du rock & métal |
| 💾 **Années 2000** | Les hits incontournables des années 2000 |
| 🪩 **Années 80** | Disco, synthwave et tubes intemporels |
| 🔥 **Pop & Hits** | Les plus grands hits radio internationaux |
| 🔗 **Playlist Personnalisée** | Colle n'importe quel lien ou ID de playlist publique Deezer ! |

Pour ajouter un nouveau thème, modifie simplement `src/config/themes.js`.

---

## 🏆 Système de Score

$$\text{Score} = 500 + \left(500 \times \left(1 - \frac{\text{Temps de réponse}}{\text{Durée manche}}\right)\right) + \text{Bonus Streak}$$

* **Vitesse maximale** : Jusqu'à 1000 points par manche.
* **Bonus Série (Streak)** : +50 points par bonne réponse consécutive (jusqu'à +200 pts).
* **Mauvaise réponse** : 0 point et réinitialisation de la série.

---

## 🛠️ Structure du Projet

```
blind-test/
├── package.json               # Dépendances (express, socket.io, qrcode)
├── src/
│   ├── server.js              # Serveur Express, WebSocket et détection IP LAN
│   ├── config/
│   │   ├── themes.js          # Configuration des thèmes & playlists Deezer
│   │   ├── animeCatalog.js    # Catalogue des openings avec association d'animés
│   │   └── disneyCatalog.js   # Catalogue des chansons Disney avec association de films
│   └── services/
│       ├── deezerService.js   # Client Deezer API avec cache & filtrage audio
│       └── roomManager.js     # Gestion des salons, scores, chronomètres et QCM
├── public/
│   ├── css/
│   │   └── style.css          # Design sombre dynamique, animations et responsive
│   ├── js/
│   │   ├── host.js            # Logique écran TV (audio, timer, podium)
│   │   └── player.js          # Logique manette mobile (boutons tactiles, vibrations)
│   ├── host.html              # Vue grand écran
│   └── index.html             # Vue joueur mobile
└── tests/
    ├── test-game.js           # Simulation automatique multijoueur
    ├── test-disney.js         # Test automatique du mode Disney et Rock/Métal
    └── test-rap.js            # Test automatique du mode Rap FR multi-générations
```
