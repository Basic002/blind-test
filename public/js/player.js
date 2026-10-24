// Player Controller Script
const socket = io();

// State
let selectedAvatar = '🦊';
let myPlayerInfo = null;
let currentOptions = [];
let playerTimerInterval = null;
let hasAnsweredCurrentRound = false;

// Auth & Account State
let currentUser = null;
let authToken = localStorage.getItem('blindtest_token') || null;
let currentAuthTab = 'guest'; // 'guest' | 'account'
let authFormMode = 'login'; // 'login' | 'register'
let authSelectedAvatar = '🦊';

// DOM Elements
const views = {
  join: document.getElementById('view-join'),
  waiting: document.getElementById('view-waiting'),
  play: document.getElementById('view-play'),
  result: document.getElementById('view-result'),
  gameover: document.getElementById('view-gameover-player')
};

function switchView(viewName) {
  Object.values(views).forEach(v => {
    v.style.display = 'none';
  });
  if (views[viewName]) {
    views[viewName].style.display = viewName === 'play' ? 'flex' : 'block';
  }
}

// Check URL params for room code (from QR code scan)
const urlParams = new URLSearchParams(window.location.search);
const roomParam = urlParams.get('room');
if (roomParam) {
  const roomInput = document.getElementById('input-room-code');
  roomInput.value = roomParam.toUpperCase().trim();
}

// ---------------------------------------------------------------------------
// GESTION DU COMPTE & DE L'AUTHENTIFICATION
// ---------------------------------------------------------------------------

function applyUserState(user) {
  currentUser = user;
  if (user) {
    // Header
    document.getElementById('player-avatar-badge').textContent = user.avatar || '🦊';
    document.getElementById('player-name-badge').textContent = user.username;
    document.getElementById('player-level-badge').textContent = `Nv. ${user.progression?.level || 1}`;
    document.getElementById('player-title-badge').textContent = user.progression?.title || 'Novice';

    // View Join Banner
    document.getElementById('logged-user-section').style.display = 'flex';
    document.getElementById('logged-avatar').textContent = user.avatar || '🦊';
    document.getElementById('logged-username').textContent = user.username;
    document.getElementById('logged-level').textContent = `Nv. ${user.progression?.level || 1}`;
    document.getElementById('logged-title').textContent = user.progression?.title || 'Novice';

    document.getElementById('auth-tabs').style.display = 'none';
    document.getElementById('account-auth-section').style.display = 'none';
    document.getElementById('guest-avatar-section').style.display = 'none';
    document.getElementById('guest-nickname-section').style.display = 'none';

    document.getElementById('input-nickname').value = user.username;
    selectedAvatar = user.avatar || '🦊';
  } else {
    // Header guest state
    document.getElementById('player-avatar-badge').textContent = selectedAvatar;
    document.getElementById('player-name-badge').textContent = 'Joueur';
    document.getElementById('player-level-badge').textContent = 'Nv. 1';
    document.getElementById('player-title-badge').textContent = 'Invité';

    // View Join
    document.getElementById('logged-user-section').style.display = 'none';
    document.getElementById('auth-tabs').style.display = 'flex';
    switchAuthTab(currentAuthTab);
  }
}

// Auto-login verification on load
if (authToken) {
  socket.emit('auth_verify_token', { token: authToken });
}

socket.on('auth_verified', (data) => {
  applyUserState(data.user);
});

socket.on('auth_invalid', () => {
  localStorage.removeItem('blindtest_token');
  authToken = null;
  applyUserState(null);
});

// Tab Switcher (Invité vs Mon Compte)
function switchAuthTab(tab) {
  currentAuthTab = tab;
  const guestBtn = document.getElementById('tab-btn-guest');
  const accBtn = document.getElementById('tab-btn-account');
  if (guestBtn) guestBtn.classList.toggle('active', tab === 'guest');
  if (accBtn) accBtn.classList.toggle('active', tab === 'account');

  if (tab === 'guest') {
    document.getElementById('guest-avatar-section').style.display = 'block';
    document.getElementById('guest-nickname-section').style.display = 'block';
    document.getElementById('account-auth-section').style.display = 'none';
  } else {
    document.getElementById('guest-avatar-section').style.display = 'none';
    document.getElementById('guest-nickname-section').style.display = 'none';
    document.getElementById('account-auth-section').style.display = 'block';
  }
}

const tabGuestBtn = document.getElementById('tab-btn-guest');
if (tabGuestBtn) tabGuestBtn.addEventListener('click', () => switchAuthTab('guest'));

const tabAccBtn = document.getElementById('tab-btn-account');
if (tabAccBtn) tabAccBtn.addEventListener('click', () => switchAuthTab('account'));

// Switch Login / Register mode
const authSwitchMode = document.getElementById('auth-switch-mode');
if (authSwitchMode) {
  authSwitchMode.addEventListener('click', () => {
    const errEl = document.getElementById('auth-error-msg');
    if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }

    if (authFormMode === 'login') {
      authFormMode = 'register';
      document.getElementById('auth-form-title').textContent = 'Créer un compte';
      authSwitchMode.textContent = 'Déjà un compte ? Se connecter';
      document.getElementById('btn-auth-submit').textContent = 'Créer mon compte ➔';
      document.getElementById('auth-avatar-picker-group').style.display = 'block';
    } else {
      authFormMode = 'login';
      document.getElementById('auth-form-title').textContent = 'Connexion';
      authSwitchMode.textContent = 'Créer un compte';
      document.getElementById('btn-auth-submit').textContent = 'Se connecter ➔';
      document.getElementById('auth-avatar-picker-group').style.display = 'none';
    }
  });
}

// Avatar selection in auth form
document.querySelectorAll('#auth-avatar-picker .avatar-option').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('#auth-avatar-picker .avatar-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    authSelectedAvatar = el.dataset.avatar;
    vibrate(20);
  });
});

// Submit Auth (Direct HTTP REST with timeout & Socket fallback)
const btnAuthSubmit = document.getElementById('btn-auth-submit');

async function handleAuthSubmit() {
  const errEl = document.getElementById('auth-error-msg');
  if (errEl) {
    errEl.style.display = 'none';
    errEl.textContent = '';
  }

  const username = document.getElementById('auth-input-username').value.trim();
  const password = document.getElementById('auth-input-password').value;

  if (!username || username.length < 2 || username.length > 16) {
    const msg = 'Le pseudo doit contenir entre 2 et 16 caractères.';
    if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; } else { alert(msg); }
    return;
  }

  if (!password || password.length < 4) {
    const msg = 'Le mot de passe doit faire au moins 4 caractères.';
    if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; } else { alert(msg); }
    return;
  }

  if (btnAuthSubmit) {
    btnAuthSubmit.disabled = true;
    btnAuthSubmit.textContent = 'Chargement... ⏳';
  }

  try {
    const endpoint = authFormMode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const payload = authFormMode === 'register'
      ? { username, password, avatar: authSelectedAvatar }
      : { username, password };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || 'Erreur lors de l\'authentification.');
    }

    // Success!
    localStorage.setItem('blindtest_token', data.token);
    authToken = data.token;
    applyUserState(data.user);
    showToast('🎉', 'Connexion réussie', `Bienvenue ${data.user.username} !`);
    vibrate(60);
  } catch (err) {
    // If fetch failed (e.g. offline/network issue), fallback to socket emit
    if (socket && socket.connected) {
      if (authFormMode === 'register') {
        socket.emit('auth_register', { username, password, avatar: authSelectedAvatar });
      } else {
        socket.emit('auth_login', { username, password });
      }
      return; // Wait for socket response
    }

    const msg = err.name === 'AbortError'
      ? 'Délai d\'attente dépassé. Vérifie la connexion du serveur.'
      : (err.message || 'Erreur de connexion');
    if (errEl) {
      errEl.textContent = msg;
      errEl.style.display = 'block';
    } else {
      alert(msg);
    }
  } finally {
    if (btnAuthSubmit) {
      btnAuthSubmit.disabled = false;
      btnAuthSubmit.textContent = authFormMode === 'register' ? 'Créer mon compte ➔' : 'Se connecter ➔';
    }
  }
}

if (btnAuthSubmit) {
  btnAuthSubmit.addEventListener('click', handleAuthSubmit);
}

document.getElementById('auth-input-username')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleAuthSubmit();
});

document.getElementById('auth-input-password')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleAuthSubmit();
});

socket.on('auth_success', (data) => {
  if (btnAuthSubmit) {
    btnAuthSubmit.disabled = false;
    btnAuthSubmit.textContent = authFormMode === 'register' ? 'Créer mon compte ➔' : 'Se connecter ➔';
  }
  localStorage.setItem('blindtest_token', data.token);
  authToken = data.token;
  applyUserState(data.user);
  showToast('🎉', 'Connexion réussie', `Bienvenue ${data.user.username} !`);
  vibrate(60);
});

socket.on('auth_error', (data) => {
  if (btnAuthSubmit) {
    btnAuthSubmit.disabled = false;
    btnAuthSubmit.textContent = authFormMode === 'register' ? 'Créer mon compte ➔' : 'Se connecter ➔';
  }
  const errEl = document.getElementById('auth-error-msg');
  const msg = data.message || 'Erreur d\'authentification';
  if (errEl) {
    errEl.textContent = msg;
    errEl.style.display = 'block';
  } else {
    alert(msg);
  }
});

// Logout
function logoutUser() {
  localStorage.removeItem('blindtest_token');
  authToken = null;
  applyUserState(null);
  closeProfileModal();
  showToast('👋', 'Déconnecté', 'Session fermée');
}

const btnLoggedLogout = document.getElementById('btn-logged-logout');
if (btnLoggedLogout) btnLoggedLogout.addEventListener('click', logoutUser);

const btnModalLogout = document.getElementById('btn-logout');
if (btnModalLogout) btnModalLogout.addEventListener('click', logoutUser);

// ---------------------------------------------------------------------------
// MODAL PROFIL & SUCCÈS
// ---------------------------------------------------------------------------

function openProfileModal() {
  const modal = document.getElementById('modal-profile');
  if (!modal) return;
  modal.style.display = 'flex';

  if (currentUser) {
    socket.emit('get_profile', { userId: currentUser.id });
  } else {
    // Guest dummy profile
    document.getElementById('profile-avatar').textContent = selectedAvatar;
    document.getElementById('profile-username').textContent = document.getElementById('input-nickname').value || 'Invité';
    document.getElementById('profile-level-badge').textContent = 'Nv. 1';
    document.getElementById('profile-title').textContent = 'Invité sans compte';
    document.getElementById('profile-xp-text').textContent = 'Compte non connecté';
    document.getElementById('profile-xp-percent').textContent = '0%';
    document.getElementById('profile-xp-bar').style.width = '0%';
    document.getElementById('stat-games').textContent = '0';
    document.getElementById('stat-wins').textContent = '0';
    document.getElementById('stat-podiums').textContent = '0';
    document.getElementById('stat-accuracy').textContent = '0%';
    document.getElementById('stat-streak').textContent = '🔥 0';

    // Fetch achievements list definition
    fetch('/api/achievements')
      .then(r => r.json())
      .then(data => {
        renderAchievementsList(data.achievements || [], {});
      })
      .catch(() => {});
  }
}

function closeProfileModal() {
  const modal = document.getElementById('modal-profile');
  if (modal) modal.style.display = 'none';
}

document.getElementById('btn-open-profile-header')?.addEventListener('click', openProfileModal);
document.getElementById('player-profile-header-trigger')?.addEventListener('click', openProfileModal);
document.getElementById('btn-logged-profile')?.addEventListener('click', openProfileModal);
document.getElementById('btn-close-profile')?.addEventListener('click', closeProfileModal);
document.getElementById('btn-close-profile-bottom')?.addEventListener('click', closeProfileModal);

// Close on backdrop click
document.getElementById('modal-profile')?.addEventListener('click', (e) => {
  if (e.target.id === 'modal-profile') closeProfileModal();
});

socket.on('profile_data', (data) => {
  const user = data.user;
  const achievements = data.achievements || [];

  document.getElementById('profile-avatar').textContent = user.avatar || '🦊';
  document.getElementById('profile-username').textContent = user.username;
  document.getElementById('profile-level-badge').textContent = `Nv. ${user.progression.level}`;
  document.getElementById('profile-title').textContent = user.progression.title;

  const lvlInfo = user.progression.levelInfo;
  if (lvlInfo) {
    document.getElementById('profile-xp-text').textContent = `${lvlInfo.xpIntoLevel.toLocaleString('fr-FR')} / ${lvlInfo.xpNeededForLevel.toLocaleString('fr-FR')} XP`;
    document.getElementById('profile-xp-percent').textContent = `${lvlInfo.progressPercent}%`;
    document.getElementById('profile-xp-bar').style.width = `${lvlInfo.progressPercent}%`;
  }

  // Stats
  document.getElementById('stat-games').textContent = (user.stats.gamesPlayed || 0).toLocaleString('fr-FR');
  document.getElementById('stat-wins').textContent = (user.stats.gamesWon || 0).toLocaleString('fr-FR');
  document.getElementById('stat-podiums').textContent = (user.stats.podiums || 0).toLocaleString('fr-FR');
  const acc = user.stats.totalAnswers > 0
    ? Math.round(((user.stats.totalCorrectAnswers || 0) / user.stats.totalAnswers) * 100)
    : 0;
  document.getElementById('stat-accuracy').textContent = `${acc}%`;
  document.getElementById('stat-streak').textContent = `🔥 ${user.stats.bestStreak || 0}`;

  // Achievements
  renderAchievementsList(achievements, user.achievements || {});
});

function renderAchievementsList(achievements) {
  const listEl = document.getElementById('achievements-list');
  const countBadge = document.getElementById('achievements-count-badge');
  const unlocked = achievements.filter(a => a.isUnlocked).length;

  if (countBadge) countBadge.textContent = `${unlocked} / ${achievements.length} Débloqués`;

  listEl.innerHTML = achievements.map(ach => `
    <div class="achievement-card ${ach.isUnlocked ? 'unlocked' : 'locked'}">
      <div class="achievement-icon">${ach.isUnlocked ? ach.icon : '🔒'}</div>
      <div class="achievement-info">
        <div class="achievement-title">${escapeHtml(ach.name)} ${ach.isUnlocked ? '✓' : ''}</div>
        <div class="achievement-desc">${escapeHtml(ach.description)}</div>
      </div>
      <div class="achievement-reward">+${ach.xpReward} XP</div>
    </div>
  `).join('');
}

// ---------------------------------------------------------------------------
// TOAST NOTIFICATIONS (Succès & Montée de niveau)
// ---------------------------------------------------------------------------

function showToast(icon, title, subtitle, isLevelUp = false) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-item ${isLevelUp ? 'levelup' : ''}`;
  toast.innerHTML = `
    <span style="font-size: 1.8rem;">${icon}</span>
    <div style="display: flex; flex-direction: column; text-align: left; min-width: 0;">
      <span style="font-size: 0.76rem; font-weight: 800; color: ${isLevelUp ? 'var(--party-cyan)' : 'var(--party-gold)'}; text-transform: uppercase; letter-spacing: 0.05em;">${escapeHtml(title)}</span>
      <span style="font-size: 0.95rem; font-weight: 700; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(subtitle)}</span>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

// Avatar selection for guest
document.querySelectorAll('#avatar-picker .avatar-option').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('#avatar-picker .avatar-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    selectedAvatar = el.dataset.avatar;
    vibrate(20);
  });
});

// Join Button
const btnJoin = document.getElementById('btn-join');
btnJoin.addEventListener('click', () => {
  const roomCode = document.getElementById('input-room-code').value.trim().toUpperCase();
  const nickname = currentUser ? currentUser.username : document.getElementById('input-nickname').value.trim();
  const avatar = currentUser ? currentUser.avatar : selectedAvatar;

  if (!roomCode || roomCode.length < 3) {
    alert('Entre un code de salon valide !');
    return;
  }

  if (!nickname || nickname.length < 2 || nickname.length > 16) {
    alert('Le pseudo doit contenir entre 2 et 16 caractères !');
    return;
  }

  btnJoin.disabled = true;
  btnJoin.textContent = 'CONNEXION...';

  socket.emit('join_room', {
    roomCode,
    nickname,
    avatar,
    userId: currentUser ? currentUser.id : null
  });
});

// Join response handlers
socket.on('join_success', (data) => {
  myPlayerInfo = data.player;
  
  document.getElementById('player-avatar-badge').textContent = data.player.avatar;
  document.getElementById('player-name-badge').textContent = data.player.nickname;
  document.getElementById('player-level-badge').textContent = `Nv. ${data.player.level || 1}`;
  document.getElementById('player-title-badge').textContent = data.player.title || 'Novice';
  document.getElementById('player-score-badge').textContent = `${data.player.score} pts`;

  vibrate(50);
  switchView('waiting');
});

socket.on('join_error', (data) => {
  alert(data.message || 'Erreur lors de la connexion');
  btnJoin.disabled = false;
  btnJoin.textContent = 'REJOINDRE 🎮';
});

// Round Start on Mobile
socket.on('round_start_player', (data) => {
  hasAnsweredCurrentRound = false;
  currentOptions = data.options;

  vibrate(60);
  switchView('play');

  // Update header
  document.getElementById('player-round-badge').textContent = `Manche 0${data.roundIndex} / 0${data.totalRounds}`.replace(/0(\d\d)/g, '$1');
  const modeText = document.getElementById('player-question-mode');
  if (modeText) {
    if (data.isDisney) {
      modeText.textContent = "Trouve le Disney !";
      modeText.style.color = "var(--party-gold)";
    } else if (data.isAnime) {
      modeText.textContent = "Trouve l'animé !";
      modeText.style.color = "var(--party-coral)";
    } else {
      modeText.textContent = "Trouve le morceau !";
      modeText.style.color = "var(--party-cyan)";
    }
  }

  document.getElementById('answer-locked-banner').style.display = 'none';

  // Render 4 buttons
  const buttons = document.querySelectorAll('.choice-btn');
  buttons.forEach((btn, index) => {
    btn.classList.remove('selected', 'disabled');
    btn.disabled = false;
    
    const option = data.options[index];
    if (option) {
      btn.dataset.optionId = option.id;
      btn.querySelector('.choice-title').textContent = option.title;
      btn.querySelector('.choice-artist').textContent = data.isDisney ? 'Film Disney' : (data.isAnime ? 'Animé' : option.artist);
      btn.style.display = 'flex';
    } else {
      btn.style.display = 'none';
    }
  });

  // Start visual sync countdown
  startMobileTimer(data.duration);
});

// Answer Button click
document.querySelectorAll('.choice-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (hasAnsweredCurrentRound) return;
    hasAnsweredCurrentRound = true;

    const optionId = btn.dataset.optionId;
    vibrate(40);

    // Lock UI
    document.querySelectorAll('.choice-btn').forEach(b => {
      if (b === btn) {
        b.classList.add('selected');
      } else {
        b.classList.add('disabled');
        b.disabled = true;
      }
    });

    document.getElementById('answer-locked-banner').style.display = 'block';

    // Send answer to server
    socket.emit('submit_answer', {
      optionId,
      clientTimestamp: Date.now()
    });
  });
});

// Progression feedback during round
socket.on('round_progression_update', (progression) => {
  if (!progression) return;

  if (progression.newAchievements && progression.newAchievements.length > 0) {
    progression.newAchievements.forEach(ach => {
      showToast(ach.icon, 'Succès Débloqué !', `${ach.name} (+${ach.xpReward} XP)`);
      vibrate([60, 40, 80]);
    });
  }

  if (progression.wasLevelUp && progression.levelInfo) {
    showToast('⭐', 'Niveau Supérieur !', `Tu passes Niveau ${progression.levelInfo.level} · ${progression.levelInfo.title}`, true);
    document.getElementById('player-level-badge').textContent = `Nv. ${progression.levelInfo.level}`;
    document.getElementById('player-title-badge').textContent = progression.levelInfo.title;
    vibrate([100, 50, 100, 50, 200]);
  }
});

function startMobileTimer(durationSeconds) {
  if (playerTimerInterval) clearInterval(playerTimerInterval);

  const timerBar = document.getElementById('player-timer-bar');
  const startTime = Date.now();
  const totalMs = durationSeconds * 1000;

  timerBar.style.width = '100%';

  playerTimerInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, totalMs - elapsed);
    const percent = (remaining / totalMs) * 100;

    timerBar.style.width = `${percent}%`;

    if (remaining <= 0) {
      clearInterval(playerTimerInterval);
    }
  }, 50);
}

// Round Ended feedback
socket.on('round_ended_player', (data) => {
  if (playerTimerInterval) clearInterval(playerTimerInterval);

  switchView('result');

  // Update top score & streak
  document.getElementById('player-score-badge').textContent = `${data.totalScore.toLocaleString('fr-FR')} pts`;
  const streakBadge = document.getElementById('player-streak-badge');
  if (data.streak > 1) {
    streakBadge.style.display = 'inline-flex';
    streakBadge.textContent = `🔥 ${data.streak}`;
  } else {
    streakBadge.style.display = 'none';
  }

  const resultIcon = document.getElementById('result-icon');
  const resultTitle = document.getElementById('result-title');
  const resultPoints = document.getElementById('result-points');
  const resultSongName = document.getElementById('result-song-name');
  const resultRankText = document.getElementById('result-rank-text');
  const resultTypeLabel = document.getElementById('result-type-label');

  if (data.isCorrect) {
    vibrate([70, 40, 70]);
    resultIcon.textContent = '✓';
    resultTitle.textContent = 'Excellent !';
    resultTitle.style.color = 'var(--party-emerald)';
    resultPoints.textContent = `+${data.pointsEarned.toLocaleString('fr-FR')} pts`;
    resultPoints.style.color = 'var(--party-emerald)';
  } else {
    vibrate(180);
    resultIcon.textContent = '✕';
    resultTitle.textContent = 'Manqué';
    resultTitle.style.color = 'var(--party-coral)';
    resultPoints.textContent = '+0 pt';
    resultPoints.style.color = 'var(--text-tertiary)';
  }

  if (data.correctTrack && data.correctTrack.isDisney && data.correctTrack.disney) {
    if (resultTypeLabel) resultTypeLabel.textContent = "Film Disney :";
    resultSongName.textContent = `${data.correctTrack.disney} — "${data.correctTrack.title}"`;
  } else if (data.correctTrack && data.correctTrack.isAnime && data.correctTrack.anime) {
    if (resultTypeLabel) resultTypeLabel.textContent = "Animé culte :";
    resultSongName.textContent = `${data.correctTrack.anime} — "${data.correctTrack.title}"`;
  } else {
    if (resultTypeLabel) resultTypeLabel.textContent = "Titre du morceau :";
    resultSongName.textContent = `${data.correctTrack.title} — ${data.correctTrack.artist}`;
  }
  
  const rankSuffix = data.rank === 1 ? '1er' : `${data.rank}ème`;
  resultRankText.textContent = `Rang : ${rankSuffix} · ${data.totalScore.toLocaleString('fr-FR')} pts`;
});

// Game Over feedback
socket.on('game_over_player', (data) => {
  if (playerTimerInterval) clearInterval(playerTimerInterval);

  switchView('gameover');

  const finalMedal = document.getElementById('final-medal');
  const finalRankTitle = document.getElementById('final-rank-title');
  const finalScoreDisplay = document.getElementById('final-score-display');

  if (data.rank === 1) {
    vibrate([100, 50, 100, 50, 200]);
    finalMedal.textContent = '🥇';
    finalRankTitle.textContent = '1ère Place · Vainqueur !';
    finalRankTitle.style.color = 'var(--party-gold)';
  } else if (data.rank === 2) {
    finalMedal.textContent = '🥈';
    finalRankTitle.textContent = '2ème Place';
    finalRankTitle.style.color = '#cbd5e1';
  } else if (data.rank === 3) {
    finalMedal.textContent = '🥉';
    finalRankTitle.textContent = '3ème Place';
    finalRankTitle.style.color = '#f97316';
  } else {
    finalMedal.textContent = '🎮';
    finalRankTitle.textContent = `${data.rank}ème Place sur ${data.totalPlayers}`;
    finalRankTitle.style.color = 'var(--text-secondary)';
  }

  finalScoreDisplay.textContent = `${data.score.toLocaleString('fr-FR')} pts`;

  // Game End Progression (XP & Achievements)
  if (data.progression) {
    const prog = data.progression;
    if (prog.newAchievements && prog.newAchievements.length > 0) {
      setTimeout(() => {
        prog.newAchievements.forEach(ach => {
          showToast(ach.icon, 'Succès Débloqué !', `${ach.name} (+${ach.xpReward} XP)`);
        });
      }, 800);
    }

    if (prog.wasLevelUp && prog.levelInfo) {
      setTimeout(() => {
        showToast('⭐', 'Niveau Supérieur !', `Tu passes Niveau ${prog.levelInfo.level} · ${prog.levelInfo.title}`, true);
        document.getElementById('player-level-badge').textContent = `Nv. ${prog.levelInfo.level}`;
        document.getElementById('player-title-badge').textContent = prog.levelInfo.title;
      }, 1600);
    }
  }
});

// Back to lobby
socket.on('back_to_lobby', () => {
  if (playerTimerInterval) {
    clearInterval(playerTimerInterval);
    playerTimerInterval = null;
  }
  hasAnsweredCurrentRound = false;
  switchView('waiting');
  document.getElementById('player-score-badge').textContent = '0 pts';
  document.getElementById('player-streak-badge').style.display = 'none';
});

// Haptic feedback helper
function vibrate(pattern) {
  if (navigator && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Ignore if not supported / permissions
    }
  }
}

// Utility escape
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;');
}
