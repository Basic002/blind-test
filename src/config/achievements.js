/**
 * List of Achievements (Succès) in the Blind-Test game
 */
const ACHIEVEMENTS = [
  {
    id: 'first_step',
    name: 'Premier Pas',
    description: 'Terminer sa toute première partie de blind-test',
    icon: '🚀',
    category: 'Général',
    xpReward: 150,
    check: (user, context) => {
      return (user.stats.gamesPlayed || 0) >= 1;
    }
  },
  {
    id: 'speed_demon',
    name: 'Buzzer Éclair',
    description: 'Donner une bonne réponse en moins de 3 secondes',
    icon: '⚡',
    category: 'Vitesse',
    xpReward: 200,
    check: (user, context) => {
      return context && context.isCorrect && context.responseTimeMs && context.responseTimeMs <= 3000;
    }
  },
  {
    id: 'streak_3',
    name: 'En Plein Feu',
    description: 'Atteindre une série de 3 bonnes réponses consécutives',
    icon: '🔥',
    category: 'Précision',
    xpReward: 200,
    check: (user, context) => {
      return (user.stats.bestStreak || 0) >= 3 || (context && context.streak >= 3);
    }
  },
  {
    id: 'streak_5',
    name: 'Inarrêtable',
    description: 'Enchaîner une série de 5 bonnes réponses consécutives',
    icon: '☄️',
    category: 'Précision',
    xpReward: 350,
    check: (user, context) => {
      return (user.stats.bestStreak || 0) >= 5 || (context && context.streak >= 5);
    }
  },
  {
    id: 'first_victory',
    name: 'Numéro 1',
    description: 'Remporter une victoire (1ère place) dans une partie',
    icon: '👑',
    category: 'Victoire',
    xpReward: 400,
    check: (user, context) => {
      return (user.stats.gamesWon || 0) >= 1 || (context && context.rank === 1);
    }
  },
  {
    id: 'podium',
    name: 'Sur le Podium',
    description: 'Finir dans le Top 3 d\'une partie multijoueur',
    icon: '🥈',
    category: 'Victoire',
    xpReward: 200,
    check: (user, context) => {
      return (user.stats.podiums || 0) >= 1 || (context && context.rank && context.rank <= 3);
    }
  },
  {
    id: 'perfect_game',
    name: 'Sans Faute',
    description: 'Faire un 100% de bonnes réponses sur une partie complète',
    icon: '🎯',
    category: 'Précision',
    xpReward: 600,
    check: (user, context) => {
      return context && context.isGameEnd && context.roundsTotal > 0 && context.correctCount === context.roundsTotal;
    }
  },
  {
    id: 'disney_master',
    name: 'Prince(sse) Disney',
    description: 'Deviner 5 films Disney correctement',
    icon: '🏰',
    category: 'Thèmes',
    xpReward: 300,
    check: (user) => {
      return (user.stats.themeStats?.disney?.correct || 0) >= 5;
    }
  },
  {
    id: 'anime_otaku',
    name: 'Véritable Otaku',
    description: 'Identifier 5 openings d\'animés correctement',
    icon: '⚡',
    category: 'Thèmes',
    xpReward: 300,
    check: (user) => {
      return (user.stats.themeStats?.anime?.correct || 0) >= 5;
    }
  },
  {
    id: 'rap_master',
    name: 'Kickeur Né',
    description: 'Trouver 5 morceaux de Rap Français',
    icon: '🎤',
    category: 'Thèmes',
    xpReward: 300,
    check: (user) => {
      return (user.stats.themeStats?.['rap-fr']?.correct || 0) >= 5;
    }
  },
  {
    id: '80s_master',
    name: 'Nostalgie 80s',
    description: 'Trouver 5 morceaux des Années 80',
    icon: '🥖',
    category: 'Thèmes',
    xpReward: 300,
    check: (user) => {
      const fr80 = user.stats.themeStats?.['80s-fr']?.correct || 0;
      const gen80 = user.stats.themeStats?.['80s']?.correct || 0;
      return (fr80 + gen80) >= 5;
    }
  },
  {
    id: '2000s_master',
    name: 'Génération 2000',
    description: 'Trouver 5 morceaux des Années 2000',
    icon: '📼',
    category: 'Thèmes',
    xpReward: 300,
    check: (user) => {
      const fr2000 = user.stats.themeStats?.['2000s-fr']?.correct || 0;
      const gen2000 = user.stats.themeStats?.['2000s']?.correct || 0;
      return (fr2000 + gen2000) >= 5;
    }
  },
  {
    id: 'score_5000',
    name: 'Scoreur d\'Élite',
    description: 'Atteindre ou dépasser 5 000 points en une seule partie',
    icon: '🌟',
    category: 'Score',
    xpReward: 350,
    check: (user, context) => {
      return context && context.score >= 5000;
    }
  },
  {
    id: 'veteran_5_games',
    name: 'Fidèle au Poste',
    description: 'Jouer 5 parties complètes de blind-test',
    icon: '🕹️',
    category: 'Général',
    xpReward: 400,
    check: (user) => {
      return (user.stats.gamesPlayed || 0) >= 5;
    }
  },
  {
    id: 'level_5',
    name: 'Buzzer Confirmé',
    description: 'Atteindre le Niveau 5 (Buzzer Express)',
    icon: '🎖️',
    category: 'Progression',
    xpReward: 500,
    check: (user) => {
      return (user.progression.level || 1) >= 5;
    }
  },
  {
    id: 'level_10',
    name: 'Légende Vivante',
    description: 'Atteindre le Niveau 10 (Légende du Blind-Test)',
    icon: '💎',
    category: 'Progression',
    xpReward: 1000,
    check: (user) => {
      return (user.progression.level || 1) >= 10;
    }
  }
];

module.exports = { ACHIEVEMENTS };
