const { getTracksForTheme } = require('./deezerService');
const accountManager = require('./accountManager');

const USERNAME_REGEX = /^[\p{L}\p{N}_\- ]{2,16}$/u;

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
    this.rooms = new Map();
    this.socketToRoom = new Map();
  }

  createRoom(hostSocketId) {
    let roomCode = generateRoomCode();
    while (this.rooms.has(roomCode)) {
      roomCode = generateRoomCode();
    }

    const room = {
      code: roomCode,
      hostSocketId,
      status: 'lobby',
      themeId: 'disney',
      customPlaylistId: null,
      settings: {
        totalRounds: 10,
        roundDuration: 25,
        revealDuration: 6
      },
      players: new Map(),
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

  joinRoom(roomCode, socketId, nickname, avatar = '🎵', userId = null) {
    const room = this.getRoom(roomCode);
    if (!room) {
      throw new Error('Salon introuvable. Vérifie le code !');
    }

    if (room.status !== 'lobby') {
      throw new Error('La partie a déjà commencé dans ce salon.');
    }

    const rawNick = typeof nickname === 'string' ? nickname : 'Joueur';
    const cleanNick = rawNick.trim().substring(0, 16);
    if (!cleanNick || cleanNick.length < 2 || cleanNick.length > 16) {
      throw new Error('Le pseudo doit contenir entre 2 et 16 caractères.');
    }
    if (!USERNAME_REGEX.test(cleanNick)) {
      throw new Error('Le pseudo ne peut contenir que des lettres, chiffres, espaces, tirets et underscores.');
    }
    for (const player of room.players.values()) {
      if (player.nickname.toLowerCase() === cleanNick.toLowerCase()) {
        throw new Error('Ce pseudo est déjà pris dans ce salon.');
      }
    }

    const cleanAvatar = typeof avatar === 'string' && avatar.trim().length > 0 && avatar.trim().length <= 10
      ? avatar.trim()
      : '🎵';

    let userLevel = 1;
    let userTitle = 'Novice';
    let userBadge = '🎵';
    let registeredUserId = null;

    if (userId && typeof userId === 'string') {
      const user = accountManager.getUserById(userId);
      if (user) {
        registeredUserId = user.id;
        userLevel = user.progression.level;
        userTitle = user.progression.title;
        userBadge = user.progression.badge;
      }
    }

    const player = {
      id: socketId,
      userId: registeredUserId,
      nickname: cleanNick,
      avatar: cleanAvatar,
      score: 0,
      streak: 0,
      level: userLevel,
      title: userTitle,
      badge: userBadge,
      correctAnswersCount: 0,
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

    const room = this.rooms.get(roomCode);
    this.socketToRoom.delete(socketId);
    if (!room) return null;

    if (room.hostSocketId === socketId) {
      if (room.roundTimer) clearTimeout(room.roundTimer);
      this.io.to(room.code).emit('room_closed', { message: 'L\'hôte a quitté la partie.' });
      for (const pId of room.players.keys()) {
        this.socketToRoom.delete(pId);
      }
      this.rooms.delete(room.code);
      return { type: 'host_left', roomCode };
    }

    if (room.players.has(socketId)) {
      const player = room.players.get(socketId);
      room.players.delete(socketId);
      
      this.io.to(room.hostSocketId).emit('player_left', {
        playerId: socketId,
        nickname: player.nickname,
        players: this.getPlayersList(room)
      });

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
      userId: p.userId || null,
      nickname: p.nickname,
      avatar: p.avatar,
      score: p.score,
      streak: p.streak,
      level: p.level || 1,
      title: p.title || 'Novice',
      badge: p.badge || '🎵',
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

    const tracks = await getTracksForTheme(room.themeId, room.customPlaylistId);
    room.tracksPool = tracks;

    const totalRounds = Math.min(room.settings.totalRounds, tracks.length);
    room.settings.totalRounds = totalRounds;
    room.gameTracks = shuffleArray(tracks).slice(0, totalRounds);
    room.currentRoundIndex = 0;

    for (const player of room.players.values()) {
      player.score = 0;
      player.streak = 0;
      player.correctAnswersCount = 0;
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
    const isDisney = Boolean(currentTrack.isDisney || room.themeId === 'disney');
    let rawOptions = [];

    if (isDisney && currentTrack.disney) {
      const chosenDisney = new Set([currentTrack.disney.toLowerCase()]);
      const disneyDistractors = [];

      for (const t of shuffleArray(room.tracksPool)) {
        if (t.disney && !chosenDisney.has(t.disney.toLowerCase())) {
          chosenDisney.add(t.disney.toLowerCase());
          disneyDistractors.push(t);
          if (disneyDistractors.length === 3) break;
        }
      }

      rawOptions = [
        { id: currentTrack.id, title: currentTrack.disney, artist: 'Film Disney' },
        ...disneyDistractors.map(d => ({ id: d.id, title: d.disney, artist: 'Film Disney' }))
      ];
    } else if (isAnime && currentTrack.anime) {
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
      const currentKey = `${(currentTrack.title || '').toLowerCase()}:::${(currentTrack.artist || '').toLowerCase()}`;
      const chosenKeys = new Set([currentKey]);
      const distractors = [];

      for (const t of shuffleArray(room.tracksPool)) {
        if (t.id === currentTrack.id) continue;
        const key = `${(t.title || '').toLowerCase()}:::${(t.artist || '').toLowerCase()}`;
        if (!chosenKeys.has(key)) {
          chosenKeys.add(key);
          distractors.push(t);
          if (distractors.length === 3) break;
        }
      }

      rawOptions = [
        { id: currentTrack.id, title: currentTrack.title, artist: currentTrack.artist },
        ...distractors.map(d => ({ id: d.id, title: d.title, artist: d.artist }))
      ];
    }

    const shuffledOptions = shuffleArray(rawOptions);

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
      isDisney,
      answers: new Map()
    };

    room.status = 'playing';

    this.io.to(room.hostSocketId).emit('round_start_host', {
      roundIndex: room.currentRoundIndex + 1,
      totalRounds: room.settings.totalRounds,
      audioPreview: `/api/audio-preview/${currentTrack.id}`,
      fallbackPreview: currentTrack.preview,
      isAnime,
      isDisney,
      duration,
      players: this.getPlayersList(room)
    });

    for (const [socketId] of room.players) {
      this.io.to(socketId).emit('round_start_player', {
        roundIndex: room.currentRoundIndex + 1,
        totalRounds: room.settings.totalRounds,
        isAnime,
        isDisney,
        questionLabel: isDisney ? 'Trouve le Disney !' : (isAnime ? 'Trouve l\'animé !' : 'Trouve le morceau !'),
        options: shuffledOptions.map((opt, idx) => ({
          id: opt.id,
          index: idx,
          title: opt.title,
          artist: opt.artist
        })),
        duration
      });
    }

    room.roundTimer = setTimeout(() => {
      this.endRound(room);
    }, duration * 1000 + 500);
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
      const totalTimeMs = round.duration * 1000;
      const speedFactor = Math.max(0, 1 - (responseTimeMs / totalTimeMs));
      const basePoints = Math.round(500 + (500 * speedFactor));
      
      const streakBonus = Math.min(200, player.streak * 50);
      pointsEarned = basePoints + streakBonus;

      player.score += pointsEarned;
      player.streak += 1;
      player.correctAnswersCount = (player.correctAnswersCount || 0) + 1;
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

    let roundProgression = null;
    if (player.userId) {
      roundProgression = accountManager.recordRoundAnswer(player.userId, {
        isCorrect,
        responseTimeMs,
        streak: player.streak,
        themeId: room.themeId
      });
      if (roundProgression && roundProgression.levelInfo) {
        player.level = roundProgression.levelInfo.level;
        player.title = roundProgression.levelInfo.title;
        player.badge = roundProgression.levelInfo.badge;
      }
    }

    this.io.to(socketId).emit('answer_received', {
      hasAnswered: true,
      progression: roundProgression
    });

    this.io.to(room.hostSocketId).emit('player_answered', {
      playerId: socketId,
      answeredCount: round.answers.size,
      totalPlayers: room.players.size,
      players: this.getPlayersList(room)
    });

    this.checkAllPlayersAnswered(room);
  }

  checkAllPlayersAnswered(room) {
    if (!room.currentRound || room.status !== 'playing') return;
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

    this.io.to(room.hostSocketId).emit('round_ended_host', {
      track: {
        id: correctTrack.id,
        title: correctTrack.title,
        artist: correctTrack.artist,
        anime: correctTrack.anime || null,
        disney: correctTrack.disney || null,
        isAnime: Boolean(correctTrack.isAnime || round.isAnime),
        isDisney: Boolean(correctTrack.isDisney || round.isDisney),
        cover: correctTrack.cover,
        preview: correctTrack.preview
      },
      leaderboard,
      revealDuration: room.settings.revealDuration
    });

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
          disney: correctTrack.disney || null,
          isAnime: Boolean(correctTrack.isAnime || round.isAnime),
          isDisney: Boolean(correctTrack.isDisney || round.isDisney)
        }
      });
    }

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
      let gameProgression = null;

      if (player.userId) {
        gameProgression = accountManager.recordGameEnd(player.userId, {
          score: player.score,
          rank,
          totalPlayers: room.players.size,
          roundsTotal: room.settings.totalRounds,
          correctCount: player.correctAnswersCount || 0,
          themeId: room.themeId
        });
      }

      this.io.to(socketId).emit('game_over_player', {
        rank,
        score: player.score,
        totalPlayers: room.players.size,
        progression: gameProgression
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
