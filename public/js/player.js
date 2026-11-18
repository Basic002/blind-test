const socket = io();

let selectedAvatar = 'fox';
let myPlayerInfo = null;
let currentOptions = [];
let playerTimerInterval = null;
let hasAnsweredCurrentRound = false;

let currentGameMode = 'classic';
let currentSurvivalLives = 3;
let currentTeamId = 'red';
let currentTeamCount = 2;
let currentLives = 3;
let isPlayerEliminated = false;
let currentTeamScores = [];

const TEAM_META = {
  red: { id: 'red', name: 'Rouge', color: '#ef4444', border: '#b91c1c' },
  blue: { id: 'blue', name: 'Bleue', color: '#3b82f6', border: '#1d4ed8' },
  green: { id: 'green', name: 'Verte', color: '#10b981', border: '#047857' },
  yellow: { id: 'yellow', name: 'Jaune', color: '#f59e0b', border: '#b45309' }
};

function renderHeartIcons(lives, maxLives) {
  const max = maxLives || currentSurvivalLives || 3;
  let html = '';
  for (let i = 0; i < max; i++) {
    if (i < lives) {
      html += `<span style="display: inline-flex; align-items: center; justify-content: center; color: #ef4444;">${renderIcon('heart', { size: 16 })}</span>`;
    } else {
      html += `<span style="display: inline-flex; align-items: center; justify-content: center; opacity: 0.35; color: #64748b;">${renderIcon('heart-broken', { size: 16 })}</span>`;
    }
  }
  return html;
}

function updateHeaderModeBadge() {
  const badge = document.getElementById('player-header-mode-badge');
  if (!badge) return;
  if (currentGameMode === 'survival') {
    badge.style.display = 'inline-flex';
    if (isPlayerEliminated) {
      badge.innerHTML = `<span style="padding: 0.2rem 0.5rem; border-radius: 9999px; background: rgba(239, 68, 68, 0.2); border: 1.5px solid #ef4444; color: #ef4444; font-size: 0.72rem; font-weight: 800; display: inline-flex; align-items: center; gap: 0.25rem;">${renderIcon('skull', { size: 12 })} RIP</span>`;
    } else {
      badge.innerHTML = `<span style="padding: 0.2rem 0.5rem; border-radius: 9999px; background: rgba(239, 68, 68, 0.15); border: 1.5px solid #ef4444; color: #ef4444; font-size: 0.76rem; font-weight: 800; display: inline-flex; align-items: center; gap: 0.25rem;">${renderIcon('heart', { size: 13 })} ${currentLives}</span>`;
    }
  } else if (currentGameMode === 'teams') {
    badge.style.display = 'inline-flex';
    const team = TEAM_META[currentTeamId] || TEAM_META.red;
    badge.innerHTML = `<span style="padding: 0.2rem 0.55rem; border-radius: 9999px; background: ${team.color}22; border: 1.5px solid ${team.color}; color: ${team.color}; font-size: 0.74rem; font-weight: 800; display: inline-flex; align-items: center; gap: 0.25rem;">${renderIcon('users', { size: 12 })} ${escapeHtml(team.name)}</span>`;
  } else {
    badge.style.display = 'none';
    badge.innerHTML = '';
  }
}

function renderLobbyTeamButtons() {
  const container = document.getElementById('player-team-selector');
  if (!container) return;
  const count = currentTeamCount === 4 ? 4 : 2;
  const activeIds = ['red', 'blue', 'green', 'yellow'].slice(0, count);
  container.innerHTML = activeIds.map(tid => {
    const meta = TEAM_META[tid];
    const isSelected = currentTeamId === tid;
    return `<button type="button" class="player-team-btn ${isSelected ? 'selected' : ''}" data-team-id="${tid}" style="padding: 0.65rem 1.1rem; border-radius: 12px; font-weight: 800; font-size: 0.92rem; border: 2px solid ${meta.border}; background: ${isSelected ? meta.color : meta.color + '22'}; color: #ffffff; cursor: pointer; display: inline-flex; align-items: center; gap: 0.45rem; transition: transform 0.15s ease, background 0.15s ease;">
      <span style="display: inline-flex; align-items: center;">${renderIcon('users', { size: 16 })}</span>
      <span>${escapeHtml(meta.name)}</span>
    </button>`;
  }).join('');

  container.querySelectorAll('.player-team-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tid = btn.dataset.teamId;
      if (tid && tid !== currentTeamId) {
        currentTeamId = tid;
        vibrate(30);
        playMobileTapSfx();
        socket.emit('select_team', { teamId: tid });
        renderLobbyTeamButtons();
        updateHeaderModeBadge();
      }
    });
  });
}

function applyLobbyGameModeUI(settings, player, teamScores) {
  if (settings) {
    if (settings.gameMode) currentGameMode = settings.gameMode;
    if (settings.survivalLives) currentSurvivalLives = Number(settings.survivalLives);
    if (settings.teamCount) currentTeamCount = Number(settings.teamCount);
  }
  if (player) {
    if (player.lives !== undefined) currentLives = player.lives;
    if (player.isEliminated !== undefined) isPlayerEliminated = Boolean(player.isEliminated);
    if (player.teamId) currentTeamId = player.teamId;
  }
  if (teamScores) {
    currentTeamScores = teamScores;
  }

  const teamPicker = document.getElementById('player-team-picker-section');
  const survInfo = document.getElementById('player-survival-info');
  const survInitial = document.getElementById('player-survival-initial-lives');

  if (teamPicker && survInfo) {
    if (currentGameMode === 'teams') {
      teamPicker.style.display = 'block';
      survInfo.style.display = 'none';
      renderLobbyTeamButtons();
    } else if (currentGameMode === 'survival') {
      teamPicker.style.display = 'none';
      survInfo.style.display = 'block';
      if (survInitial) survInitial.textContent = currentSurvivalLives;
    } else {
      teamPicker.style.display = 'none';
      survInfo.style.display = 'none';
    }
  }

  updateHeaderModeBadge();
}

let currentUser = null;
let authToken = localStorage.getItem('blindtest_token') || null;
let currentAuthTab = 'guest';
let authFormMode = 'login';
let authSelectedAvatar = 'fox';

function initPlayerStaticIcons() {
  const openProf = document.getElementById('btn-open-profile-header');
  if (openProf && typeof renderIcon === 'function') openProf.innerHTML = renderIcon('trophy', { size: 20 });
  const logProf = document.getElementById('logged-profile-icon');
  if (logProf && typeof renderIcon === 'function') logProf.innerHTML = renderIcon('trophy', { size: 14 });
  const tGuest = document.getElementById('tab-guest-icon');
  if (tGuest && typeof renderIcon === 'function') tGuest.innerHTML = renderIcon('gamepad', { size: 16 });
  const tAcc = document.getElementById('tab-account-icon');
  if (tAcc && typeof renderIcon === 'function') tAcc.innerHTML = renderIcon('user', { size: 16 });
  const waitIcon = document.getElementById('waiting-icon');
  if (waitIcon && typeof renderIcon === 'function') waitIcon.innerHTML = renderIcon('gamepad', { size: 54 });
  const lockIcon = document.getElementById('answer-locked-icon');
  if (lockIcon && typeof renderIcon === 'function') lockIcon.innerHTML = renderIcon('lock', { size: 18 });
  const streakIcon = document.getElementById('streak-badge-icon');
  if (streakIcon && typeof renderIcon === 'function') streakIcon.innerHTML = renderIcon('flame', { size: 14 });
  const statStreakIcon = document.getElementById('stat-streak-icon');
  if (statStreakIcon && typeof renderIcon === 'function') statStreakIcon.innerHTML = renderIcon('flame', { size: 18 });
  const profTitleIcon = document.getElementById('profile-modal-title-icon');
  if (profTitleIcon && typeof renderIcon === 'function') profTitleIcon.innerHTML = renderIcon('trophy', { size: 22 });
  const survInfIcon = document.getElementById('player-surv-info-icon');
  if (survInfIcon && typeof renderIcon === 'function') survInfIcon.innerHTML = renderIcon('skull', { size: 16 });
  const legIconPlayer = document.getElementById('legal-modal-player-title-icon');
  if (legIconPlayer && typeof renderIcon === 'function') legIconPlayer.innerHTML = renderIcon('shield', { size: 22 });
  const sGuestIcon = document.getElementById('selfie-guest-icon');
  if (sGuestIcon && typeof renderIcon === 'function') sGuestIcon.innerHTML = renderIcon('camera', { size: 22 });
  const sGuestBtnIcon = document.getElementById('btn-selfie-action-icon');
  if (sGuestBtnIcon && typeof renderIcon === 'function') sGuestBtnIcon.innerHTML = renderIcon('camera', { size: 14 });
  const sAuthIcon = document.getElementById('selfie-auth-icon');
  if (sAuthIcon && typeof renderIcon === 'function') sAuthIcon.innerHTML = renderIcon('camera', { size: 22 });
  const sAuthBtnIcon = document.getElementById('btn-selfie-auth-action-icon');
  if (sAuthBtnIcon && typeof renderIcon === 'function') sAuthBtnIcon.innerHTML = renderIcon('camera', { size: 14 });
  const sProfCamIcon = document.getElementById('profile-selfie-cam-icon');
  if (sProfCamIcon && typeof renderIcon === 'function') sProfCamIcon.innerHTML = renderIcon('camera', { size: 12 });
  const logEditIcon = document.getElementById('logged-avatar-edit-icon');
  if (logEditIcon && typeof renderIcon === 'function') logEditIcon.innerHTML = renderIcon('edit', { size: 9 });
  const profEditIcon = document.getElementById('profile-edit-avatar-icon');
  if (profEditIcon && typeof renderIcon === 'function') profEditIcon.innerHTML = renderIcon('edit', { size: 16 });
  const sProfIcon = document.getElementById('selfie-profile-icon');
  if (sProfIcon && typeof renderIcon === 'function') sProfIcon.innerHTML = renderIcon('camera', { size: 22 });
  const sProfBtnIcon = document.getElementById('btn-selfie-profile-card-icon');
  if (sProfBtnIcon && typeof renderIcon === 'function') sProfBtnIcon.innerHTML = renderIcon('camera', { size: 14 });

  document.querySelectorAll('#avatar-picker .avatar-option').forEach(el => {
    const av = el.dataset.avatar;
    if (typeof renderAvatar === 'function') el.innerHTML = renderAvatar(av, 34);
  });
  document.querySelectorAll('#auth-avatar-picker .avatar-option').forEach(el => {
    const av = el.dataset.avatar;
    if (typeof renderAvatar === 'function') el.innerHTML = renderAvatar(av, 34);
  });
  document.querySelectorAll('#profile-avatar-picker .avatar-option').forEach(el => {
    const av = el.dataset.avatar;
    if (typeof renderAvatar === 'function') el.innerHTML = renderAvatar(av, 34);
  });

  const playerAvEl = document.getElementById('player-avatar-badge');
  if (playerAvEl && typeof renderAvatar === 'function') {
    playerAvEl.innerHTML = renderAvatar(selectedAvatar, 32);
  }

  document.querySelectorAll('#player-reaction-dock .reaction-btn').forEach(btn => {
    const em = btn.dataset.emote;
    if (em && typeof renderIcon === 'function') btn.innerHTML = renderIcon(em, { size: 24 });
  });
}
document.addEventListener('DOMContentLoaded', initPlayerStaticIcons);
initPlayerStaticIcons();

function processSelfieFile(file, callback) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 160;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        callback(null, dataUrl);
      } catch (err) {
        callback(err);
      }
    };
    img.onerror = () => callback(new Error('Image invalide'));
    img.src = e.target.result;
  };
  reader.onerror = () => callback(new Error('Lecture impossible'));
  reader.readAsDataURL(file);
}

function syncAvatarPickersUI(activeAvatar) {
  const isSelfie = activeAvatar && (activeAvatar.startsWith('data:image/') || activeAvatar.startsWith('http'));

  document.querySelectorAll('#avatar-picker .avatar-option').forEach(o => {
    o.classList.toggle('selected', !isSelfie && o.dataset.avatar === activeAvatar);
  });

  document.querySelectorAll('#profile-avatar-picker .avatar-option').forEach(o => {
    o.classList.toggle('selected', !isSelfie && o.dataset.avatar === activeAvatar);
  });

  const guestCard = document.getElementById('selfie-guest-card');
  if (guestCard) {
    guestCard.classList.toggle('selected', Boolean(isSelfie));
    if (isSelfie) {
      const p = document.getElementById('selfie-guest-preview');
      if (p) p.innerHTML = `<img src="${activeAvatar}" alt="Selfie" />`;
      const sub = document.getElementById('selfie-guest-sub');
      if (sub) sub.textContent = 'Avatar sélectionné ✓';
      const btnTxt = document.getElementById('btn-selfie-action-text');
      if (btnTxt) btnTxt.textContent = 'Changer';
    }
  }

  const profileCard = document.getElementById('selfie-profile-card');
  if (profileCard) {
    profileCard.classList.toggle('selected', Boolean(isSelfie));
    if (isSelfie) {
      const p = document.getElementById('selfie-profile-preview');
      if (p) p.innerHTML = `<img src="${activeAvatar}" alt="Selfie" />`;
      const sub = document.getElementById('selfie-profile-sub');
      if (sub) sub.textContent = 'Avatar sélectionné ✓';
      const btnTxt = document.getElementById('btn-selfie-profile-card-text');
      if (btnTxt) btnTxt.textContent = 'Changer';
    }
  }
}

function updateAccountAvatar(newAvatar) {
  if (!newAvatar) return;
  selectedAvatar = newAvatar;

  if (currentUser) {
    currentUser.avatar = newAvatar;
    if (currentUser.id && socket && socket.connected) {
      socket.emit('update_account_avatar', { userId: currentUser.id, avatar: newAvatar, token: authToken });
    }
    if (authToken) {
      fetch('/api/auth/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ avatar: newAvatar })
      }).catch(() => {});
    }
  }

  if (socket && socket.connected) {
    socket.emit('change_avatar', { avatar: newAvatar });
  }

  const profAv = document.getElementById('profile-avatar');
  if (profAv && typeof renderAvatar === 'function') profAv.innerHTML = renderAvatar(newAvatar, 54);
  const loggedAv = document.getElementById('logged-avatar');
  if (loggedAv && typeof renderAvatar === 'function') loggedAv.innerHTML = renderAvatar(newAvatar, 40);
  const badge = document.getElementById('player-avatar-badge');
  if (badge && typeof renderAvatar === 'function') badge.innerHTML = renderAvatar(newAvatar, 32);

  const statusBadge = document.getElementById('profile-avatar-status-badge');
  if (statusBadge) {
    statusBadge.style.display = 'inline';
    statusBadge.textContent = 'Enregistré ✓';
    setTimeout(() => {
      if (statusBadge) statusBadge.style.display = 'none';
    }, 2500);
  }

  syncAvatarPickersUI(newAvatar);
}

function applyGuestSelfie(dataUrl, shouldSelect = true) {
  if (!dataUrl) return;
  try {
    localStorage.setItem('blindtest_custom_selfie', dataUrl);
  } catch (e) {}

  const preview = document.getElementById('selfie-guest-preview');
  if (preview) {
    preview.innerHTML = `<img src="${dataUrl}" alt="Selfie" />`;
  }
  const title = document.getElementById('selfie-guest-title');
  if (title) title.textContent = 'Mon Selfie';
  const sub = document.getElementById('selfie-guest-sub');
  if (sub) sub.textContent = shouldSelect ? 'Avatar sélectionné ✓' : 'Photo enregistrée';
  const actionText = document.getElementById('btn-selfie-action-text');
  if (actionText) actionText.textContent = 'Changer';

  const profPreview = document.getElementById('selfie-profile-preview');
  if (profPreview) {
    profPreview.innerHTML = `<img src="${dataUrl}" alt="Selfie" />`;
  }
  const profTitle = document.getElementById('selfie-profile-title');
  if (profTitle) profTitle.textContent = 'Mon Selfie';
  const profSub = document.getElementById('selfie-profile-sub');
  if (profSub) profSub.textContent = shouldSelect ? 'Avatar sélectionné ✓' : 'Photo enregistrée';
  const profActionText = document.getElementById('btn-selfie-profile-card-text');
  if (profActionText) profActionText.textContent = 'Changer';

  if (shouldSelect) {
    updateAccountAvatar(dataUrl);
  }
}

function applyAuthSelfie(dataUrl, shouldSelect = true) {
  if (!dataUrl) return;
  const preview = document.getElementById('selfie-auth-preview');
  if (preview) {
    preview.innerHTML = `<img src="${dataUrl}" alt="Selfie" />`;
  }
  const title = document.getElementById('selfie-auth-title');
  if (title) title.textContent = 'Mon Selfie';
  const sub = document.getElementById('selfie-auth-sub');
  if (sub) sub.textContent = shouldSelect ? 'Avatar sélectionné ✓' : 'Photo enregistrée';
  const actionText = document.getElementById('btn-selfie-auth-action-text');
  if (actionText) actionText.textContent = 'Changer';

  if (shouldSelect) {
    authSelectedAvatar = dataUrl;
    const card = document.getElementById('selfie-auth-card');
    if (card) card.classList.add('selected');
    document.querySelectorAll('#auth-avatar-picker .avatar-option').forEach(o => o.classList.remove('selected'));
  }
}

try {
  const savedSelfie = localStorage.getItem('blindtest_custom_selfie');
  if (savedSelfie) {
    applyGuestSelfie(savedSelfie, false);
  }
} catch (e) {}

const MobileAudioCtxClass = window.AudioContext || window.webkitAudioContext;
let mobileAudioCtx = null;

function getMobileAudioCtx() {
  try {
    if (!mobileAudioCtx && MobileAudioCtxClass) {
      mobileAudioCtx = new MobileAudioCtxClass();
    }
    if (mobileAudioCtx && mobileAudioCtx.state === 'suspended') {
      mobileAudioCtx.resume().catch(() => {});
    }
    return mobileAudioCtx;
  } catch (e) {
    return null;
  }
}

function playMobileTapSfx() {
  const ctx = getMobileAudioCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  } catch (e) {}
}

function playMobileResultSfx(isCorrect) {
  const ctx = getMobileAudioCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    if (isCorrect) {
      [880, 1318.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.23);
      });
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.15);

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.17);
    }
  } catch (e) {}
}

function playHapticTickSfx() {
  const ctx = getMobileAudioCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.04);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  } catch (e) {}
}

let playerCountdownInterval = null;

function playMobileMarioKartBeep(isGo = false) {
  const ctx = getMobileAudioCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    if (!isGo) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
    } else {
      [1046.50, 1318.51].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.28 - idx * 0.08, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.71);
      });
    }
  } catch (e) {}
}

function startPlayerCountdown() {
  const overlay = document.getElementById('game-countdown-overlay');
  const numEl = document.getElementById('countdown-number');
  const labelEl = document.getElementById('countdown-label');
  const l1 = document.getElementById('countdown-light-1');
  const l2 = document.getElementById('countdown-light-2');
  const l3 = document.getElementById('countdown-light-3');

  if (!overlay || !numEl || !labelEl) return;

  if (playerCountdownInterval) {
    clearInterval(playerCountdownInterval);
    playerCountdownInterval = null;
  }

  overlay.style.display = 'flex';

  let currentStep = 3;

  function renderStep(step) {
    numEl.classList.remove('pop', 'state-3', 'state-2', 'state-1', 'state-go');
    void numEl.offsetWidth;
    numEl.classList.add('pop');

    if (l1) l1.className = 'countdown-light';
    if (l2) l2.className = 'countdown-light';
    if (l3) l3.className = 'countdown-light';

    if (step === 3) {
      numEl.textContent = '3';
      numEl.classList.add('state-3');
      labelEl.textContent = 'PRÊTS ?';
      labelEl.style.color = '#ff3366';
      if (l1) l1.className = 'countdown-light active-red';
      vibrate(80);
      playMobileMarioKartBeep(false);
    } else if (step === 2) {
      numEl.textContent = '2';
      numEl.classList.add('state-2');
      labelEl.textContent = 'ATTENTION...';
      labelEl.style.color = '#ffb703';
      if (l1) l1.className = 'countdown-light active-yellow';
      if (l2) l2.className = 'countdown-light active-yellow';
      vibrate(80);
      playMobileMarioKartBeep(false);
    } else if (step === 1) {
      numEl.textContent = '1';
      numEl.classList.add('state-1');
      labelEl.textContent = 'CONCENTREZ-VOUS...';
      labelEl.style.color = '#fb8500';
      if (l1) l1.className = 'countdown-light active-yellow';
      if (l2) l2.className = 'countdown-light active-yellow';
      if (l3) l3.className = 'countdown-light active-yellow';
      vibrate(80);
      playMobileMarioKartBeep(false);
    } else if (step === 0) {
      numEl.textContent = 'PARTEZ !';
      numEl.classList.add('state-go');
      labelEl.textContent = 'C\'EST PARTI !';
      labelEl.style.color = '#00f59b';
      if (l1) l1.className = 'countdown-light active-green';
      if (l2) l2.className = 'countdown-light active-green';
      if (l3) l3.className = 'countdown-light active-green';
      vibrate([100, 50, 150]);
      playMobileMarioKartBeep(true);
    }
  }

  renderStep(3);

  playerCountdownInterval = setInterval(() => {
    currentStep--;
    if (currentStep >= 0) {
      renderStep(currentStep);
    } else {
      clearInterval(playerCountdownInterval);
      playerCountdownInterval = null;
    }
  }, 1000);
}

function hidePlayerCountdown() {
  if (playerCountdownInterval) {
    clearInterval(playerCountdownInterval);
    playerCountdownInterval = null;
  }
  const overlay = document.getElementById('game-countdown-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

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
  const dock = document.getElementById('player-reaction-dock');
  if (dock) {
    dock.style.display = viewName === 'join' ? 'none' : 'flex';
  }
}

const urlParams = new URLSearchParams(window.location.search);
const roomParam = urlParams.get('room');
if (roomParam) {
  const roomInput = document.getElementById('input-room-code');
  roomInput.value = roomParam.toUpperCase().trim();
}

function applyUserState(user) {
  currentUser = user;
  if (user) {
    document.getElementById('player-avatar-badge').innerHTML = renderAvatar(user.avatar || 'fox', 32);
    document.getElementById('player-name-badge').textContent = user.username;
    document.getElementById('player-level-badge').textContent = `Nv. ${user.progression?.level || 1}`;
    document.getElementById('player-title-badge').textContent = user.progression?.title || 'Novice';

    document.getElementById('logged-user-section').style.display = 'flex';
    document.getElementById('logged-avatar').innerHTML = renderAvatar(user.avatar || 'fox', 40);
    document.getElementById('logged-username').textContent = user.username;
    document.getElementById('logged-level').textContent = `Nv. ${user.progression?.level || 1}`;
    document.getElementById('logged-title').textContent = user.progression?.title || 'Novice';

    document.getElementById('auth-tabs').style.display = 'none';
    document.getElementById('account-auth-section').style.display = 'none';
    document.getElementById('guest-avatar-section').style.display = 'block';
    const gLabel = document.getElementById('guest-avatar-label');
    if (gLabel) gLabel.textContent = 'Mon avatar';
    document.getElementById('guest-nickname-section').style.display = 'none';

    document.getElementById('input-nickname').value = user.username;
    selectedAvatar = user.avatar || 'fox';
    syncAvatarPickersUI(selectedAvatar);
  } else {
    document.getElementById('player-avatar-badge').innerHTML = renderAvatar(selectedAvatar, 32);
    document.getElementById('player-name-badge').textContent = 'Joueur';
    document.getElementById('player-level-badge').textContent = 'Nv. 1';
    document.getElementById('player-title-badge').textContent = 'Invité';

    document.getElementById('logged-user-section').style.display = 'none';
    document.getElementById('auth-tabs').style.display = 'flex';
    const gLabel = document.getElementById('guest-avatar-label');
    if (gLabel) gLabel.textContent = 'Choix de l\'avatar';
    document.getElementById('guest-avatar-section').style.display = 'block';
    document.getElementById('guest-nickname-section').style.display = 'block';
    switchAuthTab(currentAuthTab);
    syncAvatarPickersUI(selectedAvatar);
  }
}

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

const authSwitchMode = document.getElementById('auth-switch-mode');
if (authSwitchMode) {
  authSwitchMode.addEventListener('click', () => {
    const errEl = document.getElementById('auth-error-msg');
    if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }

    if (authFormMode === 'login') {
      authFormMode = 'register';
      document.getElementById('auth-form-title').textContent = 'Créer un compte';
      authSwitchMode.textContent = 'Déjà un compte ? Se connecter';
      document.getElementById('btn-auth-submit').textContent = 'Créer mon compte';
      document.getElementById('auth-avatar-picker-group').style.display = 'block';
    } else {
      authFormMode = 'login';
      document.getElementById('auth-form-title').textContent = 'Connexion';
      authSwitchMode.textContent = 'Créer un compte';
      document.getElementById('btn-auth-submit').textContent = 'Se connecter';
      document.getElementById('auth-avatar-picker-group').style.display = 'none';
    }
  });
}

document.querySelectorAll('#auth-avatar-picker .avatar-option').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('#auth-avatar-picker .avatar-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    const authCard = document.getElementById('selfie-auth-card');
    if (authCard) authCard.classList.remove('selected');
    const sub = document.getElementById('selfie-auth-sub');
    if (sub && authSelectedAvatar && authSelectedAvatar.startsWith('data:image/')) sub.textContent = 'Photo enregistrée';
    authSelectedAvatar = el.dataset.avatar;
    vibrate(20);
  });
});

const btnSnapAuth = document.getElementById('btn-selfie-snap-auth');
const inputSelfieAuth = document.getElementById('input-selfie-auth');
const cardSelfieAuth = document.getElementById('selfie-auth-card');

if (btnSnapAuth && inputSelfieAuth) {
  btnSnapAuth.addEventListener('click', (e) => {
    e.stopPropagation();
    inputSelfieAuth.click();
  });
}

if (cardSelfieAuth && inputSelfieAuth) {
  cardSelfieAuth.addEventListener('click', () => {
    if (authSelectedAvatar && authSelectedAvatar.startsWith('data:image/')) {
      applyAuthSelfie(authSelectedAvatar, true);
      vibrate(20);
    } else {
      const saved = localStorage.getItem('blindtest_custom_selfie');
      if (saved) {
        applyAuthSelfie(saved, true);
        vibrate(20);
      } else {
        inputSelfieAuth.click();
      }
    }
  });
}

if (inputSelfieAuth) {
  inputSelfieAuth.addEventListener('change', () => {
    const file = inputSelfieAuth.files && inputSelfieAuth.files[0];
    if (file) {
      processSelfieFile(file, (err, dataUrl) => {
        if (!err && dataUrl) {
          applyAuthSelfie(dataUrl, true);
          vibrate(35);
        }
      });
      inputSelfieAuth.value = '';
    }
  });
}

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
    btnAuthSubmit.textContent = 'Chargement...';
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

    localStorage.setItem('blindtest_token', data.token);
    authToken = data.token;
    applyUserState(data.user);
    showToast('party', 'Connexion réussie', `Bienvenue ${data.user.username} !`);
    vibrate(60);
  } catch (err) {
    if (socket && socket.connected) {
      if (authFormMode === 'register') {
        socket.emit('auth_register', { username, password, avatar: authSelectedAvatar });
      } else {
        socket.emit('auth_login', { username, password });
      }
      return;
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
      btnAuthSubmit.textContent = authFormMode === 'register' ? 'Créer mon compte' : 'Se connecter';
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
    btnAuthSubmit.textContent = authFormMode === 'register' ? 'Créer mon compte' : 'Se connecter';
  }
  localStorage.setItem('blindtest_token', data.token);
  authToken = data.token;
  applyUserState(data.user);
  showToast('party', 'Connexion réussie', `Bienvenue ${data.user.username} !`);
  vibrate(60);
});

socket.on('auth_error', (data) => {
  if (btnAuthSubmit) {
    btnAuthSubmit.disabled = false;
    btnAuthSubmit.textContent = authFormMode === 'register' ? 'Créer mon compte' : 'Se connecter';
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

function logoutUser() {
  localStorage.removeItem('blindtest_token');
  authToken = null;
  applyUserState(null);
  closeProfileModal();
  showToast('wave', 'Déconnecté', 'Session fermée');
}

const btnLoggedLogout = document.getElementById('btn-logged-logout');
if (btnLoggedLogout) btnLoggedLogout.addEventListener('click', logoutUser);

const btnModalLogout = document.getElementById('btn-logout');
if (btnModalLogout) btnModalLogout.addEventListener('click', logoutUser);

function openProfileModal() {
  const modal = document.getElementById('modal-profile');
  if (!modal) return;
  modal.style.display = 'flex';

  const activeAv = currentUser ? (currentUser.avatar || 'fox') : selectedAvatar;
  syncAvatarPickersUI(activeAv);

  if (currentUser) {
    socket.emit('get_profile', { userId: currentUser.id });
  } else {
    document.getElementById('profile-avatar').innerHTML = renderAvatar(selectedAvatar, 54);
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
    const streakValue = document.getElementById('stat-streak-value');
    if (streakValue) streakValue.textContent = '0';

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
document.getElementById('logged-user-info-trigger')?.addEventListener('click', openProfileModal);
document.getElementById('btn-close-profile')?.addEventListener('click', closeProfileModal);
document.getElementById('btn-close-profile-bottom')?.addEventListener('click', closeProfileModal);

document.getElementById('modal-profile')?.addEventListener('click', (e) => {
  if (e.target.id === 'modal-profile') closeProfileModal();
});

function openLegalModalPlayer() {
  const modal = document.getElementById('modal-legal-player');
  if (modal) modal.style.display = 'flex';
}

function closeLegalModalPlayer() {
  const modal = document.getElementById('modal-legal-player');
  if (modal) modal.style.display = 'none';
}

document.getElementById('btn-open-legal-player')?.addEventListener('click', openLegalModalPlayer);
document.getElementById('btn-close-legal-player')?.addEventListener('click', closeLegalModalPlayer);
document.getElementById('btn-close-legal-player-bottom')?.addEventListener('click', closeLegalModalPlayer);
document.getElementById('modal-legal-player')?.addEventListener('click', (e) => {
  if (e.target.id === 'modal-legal-player') closeLegalModalPlayer();
});

let playerChartInstance = null;
let lastScoreHistoryPlayer = null;

function openPlayerChartModal() {
  const modal = document.getElementById('modal-player-score-chart');
  if (!modal || !lastScoreHistoryPlayer) return;
  modal.style.display = 'flex';
  const modalIcon = document.getElementById('player-chart-modal-icon');
  if (modalIcon && typeof renderIcon === 'function') modalIcon.innerHTML = renderIcon('chart', { size: 22 });
  if (typeof window.renderScoreChart === 'function') {
    playerChartInstance = window.renderScoreChart({
      canvas: document.getElementById('score-evolution-canvas-player'),
      tooltipEl: document.getElementById('score-chart-tooltip-player'),
      legendEl: document.getElementById('chart-legend-container-player'),
      toggleGroupEl: document.getElementById('player-chart-mode-toggle'),
      scoreHistory: lastScoreHistoryPlayer
    });
  }
}

function closePlayerChartModal() {
  const modal = document.getElementById('modal-player-score-chart');
  if (modal) modal.style.display = 'none';
}

document.getElementById('btn-open-score-chart-player')?.addEventListener('click', openPlayerChartModal);
document.getElementById('btn-close-player-chart')?.addEventListener('click', closePlayerChartModal);
document.getElementById('btn-close-player-chart-bottom')?.addEventListener('click', closePlayerChartModal);
document.getElementById('modal-player-score-chart')?.addEventListener('click', (e) => {
  if (e.target.id === 'modal-player-score-chart') closePlayerChartModal();
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closePlayerChartModal();
    closeProfileModal();
    closeLegalModalPlayer();
  }
});

socket.on('profile_data', (data) => {
  const user = data.user;
  const achievements = data.achievements || [];

  document.getElementById('profile-avatar').innerHTML = renderAvatar(user.avatar || 'fox', 48);
  document.getElementById('profile-username').textContent = user.username;
  document.getElementById('profile-level-badge').textContent = `Nv. ${user.progression.level}`;
  document.getElementById('profile-title').textContent = user.progression.title;

  const lvlInfo = user.progression.levelInfo;
  if (lvlInfo) {
    document.getElementById('profile-xp-text').textContent = `${lvlInfo.xpIntoLevel.toLocaleString('fr-FR')} / ${lvlInfo.xpNeededForLevel.toLocaleString('fr-FR')} XP`;
    document.getElementById('profile-xp-percent').textContent = `${lvlInfo.progressPercent}%`;
    document.getElementById('profile-xp-bar').style.width = `${lvlInfo.progressPercent}%`;
  }

  document.getElementById('stat-games').textContent = (user.stats.gamesPlayed || 0).toLocaleString('fr-FR');
  document.getElementById('stat-wins').textContent = (user.stats.gamesWon || 0).toLocaleString('fr-FR');
  document.getElementById('stat-podiums').textContent = (user.stats.podiums || 0).toLocaleString('fr-FR');
  const acc = user.stats.totalAnswers > 0
    ? Math.round(((user.stats.totalCorrectAnswers || 0) / user.stats.totalAnswers) * 100)
    : 0;
  document.getElementById('stat-accuracy').textContent = `${acc}%`;
  const streakValue = document.getElementById('stat-streak-value');
  if (streakValue) streakValue.textContent = user.stats.bestStreak || 0;

  renderAchievementsList(achievements, user.achievements || {});
});

function renderAchievementsList(achievements) {
  const listEl = document.getElementById('achievements-list');
  const countBadge = document.getElementById('achievements-count-badge');
  const unlocked = achievements.filter(a => a.isUnlocked).length;

  if (countBadge) countBadge.textContent = `${unlocked} / ${achievements.length} Débloqués`;

  listEl.innerHTML = achievements.map(ach => `
    <div class="achievement-card ${ach.isUnlocked ? 'unlocked' : 'locked'}">
      <div class="achievement-icon" style="display: flex; align-items: center; justify-content: center;">${ach.isUnlocked ? renderIcon(ach.icon, { size: 30 }) : renderIcon('lock', { size: 26 })}</div>
      <div class="achievement-info">
        <div class="achievement-title" style="display: flex; align-items: center; gap: 0.35rem;"><span>${escapeHtml(ach.name)}</span> ${ach.isUnlocked ? renderIcon('check', { size: 14 }) : ''}</div>
        <div class="achievement-desc">${escapeHtml(ach.description)}</div>
      </div>
      <div class="achievement-reward">+${ach.xpReward} XP</div>
    </div>
  `).join('');
}

socket.on('account_avatar_updated', (data) => {
  if (data && data.user) {
    currentUser = data.user;
    selectedAvatar = data.user.avatar || 'fox';
    const profAv = document.getElementById('profile-avatar');
    if (profAv && typeof renderAvatar === 'function') profAv.innerHTML = renderAvatar(selectedAvatar, 54);
    const loggedAv = document.getElementById('logged-avatar');
    if (loggedAv && typeof renderAvatar === 'function') loggedAv.innerHTML = renderAvatar(selectedAvatar, 36);
    const badge = document.getElementById('player-avatar-badge');
    if (badge && typeof renderAvatar === 'function') badge.innerHTML = renderAvatar(selectedAvatar, 32);
  }
});

function showToast(icon, title, subtitle, isLevelUp = false) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-item ${isLevelUp ? 'levelup' : ''}`;
  toast.innerHTML = `
    <span style="width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center;">${renderIcon(icon, { size: 28 })}</span>
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

document.querySelectorAll('#avatar-picker .avatar-option').forEach(el => {
  el.addEventListener('click', () => {
    updateAccountAvatar(el.dataset.avatar);
    vibrate(20);
  });
});

document.querySelectorAll('#profile-avatar-picker .avatar-option').forEach(el => {
  el.addEventListener('click', () => {
    updateAccountAvatar(el.dataset.avatar);
    vibrate(20);
  });
});

const btnSnapGuest = document.getElementById('btn-selfie-snap-guest');
const inputSelfieGuest = document.getElementById('input-selfie-guest');
const cardSelfieGuest = document.getElementById('selfie-guest-card');

if (btnSnapGuest && inputSelfieGuest) {
  btnSnapGuest.addEventListener('click', (e) => {
    e.stopPropagation();
    inputSelfieGuest.click();
  });
}

if (cardSelfieGuest && inputSelfieGuest) {
  cardSelfieGuest.addEventListener('click', () => {
    const saved = localStorage.getItem('blindtest_custom_selfie');
    if (saved) {
      applyGuestSelfie(saved, true);
      vibrate(20);
    } else {
      inputSelfieGuest.click();
    }
  });
}

if (inputSelfieGuest) {
  inputSelfieGuest.addEventListener('change', () => {
    const file = inputSelfieGuest.files && inputSelfieGuest.files[0];
    if (file) {
      processSelfieFile(file, (err, dataUrl) => {
        if (!err && dataUrl) {
          applyGuestSelfie(dataUrl, true);
          vibrate(35);
        }
      });
      inputSelfieGuest.value = '';
    }
  });
}

const btnProfileSelfie = document.getElementById('btn-profile-snap-selfie');
const inputProfileSelfie = document.getElementById('input-selfie-profile');
const btnSnapProfileCard = document.getElementById('btn-selfie-snap-profile-card');
const cardSelfieProfile = document.getElementById('selfie-profile-card');

if (btnProfileSelfie && inputProfileSelfie) {
  btnProfileSelfie.addEventListener('click', () => {
    inputProfileSelfie.click();
  });
}

if (btnSnapProfileCard && inputProfileSelfie) {
  btnSnapProfileCard.addEventListener('click', (e) => {
    e.stopPropagation();
    inputProfileSelfie.click();
  });
}

if (cardSelfieProfile && inputProfileSelfie) {
  cardSelfieProfile.addEventListener('click', () => {
    const saved = localStorage.getItem('blindtest_custom_selfie');
    if (saved) {
      applyGuestSelfie(saved, true);
      vibrate(20);
    } else {
      inputProfileSelfie.click();
    }
  });
}

if (inputProfileSelfie) {
  inputProfileSelfie.addEventListener('change', () => {
    const file = inputProfileSelfie.files && inputProfileSelfie.files[0];
    if (file) {
      processSelfieFile(file, (err, dataUrl) => {
        if (!err && dataUrl) {
          applyGuestSelfie(dataUrl, true);
          vibrate(35);
        }
      });
      inputProfileSelfie.value = '';
    }
  });
}

const btnJoin = document.getElementById('btn-join');
btnJoin.addEventListener('click', () => {
  getMobileAudioCtx();
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
  btnJoin.textContent = 'Connexion...';

  socket.emit('join_room', {
    roomCode,
    nickname,
    avatar,
    userId: currentUser ? currentUser.id : null
  });
});

socket.on('join_success', (data) => {
  myPlayerInfo = data.player;
  
  document.getElementById('player-avatar-badge').innerHTML = renderAvatar(data.player.avatar, 32);
  document.getElementById('player-name-badge').textContent = data.player.nickname;
  document.getElementById('player-level-badge').textContent = `Nv. ${data.player.level || 1}`;
  document.getElementById('player-title-badge').textContent = data.player.title || 'Novice';
  document.getElementById('player-score-badge').textContent = `${data.player.score} pts`;

  applyLobbyGameModeUI(data.settings, data.player, data.teamScores);

  vibrate(50);
  switchView('waiting');
});

socket.on('settings_updated', (data) => {
  applyLobbyGameModeUI(data.settings, null, data.teamScores);
});

socket.on('lobby_update', (data) => {
  if (data.teamScores) currentTeamScores = data.teamScores;
  if (data.players && socket) {
    const me = data.players.find(p => p.id === socket.id);
    if (me) {
      if (me.teamId) currentTeamId = me.teamId;
      if (me.lives !== undefined) currentLives = me.lives;
      if (me.isEliminated !== undefined) isPlayerEliminated = Boolean(me.isEliminated);
    }
  }
  applyLobbyGameModeUI(data.settings, null, data.teamScores);
});

socket.on('join_error', (data) => {
  alert(data.message || 'Erreur lors de la connexion');
  btnJoin.disabled = false;
  btnJoin.textContent = 'Rejoindre';
});

socket.on('game_countdown', () => {
  startPlayerCountdown();
});

socket.on('round_start_player', (data) => {
  hidePlayerCountdown();
  hasAnsweredCurrentRound = false;
  currentOptions = data.options;
  if (data.gameMode) currentGameMode = data.gameMode;
  if (data.lives !== undefined) currentLives = data.lives;
  if (data.isEliminated !== undefined) isPlayerEliminated = Boolean(data.isEliminated);
  if (data.teamId) currentTeamId = data.teamId;
  if (data.teamScores) currentTeamScores = data.teamScores;

  vibrate(60);
  switchView('play');

  const statusBar = document.getElementById('player-mode-status-bar');
  const teamPill = document.getElementById('player-status-team-pill');
  const survHearts = document.getElementById('player-status-survival-hearts');
  const spectatorBanner = document.getElementById('player-spectator-banner');

  if (statusBar && teamPill && survHearts) {
    if (currentGameMode === 'teams') {
      statusBar.style.display = 'flex';
      const team = TEAM_META[currentTeamId] || TEAM_META.red;
      teamPill.style.display = 'inline-flex';
      teamPill.style.alignItems = 'center';
      teamPill.style.gap = '0.35rem';
      teamPill.style.color = team.color;
      teamPill.innerHTML = `${renderIcon('users', { size: 14 })} Équipe ${escapeHtml(team.name)}`;
      survHearts.style.display = 'none';
      if (spectatorBanner) spectatorBanner.style.display = 'none';
    } else if (currentGameMode === 'survival') {
      statusBar.style.display = 'flex';
      teamPill.style.display = 'none';
      survHearts.style.display = 'flex';
      survHearts.innerHTML = renderHeartIcons(currentLives, currentSurvivalLives);
      if (spectatorBanner) {
        spectatorBanner.style.display = isPlayerEliminated ? 'block' : 'none';
      }
    } else {
      statusBar.style.display = 'none';
      if (spectatorBanner) spectatorBanner.style.display = 'none';
    }
  }

  updateHeaderModeBadge();

  document.getElementById('player-round-badge').textContent = `Manche 0${data.roundIndex} / 0${data.totalRounds}`.replace(/0(\d\d)/g, '$1');
  const modeText = document.getElementById('player-question-mode');
  if (modeText) {
    if (data.isDisney) {
      modeText.textContent = "Trouve le Disney !";
      modeText.style.color = "var(--party-gold)";
    } else if (data.isAnime) {
      modeText.textContent = "Trouve l'animé !";
      modeText.style.color = "var(--party-coral)";
    } else if (data.isCinema) {
      modeText.textContent = "Trouve le film !";
      modeText.style.color = "#ef4444";
    } else if (data.isSeries) {
      modeText.textContent = "Trouve la série !";
      modeText.style.color = "#a855f7";
    } else if (data.isGaming) {
      modeText.textContent = "Trouve le jeu vidéo !";
      modeText.style.color = "#10b981";
    } else {
      modeText.textContent = "Trouve le morceau !";
      modeText.style.color = "var(--party-cyan)";
    }
  }

  document.getElementById('answer-locked-banner').style.display = 'none';

  const buttons = document.querySelectorAll('.choice-btn');
  buttons.forEach((btn, index) => {
    btn.classList.remove('selected', 'disabled');
    btn.disabled = false;
    
    const option = data.options[index];
    if (option) {
      btn.dataset.optionId = option.id;
      const titleEl = btn.querySelector('.choice-title');
      titleEl.textContent = option.title;
      if (option.title && option.title.length > 34) {
        titleEl.style.fontSize = '0.88rem';
      } else if (option.title && option.title.length > 24) {
        titleEl.style.fontSize = '1.02rem';
      } else {
        titleEl.style.fontSize = '';
      }
      const subLabel = data.isDisney ? 'Film Disney' : (data.isAnime ? 'Animé' : (data.isCinema ? 'Film culte' : (data.isSeries ? 'Série TV' : (data.isGaming ? 'Jeu Vidéo' : option.artist))));
      btn.querySelector('.choice-artist').textContent = subLabel;
      btn.style.display = 'flex';
    } else {
      btn.style.display = 'none';
    }
  });

  startMobileTimer(data.duration);
});

socket.on('answer_received', (data) => {
  if (data.lives !== undefined) currentLives = data.lives;
  if (data.isEliminated !== undefined) isPlayerEliminated = Boolean(data.isEliminated);
  updateHeaderModeBadge();
  const survHearts = document.getElementById('player-status-survival-hearts');
  if (survHearts && currentGameMode === 'survival') {
    survHearts.innerHTML = renderHeartIcons(currentLives, currentSurvivalLives);
  }
});

document.querySelectorAll('.choice-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (hasAnsweredCurrentRound) return;
    hasAnsweredCurrentRound = true;

    const optionId = btn.dataset.optionId;
    vibrate(40);
    playMobileTapSfx();

    document.querySelectorAll('.choice-btn').forEach(b => {
      if (b === btn) {
        b.classList.add('selected');
      } else {
        b.classList.add('disabled');
        b.disabled = true;
      }
    });

    document.getElementById('answer-locked-banner').style.display = 'block';

    socket.emit('submit_answer', {
      optionId,
      clientTimestamp: Date.now()
    });
  });
});

socket.on('round_progression_update', (progression) => {
  if (!progression) return;

  if (progression.newAchievements && progression.newAchievements.length > 0) {
    progression.newAchievements.forEach(ach => {
      showToast(ach.icon, 'Succès Débloqué !', `${ach.name} (+${ach.xpReward} XP)`);
      vibrate([60, 40, 80]);
    });
  }

  if (progression.wasLevelUp && progression.levelInfo) {
    showToast('star', 'Niveau Supérieur !', `Tu passes Niveau ${progression.levelInfo.level} · ${progression.levelInfo.title}`, true);
    document.getElementById('player-level-badge').textContent = `Nv. ${progression.levelInfo.level}`;
    document.getElementById('player-title-badge').textContent = progression.levelInfo.title;
    vibrate([100, 50, 100, 50, 200]);
  }
});

function startMobileTimer(durationSeconds) {
  if (playerTimerInterval) clearInterval(playerTimerInterval);

  const timerBar = document.getElementById('player-timer-bar');
  const viewPlay = document.getElementById('view-play');
  const badge = document.getElementById('player-timer-countdown-badge');
  const startTime = Date.now();
  const totalMs = durationSeconds * 1000;
  let lastWarningSecond = -1;

  if (timerBar) {
    timerBar.style.width = '100%';
    timerBar.style.boxShadow = '';
    timerBar.classList.remove('timer-warning-pulse');
  }
  if (badge) {
    badge.style.display = 'none';
  }

  playerTimerInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, totalMs - elapsed);
    const percent = (remaining / totalMs) * 100;

    if (timerBar) {
      timerBar.style.width = `${percent}%`;
    }

    const secCeil = Math.ceil(remaining / 1000);
    if (secCeil <= 5 && secCeil > 0 && secCeil !== lastWarningSecond) {
      lastWarningSecond = secCeil;
      if (!isPlayerEliminated) {
        vibrate(hasAnsweredCurrentRound ? [60] : [85]);
        playHapticTickSfx();
      }
      if (timerBar) {
        timerBar.style.boxShadow = '0 0 18px rgba(255, 51, 102, 0.9)';
        timerBar.classList.add('timer-warning-pulse');
      }
      if (viewPlay) {
        viewPlay.classList.remove('haptic-shake');
        void viewPlay.offsetWidth;
        viewPlay.classList.add('haptic-shake');
      }
      if (badge) {
        badge.style.display = 'inline-flex';
        badge.textContent = `⏱ ${secCeil}s !`;
      }
    }

    if (remaining <= 0) {
      clearInterval(playerTimerInterval);
      if (timerBar) {
        timerBar.classList.remove('timer-warning-pulse');
      }
      if (badge) {
        badge.style.display = 'none';
      }
      if (!isPlayerEliminated && lastWarningSecond !== 0) {
        lastWarningSecond = 0;
        vibrate([100, 50, 100]);
        playHapticTickSfx();
      }
    }
  }, 50);
}

socket.on('round_ended_player', (data) => {
  if (playerTimerInterval) clearInterval(playerTimerInterval);

  const endBadge = document.getElementById('player-timer-countdown-badge');
  if (endBadge) endBadge.style.display = 'none';
  const endTBar = document.getElementById('player-timer-bar');
  if (endTBar) endTBar.classList.remove('timer-warning-pulse');

  switchView('result');

  if (data.gameMode) currentGameMode = data.gameMode;
  if (data.lives !== undefined) currentLives = data.lives;
  if (data.isEliminated !== undefined) isPlayerEliminated = Boolean(data.isEliminated);
  if (data.teamId) currentTeamId = data.teamId;
  if (data.teamScores) currentTeamScores = data.teamScores;
  updateHeaderModeBadge();

  const survBanner = document.getElementById('result-survival-hearts-banner');
  const teamBanner = document.getElementById('result-team-points-banner');

  if (survBanner) {
    if (currentGameMode === 'survival') {
      survBanner.style.display = 'block';
      if (isPlayerEliminated) {
        survBanner.innerHTML = `<span style="display: inline-flex; align-items: center; gap: 0.35rem;">${renderIcon('skull', { size: 18 })} Éliminé (0 vie restante)</span>`;
        survBanner.style.background = 'rgba(239, 68, 68, 0.25)';
      } else {
        survBanner.innerHTML = `<span style="display: inline-flex; align-items: center; gap: 0.4rem;">${renderHeartIcons(currentLives, currentSurvivalLives)} <span style="margin-left: 0.3rem;">${currentLives} vie${currentLives > 1 ? 's' : ''} restante${currentLives > 1 ? 's' : ''}</span></span>`;
        survBanner.style.background = 'rgba(239, 68, 68, 0.15)';
      }
    } else {
      survBanner.style.display = 'none';
    }
  }

  if (teamBanner) {
    if (currentGameMode === 'teams') {
      teamBanner.style.display = 'block';
      const myTeam = (currentTeamScores || []).find(t => t.id === currentTeamId);
      const team = TEAM_META[currentTeamId] || TEAM_META.red;
      const teamTotal = myTeam ? myTeam.score.toLocaleString('fr-FR') : '0';
      teamBanner.innerHTML = `<span style="color: ${team.color}; display: inline-flex; align-items: center; gap: 0.35rem;">${renderIcon('users', { size: 16 })} Équipe ${escapeHtml(team.name)} : <strong>${teamTotal} pts au total</strong></span>`;
    } else {
      teamBanner.style.display = 'none';
    }
  }

  document.getElementById('player-score-badge').textContent = `${data.totalScore.toLocaleString('fr-FR')} pts`;
  const streakBadge = document.getElementById('player-streak-badge');
  const streakText = document.getElementById('streak-badge-text');
  if (data.streak > 1) {
    streakBadge.style.display = 'inline-flex';
    if (streakText) streakText.textContent = data.streak;
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
    playMobileResultSfx(true);
    resultIcon.innerHTML = renderIcon('check', { size: 54 });
    resultTitle.textContent = 'Excellent !';
    resultTitle.style.color = 'var(--party-emerald)';
    resultPoints.textContent = `+${data.pointsEarned.toLocaleString('fr-FR')} pts`;
    resultPoints.style.color = 'var(--party-emerald)';
  } else {
    vibrate(180);
    playMobileResultSfx(false);
    resultIcon.innerHTML = renderIcon('cross', { size: 54 });
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
  } else if (data.correctTrack && data.correctTrack.isCinema && data.correctTrack.cinema) {
    if (resultTypeLabel) resultTypeLabel.textContent = "Film culte :";
    resultSongName.textContent = `${data.correctTrack.cinema} — "${data.correctTrack.title}"`;
  } else if (data.correctTrack && data.correctTrack.isSeries && data.correctTrack.series) {
    if (resultTypeLabel) resultTypeLabel.textContent = "Série TV :";
    resultSongName.textContent = `${data.correctTrack.series} — "${data.correctTrack.title}"`;
  } else if (data.correctTrack && data.correctTrack.isGaming && data.correctTrack.gaming) {
    if (resultTypeLabel) resultTypeLabel.textContent = "Jeu vidéo :";
    resultSongName.textContent = `${data.correctTrack.gaming} — "${data.correctTrack.title}"`;
  } else {
    if (resultTypeLabel) resultTypeLabel.textContent = "Titre du morceau :";
    resultSongName.textContent = `${data.correctTrack.title} — ${data.correctTrack.artist}`;
  }
  
  const rankSuffix = data.rank === 1 ? '1er' : `${data.rank}ème`;
  resultRankText.textContent = `Rang : ${rankSuffix} · ${data.totalScore.toLocaleString('fr-FR')} pts`;
});

socket.on('game_over_player', (data) => {
  if (playerTimerInterval) clearInterval(playerTimerInterval);

  switchView('gameover');

  if (data.gameMode) currentGameMode = data.gameMode;
  if (data.lives !== undefined) currentLives = data.lives;
  if (data.isEliminated !== undefined) isPlayerEliminated = Boolean(data.isEliminated);
  if (data.teamId) currentTeamId = data.teamId;

  const finalMedal = document.getElementById('final-medal');
  const finalRankTitle = document.getElementById('final-rank-title');
  const finalScoreDisplay = document.getElementById('final-score-display');
  const teamResult = document.getElementById('gameover-team-result');
  const survResult = document.getElementById('gameover-survival-result');

  if (teamResult) {
    if (currentGameMode === 'teams' && data.winningTeam) {
      teamResult.style.display = 'inline-block';
      const isWinner = data.isWinnerTeam;
      const team = TEAM_META[data.winningTeam.id] || TEAM_META.red;
      if (isWinner) {
        teamResult.style.background = 'rgba(16, 185, 129, 0.2)';
        teamResult.style.border = '2px solid #10b981';
        teamResult.style.color = '#10b981';
        teamResult.innerHTML = `<span style="display: inline-flex; align-items: center; gap: 0.4rem;">${renderIcon('trophy', { size: 20 })} Ton équipe l'emporte ! (${data.winningTeam.score.toLocaleString('fr-FR')} pts)</span>`;
      } else {
        teamResult.style.background = 'rgba(239, 68, 68, 0.15)';
        teamResult.style.border = '2px solid #ef4444';
        teamResult.style.color = '#ff6b81';
        teamResult.innerHTML = `<span style="display: inline-flex; align-items: center; gap: 0.4rem;">${renderIcon('shield', { size: 18 })} Équipe ${escapeHtml(team.name)} gagnante (${data.winningTeam.score.toLocaleString('fr-FR')} pts)</span>`;
      }
    } else {
      teamResult.style.display = 'none';
    }
  }

  if (survResult) {
    if (currentGameMode === 'survival') {
      survResult.style.display = 'block';
      if (!isPlayerEliminated && data.rank === 1) {
        survResult.innerHTML = `<span style="display: inline-flex; align-items: center; gap: 0.45rem; color: var(--party-gold); font-size: 1.3rem;">${renderIcon('crown', { size: 28 })} VICTOIRE ROYALE · TOP 1 !</span>`;
      } else if (!isPlayerEliminated) {
        survResult.innerHTML = `<span style="display: inline-flex; align-items: center; gap: 0.35rem; color: #10b981;">${renderIcon('shield', { size: 20 })} Survivant final (${currentLives} ❤️ restantes)</span>`;
      } else {
        survResult.innerHTML = `<span style="display: inline-flex; align-items: center; gap: 0.35rem; color: #ef4444;">${renderIcon('skull', { size: 20 })} Éliminé avant la fin</span>`;
      }
    } else {
      survResult.style.display = 'none';
    }
  }

  if (data.rank === 1) {
    vibrate([100, 50, 100, 50, 200]);
    finalMedal.innerHTML = renderIcon('medal-gold', { size: 68 });
    finalRankTitle.textContent = '1ère Place · Vainqueur !';
    finalRankTitle.style.color = 'var(--party-gold)';
  } else if (data.rank === 2) {
    finalMedal.innerHTML = renderIcon('medal-silver', { size: 68 });
    finalRankTitle.textContent = '2ème Place';
    finalRankTitle.style.color = '#cbd5e1';
  } else if (data.rank === 3) {
    finalMedal.innerHTML = renderIcon('medal-bronze', { size: 68 });
    finalRankTitle.textContent = '3ème Place';
    finalRankTitle.style.color = '#f97316';
  } else {
    finalMedal.innerHTML = renderIcon('gamepad', { size: 68 });
    finalRankTitle.textContent = `${data.rank}ème Place sur ${data.totalPlayers}`;
    finalRankTitle.style.color = 'var(--text-secondary)';
  }

  finalScoreDisplay.textContent = `${data.score.toLocaleString('fr-FR')} pts`;

  const awardCard = document.getElementById('player-award-card');
  if (awardCard) {
    if (data.award) {
      awardCard.style.display = 'block';
      document.getElementById('player-award-icon').innerHTML = renderIcon(data.award.id || data.award.icon, { size: 36 });
      document.getElementById('player-award-title').textContent = data.award.title;
      document.getElementById('player-award-desc').textContent = data.award.desc;
      document.getElementById('player-award-value').textContent = data.award.value;
    } else {
      awardCard.style.display = 'none';
    }
  }

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
        showToast('star', 'Niveau Supérieur !', `Tu passes Niveau ${prog.levelInfo.level} · ${prog.levelInfo.title}`, true);
        document.getElementById('player-level-badge').textContent = `Nv. ${prog.levelInfo.level}`;
        document.getElementById('player-title-badge').textContent = prog.levelInfo.title;
      }, 1600);
    }
  }

  const chartBtn = document.getElementById('btn-open-score-chart-player');
  if (chartBtn) {
    if (data.scoreHistory) {
      chartBtn.style.display = 'inline-flex';
      const iconBtn = document.getElementById('icon-btn-chart-player');
      if (iconBtn && typeof renderIcon === 'function') iconBtn.innerHTML = renderIcon('chart', { size: 18 });
      lastScoreHistoryPlayer = data.scoreHistory;
    } else {
      chartBtn.style.display = 'none';
    }
  }
});

socket.on('back_to_lobby', (data) => {
  hidePlayerCountdown();
  if (playerTimerInterval) {
    clearInterval(playerTimerInterval);
    playerTimerInterval = null;
  }
  hasAnsweredCurrentRound = false;
  isPlayerEliminated = false;
  const chartBtn = document.getElementById('btn-open-score-chart-player');
  if (chartBtn) chartBtn.style.display = 'none';
  closePlayerChartModal();
  if (data && data.settings) {
    applyLobbyGameModeUI(data.settings, null, data.teamScores);
  }
  switchView('waiting');
  document.getElementById('player-score-badge').textContent = '0 pts';
  document.getElementById('player-streak-badge').style.display = 'none';
  updateHeaderModeBadge();
});

function vibrate(pattern) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      const p = Array.isArray(pattern) ? pattern : [pattern];
      navigator.vibrate(p);
    } catch (e) {
    }
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;');
}

let lastEmoteTime = 0;
function sendQuickEmote(emoteId, btn) {
  const now = Date.now();
  if (now - lastEmoteTime < 400) return;
  lastEmoteTime = now;

  playMobileTapSfx();
  vibrate(20);

  if (btn) {
    btn.classList.add('pop-anim');
    setTimeout(() => {
      btn.classList.remove('pop-anim');
    }, 320);
  }

  socket.emit('send_emote', { emoteId });
}

document.querySelectorAll('#player-reaction-dock .reaction-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const emoteId = btn.dataset.emote;
    if (emoteId) sendQuickEmote(emoteId, btn);
  });
});
