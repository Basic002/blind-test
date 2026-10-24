const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const os = require('os');
const QRCode = require('qrcode');
const cors = require('cors');

const { THEMES } = require('./config/themes');
const RoomManager = require('./services/roomManager');

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

// Middleware & static files
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.get('/api/themes', (req, res) => {
  res.json({ themes: THEMES });
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

  // Player joins a room
  socket.on('join_room', ({ roomCode, nickname, avatar }) => {
    try {
      const { room, player } = roomManager.joinRoom(roomCode, socket.id, nickname, avatar);
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
