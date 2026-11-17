const PRESET_LEVELS = [
  { level: 1,  minXp: 0,     title: 'Novice de la Musique',    badge: 'music', color: '#94a3b8' },
  { level: 2,  minXp: 300,   title: 'Mélomane en Herbe',       badge: 'sprout', color: '#10b981' },
  { level: 3,  minXp: 750,   title: 'Oreille Musicale',        badge: 'headphones', color: '#38bdf8' },
  { level: 4,  minXp: 1350,  title: 'Chasseur de Refrains',    badge: 'sniper', color: '#818cf8' },
  { level: 5,  minXp: 2100,  title: 'Buzzer Express',          badge: 'bolt', color: '#fb923c' },
  { level: 6,  minXp: 3000,  title: 'Disc Jockey',             badge: 'disc', color: '#f43f5e' },
  { level: 7,  minXp: 4100,  title: 'Virtuose du Rythme',      badge: 'guitar', color: '#a855f7' },
  { level: 8,  minXp: 5400,  title: 'Maître des Blind-Tests',  badge: 'crown', color: '#ffc21a' },
  { level: 9,  minXp: 7000,  title: 'Oracle Musical',          badge: 'sparkles', color: '#ec4899' },
  { level: 10, minXp: 9000,  title: 'Légende du Blind-Test',   badge: 'trophy', color: '#eab308' },
  { level: 11, minXp: 11500, title: 'Seigneur du Son',         badge: 'star', color: '#f59e0b' },
  { level: 12, minXp: 14500, title: 'Virtuose Suprême',        badge: 'diamond', color: '#06b6d4' },
  { level: 13, minXp: 17500, title: 'Titan du Rythme',         badge: 'bolt', color: '#3b82f6' },
  { level: 14, minXp: 21000, title: 'Archonte des Mélodies',   badge: 'flame', color: '#f97316' },
  { level: 15, minXp: 25000, title: 'Dieu de la Musique',      badge: 'galaxy', color: '#8b5cf6' },
  { level: 16, minXp: 29500, title: 'Titan Acoustique',        badge: 'sparkles', color: '#a855f7' },
  { level: 17, minXp: 34500, title: 'Maître des Harmonies',    badge: 'music', color: '#ec4899' },
  { level: 18, minXp: 40000, title: 'Prodige Céleste',         badge: 'sparkles', color: '#38bdf8' },
  { level: 19, minXp: 46000, title: 'Souverain Astral',        badge: 'galaxy', color: '#6366f1' },
  { level: 20, minXp: 52500, title: 'Légende Immortelle',      badge: 'diamond', color: '#14b8a6' },
  { level: 21, minXp: 59500, title: 'Seigneur des Fréquences', badge: 'volume-up', color: '#06b6d4' },
  { level: 22, minXp: 67000, title: 'Monarque des Ondes',      badge: 'series', color: '#f59e0b' },
  { level: 23, minXp: 75000, title: 'Alchimiste Sonore',       badge: 'potion', color: '#84cc16' },
  { level: 24, minXp: 83500, title: 'Oracle des Symphonies',   badge: 'violin', color: '#eab308' },
  { level: 25, minXp: 92500, title: 'Divinité Musicale',       badge: 'trident', color: '#ef4444' },
  { level: 26, minXp: 102000, title: 'Entité Stellaire',       badge: 'star', color: '#f43f5e' },
  { level: 27, minXp: 112000, title: 'Maître du Multivers',    badge: 'galaxy', color: '#8b5cf6' },
  { level: 28, minXp: 122500, title: 'Transcendance Sonore',   badge: 'galaxy', color: '#3b82f6' },
  { level: 29, minXp: 133500, title: 'Cosmos Rythmique',       badge: 'galaxy', color: '#ec4899' },
  { level: 30, minXp: 145000, title: 'Dieu Suprême Éternel',   badge: 'crown', color: '#ffd700' }
];

const PRESTIGE_TITLES = [
  'Dieu Primordial',
  'Maître de l\'Infini',
  'Légende Cosmique',
  'Entité Céleste',
  'Transcendant Suprême',
  'Titan Éternel',
  'Divinité Mythique',
  'Archonte Stellaire'
];

const PRESTIGE_BADGES = ['galaxy', 'crown', 'trident', 'diamond', 'flame', 'bolt', 'sparkles', 'star', 'music', 'trophy'];
const PRESTIGE_COLORS = ['#8b5cf6', '#ffd700', '#ec4899', '#06b6d4', '#f97316', '#3b82f6', '#10b981', '#f43f5e'];

function getLevelMeta(level) {
  const targetLevel = Math.max(1, Math.floor(Number(level) || 1));
  if (targetLevel <= PRESET_LEVELS.length) {
    return PRESET_LEVELS[targetLevel - 1];
  }
  const idx = targetLevel - PRESET_LEVELS.length - 1;
  const titleBase = PRESTIGE_TITLES[idx % PRESTIGE_TITLES.length];
  const prestige = Math.floor(idx / PRESTIGE_TITLES.length) + 1;
  const title = prestige > 1 ? `${titleBase} ${prestige}` : titleBase;
  return {
    level: targetLevel,
    title,
    badge: PRESTIGE_BADGES[idx % PRESTIGE_BADGES.length],
    color: PRESTIGE_COLORS[idx % PRESTIGE_COLORS.length]
  };
}

function getMinXpForLevel(level) {
  const targetLevel = Math.max(1, Math.floor(Number(level) || 1));
  if (targetLevel === 1) return 0;
  if (targetLevel <= PRESET_LEVELS.length) {
    return PRESET_LEVELS[targetLevel - 1].minXp;
  }
  const k = targetLevel - 15;
  return 25000 + 4250 * k + 250 * k * k;
}

function getLevelFromXp(totalXp) {
  const xp = Math.max(0, Number(totalXp) || 0);
  if (xp < 25000) {
    for (let i = PRESET_LEVELS.length - 1; i >= 0; i--) {
      if (xp >= PRESET_LEVELS[i].minXp) {
        return PRESET_LEVELS[i].level;
      }
    }
    return 1;
  }
  const delta = 289 + (xp - 25000) / 62.5;
  const k = Math.floor((-17 + Math.sqrt(delta)) / 2);
  return Math.max(15, 15 + k);
}

function getLevelInfo(totalXp) {
  const xp = Math.max(0, Number(totalXp) || 0);
  const currentLevel = getLevelFromXp(xp);
  const nextLevel = currentLevel + 1;

  const currentLevelMinXp = getMinXpForLevel(currentLevel);
  const nextLevelMinXp = getMinXpForLevel(nextLevel);

  const xpIntoLevel = xp - currentLevelMinXp;
  const xpNeededForLevel = Math.max(1, nextLevelMinXp - currentLevelMinXp);
  const progressPercent = Math.min(100, Math.max(0, Math.floor((xpIntoLevel / xpNeededForLevel) * 100)));

  const meta = getLevelMeta(currentLevel);

  return {
    level: currentLevel,
    title: meta.title,
    badge: meta.badge,
    color: meta.color,
    currentXp: xp,
    xpIntoLevel,
    xpNeededForLevel,
    nextLevelXp: nextLevelMinXp,
    progressPercent,
    isMaxLevel: false
  };
}

module.exports = {
  LEVELS: PRESET_LEVELS,
  PRESET_LEVELS,
  getMinXpForLevel,
  getLevelFromXp,
  getLevelMeta,
  getLevelInfo
};
