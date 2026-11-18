const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const os = require('os');
const QRCode = require('qrcode');
const cors = require('cors');

const { THEMES } = require('./config/themes');
const { ACHIEVEMENTS } = require('./config/achievements');
const { LEVELS } = require('./config/levels');
const RoomManager = require('./services/roomManager');
const accountManager = require('./services/accountManager');
const { authLimiter, registerLimiter } = require('./middleware/rateLimiter');
const { getFreshTrackPreview } = require('./services/deezerService');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

function getLocalIp() {
  const nets = os.networkInterfaces();
  const candidates = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        const isWiFi = /wi-?fi|wlan/i.test(name);
        const isEthernet = /ethernet|eth/i.test(name);
        candidates.push({ address: net.address, priority: isWiFi ? 3 : isEthernet ? 2 : 1 });
      }
    }
  }

  candidates.sort((a, b) => b.priority - a.priority);
  return candidates.length > 0 ? candidates[0].address : 'localhost';
}

const localIp = getLocalIp();

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/themes', (req, res) => {
  res.json({ themes: THEMES });
});

app.get('/api/achievements', (req, res) => {
  res.json({ achievements: ACHIEVEMENTS, levels: LEVELS });
});

app.post('/api/auth/register', registerLimiter.middleware(), (req, res) => {
  try {
    const { username, password, avatar } = req.body || {};
    const result = accountManager.register(username, password, avatar);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', authLimiter.middleware(), (req, res) => {
  try {
    const { username, password } = req.body || {};
    const result = accountManager.login(username, password);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : req.query.token;
  const user = accountManager.getUserByToken(token);
  if (!user) return res.status(401).json({ error: 'Non authentifié' });
  res.json({ user });
});

app.post('/api/auth/avatar', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : req.query.token;
    const user = accountManager.getUserByToken(token);
    if (!user) return res.status(401).json({ error: 'Non authentifié' });
    const { avatar } = req.body || {};
    const updatedUser = accountManager.updateAvatar(user.id, avatar);
    if (!updatedUser) return res.status(400).json({ error: 'Mise à jour impossible' });
    res.json({ user: updatedUser });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/profile/:userId', (req, res) => {
  const user = accountManager.getUserById(req.params.userId);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  const achievements = accountManager.getAchievementsForUser(req.params.userId);
  res.json({ user, achievements });
});

app.get('/api/audio-preview/:trackId', async (req, res) => {
  try {
    const trackId = req.params.trackId;
    if (!trackId || !/^\d+$/.test(trackId)) {
      return res.status(400).send('Identifiant de piste invalide');
    }
    const previewUrl = await getFreshTrackPreview(trackId);
    if (!previewUrl) {
      return res.status(404).send('Extrait introuvable');
    }
    res.redirect(302, previewUrl);
  } catch (err) {
    res.status(500).send('Erreur lors de la récupération de l\'extrait audio');
  }
});

app.get('/api/server-info', (req, res) => {
  res.json({
    ip: localIp,
    port: PORT,
    baseUrl: `http://${localIp}:${PORT}`
  });
});

app.get('/host', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/host.html'));
});

app.get('/play', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const roomManager = new RoomManager(io);

io.on('connection', (socket) => {
  socket.on('create_room', async () => {
    try {
      const room = roomManager.createRoom(socket.id);
      socket.join(room.code);

      const joinUrl = `http://${localIp}:${PORT}?room=${room.code}`;
      const qrDataUrl = await QRCode.toDataURL(joinUrl, {
        margin: 2,
        width: 280,
        color: {
          dark: '#1e1b4b',
          light: '#ffffff'
        }
      });

      socket.emit('room_created', {
        roomCode: room.code,
        joinUrl,
        qrDataUrl,
        settings: room.settings,
        themeId: room.themeId,
        themes: THEMES,
        teamScores: roomManager.getTeamScores(room)
      });
    } catch (err) {
      socket.emit('error_message', { message: err.message });
    }
  });

  socket.on('update_settings', (settings) => {
    try {
      const room = roomManager.getRoomBySocket(socket.id);
      if (room && room.hostSocketId === socket.id) {
        roomManager.updateSettings(room.code, settings);
        socket.emit('settings_updated', {
          settings: room.settings,
          themeId: room.themeId,
          customPlaylistId: room.customPlaylistId
        });
      }
    } catch (err) {
      socket.emit('error_message', { message: err.message });
    }
  });

  socket.on('auth_register', (data) => {
    try {
      const clientIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address || 'unknown';
      const rateCheck = registerLimiter.isAllowed(`socket:register:${clientIp}`);
      if (!rateCheck.allowed) {
        return socket.emit('auth_error', { message: rateCheck.message });
      }
      if (!data) throw new Error('Données manquantes');
      const result = accountManager.register(data.username, data.password, data.avatar);
      socket.emit('auth_success', result);
    } catch (err) {
      socket.emit('auth_error', { message: err.message || 'Erreur lors de la création du compte' });
    }
  });

  socket.on('auth_login', (data) => {
    try {
      const clientIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address || 'unknown';
      const rateCheck = authLimiter.isAllowed(`socket:login:${clientIp}`);
      if (!rateCheck.allowed) {
        return socket.emit('auth_error', { message: rateCheck.message });
      }
      if (!data) throw new Error('Données manquantes');
      const result = accountManager.login(data.username, data.password);
      socket.emit('auth_success', result);
    } catch (err) {
      socket.emit('auth_error', { message: err.message || 'Erreur de connexion' });
    }
  });

  socket.on('auth_verify_token', (data) => {
    try {
      const token = data?.token;
      const user = accountManager.getUserByToken(token);
      if (user) {
        socket.emit('auth_verified', { user, token });
      } else {
        socket.emit('auth_invalid');
      }
    } catch (err) {
      socket.emit('auth_invalid');
    }
  });

  socket.on('get_profile', ({ userId }) => {
    try {
      const user = accountManager.getUserById(userId);
      if (user) {
        const achievements = accountManager.getAchievementsForUser(userId);
        socket.emit('profile_data', { user, achievements });
      }
    } catch (err) {
      console.error('Erreur get_profile:', err);
    }
  });

  socket.on('change_avatar', ({ avatar }) => {
    try {
      if (!avatar) return;
      const res = roomManager.updatePlayerAvatar(socket.id, avatar);
      if (res) {
        socket.emit('avatar_changed', { avatar: res.player.avatar });
      }
    } catch (err) {}
  });

  socket.on('update_account_avatar', ({ userId, avatar, token }) => {
    try {
      let targetUserId = userId;
      if (!targetUserId && token) {
        const u = accountManager.getUserByToken(token);
        if (u) targetUserId = u.id;
      }
      if (!targetUserId || !avatar) return;
      const updatedUser = accountManager.updateAvatar(targetUserId, avatar);
      if (updatedUser) {
        socket.emit('account_avatar_updated', { user: updatedUser });
      }
    } catch (err) {}
  });

  socket.on('join_room', ({ roomCode, nickname, avatar, userId }) => {
    try {
      const { room, player } = roomManager.joinRoom(roomCode, socket.id, nickname, avatar, userId);
      socket.join(room.code);

      socket.emit('join_success', {
        roomCode: room.code,
        player,
        settings: room.settings,
        teamScores: roomManager.getTeamScores(room)
      });

      io.to(room.hostSocketId).emit('player_joined', {
        player,
        players: roomManager.getPlayersList(room),
        teamScores: roomManager.getTeamScores(room)
      });
    } catch (err) {
      socket.emit('join_error', { message: err.message });
    }
  });

  socket.on('select_team', ({ teamId }) => {
    try {
      const room = roomManager.getRoomBySocket(socket.id);
      if (room && room.status === 'lobby') {
        roomManager.setPlayerTeam(room.code, socket.id, teamId);
      }
    } catch (err) {
      console.error('Erreur select_team:', err);
    }
  });

  socket.on('balance_teams', () => {
    try {
      const room = roomManager.getRoomBySocket(socket.id);
      if (room && room.hostSocketId === socket.id && room.status === 'lobby') {
        roomManager.balanceTeams(room.code);
      }
    } catch (err) {
      console.error('Erreur balance_teams:', err);
    }
  });

  socket.on('start_game', async () => {
    try {
      const room = roomManager.getRoomBySocket(socket.id);
      if (room && room.hostSocketId === socket.id) {
        socket.emit('game_loading', { message: 'Chargement des extraits musicaux...' });
        await roomManager.startGame(room.code);
      }
    } catch (err) {
      socket.emit('game_start_error', { message: err.message });
    }
  });

  socket.on('submit_answer', ({ optionId, clientTimestamp }) => {
    try {
      const room = roomManager.getRoomBySocket(socket.id);
      if (room) {
        roomManager.submitAnswer(room.code, socket.id, optionId, clientTimestamp);
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
    }
  });

  socket.on('restart_to_lobby', () => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (room && room.hostSocketId === socket.id) {
      roomManager.resetRoomToLobby(room.code);
    }
  });

  socket.on('skip_round', () => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (room && room.hostSocketId === socket.id) {
      roomManager.skipRound(room.code, socket.id);
    }
  });

  socket.on('send_emote', (payload) => {
    try {
      const emoteId = payload && typeof payload.emoteId === 'string' ? payload.emoteId.trim() : '';
      if (!emoteId) return;

      const allowedEmotes = ['flame', 'heart', 'laugh', 'party', 'bolt', 'skull'];
      if (!allowedEmotes.includes(emoteId)) return;

      const room = roomManager.getRoomBySocket(socket.id);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (!player) return;

      const now = Date.now();
      const lastEmote = player.lastEmoteTime || 0;
      if (now - lastEmote < 400) return;
      player.lastEmoteTime = now;

      io.to(room.code).emit('room_emote', {
        playerId: player.id,
        nickname: player.nickname,
        avatar: player.avatar,
        emoteId,
        timestamp: now
      });
    } catch (err) {
      console.error('Erreur send_emote:', err);
    }
  });

  socket.on('host_quit_game', () => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (room && room.hostSocketId === socket.id) {
      roomManager.resetRoomToLobby(room.code);
    }
  });

  socket.on('disconnect', () => {
    roomManager.removeSocket(socket.id);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`[BLIND TEST MULTIJOUEUR EN TEMPS RÉEL]`);
  console.log(`======================================================`);
  console.log(`  Écran Hôte (TV/PC)    : http://localhost:${PORT}/host`);
  console.log(`  Manette Joueur (Mobile): http://${localIp}:${PORT}`);
  console.log(`======================================================\n`);
});
