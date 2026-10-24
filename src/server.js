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

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

// Helper to determine the best local LAN IP for smartphones on the same Wi-Fi
function getLocalIp() {
  const nets = os.networkInterfaces();
  const candidates = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // IPv4 and not 127.0.0.1
      if (net.family === 'IPv4' && !net.internal) {
        // Prefer Wi-Fi or Ethernet
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

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Middleware & static files
app.use(cors());
app.use(express.json({ limit: '10kb' })); // Mitigate body payload DoS attacks
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
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

app.get('/api/profile/:userId', (req, res) => {
  const user = accountManager.getUserById(req.params.userId);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  const achievements = accountManager.getAchievementsForUser(req.params.userId);
  res.json({ user, achievements });
});

app.get('/api/server-info', (req, res) => {
  res.json({
    ip: localIp,
    port: PORT,
    baseUrl: `http://${localIp}:${PORT}`
  });
});

// Explicit routes for easy access
app.get('/host', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/host.html'));
});

app.get('/play', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Initialize Room Manager
const roomManager = new RoomManager(io);

// Socket.io handlers
io.on('connection', (socket) => {
  // Host creates a room
  socket.on('create_room', async () => {
    try {
      const room = roomManager.createRoom(socket.id);
      socket.join(room.code);

      // Join URL for players to scan
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
        themes: THEMES
      });
    } catch (err) {
      socket.emit('error_message', { message: err.message });
    }
  });

  // Host updates settings (theme, rounds, duration)
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

  // Auth & Account handlers via Socket.IO
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

  // Player joins a room
  socket.on('join_room', ({ roomCode, nickname, avatar, userId }) => {
    try {
      const { room, player } = roomManager.joinRoom(roomCode, socket.id, nickname, avatar, userId);
      socket.join(room.code);

      // Confirm to player
      socket.emit('join_success', {
        roomCode: room.code,
        player
      });

      // Notify host and all players in the room
      io.to(room.hostSocketId).emit('player_joined', {
        player,
        players: roomManager.getPlayersList(room)
      });
    } catch (err) {
      socket.emit('join_error', { message: err.message });
    }
  });

  // Host starts the game
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

  // Player submits an answer
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

  // Host restarts game back to lobby
  socket.on('restart_to_lobby', () => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (room && room.hostSocketId === socket.id) {
      roomManager.resetRoomToLobby(room.code);
    }
  });

  // Host quits ongoing match back to lobby
  socket.on('host_quit_game', () => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (room && room.hostSocketId === socket.id) {
      roomManager.resetRoomToLobby(room.code);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    roomManager.removeSocket(socket.id);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🎶 BLIND TEST MULTIJOUEUR EN TEMPS RÉEL`);
  console.log(`======================================================`);
  console.log(`🖥️  Écran Hôte (TV/PC)    : http://localhost:${PORT}/host`);
  console.log(`📱 Manette Joueur (Mobile): http://${localIp}:${PORT}`);
  console.log(`======================================================\n`);
});
