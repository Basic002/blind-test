const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getLevelInfo } = require('../config/levels');
const { ACHIEVEMENTS } = require('../config/achievements');

const DATA_DIR = path.join(__dirname, '../../data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');

// Strict username validation: 2 to 16 alphanumeric characters, accents, spaces, hyphens, and underscores
const USERNAME_REGEX = /^[\p{L}\p{N}_\- ]{2,16}$/u;

class AccountManager {
  constructor() {
    this.accounts = new Map(); // id -> user
    this.usernameIndex = new Map(); // lowercase username -> id
    this.sessions = new Map(); // token -> id
    this.initStorage();
  }

  initStorage() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(ACCOUNTS_FILE)) {
        const raw = fs.readFileSync(ACCOUNTS_FILE, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          for (const acc of data) {
            this.accounts.set(acc.id, acc);
            this.usernameIndex.set(acc.username.toLowerCase(), acc.id);
            if (Array.isArray(acc.tokens)) {
              for (const tok of acc.tokens) {
                this.sessions.set(tok, acc.id);
              }
            }
          }
        }
      } else {
        fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify([], null, 2), 'utf8');
      }
    } catch (err) {
      console.error('Erreur initialisation stockage comptes:', err);
    }
  }

  saveStorage() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = Array.from(this.accounts.values());
      fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error('Erreur sauvegarde comptes:', err);
    }
  }

  hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  }

  generateToken() {
    return crypto.randomBytes(24).toString('hex');
  }

  sanitizeUser(user) {
    if (!user) return null;
    const levelInfo = getLevelInfo(user.progression?.xp || 0);
    return {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      createdAt: user.createdAt,
      stats: user.stats,
      progression: {
        xp: user.progression.xp,
        level: levelInfo.level,
        title: levelInfo.title,
        badge: levelInfo.badge,
        color: levelInfo.color,
        levelInfo
      },
      achievements: user.achievements
    };
  }

  register(username, password, avatar = '🦊') {
    if (typeof username !== 'string') {
      throw new Error('Le pseudo est invalide.');
    }
    const cleanUsername = username.trim();
    if (!cleanUsername || cleanUsername.length < 2 || cleanUsername.length > 16) {
      throw new Error('Le pseudo doit contenir entre 2 et 16 caractères.');
    }
    if (!USERNAME_REGEX.test(cleanUsername)) {
      throw new Error('Le pseudo ne peut contenir que des lettres, chiffres, espaces, tirets et underscores.');
    }

    if (typeof password !== 'string' || password.length < 4) {
      throw new Error('Le mot de passe doit faire au moins 4 caractères.');
    }
    if (password.length > 128) {
      throw new Error('Le mot de passe ne peut pas dépasser 128 caractères.');
    }

    const cleanAvatar = typeof avatar === 'string' && avatar.trim().length > 0 && avatar.trim().length <= 10
      ? avatar.trim()
      : '🦊';

    const lower = cleanUsername.toLowerCase();
    if (this.usernameIndex.has(lower)) {
      throw new Error('Ce pseudonyme est déjà utilisé.');
    }

    const id = 'usr_' + crypto.randomBytes(8).toString('hex');
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword(password, salt);
    const token = this.generateToken();

    const user = {
      id,
      username: cleanUsername,
      passwordHash,
      salt,
      avatar: cleanAvatar,
      tokens: [token],
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        podiums: 0,
        totalPoints: 0,
        totalCorrectAnswers: 0,
        totalAnswers: 0,
        bestStreak: 0,
        fastestAnswerMs: null,
        themeStats: {}
      },
      progression: {
        xp: 0,
        level: 1,
        title: 'Novice de la Musique'
      },
      achievements: {}
    };

    this.accounts.set(id, user);
    this.usernameIndex.set(lower, id);
    this.sessions.set(token, id);
    this.saveStorage();

    return {
      user: this.sanitizeUser(user),
      token
    };
  }

  login(username, password) {
    if (typeof username !== 'string' || typeof password !== 'string') {
      throw new Error('Identifiant ou mot de passe incorrect.');
    }
    if (password.length > 128) {
      throw new Error('Identifiant ou mot de passe incorrect.');
    }

    const cleanUsername = username.trim().toLowerCase();
    const id = this.usernameIndex.get(cleanUsername);
    if (!id) {
      throw new Error('Identifiant ou mot de passe incorrect.');
    }

    const user = this.accounts.get(id);
    if (!user) {
      throw new Error('Compte introuvable.');
    }

    const hash = this.hashPassword(password, user.salt);
    if (hash !== user.passwordHash) {
      throw new Error('Identifiant ou mot de passe incorrect.');
    }

    const token = this.generateToken();
    if (!user.tokens) user.tokens = [];
    user.tokens.push(token);
    if (user.tokens.length > 5) user.tokens = user.tokens.slice(-5);
    user.lastLoginAt = Date.now();

    this.sessions.set(token, id);
    this.saveStorage();

    return {
      user: this.sanitizeUser(user),
      token
    };
  }

  getUserByToken(token) {
    if (!token || typeof token !== 'string' || token.length !== 48) return null;
    const id = this.sessions.get(token);
    if (!id) return null;
    const user = this.accounts.get(id);
    return user ? this.sanitizeUser(user) : null;
  }

  getUserById(userId) {
    if (!userId || typeof userId !== 'string') return null;
    const user = this.accounts.get(userId);
    return user ? this.sanitizeUser(user) : null;
  }

  updateAvatar(userId, newAvatar) {
    const user = this.accounts.get(userId);
    if (!user) return null;
    user.avatar = newAvatar;
    this.saveStorage();
    return this.sanitizeUser(user);
  }

  /**
   * Check and unlock achievements
   */
  checkAchievements(user, context = {}) {
    const newlyUnlocked = [];
    if (!user.achievements) user.achievements = {};

    for (const ach of ACHIEVEMENTS) {
      if (user.achievements[ach.id]) continue; // already unlocked

      let unlocked = false;
      try {
        unlocked = ach.check(user, context);
      } catch (e) {
        console.warn(`Erreur check succes ${ach.id}:`, e);
      }

      if (unlocked) {
        user.achievements[ach.id] = {
          unlockedAt: Date.now()
        };
        // Award achievement XP bonus
        user.progression.xp = (user.progression.xp || 0) + ach.xpReward;
        newlyUnlocked.push({
          id: ach.id,
          name: ach.name,
          description: ach.description,
          icon: ach.icon,
          xpReward: ach.xpReward
        });
      }
    }

    // Update level if XP changed
    const levelInfo = getLevelInfo(user.progression.xp);
    user.progression.level = levelInfo.level;
    user.progression.title = levelInfo.title;

    return newlyUnlocked;
  }

  /**
   * Record a single round answer for a user
   */
  recordRoundAnswer(userId, { isCorrect, responseTimeMs, streak, themeId }) {
    const user = this.accounts.get(userId);
    if (!user) return null;

    if (!user.stats) user.stats = {};
    if (!user.stats.themeStats) user.stats.themeStats = {};

    user.stats.totalAnswers = (user.stats.totalAnswers || 0) + 1;
    if (isCorrect) {
      user.stats.totalCorrectAnswers = (user.stats.totalCorrectAnswers || 0) + 1;
      user.stats.bestStreak = Math.max(user.stats.bestStreak || 0, streak || 0);

      if (responseTimeMs) {
        if (!user.stats.fastestAnswerMs || responseTimeMs < user.stats.fastestAnswerMs) {
          user.stats.fastestAnswerMs = responseTimeMs;
        }
      }

      // Update theme stats
      if (themeId) {
        if (!user.stats.themeStats[themeId]) {
          user.stats.themeStats[themeId] = { correct: 0, total: 0 };
        }
        user.stats.themeStats[themeId].correct += 1;
      }
    }

    if (themeId) {
      if (!user.stats.themeStats[themeId]) {
        user.stats.themeStats[themeId] = { correct: 0, total: 0 };
      }
      user.stats.themeStats[themeId].total += 1;
    }

    // Calculate XP for this round
    let xpGained = 0;
    if (isCorrect) {
      xpGained += 25; // Base XP for correct answer
      if (responseTimeMs && responseTimeMs <= 3000) {
        xpGained += 15; // Speed bonus
      }
      if (streak && streak >= 3) {
        xpGained += 20; // Streak milestone
      }
    }

    const prevLevel = user.progression.level || 1;
    user.progression.xp = (user.progression.xp || 0) + xpGained;

    // Check round achievements
    const newlyUnlocked = this.checkAchievements(user, {
      isCorrect,
      responseTimeMs,
      streak,
      themeId
    });

    const levelInfo = getLevelInfo(user.progression.xp);
    user.progression.level = levelInfo.level;
    user.progression.title = levelInfo.title;

    const wasLevelUp = levelInfo.level > prevLevel;
    this.saveStorage();

    return {
      xpGained,
      newAchievements: newlyUnlocked,
      levelInfo,
      wasLevelUp
    };
  }

  /**
   * Record end of match for a user
   */
  recordGameEnd(userId, { score, rank, totalPlayers, roundsTotal, correctCount, themeId }) {
    const user = this.accounts.get(userId);
    if (!user) return null;

    if (!user.stats) user.stats = {};

    user.stats.gamesPlayed = (user.stats.gamesPlayed || 0) + 1;
    user.stats.totalPoints = (user.stats.totalPoints || 0) + (score || 0);

    if (rank === 1) {
      user.stats.gamesWon = (user.stats.gamesWon || 0) + 1;
    }
    if (rank <= 3) {
      user.stats.podiums = (user.stats.podiums || 0) + 1;
    }

    // End-of-game XP reward
    let endXp = 50; // Game participation
    if (rank === 1) endXp += 250;
    else if (rank === 2) endXp += 150;
    else if (rank === 3) endXp += 80;

    // Score bonus: +10 XP per 1000 points
    endXp += Math.floor((score || 0) / 1000) * 10;

    const prevLevel = user.progression.level || 1;
    user.progression.xp = (user.progression.xp || 0) + endXp;

    // Check game end achievements
    const newlyUnlocked = this.checkAchievements(user, {
      isGameEnd: true,
      score,
      rank,
      totalPlayers,
      roundsTotal,
      correctCount,
      themeId
    });

    const levelInfo = getLevelInfo(user.progression.xp);
    user.progression.level = levelInfo.level;
    user.progression.title = levelInfo.title;

    const wasLevelUp = levelInfo.level > prevLevel;
    this.saveStorage();

    return {
      xpGained: endXp,
      newAchievements: newlyUnlocked,
      levelInfo,
      wasLevelUp,
      stats: user.stats
    };
  }

  /**
   * Get full achievements list with user's unlocked state
   */
  getAchievementsForUser(userId) {
    const user = this.accounts.get(userId);
    const userAchs = user?.achievements || {};

    return ACHIEVEMENTS.map(ach => ({
      id: ach.id,
      name: ach.name,
      description: ach.description,
      icon: ach.icon,
      category: ach.category,
      xpReward: ach.xpReward,
      isUnlocked: Boolean(userAchs[ach.id]),
      unlockedAt: userAchs[ach.id]?.unlockedAt || null
    }));
  }
}

// Singleton instance
const accountManager = new AccountManager();

module.exports = accountManager;
