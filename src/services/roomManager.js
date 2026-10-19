const { getTracksForTheme } = require('./deezerService');

// Allowed characters for room codes (no O/0, I/1 to avoid confusion)
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateRoomCode() {
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return code;
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomCode -> roomData
    this.socketToRoom = new Map(); // socketId -> roomCode
  }

  createRoom(hostSocketId) {
    let roomCode = generateRoomCode();
    while (this.rooms.has(roomCode)) {
      roomCode = generateRoomCode();
    }

    const room = {
      code: roomCode,
      hostSocketId,
      status: 'lobby', // 'lobby' | 'playing' | 'round_result' | 'game_over'
      themeId: 'disney',
      customPlaylistId: null,
      settings: {
        totalRounds: 10,
        roundDuration: 25, // seconds
        revealDuration: 6 // seconds
      },
      players: new Map(), // socketId -> player
      tracksPool: [],
      gameTracks: [],
      currentRoundIndex: 0,
      currentRound: null,
      roundTimer: null
    };

    this.rooms.set(roomCode, room);
    this.socketToRoom.set(hostSocketId, roomCode);
    return room;
  }

  getRoom(roomCode) {
    if (!roomCode) return null;
    return this.rooms.get(roomCode.toUpperCase().trim());
  }

  getRoomBySocket(socketId) {
    const code = this.socketToRoom.get(socketId);
    return code ? this.rooms.get(code) : null;
  }

  joinRoom(roomCode, socketId, nickname, avatar = '🎵') {
    const room = this.getRoom(roomCode);
    if (!room) {
      throw new Error('Salon introuvable. Vérifie le code !');
    }

    if (room.status !== 'lobby') {
      throw new Error('La partie a déjà commencé dans ce salon.');
    }

    // Check nickname uniqueness in room
    const cleanNick = (nickname || 'Joueur').trim().substring(0, 16);
    for (const player of room.players.values()) {
      if (player.nickname.toLowerCase() === cleanNick.toLowerCase()) {
        throw new Error('Ce pseudo est déjà pris dans ce salon.');
      }
    }

    const player = {
      id: socketId,
      nickname: cleanNick,
      avatar: avatar || '🎵',
      score: 0,
      streak: 0,
      hasAnswered: false,
      lastAnswer: null
    };

    room.players.set(socketId, player);
    this.socketToRoom.set(socketId, room.code);

    return { room, player };
  }

  removeSocket(socketId) {
    const roomCode = this.socketToRoom.get(socketId);
    if (!roomCode) return null;

    this.socketToRoom.delete(socketId);
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    // If host leaves
    if (room.hostSocketId === socketId) {
      if (room.roundTimer) clearTimeout(room.roundTimer);
      this.io.to(room.code).emit('room_closed', { message: 'L\'hôte a quitté la partie.' });
      // Clean up players map
      for (const pId of room.players.keys()) {
        this.socketToRoom.delete(pId);
      }
      this.rooms.delete(room.code);
      return { type: 'host_left', roomCode };
    }

    // If player leaves
    if (room.players.has(socketId)) {
      const player = room.players.get(socketId);
      room.players.delete(socketId);
      
      this.io.to(room.hostSocketId).emit('player_left', {
        playerId: socketId,
        nickname: player.nickname,
        players: this.getPlayersList(room)
      });

      // If playing and this was the last pending answer
      if (room.status === 'playing') {
        this.checkAllPlayersAnswered(room);
      }

      return { type: 'player_left', roomCode, player };
    }

    return null;
  }

  getPlayersList(room) {
    return Array.from(room.players.values()).map(p => ({
      id: p.id,
      nickname: p.nickname,
      avatar: p.avatar,
      score: p.score,
      streak: p.streak,
      hasAnswered: p.hasAnswered
    })).sort((a, b) => b.score - a.score);
  }

  updateSettings(roomCode, settings) {
    const room = this.getRoom(roomCode);
    if (!room || room.status !== 'lobby') return;

    if (settings.totalRounds) room.settings.totalRounds = Math.min(30, Math.max(1, Number(settings.totalRounds)));
    if (settings.roundDuration) room.settings.roundDuration = Math.min(45, Math.max(5, Number(settings.roundDuration)));
    if (settings.revealDuration) room.settings.revealDuration = Math.min(15, Math.max(1, Number(settings.revealDuration)));
    if (settings.themeId) room.themeId = settings.themeId;
    if (settings.customPlaylistId !== undefined) room.customPlaylistId = settings.customPlaylistId;

    return room;
  }

  async startGame(roomCode) {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Salon introuvable');
    if (room.players.size === 0) throw new Error('Il faut au moins 1 joueur pour lancer !');

    // Load tracks from Deezer
    const tracks = await getTracksForTheme(room.themeId, room.customPlaylistId);
    room.tracksPool = tracks;

    // Pick unique tracks for game
    const totalRounds = Math.min(room.settings.totalRounds, tracks.length);
    room.settings.totalRounds = totalRounds;
    room.gameTracks = shuffleArray(tracks).slice(0, totalRounds);
    room.currentRoundIndex = 0;

    // Reset scores
    for (const player of room.players.values()) {
      player.score = 0;
      player.streak = 0;
      player.hasAnswered = false;
      player.lastAnswer = null;
    }

    room.status = 'playing';
    this.startRound(room);
  }

  startRound(room) {
    if (room.roundTimer) {
      clearTimeout(room.roundTimer);
      room.roundTimer = null;
    }

    const currentTrack = room.gameTracks[room.currentRoundIndex];
    if (!currentTrack) {
      this.endGame(room);
      return;
    }

    const isAnime = Boolean(currentTrack.isAnime || room.themeId === 'anime');
    let rawOptions = [];

    if (isAnime && currentTrack.anime) {
      // Pick 3 distractors with UNIQUE anime names
      const chosenAnimes = new Set([currentTrack.anime.toLowerCase()]);
      const animeDistractors = [];

      for (const t of shuffleArray(room.tracksPool)) {
        if (t.anime && !chosenAnimes.has(t.anime.toLowerCase())) {
          chosenAnimes.add(t.anime.toLowerCase());
          animeDistractors.push(t);
          if (animeDistractors.length === 3) break;
        }
      }

      rawOptions = [
        { id: currentTrack.id, title: currentTrack.anime, artist: 'Animé' },
        ...animeDistractors.map(d => ({ id: d.id, title: d.anime, artist: 'Animé' }))
      ];
    } else {
      // Pick 3 distractors from the remaining pool
      const distractors = shuffleArray(
        room.tracksPool.filter(t => t.id !== currentTrack.id)
      ).slice(0, 3);

      rawOptions = [
        { id: currentTrack.id, title: currentTrack.title, artist: currentTrack.artist },
        ...distractors.map(d => ({ id: d.id, title: d.title, artist: d.artist }))
      ];
    }

    const shuffledOptions = shuffleArray(rawOptions);

    // Reset player round answers
    for (const player of room.players.values()) {
      player.hasAnswered = false;
      player.lastAnswer = null;
    }

    const duration = room.settings.roundDuration;
    const startedAt = Date.now();

    room.currentRound = {
      track: currentTrack,
      options: shuffledOptions,
      correctId: currentTrack.id,
      startedAt,
      duration,
      isAnime,
      answers: new Map()
    };

    room.status = 'playing';

    // Send audio & display info to Host (TV)
    this.io.to(room.hostSocketId).emit('round_start_host', {
      roundIndex: room.currentRoundIndex + 1,
      totalRounds: room.settings.totalRounds,
      audioPreview: currentTrack.preview,
      isAnime,
      duration,
      players: this.getPlayersList(room)
    });

    // Send ONLY choices to smartphones (never the audio or the solution!)
    for (const [socketId] of room.players) {
      this.io.to(socketId).emit('round_start_player', {
        roundIndex: room.currentRoundIndex + 1,
        totalRounds: room.settings.totalRounds,
        isAnime,
        questionLabel: isAnime ? 'Trouve l\'animé !' : 'Trouve le morceau !',
        options: shuffledOptions.map((opt, idx) => ({
          id: opt.id,
          index: idx,
          title: opt.title,
          artist: opt.artist
        })),
        duration
      });
    }

    // Set server timeout for round end
    room.roundTimer = setTimeout(() => {
      this.endRound(room);
    }, duration * 1000 + 500); // +500ms safety margin for network
  }

  submitAnswer(roomCode, socketId, optionId, clientTimestamp) {
    const room = this.getRoom(roomCode);
    if (!room || room.status !== 'playing' || !room.currentRound) return;

    const player = room.players.get(socketId);
    if (!player || player.hasAnswered) return;

    const round = room.currentRound;
    const now = Date.now();
    const responseTimeMs = Math.max(100, now - round.startedAt);
    const isCorrect = String(optionId) === String(round.correctId);

    let pointsEarned = 0;
    if (isCorrect) {
      // Base formula: up to 1000 points based on speed
      const totalTimeMs = round.duration * 1000;
      const speedFactor = Math.max(0, 1 - (responseTimeMs / totalTimeMs));
      const basePoints = Math.round(500 + (500 * speedFactor));
      
      // Streak bonus: +50 per streak level up to +200
      const streakBonus = Math.min(200, player.streak * 50);
      pointsEarned = basePoints + streakBonus;

      player.score += pointsEarned;
      player.streak += 1;
    } else {
      player.streak = 0;
    }

    player.hasAnswered = true;
    player.lastAnswer = {
      isCorrect,
      pointsEarned,
      responseTimeMs,
      optionId
    };

    round.answers.set(socketId, player.lastAnswer);

    // Notify player that answer was registered
    this.io.to(socketId).emit('answer_received', {
      hasAnswered: true
    });

    // Notify host that a player answered (shows count or checkmark on TV)
    this.io.to(room.hostSocketId).emit('player_answered', {
      playerId: socketId,
      answeredCount: round.answers.size,
      totalPlayers: room.players.size,
      players: this.getPlayersList(room)
    });

    // If all players have answered, end round immediately
    this.checkAllPlayersAnswered(room);
  }

  checkAllPlayersAnswered(room) {
    if (!room.currentRound || room.status !== 'playing') return;
    const answeredCount = room.currentRound.answers.size;
    const totalPlayers = room.players.size;

    if (totalPlayers > 0 && answeredCount >= totalPlayers) {
      if (room.roundTimer) {
        clearTimeout(room.roundTimer);
        room.roundTimer = null;
      }
      // Small pause before revealing for visual satisfaction
      setTimeout(() => {
        this.endRound(room);
      }, 700);
    }
  }

  endRound(room) {
    if (room.roundTimer) {
      clearTimeout(room.roundTimer);
      room.roundTimer = null;
    }

    room.status = 'round_result';
    const round = room.currentRound;
    const correctTrack = round.track;

    const leaderboard = this.getPlayersList(room);

    // Notify host with full reveal (cover, track name, artist, anime, leaderboard)
    this.io.to(room.hostSocketId).emit('round_ended_host', {
      track: {
        id: correctTrack.id,
        title: correctTrack.title,
        artist: correctTrack.artist,
        anime: correctTrack.anime || null,
        isAnime: Boolean(correctTrack.isAnime || round.isAnime),
        cover: correctTrack.cover,
        preview: correctTrack.preview
      },
      leaderboard,
      revealDuration: room.settings.revealDuration
    });

    // Notify each player individually with their score & whether they got it right
    for (const [socketId, player] of room.players) {
      const answer = player.lastAnswer || { isCorrect: false, pointsEarned: 0 };
      const rank = leaderboard.findIndex(p => p.id === socketId) + 1;

      this.io.to(socketId).emit('round_ended_player', {
        isCorrect: answer.isCorrect,
        pointsEarned: answer.pointsEarned,
        totalScore: player.score,
        streak: player.streak,
        rank,
        correctTrack: {
          title: correctTrack.title,
          artist: correctTrack.artist,
          anime: correctTrack.anime || null,
          isAnime: Boolean(correctTrack.isAnime || round.isAnime)
        }
      });
    }

    // Schedule next round or game over
    room.roundTimer = setTimeout(() => {
      room.currentRoundIndex += 1;
      if (room.currentRoundIndex >= room.settings.totalRounds) {
        this.endGame(room);
      } else {
        this.startRound(room);
      }
    }, room.settings.revealDuration * 1000);
  }

  endGame(room) {
    if (room.roundTimer) {
      clearTimeout(room.roundTimer);
      room.roundTimer = null;
    }

    room.status = 'game_over';
    const finalLeaderboard = this.getPlayersList(room);

    this.io.to(room.hostSocketId).emit('game_over_host', {
      podium: finalLeaderboard.slice(0, 3),
      leaderboard: finalLeaderboard
    });

    for (const [socketId, player] of room.players) {
      const rank = finalLeaderboard.findIndex(p => p.id === socketId) + 1;
      this.io.to(socketId).emit('game_over_player', {
        rank,
        score: player.score,
        totalPlayers: room.players.size
      });
    }
  }

  resetRoomToLobby(roomCode) {
    const room = this.getRoom(roomCode);
    if (!room) return;

    if (room.roundTimer) clearTimeout(room.roundTimer);
    room.status = 'lobby';
    room.currentRoundIndex = 0;
    room.currentRound = null;
    room.gameTracks = [];

    for (const player of room.players.values()) {
      player.score = 0;
      player.streak = 0;
      player.hasAnswered = false;
      player.lastAnswer = null;
    }

    this.io.to(room.code).emit('back_to_lobby', {
      players: this.getPlayersList(room)
    });
  }
}

module.exports = RoomManager;
