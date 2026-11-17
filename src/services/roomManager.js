const { getTracksForTheme } = require('./deezerService');
const accountManager = require('./accountManager');

const USERNAME_REGEX = /^[\p{L}\p{N}_\- ]{2,16}$/u;

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const FALLBACK_DISNEY_FILMS = [
  'Le Roi Lion', 'La Reine des Neiges', 'Aladdin', 'Mulan', 'Tarzan',
  'Vaiana', 'La Belle et la Bête', 'Hercule', 'La Petite Sirène', 'Pocahontas',
  'Le Livre de la Jungle', 'Les Aristochats', 'Raiponce', 'Encanto', 'Coco',
  'Toy Story', 'Ratatouille', 'Cendrillon', 'Pinocchio', 'Zootopie'
];

const FALLBACK_ANIMES = [
  'Naruto', 'L\'Attaque des Titans', 'One Piece', 'Demon Slayer', 'Dragon Ball Z',
  'Death Note', 'Tokyo Ghoul', 'Fullmetal Alchemist', 'Hunter x Hunter', 'My Hero Academia',
  'Chainsaw Man', 'Bleach', 'Neon Genesis Evangelion', 'Sword Art Online', 'Spy x Family',
  'Fairy Tail', 'Cowboy Bebop', 'Code Geass', 'Haikyuu!!', 'JoJo\'s Bizarre Adventure'
];

const FALLBACK_CINEMA_FILMS = [
  'Star Wars', 'Harry Potter', 'Le Seigneur des Anneaux', 'Gladiator', 'Inception',
  'Interstellar', 'Titanic', 'Jurassic Park', 'Pulp Fiction', 'Retour vers le Futur',
  'James Bond', 'Le Bon, la Brute et le Truand', 'Le Parrain', 'Rocky', 'Mission Impossible',
  'Indiana Jones', 'Forrest Gump', 'Top Gun', 'Pirates des Caraïbes', 'The Dark Knight (Batman)'
];

const FALLBACK_SERIES = [
  'Game of Thrones', 'Stranger Things', 'Friends', 'Peaky Blinders', 'Breaking Bad',
  'La Casa de Papel', 'The Walking Dead', 'Prison Break', 'Narcos', 'Vikings',
  'Sherlock', 'The Crown', 'Dexter', 'Lost', 'Buffy contre les vampires',
  'Le Prince de Bel-Air', 'Desperate Housewives', 'The Big Bang Theory', 'Dr House', 'Squid Game'
];

const FALLBACK_GAMES = [
  'The Legend of Zelda', 'Super Mario', 'The Elder Scrolls V: Skyrim', 'Minecraft', 'The Witcher 3',
  'Pokémon', 'Grand Theft Auto (GTA)', 'Final Fantasy', 'Halo', 'League of Legends',
  'DOOM', 'Cyberpunk 2077', 'Dark Souls', 'Elden Ring', 'Assassin\'s Creed',
  'God of War', 'Undertale', 'Sonic the Hedgehog', 'Street Fighter', 'Tetris'
];

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

function calculateAwards(room, finalLeaderboard) {
  const awards = [];
  const players = Array.from(room.players.values()).filter(p => p.gameStats);
  if (players.length === 0) return awards;

  let bestSpeedPlayer = null;
  let bestAvgSpeed = Infinity;

  let bestSniperPlayer = null;
  let bestSniperRatio = -1;

  let fastestAnswerPlayer = null;
  let fastestAnswerTime = Infinity;

  let bestStreakPlayer = null;
  let highestStreak = 0;

  let mostLatePlayer = null;
  let mostLateCount = 0;

  let mostWrongPlayer = null;
  let mostWrongCount = 0;

  for (const p of players) {
    const s = p.gameStats;
    if (s.correctTimes && s.correctTimes.length > 0) {
      const avg = s.correctTimes.reduce((a, b) => a + b, 0) / s.correctTimes.length;
      if (avg < bestAvgSpeed) {
        bestAvgSpeed = avg;
        bestSpeedPlayer = p;
      }
    }

    const total = (s.correctCount || 0) + (s.wrongCount || 0);
    if (total > 0) {
      const ratio = (s.correctCount || 0) / total;
      if (ratio > bestSniperRatio && (s.correctCount || 0) >= 2) {
        bestSniperRatio = ratio;
        bestSniperPlayer = p;
      }
    }

    if (s.fastestAnswerMs && s.fastestAnswerMs < fastestAnswerTime) {
      fastestAnswerTime = s.fastestAnswerMs;
      fastestAnswerPlayer = p;
    }

    if (s.bestStreak && s.bestStreak > highestStreak && s.bestStreak >= 3) {
      highestStreak = s.bestStreak;
      bestStreakPlayer = p;
    }

    if (s.lateAnswersCount && s.lateAnswersCount > mostLateCount && s.lateAnswersCount >= 1) {
      mostLateCount = s.lateAnswersCount;
      mostLatePlayer = p;
    }

    if (s.wrongCount && s.wrongCount > mostWrongCount && s.wrongCount >= 2) {
      mostWrongCount = s.wrongCount;
      mostWrongPlayer = p;
    }
  }

  if (bestSpeedPlayer && bestAvgSpeed < Infinity) {
    awards.push({
      id: 'fusee',
      title: 'La Fusée',
      icon: 'fusee',
      desc: 'Vitesse de réponse moyenne éclair',
      value: `${(bestAvgSpeed / 1000).toFixed(2)}s moy.`,
      player: { id: bestSpeedPlayer.id || '', nickname: bestSpeedPlayer.nickname, avatar: bestSpeedPlayer.avatar }
    });
  }

  if (bestSniperPlayer && bestSniperRatio > 0 && (!bestSpeedPlayer || bestSniperPlayer.id !== bestSpeedPlayer.id)) {
    awards.push({
      id: 'sniper',
      title: 'Le Sniper',
      icon: 'sniper',
      desc: 'Précision chirurgicale sur les manches',
      value: `${Math.round(bestSniperRatio * 100)}% de réussite`,
      player: { id: bestSniperPlayer.id || '', nickname: bestSniperPlayer.nickname, avatar: bestSniperPlayer.avatar }
    });
  }

  if (fastestAnswerPlayer && fastestAnswerTime < Infinity && fastestAnswerTime <= 3000) {
    awards.push({
      id: 'eclair',
      title: 'L\'Éclair',
      icon: 'eclair',
      desc: 'Bonne réponse la plus rapide de la partie',
      value: `${(fastestAnswerTime / 1000).toFixed(2)}s chrono`,
      player: { id: fastestAnswerPlayer.id || '', nickname: fastestAnswerPlayer.nickname, avatar: fastestAnswerPlayer.avatar }
    });
  }

  if (bestStreakPlayer && highestStreak >= 3) {
    awards.push({
      id: 'incendiaire',
      title: 'L\'Incendiaire',
      icon: 'incendiaire',
      desc: 'Plus longue série de bonnes réponses',
      value: `Série de ${highestStreak}`,
      player: { id: bestStreakPlayer.id || '', nickname: bestStreakPlayer.nickname, avatar: bestStreakPlayer.avatar }
    });
  }

  if (mostLatePlayer && mostLateCount >= 1) {
    awards.push({
      id: 'tortue',
      title: 'La Tortue',
      icon: 'tortue',
      desc: 'A validé in extremis au buzzer',
      value: `${mostLateCount} fois in extremis`,
      player: { id: mostLatePlayer.id || '', nickname: mostLatePlayer.nickname, avatar: mostLatePlayer.avatar }
    });
  }

  if (mostWrongPlayer && mostWrongCount >= 2) {
    awards.push({
      id: 'chat_noir',
      title: 'Le Chat Noir',
      icon: 'chat_noir',
      desc: 'Le joueur qui n\'a vraiment pas eu de chance',
      value: `${mostWrongCount} erreurs`,
      player: { id: mostWrongPlayer.id || '', nickname: mostWrongPlayer.nickname, avatar: mostWrongPlayer.avatar }
    });
  }

  return awards;
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
      playedTrackIds: new Set(),
      lastThemeId: 'disney',
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

  joinRoom(roomCode, socketId, nickname, avatar = 'fox', userId = null) {
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

    const cleanAvatar = typeof avatar === 'string' && avatar.trim().length > 0 && avatar.trim().length <= 30
      ? avatar.trim()
      : 'fox';

    let userLevel = 1;
    let userTitle = 'Novice';
    let userBadge = 'music';
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
      badge: p.badge || 'music',
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

    if (!room.playedTrackIds || room.lastThemeId !== room.themeId) {
      room.playedTrackIds = new Set();
      room.lastThemeId = room.themeId;
    }

    let availableTracks = room.tracksPool.filter(t => !room.playedTrackIds.has(t.id));
    if (availableTracks.length < totalRounds) {
      room.playedTrackIds.clear();
      availableTracks = room.tracksPool;
    }

    room.gameTracks = shuffleArray(availableTracks).slice(0, totalRounds);
    for (const t of room.gameTracks) {
      room.playedTrackIds.add(t.id);
    }
    room.currentRoundIndex = 0;

    for (const player of room.players.values()) {
      player.score = 0;
      player.streak = 0;
      player.correctAnswersCount = 0;
      player.hasAnswered = false;
      player.lastAnswer = null;
      player.gameStats = {
        correctCount: 0,
        wrongCount: 0,
        totalAnswerTimeMs: 0,
        correctTimes: [],
        bestStreak: 0,
        lateAnswersCount: 0,
        fastestAnswerMs: Infinity
      };
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
    const isCinema = Boolean(currentTrack.isCinema || room.themeId === 'cinema');
    const isSeries = Boolean(currentTrack.isSeries || room.themeId === 'series');
    const isGaming = Boolean(currentTrack.isGaming || room.themeId === 'gaming');
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

      if (disneyDistractors.length < 3) {
        for (const fallback of FALLBACK_DISNEY_FILMS) {
          if (!chosenDisney.has(fallback.toLowerCase())) {
            chosenDisney.add(fallback.toLowerCase());
            disneyDistractors.push({ id: `fb_disney_${disneyDistractors.length}`, disney: fallback });
            if (disneyDistractors.length === 3) break;
          }
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

      if (animeDistractors.length < 3) {
        for (const fallback of FALLBACK_ANIMES) {
          if (!chosenAnimes.has(fallback.toLowerCase())) {
            chosenAnimes.add(fallback.toLowerCase());
            animeDistractors.push({ id: `fb_anime_${animeDistractors.length}`, anime: fallback });
            if (animeDistractors.length === 3) break;
          }
        }
      }

      rawOptions = [
        { id: currentTrack.id, title: currentTrack.anime, artist: 'Animé' },
        ...animeDistractors.map(d => ({ id: d.id, title: d.anime, artist: 'Animé' }))
      ];
    } else if (isCinema && currentTrack.cinema) {
      const chosenCinema = new Set([currentTrack.cinema.toLowerCase()]);
      const cinemaDistractors = [];

      for (const t of shuffleArray(room.tracksPool)) {
        if (t.cinema && !chosenCinema.has(t.cinema.toLowerCase())) {
          chosenCinema.add(t.cinema.toLowerCase());
          cinemaDistractors.push(t);
          if (cinemaDistractors.length === 3) break;
        }
      }

      if (cinemaDistractors.length < 3) {
        for (const fallback of FALLBACK_CINEMA_FILMS) {
          if (!chosenCinema.has(fallback.toLowerCase())) {
            chosenCinema.add(fallback.toLowerCase());
            cinemaDistractors.push({ id: `fb_cinema_${cinemaDistractors.length}`, cinema: fallback });
            if (cinemaDistractors.length === 3) break;
          }
        }
      }

      rawOptions = [
        { id: currentTrack.id, title: currentTrack.cinema, artist: 'Film culte' },
        ...cinemaDistractors.map(d => ({ id: d.id, title: d.cinema, artist: 'Film culte' }))
      ];
    } else if (isSeries && currentTrack.series) {
      const chosenSeries = new Set([currentTrack.series.toLowerCase()]);
      const seriesDistractors = [];

      for (const t of shuffleArray(room.tracksPool)) {
        if (t.series && !chosenSeries.has(t.series.toLowerCase())) {
          chosenSeries.add(t.series.toLowerCase());
          seriesDistractors.push(t);
          if (seriesDistractors.length === 3) break;
        }
      }

      if (seriesDistractors.length < 3) {
        for (const fallback of FALLBACK_SERIES) {
          if (!chosenSeries.has(fallback.toLowerCase())) {
            chosenSeries.add(fallback.toLowerCase());
            seriesDistractors.push({ id: `fb_series_${seriesDistractors.length}`, series: fallback });
            if (seriesDistractors.length === 3) break;
          }
        }
      }

      rawOptions = [
        { id: currentTrack.id, title: currentTrack.series, artist: 'Série TV' },
        ...seriesDistractors.map(d => ({ id: d.id, title: d.series, artist: 'Série TV' }))
      ];
    } else if (isGaming && currentTrack.gaming) {
      const chosenGaming = new Set([currentTrack.gaming.toLowerCase()]);
      const gamingDistractors = [];

      for (const t of shuffleArray(room.tracksPool)) {
        if (t.gaming && !chosenGaming.has(t.gaming.toLowerCase())) {
          chosenGaming.add(t.gaming.toLowerCase());
          gamingDistractors.push(t);
          if (gamingDistractors.length === 3) break;
        }
      }

      if (gamingDistractors.length < 3) {
        for (const fallback of FALLBACK_GAMES) {
          if (!chosenGaming.has(fallback.toLowerCase())) {
            chosenGaming.add(fallback.toLowerCase());
            gamingDistractors.push({ id: `fb_gaming_${gamingDistractors.length}`, gaming: fallback });
            if (gamingDistractors.length === 3) break;
          }
        }
      }

      rawOptions = [
        { id: currentTrack.id, title: currentTrack.gaming, artist: 'Jeu Vidéo' },
        ...gamingDistractors.map(d => ({ id: d.id, title: d.gaming, artist: 'Jeu Vidéo' }))
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
      isCinema,
      isSeries,
      isGaming,
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
      isCinema,
      isSeries,
      isGaming,
      duration,
      players: this.getPlayersList(room)
    });

    const questionLabel = isDisney
      ? 'Trouve le Disney !'
      : (isAnime
        ? 'Trouve l\'animé !'
        : (isCinema
          ? 'Trouve le film !'
          : (isSeries
            ? 'Trouve la série !'
            : (isGaming
              ? 'Trouve le jeu vidéo !'
              : 'Trouve le morceau !'))));

    for (const [socketId] of room.players) {
      this.io.to(socketId).emit('round_start_player', {
        roundIndex: room.currentRoundIndex + 1,
        totalRounds: room.settings.totalRounds,
        isAnime,
        isDisney,
        isCinema,
        isSeries,
        isGaming,
        questionLabel,
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

    if (!player.gameStats) {
      player.gameStats = {
        correctCount: 0,
        wrongCount: 0,
        totalAnswerTimeMs: 0,
        correctTimes: [],
        bestStreak: 0,
        lateAnswersCount: 0,
        fastestAnswerMs: Infinity
      };
    }

    player.gameStats.totalAnswerTimeMs += responseTimeMs;
    if (responseTimeMs > (round.duration - 4) * 1000) {
      player.gameStats.lateAnswersCount += 1;
    }

    if (isCorrect) {
      player.gameStats.correctCount += 1;
      player.gameStats.correctTimes.push(responseTimeMs);
      if (responseTimeMs < player.gameStats.fastestAnswerMs) {
        player.gameStats.fastestAnswerMs = responseTimeMs;
      }
    } else {
      player.gameStats.wrongCount += 1;
    }

    if (player.streak > player.gameStats.bestStreak) {
      player.gameStats.bestStreak = player.streak;
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

    const allAnswered = round.answers.size >= room.players.size && room.players.size > 0;

    this.io.to(room.hostSocketId).emit('player_answered', {
      playerId: socketId,
      answeredCount: round.answers.size,
      totalPlayers: room.players.size,
      allAnswered,
      players: this.getPlayersList(room)
    });

    this.checkAllPlayersAnswered(room);
  }

  skipRound(roomCode, socketId) {
    const room = this.getRoom(roomCode);
    if (!room || room.status !== 'playing' || room.hostSocketId !== socketId) return;
    this.endRound(room);
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
        cinema: correctTrack.cinema || null,
        series: correctTrack.series || null,
        gaming: correctTrack.gaming || null,
        isAnime: Boolean(correctTrack.isAnime || round.isAnime),
        isDisney: Boolean(correctTrack.isDisney || round.isDisney),
        isCinema: Boolean(correctTrack.isCinema || round.isCinema),
        isSeries: Boolean(correctTrack.isSeries || round.isSeries),
        isGaming: Boolean(correctTrack.isGaming || round.isGaming),
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
          cinema: correctTrack.cinema || null,
          series: correctTrack.series || null,
          gaming: correctTrack.gaming || null,
          isAnime: Boolean(correctTrack.isAnime || round.isAnime),
          isDisney: Boolean(correctTrack.isDisney || round.isDisney),
          isCinema: Boolean(correctTrack.isCinema || round.isCinema),
          isSeries: Boolean(correctTrack.isSeries || round.isSeries),
          isGaming: Boolean(correctTrack.isGaming || round.isGaming)
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
    const awards = calculateAwards(room, finalLeaderboard);

    this.io.to(room.hostSocketId).emit('game_over_host', {
      podium: finalLeaderboard.slice(0, 3),
      leaderboard: finalLeaderboard,
      awards
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

      const playerAward = awards.find(a => a.player.id === socketId) || null;

      this.io.to(socketId).emit('game_over_player', {
        rank,
        score: player.score,
        totalPlayers: room.players.size,
        progression: gameProgression,
        award: playerAward
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
      player.gameStats = {
        correctCount: 0,
        wrongCount: 0,
        totalAnswerTimeMs: 0,
        correctTimes: [],
        bestStreak: 0,
        lateAnswersCount: 0,
        fastestAnswerMs: Infinity
      };
    }

    this.io.to(room.code).emit('back_to_lobby', {
      players: this.getPlayersList(room)
    });
  }
}

module.exports = RoomManager;
