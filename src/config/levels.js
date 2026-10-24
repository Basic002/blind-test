/**
 * Levels configuration & XP progression system
 */
const LEVELS = [
  { level: 1,  minXp: 0,     title: 'Novice de la Musique',    badge: '🎵', color: '#94a3b8' },
  { level: 2,  minXp: 300,   title: 'Mélomane en Herbe',       badge: '🌱', color: '#10b981' },
  { level: 3,  minXp: 750,   title: 'Oreille Musicale',        badge: '🎧', color: '#38bdf8' },
  { level: 4,  minXp: 1350,  title: 'Chasseur de Refrains',    badge: '🎯', color: '#818cf8' },
  { level: 5,  minXp: 2100,  title: 'Buzzer Express',          badge: '⚡', color: '#fb923c' },
  { level: 6,  minXp: 3000,  title: 'Disc Jockey',             badge: '💿', color: '#f43f5e' },
  { level: 7,  minXp: 4100,  title: 'Virtuose du Rythme',      badge: '🎸', color: '#a855f7' },
  { level: 8,  minXp: 5400,  title: 'Maître des Blind-Tests',  badge: '👑', color: '#ffc21a' },
  { level: 9,  minXp: 7000,  title: 'Oracle Musical',          badge: '🔮', color: '#ec4899' },
  { level: 10, minXp: 9000,  title: 'Légende du Blind-Test',   badge: '🏆', color: '#eab308' },
  { level: 11, minXp: 11500, title: 'Seigneur du Son',         badge: '🌟', color: '#f59e0b' },
  { level: 12, minXp: 14500, title: 'Virtuose Suprême',        badge: '💎', color: '#06b6d4' },
  { level: 15, minXp: 20000, title: 'Dieu de la Musique',      badge: '🌌', color: '#8b5cf6' }
];

function getLevelInfo(totalXp) {
  const xp = Math.max(0, Number(totalXp) || 0);
  let current = LEVELS[0];
  let next = LEVELS[1];

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
      break;
    }
  }

  const currentLevelXp = current.minXp;
  const nextLevelXp = next ? next.minXp : current.minXp * 1.5;
  const xpIntoLevel = xp - currentLevelXp;
  const xpNeededForLevel = nextLevelXp - currentLevelXp;
  const progressPercent = next ? Math.min(100, Math.floor((xpIntoLevel / xpNeededForLevel) * 100)) : 100;

  return {
    level: current.level,
    title: current.title,
    badge: current.badge,
    color: current.color,
    currentXp: xp,
    xpIntoLevel,
    xpNeededForLevel,
    nextLevelXp,
    progressPercent,
    isMaxLevel: !next
  };
}

module.exports = {
  LEVELS,
  getLevelInfo
};
