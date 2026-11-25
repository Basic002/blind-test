const socket = io();

let roomCode = null;
let currentThemes = [];
let selectedThemeId = 'disney';
let roundTimerInterval = null;
let audioFadeInterval = null;
let audioPlayer = document.getElementById('audio-player');
let currentPlayers = [];
let currentAudioFallback = null;
let bgmEnabled = localStorage.getItem('blindtest_bgm_enabled') !== 'false';

function initStaticIcons() {
  const brandBadge = document.getElementById('host-brand-badge');
  if (brandBadge && typeof renderIcon === 'function') {
    brandBadge.innerHTML = renderIcon('bolt', { size: 22 });
  }
  const bgmBtnIcon = document.getElementById('bgm-btn-icon');
  if (bgmBtnIcon && typeof renderIcon === 'function') {
    bgmBtnIcon.innerHTML = renderIcon('music', { size: 18 });
  }
  if (typeof updateBgmBtnState === 'function') {
    updateBgmBtnState();
  }
  const sfxBtnIcon = document.getElementById('sfx-btn-icon');
  if (sfxBtnIcon && typeof renderIcon === 'function') {
    sfxBtnIcon.innerHTML = renderIcon('bell-on', { size: 18 });
  }
  const ansIcon = document.getElementById('answers-counter-icon');
  if (ansIcon && typeof renderIcon === 'function') {
    ansIcon.innerHTML = renderIcon('bolt', { size: 18 });
  }
  const skipIcon = document.getElementById('skip-round-icon');
  if (skipIcon && typeof renderIcon === 'function') {
    skipIcon.innerHTML = renderIcon('skip', { size: 18 });
  }
  const p1 = document.getElementById('podium-icon-1');
  if (p1 && typeof renderIcon === 'function') {
    p1.innerHTML = renderIcon('trophy', { size: 28 });
  }
  const p2 = document.getElementById('podium-icon-2');
  if (p2 && typeof renderIcon === 'function') {
    p2.innerHTML = renderIcon('medal-silver', { size: 24 });
  }
  const p3 = document.getElementById('podium-icon-3');
  if (p3 && typeof renderIcon === 'function') {
    p3.innerHTML = renderIcon('medal-bronze', { size: 24 });
  }
  const awTitle = document.getElementById('awards-title-icon');
  if (awTitle && typeof renderIcon === 'function') {
    awTitle.innerHTML = renderIcon('award', { size: 22 });
  }
  const modeCl = document.getElementById('mode-icon-classic');
  if (modeCl && typeof renderIcon === 'function') modeCl.innerHTML = renderIcon('trophy', { size: 28 });
  const modeSurv = document.getElementById('mode-icon-survival');
  if (modeSurv && typeof renderIcon === 'function') modeSurv.innerHTML = renderIcon('skull', { size: 28 });
  const modeTms = document.getElementById('mode-icon-teams');
  if (modeTms && typeof renderIcon === 'function') modeTms.innerHTML = renderIcon('users', { size: 28 });
  const balIcon = document.getElementById('balance-teams-icon');
  if (balIcon && typeof renderIcon === 'function') balIcon.innerHTML = renderIcon('users', { size: 16 });
  const survIcon = document.getElementById('host-survival-icon');
  if (survIcon && typeof renderIcon === 'function') survIcon.innerHTML = renderIcon('skull', { size: 20 });
  const stepsIcon = document.getElementById('join-steps-header-icon');
  if (stepsIcon && typeof renderIcon === 'function') stepsIcon.innerHTML = renderIcon('gamepad', { size: 18 });
  const copyUrlIcon = document.getElementById('copy-url-icon');
  if (copyUrlIcon && typeof renderIcon === 'function') copyUrlIcon.innerHTML = renderIcon('copy', { size: 15 });
  const devPillIcon = document.getElementById('device-pill-icon');
  if (devPillIcon && typeof renderIcon === 'function') devPillIcon.innerHTML = renderIcon('wifi', { size: 15 });
  const guideIcon = document.getElementById('lobby-mode-guide-icon');
  if (guideIcon && typeof renderIcon === 'function') guideIcon.innerHTML = renderIcon('trophy', { size: 18 });
  const legIcon = document.getElementById('legal-modal-title-icon');
  if (legIcon && typeof renderIcon === 'function') legIcon.innerHTML = renderIcon('shield', { size: 22 });
  const hostProfileIcon = document.getElementById('host-profile-header-icon');
  if (hostProfileIcon && typeof renderIcon === 'function') hostProfileIcon.innerHTML = renderIcon('user', { size: 22 });
}
document.addEventListener('DOMContentLoaded', initStaticIcons);
initStaticIcons();

function openLegalModalHost() {
  const modal = document.getElementById('modal-legal');
  if (modal) modal.style.display = 'flex';
}

function closeLegalModalHost() {
  const modal = document.getElementById('modal-legal');
  if (modal) modal.style.display = 'none';
}

document.getElementById('btn-open-legal-host')?.addEventListener('click', openLegalModalHost);
document.getElementById('btn-close-legal')?.addEventListener('click', closeLegalModalHost);
document.getElementById('btn-close-legal-bottom')?.addEventListener('click', closeLegalModalHost);
document.getElementById('modal-legal')?.addEventListener('click', (e) => {
  if (e.target.id === 'modal-legal') closeLegalModalHost();
});

function closeHostPlayerProfile() {
  const modal = document.getElementById('modal-host-profile');
  if (modal) modal.style.display = 'none';
}

async function openHostPlayerProfile(playerId, userId) {
  const modal = document.getElementById('modal-host-profile');
  if (!modal) return;

  const headerIcon = document.getElementById('host-profile-header-icon');
  if (headerIcon && typeof renderIcon === 'function') {
    headerIcon.innerHTML = renderIcon('user', { size: 22 });
  }

  const avatarEl = document.getElementById('host-profile-avatar');
  const nameEl = document.getElementById('host-profile-nickname');
  const lvlEl = document.getElementById('host-profile-level-badge');
  const typeEl = document.getElementById('host-profile-type-badge');
  const titleEl = document.getElementById('host-profile-title');
  const xpSection = document.getElementById('host-profile-xp-section');
  const xpText = document.getElementById('host-profile-xp-text');
  const xpPercent = document.getElementById('host-profile-xp-percent');
  const xpBar = document.getElementById('host-profile-xp-bar');
  const guestNotice = document.getElementById('host-profile-guest-notice');

  const statGames = document.getElementById('host-stat-games');
  const statWins = document.getElementById('host-stat-wins');
  const statPodiums = document.getElementById('host-stat-podiums');
  const statAccuracy = document.getElementById('host-stat-accuracy');
  const statStreak = document.getElementById('host-stat-streak');
  const statCurScore = document.getElementById('host-stat-current-score');

  const achSection = document.getElementById('host-profile-achievements-section');
  const achBadge = document.getElementById('host-profile-achievements-badge');
  const achList = document.getElementById('host-profile-achievements-list');

  const inGamePlayer = (currentPlayers || []).find(p => (playerId && p.id === playerId) || (userId && p.userId === userId));

  const fallbackAvatar = inGamePlayer ? inGamePlayer.avatar : 'fox';
  const fallbackNick = inGamePlayer ? inGamePlayer.nickname : 'Joueur';
  const fallbackLvl = inGamePlayer ? (inGamePlayer.level || 1) : 1;
  const fallbackTitle = inGamePlayer ? (inGamePlayer.title || 'Novice') : 'Novice';
  const currentScore = inGamePlayer && inGamePlayer.score !== undefined ? `${inGamePlayer.score.toLocaleString('fr-FR')} pts` : '0 pts';

  if (avatarEl) avatarEl.innerHTML = renderAvatar(fallbackAvatar, 58);
  if (nameEl) nameEl.textContent = fallbackNick;
  if (lvlEl) lvlEl.textContent = `Nv. ${fallbackLvl}`;
  if (titleEl) titleEl.textContent = fallbackTitle;
  if (statCurScore) statCurScore.textContent = currentScore;

  const effectiveUserId = userId || (inGamePlayer && inGamePlayer.userId) || null;

  if (effectiveUserId) {
    if (typeEl) {
      typeEl.textContent = 'Compte';
      typeEl.className = 'host-profile-type-badge member';
    }
    if (guestNotice) guestNotice.style.display = 'none';
    if (xpSection) xpSection.style.display = 'block';
    if (achSection) achSection.style.display = 'block';

    if (achList) {
      achList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 1.5rem 0;">Chargement du profil...</div>';
    }

    modal.style.display = 'flex';

    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(effectiveUserId)}`);
      if (!res.ok) throw new Error('Profil introuvable');
      const data = await res.json();
      const u = data.user;
      const achievements = data.achievements || [];

      if (u.avatar && avatarEl) {
        avatarEl.innerHTML = renderAvatar(u.avatar, 58);
      }
      if (nameEl) nameEl.textContent = u.username || fallbackNick;

      const lvl = u.progression?.level || fallbackLvl;
      const title = u.progression?.title || fallbackTitle;
      if (lvlEl) lvlEl.textContent = `Nv. ${lvl}`;
      if (titleEl) titleEl.textContent = title;

      const info = u.progression?.levelInfo;
      const xpInto = info ? info.xpIntoLevel : 0;
      const xpNeeded = info ? info.xpNeededForLevel : 100;
      const pct = info ? info.progressPercent : 0;
      if (xpText) xpText.textContent = `${xpInto.toLocaleString('fr-FR')} / ${xpNeeded.toLocaleString('fr-FR')} XP`;
      if (xpPercent) xpPercent.textContent = `${pct}%`;
      if (xpBar) xpBar.style.width = `${pct}%`;

      const s = u.stats || {};
      if (statGames) statGames.textContent = s.gamesPlayed || 0;
      if (statWins) statWins.textContent = s.gamesWon || 0;
      if (statPodiums) statPodiums.textContent = s.podiums || 0;

      const acc = s.totalAnswers && s.totalAnswers > 0
        ? Math.round(((s.totalCorrectAnswers || 0) / s.totalAnswers) * 100)
        : 0;
      if (statAccuracy) statAccuracy.textContent = `${acc}%`;
      if (statStreak) statStreak.textContent = s.bestStreak || (inGamePlayer ? inGamePlayer.streak : 0);

      const unlockedCount = achievements.filter(a => a.isUnlocked).length;
      if (achBadge) achBadge.textContent = `${unlockedCount} / ${achievements.length}`;

      if (achList) {
        if (achievements.length === 0) {
          achList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 1rem 0;">Aucun succès disponible.</div>';
        } else {
          achList.innerHTML = achievements.map(a => {
            const statusClass = a.isUnlocked ? 'unlocked' : 'locked';
            const iconHtml = typeof renderIcon === 'function' ? renderIcon(a.icon || 'trophy', { size: 26 }) : '';
            return `
              <div class="achievement-card ${statusClass}">
                <span style="width: 38px; height: 38px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">${iconHtml}</span>
                <div style="flex: 1; min-width: 0;">
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
                    <span style="font-weight: 800; font-size: 0.95rem; color: #fff;">${escapeHtml(a.name)}</span>
                    <span style="font-size: 0.76rem; font-weight: 700; color: ${a.isUnlocked ? 'var(--party-gold)' : 'var(--text-tertiary)'};">+${a.xpReward || 50} XP</span>
                  </div>
                  <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.15rem; line-height: 1.3;">${escapeHtml(a.description)}</div>
                </div>
              </div>
            `;
          }).join('');
        }
      }
    } catch (err) {
      if (achList) {
        achList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 1rem 0;">Données de compte indisponibles.</div>';
      }
    }
  } else {
    if (typeEl) {
      typeEl.textContent = 'Invité';
      typeEl.className = 'host-profile-type-badge guest';
    }
    if (guestNotice) guestNotice.style.display = 'block';
    if (xpSection) xpSection.style.display = 'none';
    if (achSection) achSection.style.display = 'none';

    if (statGames) statGames.textContent = '1';
    if (statWins) statWins.textContent = '-';
    if (statPodiums) statPodiums.textContent = '-';
    if (statAccuracy) statAccuracy.textContent = '-';
    if (statStreak) statStreak.textContent = inGamePlayer ? (inGamePlayer.streak || 0) : '0';

    modal.style.display = 'flex';
  }
}

document.getElementById('btn-close-host-profile')?.addEventListener('click', closeHostPlayerProfile);
document.getElementById('btn-close-host-profile-bottom')?.addEventListener('click', closeHostPlayerProfile);
document.getElementById('modal-host-profile')?.addEventListener('click', (e) => {
  if (e.target.id === 'modal-host-profile') closeHostPlayerProfile();
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeHostPlayerProfile();
    closeLegalModalHost();
  }
});

const SILENT_AUDIO = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

const AudioContextClass = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let sfxEnabled = true;

function getAudioContext() {
  if (!audioCtx && AudioContextClass) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function getMasterSfxVolume() {
  if (!sfxEnabled) return 0;
  const vol = parseFloat(volumeSlider ? volumeSlider.value : 0.8);
  return Math.max(0, Math.min(1, vol));
}

function playRoundStartSfx() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const masterVol = getMasterSfxVolume();
  if (masterVol <= 0) return;

  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * 0.08);

    gain.gain.setValueAtTime(0, now + idx * 0.08);
    gain.gain.linearRampToValueAtTime(0.22 * masterVol, now + idx * 0.08 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.08);
    osc.stop(now + idx * 0.08 + 0.36);
  });
}

function playPlayerAnswerSfx() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const masterVol = getMasterSfxVolume();
  if (masterVol <= 0) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(750, now);
  osc.frequency.exponentialRampToValueAtTime(1350, now + 0.07);

  gain.gain.setValueAtTime(0.2 * masterVol, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.13);
}

function playCountdownTickSfx(secondsLeft) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const masterVol = getMasterSfxVolume();
  if (masterVol <= 0) return;

  const isUrgent = secondsLeft <= 3;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const freq = isUrgent ? 1150 : 850;

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.45, now + 0.06);

  const vol = (isUrgent ? 0.38 : 0.22) * masterVol;
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.08);
}

function playEmotePopSfx() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const masterVol = getMasterSfxVolume();
  if (masterVol <= 0) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

  gain.gain.setValueAtTime(0.12 * masterVol, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.1);
}

function playRevealSfx() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const masterVol = getMasterSfxVolume();
  if (masterVol <= 0) return;

  const chord = [392.00, 493.88, 587.33, 783.99, 987.77];
  chord.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * 0.035);

    gain.gain.setValueAtTime(0, now + idx * 0.035);
    gain.gain.linearRampToValueAtTime(0.18 * masterVol, now + idx * 0.035 + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.035 + 0.7);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.035);
    osc.stop(now + idx * 0.035 + 0.72);
  });
}

function playPodiumFanfareSfx() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const masterVol = getMasterSfxVolume();
  if (masterVol <= 0) return;

  const melody = [
    { freq: 392.00, time: 0.0, dur: 0.12 },
    { freq: 523.25, time: 0.14, dur: 0.12 },
    { freq: 659.25, time: 0.28, dur: 0.14 },
    { freq: 783.99, time: 0.44, dur: 0.22 },
    { freq: 659.25, time: 0.70, dur: 0.12 },
    { freq: 783.99, time: 0.84, dur: 0.14 },
    { freq: 1046.50, time: 1.02, dur: 0.6 }
  ];

  melody.forEach(note => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(note.freq, now + note.time);

    gain.gain.setValueAtTime(0, now + note.time);
    gain.gain.linearRampToValueAtTime(0.25 * masterVol, now + note.time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + note.time);
    osc.stop(now + note.time + note.dur + 0.02);
  });
}

let countdownInterval = null;

function playMarioKartBeepSfx(isGo = false) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const masterVol = getMasterSfxVolume();
  if (masterVol <= 0) return;
  const now = ctx.currentTime;

  if (!isGo) {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(523.25, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.45 * masterVol, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.39);
    osc2.stop(now + 0.39);
  } else {
    const freqs = [1046.50, 1318.51, 1567.98];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime((0.36 - idx * 0.08) * masterVol, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.86);
    });
  }
}

function startCountdownVisualAndSound() {
  const overlay = document.getElementById('game-countdown-overlay');
  const numEl = document.getElementById('countdown-number');
  const labelEl = document.getElementById('countdown-label');
  const l1 = document.getElementById('countdown-light-1');
  const l2 = document.getElementById('countdown-light-2');
  const l3 = document.getElementById('countdown-light-3');

  if (!overlay || !numEl || !labelEl) return;

  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
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
      playMarioKartBeepSfx(false);
    } else if (step === 2) {
      numEl.textContent = '2';
      numEl.classList.add('state-2');
      labelEl.textContent = 'ATTENTION...';
      labelEl.style.color = '#ffb703';
      if (l1) l1.className = 'countdown-light active-yellow';
      if (l2) l2.className = 'countdown-light active-yellow';
      playMarioKartBeepSfx(false);
    } else if (step === 1) {
      numEl.textContent = '1';
      numEl.classList.add('state-1');
      labelEl.textContent = 'CONCENTREZ-VOUS...';
      labelEl.style.color = '#fb8500';
      if (l1) l1.className = 'countdown-light active-yellow';
      if (l2) l2.className = 'countdown-light active-yellow';
      if (l3) l3.className = 'countdown-light active-yellow';
      playMarioKartBeepSfx(false);
    } else if (step === 0) {
      numEl.textContent = 'PARTEZ !';
      numEl.classList.add('state-go');
      labelEl.textContent = 'C\'EST PARTI !';
      labelEl.style.color = '#00f59b';
      if (l1) l1.className = 'countdown-light active-green';
      if (l2) l2.className = 'countdown-light active-green';
      if (l3) l3.className = 'countdown-light active-green';
      playMarioKartBeepSfx(true);
    }
  }

  renderStep(3);

  countdownInterval = setInterval(() => {
    currentStep--;
    if (currentStep >= 0) {
      renderStep(currentStep);
    } else {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }, 1000);
}

function hideCountdownOverlay() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  const overlay = document.getElementById('game-countdown-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

let lobbyBgmMasterGain = null;
let lobbyBgmTimer = null;
let lobbyBgmStep = 0;
let nextBgmStepTime = 0;
let lobbyMusicPlaying = false;
let bgmNoiseBuffer = null;

function getBgmNoiseBuffer(ctx) {
  if (!bgmNoiseBuffer && ctx) {
    const bufferSize = Math.floor(ctx.sampleRate * 1.5);
    bgmNoiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = bgmNoiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }
  return bgmNoiseBuffer;
}

function getMasterBgmVolume() {
  if (!bgmEnabled) return 0;
  const vol = parseFloat(volumeSlider ? volumeSlider.value : 0.8);
  return Math.max(0, Math.min(1, vol)) * 0.35;
}

function updateBgmVolume() {
  if (lobbyBgmMasterGain && audioCtx) {
    const targetVol = getMasterBgmVolume();
    lobbyBgmMasterGain.gain.setTargetAtTime(targetVol, audioCtx.currentTime, 0.05);
  }
}

function updateBgmBtnState() {
  const bgmToggleBtn = document.getElementById('bgm-toggle-btn');
  const bgmBtnIcon = document.getElementById('bgm-btn-icon');
  const bgmBtnText = document.getElementById('bgm-btn-text');
  if (bgmBtnIcon && typeof renderIcon === 'function') {
    bgmBtnIcon.innerHTML = renderIcon('music', { size: 18 });
  }
  if (bgmBtnText) {
    bgmBtnText.textContent = bgmEnabled ? 'Musique ON' : 'Musique OFF';
  }
  if (bgmToggleBtn) {
    bgmToggleBtn.style.opacity = bgmEnabled ? '1' : '0.6';
  }
}

function playBgmKick(ctx, time, destGain) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(125, time);
  osc.frequency.exponentialRampToValueAtTime(42, time + 0.1);
  gain.gain.setValueAtTime(0.5, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
  osc.connect(gain);
  gain.connect(destGain);
  osc.start(time);
  osc.stop(time + 0.23);
}

function playBgmSnare(ctx, time, destGain) {
  const noiseBuf = getBgmNoiseBuffer(ctx);
  if (!noiseBuf) return;
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(1800, time);
  bandpass.Q.setValueAtTime(1.8, time);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.24, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(180, time);
  osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);
  oscGain.gain.setValueAtTime(0.18, time);
  oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

  noise.connect(bandpass);
  bandpass.connect(gain);
  gain.connect(destGain);

  osc.connect(oscGain);
  oscGain.connect(destGain);

  noise.start(time);
  noise.stop(time + 0.17);
  osc.start(time);
  osc.stop(time + 0.09);
}

function playBgmHiHat(ctx, time, destGain, velocity = 0.12) {
  const noiseBuf = getBgmNoiseBuffer(ctx);
  if (!noiseBuf) return;
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;

  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.setValueAtTime(6500, time);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(velocity, time);
  gain.gain.exponentialRampToValueAtTime(0.0005, time + 0.045);

  noise.connect(highpass);
  highpass.connect(gain);
  gain.connect(destGain);

  noise.start(time);
  noise.stop(time + 0.05);
}

function playBgmBass(ctx, time, freq, duration, destGain) {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, time);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(260, time);

  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(0.38, time + 0.02);
  gain.gain.setValueAtTime(0.32, time + duration * 0.7);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(destGain);

  osc.start(time);
  osc.stop(time + duration + 0.02);
}

function playBgmRhodesChord(ctx, time, freqs, duration, destGain) {
  freqs.forEach((freq, idx) => {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 1.002, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, time);
    filter.frequency.exponentialRampToValueAtTime(600, time + duration);

    const noteVol = (0.08 / Math.sqrt(freqs.length)) * (1 - idx * 0.08);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(noteVol, time + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(destGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration + 0.05);
    osc2.stop(time + duration + 0.05);
  });
}

function playBgmChime(ctx, time, freq, destGain) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, time);

  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(0.065, time + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.95);

  osc.connect(gain);
  gain.connect(destGain);

  osc.start(time);
  osc.stop(time + 1.0);
}

function playLobbyBgmStep(ctx, step, time, stepDur) {
  if (step === 0) playBgmRhodesChord(ctx, time, [174.61, 261.63, 329.63, 392.00, 440.00], stepDur * 7.5, lobbyBgmMasterGain);
  if (step === 8) playBgmRhodesChord(ctx, time, [174.61, 261.63, 329.63, 392.00, 440.00], stepDur * 6.5, lobbyBgmMasterGain);
  if (step === 16) playBgmRhodesChord(ctx, time, [196.00, 246.94, 293.66, 329.63, 440.00], stepDur * 7.5, lobbyBgmMasterGain);
  if (step === 24) playBgmRhodesChord(ctx, time, [196.00, 246.94, 293.66, 329.63, 440.00], stepDur * 6.5, lobbyBgmMasterGain);
  if (step === 32) playBgmRhodesChord(ctx, time, [164.81, 246.94, 293.66, 369.99, 392.00], stepDur * 7.5, lobbyBgmMasterGain);
  if (step === 40) playBgmRhodesChord(ctx, time, [164.81, 246.94, 293.66, 369.99, 392.00], stepDur * 6.5, lobbyBgmMasterGain);
  if (step === 48) playBgmRhodesChord(ctx, time, [220.00, 261.63, 329.63, 392.00, 493.88], stepDur * 7.5, lobbyBgmMasterGain);
  if (step === 56) playBgmRhodesChord(ctx, time, [220.00, 261.63, 329.63, 392.00, 493.88], stepDur * 6.5, lobbyBgmMasterGain);

  if (step === 0) playBgmBass(ctx, time, 87.31, stepDur * 4.5, lobbyBgmMasterGain);
  if (step === 6) playBgmBass(ctx, time, 110.00, stepDur * 3, lobbyBgmMasterGain);
  if (step === 10) playBgmBass(ctx, time, 130.81, stepDur * 4, lobbyBgmMasterGain);
  if (step === 16) playBgmBass(ctx, time, 98.00, stepDur * 4.5, lobbyBgmMasterGain);
  if (step === 22) playBgmBass(ctx, time, 123.47, stepDur * 3, lobbyBgmMasterGain);
  if (step === 26) playBgmBass(ctx, time, 146.83, stepDur * 4, lobbyBgmMasterGain);
  if (step === 32) playBgmBass(ctx, time, 82.41, stepDur * 4.5, lobbyBgmMasterGain);
  if (step === 38) playBgmBass(ctx, time, 98.00, stepDur * 3, lobbyBgmMasterGain);
  if (step === 42) playBgmBass(ctx, time, 123.47, stepDur * 4, lobbyBgmMasterGain);
  if (step === 48) playBgmBass(ctx, time, 110.00, stepDur * 4.5, lobbyBgmMasterGain);
  if (step === 54) playBgmBass(ctx, time, 130.81, stepDur * 3, lobbyBgmMasterGain);
  if (step === 58) playBgmBass(ctx, time, 164.81, stepDur * 3, lobbyBgmMasterGain);
  if (step === 62) playBgmBass(ctx, time, 98.00, stepDur * 2, lobbyBgmMasterGain);

  if ([0, 6, 10, 16, 22, 26, 32, 38, 42, 48, 54, 58].includes(step)) {
    playBgmKick(ctx, time, lobbyBgmMasterGain);
  }

  if ([4, 12, 20, 28, 36, 44, 52, 60].includes(step)) {
    playBgmSnare(ctx, time, lobbyBgmMasterGain);
  }

  if (step % 2 === 0) {
    const isOffbeat = (step % 4 !== 0);
    const hatTime = isOffbeat ? time + 0.018 : time;
    const hatVol = isOffbeat ? 0.08 : 0.14;
    playBgmHiHat(ctx, hatTime, lobbyBgmMasterGain, hatVol);
  }

  if (step === 14) playBgmChime(ctx, time, 1046.50, lobbyBgmMasterGain);
  if (step === 18) playBgmChime(ctx, time, 1318.51, lobbyBgmMasterGain);
  if (step === 30) playBgmChime(ctx, time, 783.99, lobbyBgmMasterGain);
  if (step === 46) playBgmChime(ctx, time, 880.00, lobbyBgmMasterGain);
  if (step === 60) playBgmChime(ctx, time, 1318.51, lobbyBgmMasterGain);
  if (step === 62) playBgmChime(ctx, time, 1174.66, lobbyBgmMasterGain);
}

function scheduleLobbyBgmSteps() {
  if (!lobbyMusicPlaying) return;
  const ctx = getAudioContext();
  if (!ctx || ctx.state === 'suspended') return;

  const stepDur = 60 / 84 / 4;
  const lookahead = 0.15;

  while (nextBgmStepTime < ctx.currentTime + lookahead) {
    playLobbyBgmStep(ctx, lobbyBgmStep, nextBgmStepTime, stepDur);
    nextBgmStepTime += stepDur;
    lobbyBgmStep = (lobbyBgmStep + 1) % 64;
  }
}

function startLobbyMusic() {
  if (lobbyMusicPlaying || !bgmEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  if (!lobbyBgmMasterGain) {
    lobbyBgmMasterGain = ctx.createGain();
    lobbyBgmMasterGain.connect(ctx.destination);
  }

  const targetVol = getMasterBgmVolume();
  const now = ctx.currentTime;
  lobbyBgmMasterGain.gain.cancelScheduledValues(now);
  lobbyBgmMasterGain.gain.setValueAtTime(0.0001, now);
  lobbyBgmMasterGain.gain.linearRampToValueAtTime(targetVol, now + 1.2);

  lobbyMusicPlaying = true;
  lobbyBgmStep = 0;
  nextBgmStepTime = now + 0.1;

  if (lobbyBgmTimer) {
    clearInterval(lobbyBgmTimer);
  }
  lobbyBgmTimer = setInterval(scheduleLobbyBgmSteps, 40);
}

function stopLobbyMusic(fadeDuration = 0.6) {
  if (!lobbyMusicPlaying) return;
  lobbyMusicPlaying = false;
  if (lobbyBgmTimer) {
    clearInterval(lobbyBgmTimer);
    lobbyBgmTimer = null;
  }
  if (lobbyBgmMasterGain && audioCtx) {
    const now = audioCtx.currentTime;
    lobbyBgmMasterGain.gain.cancelScheduledValues(now);
    lobbyBgmMasterGain.gain.setValueAtTime(Math.max(0.0001, lobbyBgmMasterGain.gain.value), now);
    lobbyBgmMasterGain.gain.exponentialRampToValueAtTime(0.0001, now + fadeDuration);
  }
}

function tryResumeLobbyBgm() {
  if (bgmEnabled && views.lobby && views.lobby.classList.contains('active') && !lobbyMusicPlaying) {
    startLobbyMusic();
  }
}
document.addEventListener('pointerdown', tryResumeLobbyBgm, { once: true });
document.addEventListener('keydown', tryResumeLobbyBgm, { once: true });

function showAudioPrompt() {
  let prompt = document.getElementById('audio-unmute-prompt');
  if (!prompt) {
    prompt = document.createElement('div');
    prompt.id = 'audio-unmute-prompt';
    prompt.className = 'audio-unmute-pill';
    prompt.style.display = 'flex';
    prompt.style.alignItems = 'center';
    prompt.style.gap = '0.45rem';
    prompt.innerHTML = `${renderIcon('volume-up', { size: 20 })} <span>Cliquer pour activer le son</span>`;
    document.body.appendChild(prompt);
    prompt.addEventListener('click', (e) => {
      e.stopPropagation();
      audioPlayer.play().then(() => {
        hideAudioPrompt();
      }).catch(err => {
        console.warn('Playback error:', err);
        if (currentAudioFallback && audioPlayer.src !== currentAudioFallback) {
          audioPlayer.src = currentAudioFallback;
          audioPlayer.load();
          audioPlayer.play().then(() => hideAudioPrompt()).catch(() => hideAudioPrompt());
        } else {
          hideAudioPrompt();
        }
      });
    });
  }
  prompt.style.display = 'flex';
}

function hideAudioPrompt() {
  const prompt = document.getElementById('audio-unmute-prompt');
  if (prompt) {
    prompt.style.display = 'none';
  }
}

audioPlayer.addEventListener('playing', () => {
  hideAudioPrompt();
});

audioPlayer.addEventListener('error', () => {
  if (currentAudioFallback && audioPlayer.src !== currentAudioFallback) {
    audioPlayer.src = currentAudioFallback;
    audioPlayer.load();
    audioPlayer.play().then(() => hideAudioPrompt()).catch(() => showAudioPrompt());
  } else {
    hideAudioPrompt();
  }
});

document.addEventListener('click', () => {
  if (views.round && views.round.classList.contains('active') && audioPlayer.paused && audioPlayer.src && audioPlayer.src !== SILENT_AUDIO) {
    audioPlayer.play().then(() => hideAudioPrompt()).catch(() => {});
  }
});

const views = {
  lobby: document.getElementById('view-lobby'),
  round: document.getElementById('view-round'),
  reveal: document.getElementById('view-reveal'),
  gameover: document.getElementById('view-gameover')
};

function switchView(viewName) {
  Object.values(views).forEach(v => v.classList.remove('active'));
  if (views[viewName]) {
    views[viewName].classList.add('active');
  }

  if (viewName === 'lobby') {
    if (bgmEnabled) startLobbyMusic();
  } else {
    stopLobbyMusic(0.5);
  }

  const quitBtn = document.getElementById('host-quit-btn');
  if (quitBtn) {
    if (viewName === 'round' || viewName === 'reveal') {
      quitBtn.style.display = 'inline-flex';
    } else {
      quitBtn.style.display = 'none';
    }
  }
}

const hostQuitBtn = document.getElementById('host-quit-btn');
if (hostQuitBtn) {
  hostQuitBtn.addEventListener('click', () => {
    if (confirm('Voulez-vous vraiment quitter la partie en cours et retourner au salon d\'attente ?')) {
      socket.emit('host_quit_game');
    }
  });
}

const volumeSlider = document.getElementById('volume-slider');
audioPlayer.volume = parseFloat(volumeSlider.value);
volumeSlider.addEventListener('input', (e) => {
  audioPlayer.volume = parseFloat(e.target.value);
  updateBgmVolume();
});

const bgmToggleBtn = document.getElementById('bgm-toggle-btn');
if (bgmToggleBtn) {
  bgmToggleBtn.addEventListener('click', () => {
    bgmEnabled = !bgmEnabled;
    localStorage.setItem('blindtest_bgm_enabled', bgmEnabled ? 'true' : 'false');
    updateBgmBtnState();
    if (bgmEnabled) {
      if (views.lobby && views.lobby.classList.contains('active')) {
        startLobbyMusic();
      }
    } else {
      stopLobbyMusic(0.3);
    }
    getAudioContext();
  });
}

const sfxToggleBtn = document.getElementById('sfx-toggle-btn');
if (sfxToggleBtn) {
  sfxToggleBtn.addEventListener('click', () => {
    sfxEnabled = !sfxEnabled;
    const sfxBtnIcon = document.getElementById('sfx-btn-icon');
    const sfxBtnText = document.getElementById('sfx-btn-text');
    if (sfxBtnIcon && typeof renderIcon === 'function') {
      sfxBtnIcon.innerHTML = renderIcon(sfxEnabled ? 'bell-on' : 'bell-off', { size: 18 });
    }
    if (sfxBtnText) {
      sfxBtnText.textContent = sfxEnabled ? 'Bruitages ON' : 'Bruitages OFF';
    }
    sfxToggleBtn.style.opacity = sfxEnabled ? '1' : '0.6';
    getAudioContext();
  });
}

document.getElementById('fullscreen-btn').addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});

const skipRoundBtn = document.getElementById('skip-round-btn');
if (skipRoundBtn) {
  skipRoundBtn.addEventListener('click', () => {
    socket.emit('skip_round');
    skipRoundBtn.style.display = 'none';
  });
}

socket.emit('create_room');

let selectedGameMode = 'classic';
let selectedSurvivalLives = 3;
let selectedTeamCount = 2;

function applyGameModeUI(settings) {
  if (!settings) return;
  selectedGameMode = settings.gameMode || selectedGameMode;
  selectedSurvivalLives = settings.survivalLives || selectedSurvivalLives;
  selectedTeamCount = settings.teamCount || selectedTeamCount;

  document.querySelectorAll('.mode-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.mode === selectedGameMode);
  });

  const survBox = document.getElementById('mode-options-survival');
  const teamBox = document.getElementById('mode-options-teams');
  const descEl = document.getElementById('mode-badge-desc');
  const survSel = document.getElementById('survival-lives-select');
  const teamSel = document.getElementById('teams-count-select');
  const guideTitle = document.getElementById('lobby-mode-guide-title');
  const guideDesc = document.getElementById('lobby-mode-guide-desc');
  const guideIcon = document.getElementById('lobby-mode-guide-icon');

  if (survSel) survSel.value = selectedSurvivalLives;
  if (teamSel) teamSel.value = selectedTeamCount;

  if (selectedGameMode === 'survival') {
    if (survBox) survBox.style.display = 'block';
    if (teamBox) teamBox.style.display = 'none';
    if (descEl) descEl.textContent = 'Vies éliminatoires';
    if (guideTitle) guideTitle.textContent = 'Règles Survie Battle Royale';
    if (guideDesc) guideDesc.textContent = `Chaque erreur ou silence coûte 1 vie (${selectedSurvivalLives} vies au départ). Élimination à 0 vie, le dernier survivant fait Top 1 !`;
    if (guideIcon && typeof renderIcon === 'function') guideIcon.innerHTML = renderIcon('skull', { size: 18 });
  } else if (selectedGameMode === 'teams') {
    if (survBox) survBox.style.display = 'none';
    if (teamBox) teamBox.style.display = 'flex';
    if (descEl) descEl.textContent = 'Guerre des clans';
    if (guideTitle) guideTitle.textContent = `Règles Mode Équipes (${selectedTeamCount} Clans)`;
    if (guideDesc) guideDesc.textContent = "Les points individuels de chaque membre sont additionnés au score collectif du clan. L'équipe en tête à la fin l'emporte !";
    if (guideIcon && typeof renderIcon === 'function') guideIcon.innerHTML = renderIcon('users', { size: 18 });
  } else {
    if (survBox) survBox.style.display = 'none';
    if (teamBox) teamBox.style.display = 'none';
    if (descEl) descEl.textContent = 'Points classiques';
    if (guideTitle) guideTitle.textContent = 'Règles du Mode Classique';
    if (guideDesc) guideDesc.textContent = "Chacun pour soi ! Vitesse maximale pour décrocher jusqu'à 1 000 pts par manche, avec bonus de flamme pour les séries de bonnes réponses.";
    if (guideIcon && typeof renderIcon === 'function') guideIcon.innerHTML = renderIcon('trophy', { size: 18 });
  }
}

document.querySelectorAll('.mode-card').forEach(card => {
  card.addEventListener('click', () => {
    selectedGameMode = card.dataset.mode;
    applyGameModeUI({ gameMode: selectedGameMode, survivalLives: selectedSurvivalLives, teamCount: selectedTeamCount });
    sendSettingsUpdate();
  });
});

const survLivesSel = document.getElementById('survival-lives-select');
if (survLivesSel) {
  survLivesSel.addEventListener('change', () => {
    selectedSurvivalLives = parseInt(survLivesSel.value, 10);
    applyGameModeUI({ gameMode: selectedGameMode, survivalLives: selectedSurvivalLives, teamCount: selectedTeamCount });
    sendSettingsUpdate();
  });
}

const teamsCountSel = document.getElementById('teams-count-select');
if (teamsCountSel) {
  teamsCountSel.addEventListener('change', () => {
    selectedTeamCount = parseInt(teamsCountSel.value, 10);
    applyGameModeUI({ gameMode: selectedGameMode, survivalLives: selectedSurvivalLives, teamCount: selectedTeamCount });
    sendSettingsUpdate();
  });
}

const balBtn = document.getElementById('btn-balance-teams');
if (balBtn) {
  balBtn.addEventListener('click', () => {
    socket.emit('balance_teams');
  });
}

const copyJoinBtn = document.getElementById('btn-copy-join-url');
if (copyJoinBtn) {
  copyJoinBtn.addEventListener('click', () => {
    const urlEl = document.getElementById('display-join-url');
    const text = urlEl ? urlEl.textContent : '';
    if (text && text !== 'Chargement...' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        const iconEl = document.getElementById('copy-url-icon');
        const textEl = document.getElementById('copy-url-text');
        if (iconEl && typeof renderIcon === 'function') iconEl.innerHTML = renderIcon('check', { size: 15 });
        if (textEl) textEl.textContent = 'Copié !';
        copyJoinBtn.style.borderColor = 'var(--party-emerald)';
        copyJoinBtn.style.color = 'var(--party-emerald)';
        setTimeout(() => {
          if (iconEl && typeof renderIcon === 'function') iconEl.innerHTML = renderIcon('copy', { size: 15 });
          if (textEl) textEl.textContent = 'Copier';
          copyJoinBtn.style.borderColor = '';
          copyJoinBtn.style.color = '';
        }, 2200);
      }).catch(() => {});
    }
  });
}

socket.on('room_created', (data) => {
  roomCode = data.roomCode;
  currentThemes = data.themes;

  document.getElementById('display-room-code').textContent = data.roomCode;
  document.getElementById('display-join-url').textContent = data.joinUrl;
  document.getElementById('qr-code-img').src = data.qrDataUrl;

  renderThemes(data.themes, data.themeId);
  document.getElementById('rounds-select').value = data.settings.totalRounds;
  document.getElementById('duration-select').value = data.settings.roundDuration;
  if (data.settings) {
    applyGameModeUI(data.settings);
  }
  if (bgmEnabled && views.lobby && views.lobby.classList.contains('active')) {
    startLobbyMusic();
  }
});

socket.on('settings_updated', (data) => {
  if (data.settings) {
    applyGameModeUI(data.settings);
  }
  if (data.players) {
    currentPlayers = data.players;
    updateLobbyPlayers(data.players, data.teamScores);
  }
});

socket.on('lobby_update', (data) => {
  if (data.settings) {
    applyGameModeUI(data.settings);
  }
  if (data.players) {
    currentPlayers = data.players;
    updateLobbyPlayers(data.players, data.teamScores);
  }
});

function renderThemes(themes, activeThemeId) {
  const container = document.getElementById('themes-grid');
  container.innerHTML = '';

  themes.forEach(theme => {
    const card = document.createElement('div');
    card.className = `theme-card ${theme.id === activeThemeId ? 'selected' : ''}`;
    card.dataset.themeId = theme.id;
    card.innerHTML = `
      ${theme.id === 'anime' ? '<span class="theme-badge-anime">ANIME</span>' : ''}
      ${theme.id === 'disney' ? '<span class="theme-badge-anime" style="background: #0284c7;">DISNEY</span>' : ''}
      ${theme.id === 'cinema' ? '<span class="theme-badge-anime" style="background: #dc2626;">CINÉMA</span>' : ''}
      ${theme.id === 'series' ? '<span class="theme-badge-anime" style="background: #9333ea;">SÉRIES</span>' : ''}
      ${theme.id === 'gaming' ? '<span class="theme-badge-anime" style="background: #059669;">GAMING</span>' : ''}
      <div class="theme-icon" style="display: flex; align-items: center; justify-content: center;">${renderThemeIcon(theme.id || theme.icon, 36)}</div>
      <div class="theme-title">${theme.name}</div>
    `;

    card.addEventListener('click', () => {
      document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedThemeId = theme.id;
      
      const customBox = document.getElementById('custom-playlist-box');
      if (theme.id === 'custom') {
        customBox.style.display = 'block';
        document.getElementById('custom-playlist-input').focus();
      } else {
        customBox.style.display = 'none';
      }

      sendSettingsUpdate();
    });

    container.appendChild(card);
  });
}

function sendSettingsUpdate() {
  const rounds = parseInt(document.getElementById('rounds-select').value, 10);
  const duration = parseInt(document.getElementById('duration-select').value, 10);
  const customPlaylistId = document.getElementById('custom-playlist-input').value.trim();

  socket.emit('update_settings', {
    themeId: selectedThemeId,
    customPlaylistId: selectedThemeId === 'custom' ? customPlaylistId : null,
    totalRounds: rounds,
    roundDuration: duration,
    gameMode: selectedGameMode,
    survivalLives: selectedSurvivalLives,
    teamCount: selectedTeamCount
  });
}

document.getElementById('rounds-select').addEventListener('change', sendSettingsUpdate);
document.getElementById('duration-select').addEventListener('change', sendSettingsUpdate);
document.getElementById('custom-playlist-input').addEventListener('input', sendSettingsUpdate);

socket.on('player_joined', (data) => {
  currentPlayers = data.players;
  updateLobbyPlayers(data.players, data.teamScores);
});

socket.on('player_left', (data) => {
  currentPlayers = data.players;
  updateLobbyPlayers(data.players, data.teamScores);
});

function updateLobbyPlayers(players, teamScores) {
  const grid = document.getElementById('lobby-players-grid');
  const countBadge = document.getElementById('players-count-badge');
  const startBtn = document.getElementById('start-game-btn');

  const count = players.length;
  countBadge.textContent = `${count} JOUEUR${count > 1 ? 'S' : ''}`;

  if (count === 0) {
    grid.innerHTML = `
      <div id="no-players-placeholder" style="grid-column: 1 / -1; color: #71717a; font-family: var(--font-mono); text-align: center; padding: 2rem 1rem; font-size: 0.85rem;">
        [EN ATTENTE DES JOUEURS // SCANNEZ LE QR CODE]
      </div>
    `;
    startBtn.disabled = true;
    startBtn.textContent = 'Lancer la Partie';
  } else {
    const teamColorMap = {
      red: { color: '#ef4444', name: 'Rouge' },
      blue: { color: '#3b82f6', name: 'Bleue' },
      green: { color: '#10b981', name: 'Verte' },
      yellow: { color: '#f59e0b', name: 'Jaune' }
    };

    grid.innerHTML = players.map(p => {
      let teamBadgeHtml = '';
      if (selectedGameMode === 'teams' && p.teamId && teamColorMap[p.teamId]) {
        const t = teamColorMap[p.teamId];
        teamBadgeHtml = `<span class="player-team-pill" style="background: ${t.color}22; border: 1.5px solid ${t.color}; color: ${t.color}; font-size: 0.7rem; font-weight: 800; padding: 2px 7px; border-radius: 9999px;">${t.name}</span>`;
      }

      let survivalBadgeHtml = '';
      if (selectedGameMode === 'survival') {
        survivalBadgeHtml = `<span style="font-size: 0.72rem; font-weight: 800; color: #ef4444; display: inline-flex; align-items: center; gap: 3px;">${renderIcon('heart', { size: 14 })} ${p.lives || selectedSurvivalLives}</span>`;
      }

      const teamBorder = selectedGameMode === 'teams' && p.teamId && teamColorMap[p.teamId]
        ? `border-color: ${teamColorMap[p.teamId].color}66; box-shadow: 0 0 10px ${teamColorMap[p.teamId].color}22;`
        : '';

      return `
        <div class="player-chip clickable-profile" data-player-id="${p.id}" data-user-id="${p.userId || ''}" style="${teamBorder}" title="Voir le profil">
          <span class="player-avatar" style="width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center;">${renderAvatar(p.avatar, 28)}</span>
          <span class="player-name">${escapeHtml(p.nickname)}</span>
          <span class="player-level-badge">Nv.${p.level || 1}</span>
          ${teamBadgeHtml}
          ${survivalBadgeHtml}
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.player-chip.clickable-profile').forEach(chip => {
      chip.addEventListener('click', () => {
        openHostPlayerProfile(chip.dataset.playerId, chip.dataset.userId);
      });
    });

    startBtn.disabled = false;
    startBtn.textContent = `Lancer la Partie (${count})`;
  }
}

const startBtn = document.getElementById('start-game-btn');
startBtn.addEventListener('click', () => {
  stopLobbyMusic(0.8);
  getAudioContext();
  try {
    audioPlayer.src = SILENT_AUDIO;
    audioPlayer.play().catch(() => {});
  } catch (e) {}

  socket.emit('start_game');
  startBtn.disabled = true;
  startBtn.textContent = 'Lancement en cours...';
});

socket.on('game_loading', (data) => {
  stopLobbyMusic(0.8);
  startBtn.textContent = data.message || 'Chargement...';
});

socket.on('game_countdown', () => {
  stopLobbyMusic(0.3);
  startCountdownVisualAndSound();
});

socket.on('game_start_error', (data) => {
  hideCountdownOverlay();
  alert('Erreur: ' + data.message);
  startBtn.disabled = false;
  startBtn.textContent = 'Lancer la Partie';
  if (bgmEnabled && views.lobby && views.lobby.classList.contains('active')) {
    startLobbyMusic();
  }
});

socket.on('round_start_host', (data) => {
  hideCountdownOverlay();
  audioPlayer.loop = false;
  if (audioFadeInterval) {
    clearInterval(audioFadeInterval);
    audioFadeInterval = null;
  }

  playRoundStartSfx();
  switchView('round');

  const skipBtn = document.getElementById('skip-round-btn');
  if (skipBtn) skipBtn.style.display = 'none';

  document.getElementById('round-number-display').textContent = `Manche 0${data.roundIndex} / 0${data.totalRounds}`.replace(/0(\d\d)/g, '$1');

  if (data.gameMode) selectedGameMode = data.gameMode;
  if (selectedGameMode === 'teams') {
    renderTeamScoreBar(data.teamScores);
    const survBanner = document.getElementById('host-survival-banner');
    if (survBanner) survBanner.style.display = 'none';
  } else if (selectedGameMode === 'survival') {
    const bar = document.getElementById('host-team-score-bar');
    if (bar) bar.style.display = 'none';
    const survBanner = document.getElementById('host-survival-banner');
    if (survBanner) {
      survBanner.style.display = 'inline-flex';
      const survText = document.getElementById('host-survival-text');
      if (survText) {
        survText.textContent = `${data.survivorsCount} Survivant${data.survivorsCount > 1 ? 's' : ''} en lice`;
      }
    }
  } else {
    const bar = document.getElementById('host-team-score-bar');
    if (bar) bar.style.display = 'none';
    const survBanner = document.getElementById('host-survival-banner');
    if (survBanner) survBanner.style.display = 'none';
  }
  
  if (data.isDisney) {
    document.getElementById('round-mode-display').textContent = 'Mode Disney';
    document.getElementById('round-question-heading').textContent = 'De quel Disney vient cette chanson ?';
    document.getElementById('round-question-subtext').textContent = 'Devinez le bon film Disney sur votre manette !';
  } else if (data.isAnime) {
    document.getElementById('round-mode-display').textContent = 'Mode Animé';
    document.getElementById('round-question-heading').textContent = 'De quel animé vient cet opening ?';
    document.getElementById('round-question-subtext').textContent = 'Devinez le bon animé sur votre manette !';
  } else if (data.isCinema) {
    document.getElementById('round-mode-display').textContent = 'Mode Cinéma';
    document.getElementById('round-question-heading').textContent = 'De quel film culte vient cette musique ?';
    document.getElementById('round-question-subtext').textContent = 'Devinez le bon film sur votre manette !';
  } else if (data.isSeries) {
    document.getElementById('round-mode-display').textContent = 'Mode Séries TV';
    document.getElementById('round-question-heading').textContent = 'De quelle série TV vient ce générique ?';
    document.getElementById('round-question-subtext').textContent = 'Devinez la bonne série sur votre manette !';
  } else if (data.isGaming) {
    document.getElementById('round-mode-display').textContent = 'Mode Jeux Vidéo';
    document.getElementById('round-question-heading').textContent = 'De quel jeu vidéo vient cette musique ?';
    document.getElementById('round-question-subtext').textContent = 'Devinez le bon jeu vidéo sur votre manette !';
  } else {
    const themeObj = currentThemes.find(t => t.id === selectedThemeId);
    document.getElementById('round-mode-display').textContent = themeObj ? themeObj.name : 'Blind-Test';
    document.getElementById('round-question-heading').textContent = 'Écoutez l\'extrait...';
    document.getElementById('round-question-subtext').textContent = 'Devinez le bon titre sur votre manette !';
  }

  currentPlayers = data.players || [];
  updateAnsweredCount(0, data.players.length);
  renderRoundPlayersList(data.players);

  currentAudioFallback = data.fallbackPreview || null;
  audioPlayer.pause();
  audioPlayer.volume = parseFloat(volumeSlider.value);
  audioPlayer.src = data.audioPreview;
  audioPlayer.load();

  const playPromise = audioPlayer.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      hideAudioPrompt();
    }).catch(err => {
      console.warn('Autoplay blocked or audio failed:', err);
      showAudioPrompt();
    });
  }

  startRoundTimer(data.duration);
});

function renderRoundPlayersList(players) {
  const container = document.getElementById('round-players-list');
  const teamColorMap = {
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#10b981',
    yellow: '#f59e0b'
  };

  container.innerHTML = players.map(p => {
    let extraBadge = '';
    let extraBorder = '';

    if (selectedGameMode === 'survival') {
      if (p.isEliminated) {
        extraBadge = `<span style="color: #ef4444; font-size: 0.72rem; font-weight: 800; display: inline-flex; align-items: center; gap: 2px;">${renderIcon('skull', { size: 13 })} RIP</span>`;
      } else {
        extraBadge = `<span style="color: #ef4444; font-size: 0.72rem; font-weight: 800; display: inline-flex; align-items: center; gap: 2px;">${renderIcon('heart', { size: 13 })} ${p.lives || 1}</span>`;
      }
    } else if (selectedGameMode === 'teams' && p.teamId && teamColorMap[p.teamId]) {
      const tc = teamColorMap[p.teamId];
      extraBorder = `border-color: ${tc}aa; box-shadow: 0 0 10px ${tc}33;`;
      extraBadge = `<span style="width: 8px; height: 8px; border-radius: 50%; background: ${tc}; display: inline-block;"></span>`;
    }

    const elimOpacity = p.isEliminated ? 'opacity: 0.35; filter: grayscale(1);' : 'opacity: 0.55;';

    return `
      <div id="round-player-${p.id}" class="player-chip clickable-profile ${p.isEliminated ? 'eliminated' : ''}" data-player-id="${p.id}" data-user-id="${p.userId || ''}" style="${elimOpacity} ${extraBorder} transition: all 0.25s ease;" title="Voir le profil">
        <span class="player-avatar" style="width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center;">${renderAvatar(p.avatar, 24)}</span>
        <span class="player-name">${escapeHtml(p.nickname)}</span>
        <span class="player-level-badge">Nv.${p.level || 1}</span>
        ${extraBadge}
        <span class="answer-check" style="display: none; margin-left: 0.3rem; vertical-align: middle;">${renderIcon('check', { size: 16 })}</span>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.player-chip.clickable-profile').forEach(chip => {
    chip.addEventListener('click', () => {
      openHostPlayerProfile(chip.dataset.playerId, chip.dataset.userId);
    });
  });
}

function renderTeamScoreBar(teamScores) {
  const bar = document.getElementById('host-team-score-bar');
  if (!bar) return;
  if (!teamScores || teamScores.length === 0) {
    bar.style.display = 'none';
    return;
  }
  bar.style.display = 'flex';
  bar.innerHTML = teamScores.map(t => `
    <div class="team-score-card" style="border: 2px solid ${t.color}; box-shadow: 0 0 16px ${t.color}33;">
      <span class="team-dot" style="background: ${t.color};"></span>
      <span class="team-name" style="color: ${t.color};">${escapeHtml(t.name)}</span>
      <span class="team-pts">${t.score.toLocaleString('fr-FR')} <small>pts</small></span>
    </div>
  `).join('<div class="team-vs-pill">VS</div>');
}

socket.on('player_answered', (data) => {
  playPlayerAnswerSfx();
  updateAnsweredCount(data.answeredCount, data.totalPlayers);

  if (data.teamScores && selectedGameMode === 'teams') {
    renderTeamScoreBar(data.teamScores);
  }

  const playerChip = document.getElementById(`round-player-${data.playerId}`);
  if (playerChip) {
    playerChip.style.opacity = '1';
    playerChip.style.borderColor = 'rgba(48, 209, 88, 0.6)';
    playerChip.style.background = 'rgba(48, 209, 88, 0.12)';
    playerChip.style.boxShadow = '0 0 16px rgba(48, 209, 88, 0.25)';
    const check = playerChip.querySelector('.answer-check');
    if (check) check.style.display = 'inline';
  }

  if (data.allAnswered) {
    const skipBtn = document.getElementById('skip-round-btn');
    if (skipBtn) skipBtn.style.display = 'inline-flex';
  }
});

function updateAnsweredCount(answered, total) {
  const textEl = document.getElementById('answers-counter-text');
  if (textEl) {
    textEl.textContent = `${answered} / ${total} ont répondu`;
  }
}

function startRoundTimer(durationSeconds) {
  if (roundTimerInterval) clearInterval(roundTimerInterval);

  const timerBar = document.getElementById('timer-bar');
  const timerSeconds = document.getElementById('timer-seconds');
  const startTime = Date.now();
  const totalMs = durationSeconds * 1000;
  let lastTickSecond = -1;

  timerBar.style.width = '100%';
  timerSeconds.textContent = durationSeconds;

  roundTimerInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, totalMs - elapsed);
    const percent = (remaining / totalMs) * 100;

    timerBar.style.width = `${percent}%`;
    const secCeil = Math.ceil(remaining / 1000);
    timerSeconds.textContent = secCeil;

    if (secCeil <= 5 && secCeil > 0 && secCeil !== lastTickSecond) {
      lastTickSecond = secCeil;
      playCountdownTickSfx(secCeil);
    }

    if (remaining <= 0) {
      clearInterval(roundTimerInterval);
    }
  }, 50);
}

socket.on('round_ended_host', (data) => {
  if (roundTimerInterval) clearInterval(roundTimerInterval);
  hideAudioPrompt();
  playRevealSfx();
  const skipBtn = document.getElementById('skip-round-btn');
  if (skipBtn) skipBtn.style.display = 'none';

  if (audioFadeInterval) {
    clearInterval(audioFadeInterval);
    audioFadeInterval = null;
  }
  audioPlayer.loop = false;
  audioPlayer.currentTime = 0;
  audioPlayer.volume = parseFloat(volumeSlider.value);
  if (audioPlayer.src && audioPlayer.src !== SILENT_AUDIO) {
    audioPlayer.play().catch(() => {});
  }

  if (data.leaderboard) {
    currentPlayers = data.leaderboard;
  }
  switchView('reveal');

  const coverUrl = data.track.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400';
  document.getElementById('reveal-cover').src = coverUrl;
  const glow = document.getElementById('reveal-glow') || document.getElementById('reveal-cover-glow');
  if (glow) glow.style.backgroundImage = `url('${coverUrl}')`;

  const categoryEl = document.getElementById('reveal-category');
  const titleEl = document.getElementById('reveal-title');
  const artistEl = document.getElementById('reveal-artist');
  const extraEl = document.getElementById('reveal-extra-info');

  if (data.track.isDisney && data.track.disney) {
    categoryEl.textContent = 'FILM DISNEY';
    titleEl.textContent = data.track.disney;
    artistEl.textContent = `Chanson : "${data.track.title}"`;
    if (extraEl) {
      extraEl.textContent = `Artiste : ${data.track.artist}`;
      extraEl.style.display = 'block';
    }
  } else if (data.track.isAnime && data.track.anime) {
    categoryEl.textContent = 'ANIMÉ CULTE';
    titleEl.textContent = data.track.anime;
    artistEl.textContent = `Opening : "${data.track.title}"`;
    if (extraEl) {
      extraEl.textContent = `Artiste : ${data.track.artist}`;
      extraEl.style.display = 'block';
    }
  } else if (data.track.isCinema && data.track.cinema) {
    categoryEl.textContent = 'FILM CULTE';
    titleEl.textContent = data.track.cinema;
    artistEl.textContent = `Musique : "${data.track.title}"`;
    if (extraEl) {
      extraEl.textContent = `Compositeur / Artiste : ${data.track.artist}`;
      extraEl.style.display = 'block';
    }
  } else if (data.track.isSeries && data.track.series) {
    categoryEl.textContent = 'SÉRIE TV';
    titleEl.textContent = data.track.series;
    artistEl.textContent = `Générique : "${data.track.title}"`;
    if (extraEl) {
      extraEl.textContent = `Artiste : ${data.track.artist}`;
      extraEl.style.display = 'block';
    }
  } else if (data.track.isGaming && data.track.gaming) {
    categoryEl.textContent = 'JEU VIDÉO';
    titleEl.textContent = data.track.gaming;
    artistEl.textContent = `Piste : "${data.track.title}"`;
    if (extraEl) {
      extraEl.textContent = `Compositeur : ${data.track.artist}`;
      extraEl.style.display = 'block';
    }
  } else {
    categoryEl.textContent = 'TITRE DU MORCEAU';
    titleEl.textContent = data.track.title;
    artistEl.textContent = data.track.artist;
    if (extraEl) extraEl.style.display = 'none';
  }

  const teamsBoard = document.getElementById('reveal-teams-board');
  if (teamsBoard) {
    if (data.gameMode === 'teams' && data.teamScores && data.teamScores.length > 0) {
      teamsBoard.style.display = 'grid';
      teamsBoard.innerHTML = `
        <div style="grid-column: 1 / -1; font-size: 0.95rem; font-weight: 800; text-transform: uppercase; color: var(--party-cyan); letter-spacing: 0.05em; margin-bottom: 0.5rem; text-align: center;">Classement des Équipes</div>
        ${data.teamScores.map((t, idx) => `
          <div class="team-reveal-card" style="border: 2px solid ${t.color}; background: rgba(13, 19, 48, 0.88); border-radius: 16px; padding: 0.85rem 1.25rem; display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <span style="font-size: 1.25rem; font-weight: 900; color: ${t.color};">${idx + 1}</span>
              <span style="font-weight: 800; color: #fff;">${escapeHtml(t.name)}</span>
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">(${t.playerCount} joueurs)</span>
            </div>
            <div style="font-size: 1.3rem; font-weight: 900; color: ${t.color};">${t.score.toLocaleString('fr-FR')} pts</div>
          </div>
        `).join('')}
      `;
    } else {
      teamsBoard.style.display = 'none';
    }
  }

  renderLeaderboard(data.leaderboard);
});

function renderLeaderboard(leaderboard) {
  const container = document.getElementById('reveal-leaderboard');
  const teamColorMap = {
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#10b981',
    yellow: '#f59e0b'
  };

  container.innerHTML = leaderboard.slice(0, 6).map((player, index) => {
    const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : '';
    const medalHtml = index === 0
      ? renderIcon('medal-gold', { size: 24 })
      : index === 1
      ? renderIcon('medal-silver', { size: 24 })
      : index === 2
      ? renderIcon('medal-bronze', { size: 24 })
      : `<span style="font-size: 1rem; font-weight: 800; color: var(--text-secondary);">${index + 1}</span>`;

    let extraBadgeHtml = '';
    if (selectedGameMode === 'survival') {
      extraBadgeHtml = player.isEliminated
        ? `<span style="font-size: 0.75rem; font-weight: 800; color: #ef4444; display: inline-flex; align-items: center; gap: 3px;">${renderIcon('skull', { size: 14 })} ÉLIMINÉ</span>`
        : `<span style="font-size: 0.78rem; font-weight: 800; color: #ef4444; display: inline-flex; align-items: center; gap: 3px;">${renderIcon('heart', { size: 14 })} ${player.lives || 1}</span>`;
    } else if (selectedGameMode === 'teams' && player.teamId && teamColorMap[player.teamId]) {
      const tc = teamColorMap[player.teamId];
      extraBadgeHtml = `<span style="width: 10px; height: 10px; border-radius: 50%; background: ${tc}; display: inline-block;"></span>`;
    }

    return `
      <div class="leaderboard-row clickable-profile ${rankClass}" data-player-id="${player.id}" data-user-id="${player.userId || ''}" title="Voir le profil">
        <div class="leaderboard-player-info">
          <span style="width: 28px; display: inline-flex; align-items: center; justify-content: center;">${medalHtml}</span>
          <span class="player-avatar" style="width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center;">${renderAvatar(player.avatar, 30)}</span>
          <div style="display: flex; flex-direction: column; text-align: left;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-weight: 700;">${escapeHtml(player.nickname)}</span>
              <span class="player-level-badge">Nv.${player.level || 1}</span>
              ${extraBadgeHtml}
            </div>
            <span style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">${escapeHtml(player.title || 'Novice')}</span>
          </div>
          ${player.streak > 1 ? `<span class="streak-badge" style="display: inline-flex; align-items: center; gap: 0.3rem;">${renderIcon('flame', { size: 14 })} ${player.streak}</span>` : ''}
        </div>
        <div class="leaderboard-score">${player.score.toLocaleString('fr-FR')} <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-tertiary);">pts</span></div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.leaderboard-row.clickable-profile').forEach(row => {
    row.addEventListener('click', () => {
      openHostPlayerProfile(row.dataset.playerId, row.dataset.userId);
    });
  });
}

socket.on('game_over_host', (data) => {
  audioPlayer.loop = false;
  if (roundTimerInterval) clearInterval(roundTimerInterval);
  if (audioFadeInterval) {
    clearInterval(audioFadeInterval);
    audioFadeInterval = null;
  }
  audioPlayer.pause();
  hideAudioPrompt();

  switchView('gameover');
  playPodiumFanfareSfx();
  launchConfetti();

  const p1icon = document.getElementById('podium-icon-1');
  if (p1icon && typeof renderIcon === 'function') p1icon.innerHTML = renderIcon('trophy', { size: 28 });
  const p2icon = document.getElementById('podium-icon-2');
  if (p2icon && typeof renderIcon === 'function') p2icon.innerHTML = renderIcon('medal-silver', { size: 24 });
  const p3icon = document.getElementById('podium-icon-3');
  if (p3icon && typeof renderIcon === 'function') p3icon.innerHTML = renderIcon('medal-bronze', { size: 24 });
  const awTitle = document.getElementById('awards-title-icon');
  if (awTitle && typeof renderIcon === 'function') awTitle.innerHTML = renderIcon('award', { size: 22 });

  const teamBanner = document.getElementById('gameover-team-winner-banner');
  const teamBadge = document.getElementById('gameover-team-badge');
  const survBanner = document.getElementById('gameover-survival-winner-banner');

  if (data.gameMode === 'teams' && data.winningTeam) {
    if (teamBanner) teamBanner.style.display = 'block';
    if (teamBadge) {
      teamBadge.style.background = `${data.winningTeam.color}22`;
      teamBadge.style.border = `2px solid ${data.winningTeam.color}`;
      teamBadge.style.color = '#ffffff';
      teamBadge.innerHTML = `🏆 VICTOIRE DE L'${data.winningTeam.name.toUpperCase()} (${data.winningTeam.score.toLocaleString('fr-FR')} pts)`;
    }
    if (survBanner) survBanner.style.display = 'none';
  } else if (data.gameMode === 'survival') {
    if (teamBanner) teamBanner.style.display = 'none';
    if (survBanner) survBanner.style.display = 'block';
  } else {
    if (teamBanner) teamBanner.style.display = 'none';
    if (survBanner) survBanner.style.display = 'none';
  }

  if (data.leaderboard) {
    currentPlayers = data.leaderboard;
  } else if (data.podium) {
    currentPlayers = data.podium;
  }

  const podium = data.podium || [];
  
  if (podium[0]) {
    const p1 = document.getElementById('podium-1');
    p1.dataset.playerId = podium[0].id || '';
    p1.dataset.userId = podium[0].userId || '';
    p1.classList.add('clickable-profile');
    p1.setAttribute('title', 'Voir le profil');
    p1.querySelector('.podium-avatar').innerHTML = renderAvatar(podium[0].avatar, 64);
    p1.querySelector('.podium-name').textContent = podium[0].nickname;
    p1.querySelector('.podium-score').textContent = `${podium[0].score.toLocaleString('fr-FR')} pts`;
    const lvl1 = p1.querySelector('.podium-level');
    if (lvl1) lvl1.textContent = `Nv.${podium[0].level || 1} · ${podium[0].title || 'Novice'}`;
    p1.onclick = () => openHostPlayerProfile(podium[0].id, podium[0].userId);
  }

  if (podium[1]) {
    const p2 = document.getElementById('podium-2');
    p2.dataset.playerId = podium[1].id || '';
    p2.dataset.userId = podium[1].userId || '';
    p2.classList.add('clickable-profile');
    p2.setAttribute('title', 'Voir le profil');
    p2.querySelector('.podium-avatar').innerHTML = renderAvatar(podium[1].avatar, 52);
    p2.querySelector('.podium-name').textContent = podium[1].nickname;
    p2.querySelector('.podium-score').textContent = `${podium[1].score.toLocaleString('fr-FR')} pts`;
    const lvl2 = p2.querySelector('.podium-level');
    if (lvl2) lvl2.textContent = `Nv.${podium[1].level || 1} · ${podium[1].title || 'Novice'}`;
    p2.onclick = () => openHostPlayerProfile(podium[1].id, podium[1].userId);
  }

  if (podium[2]) {
    const p3 = document.getElementById('podium-3');
    p3.dataset.playerId = podium[2].id || '';
    p3.dataset.userId = podium[2].userId || '';
    p3.classList.add('clickable-profile');
    p3.setAttribute('title', 'Voir le profil');
    p3.querySelector('.podium-avatar').innerHTML = renderAvatar(podium[2].avatar, 46);
    p3.querySelector('.podium-name').textContent = podium[2].nickname;
    p3.querySelector('.podium-score').textContent = `${podium[2].score.toLocaleString('fr-FR')} pts`;
    const lvl3 = p3.querySelector('.podium-level');
    if (lvl3) lvl3.textContent = `Nv.${podium[2].level || 1} · ${podium[2].title || 'Novice'}`;
    p3.onclick = () => openHostPlayerProfile(podium[2].id, podium[2].userId);
  }

  const awardsSection = document.getElementById('gameover-awards-section');
  const awardsGrid = document.getElementById('gameover-awards-grid');
  if (awardsSection && awardsGrid) {
    if (data.awards && data.awards.length > 0) {
      awardsSection.style.display = 'block';
      awardsGrid.innerHTML = data.awards.map(a => `
        <div class="award-card-clickable" data-player-id="${a.player?.id || ''}" data-user-id="${a.player?.userId || ''}" style="background: rgba(255, 255, 255, 0.05); border: 2px solid rgba(255, 255, 255, 0.12); border-radius: 18px; padding: 1.1rem 1.25rem; display: flex; align-items: center; gap: 1rem; text-align: left; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25);" title="Voir le profil">
          <span style="width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center;">${renderIcon(a.id || a.icon, { size: 38 })}</span>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
              <span style="font-weight: 800; font-size: 1.05rem; color: #ffffff;">${escapeHtml(a.title)}</span>
              <span style="font-size: 0.8rem; font-weight: 700; color: var(--party-cyan);">${escapeHtml(a.value)}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.4rem; margin-top: 0.25rem;">
              <span style="width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center;">${renderAvatar(a.player.avatar, 20)}</span>
              <span style="font-weight: 800; font-size: 0.95rem; color: var(--party-gold);">${escapeHtml(a.player.nickname)}</span>
            </div>
            <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 0.15rem;">${escapeHtml(a.desc)}</div>
          </div>
        </div>
      `).join('');

      awardsGrid.querySelectorAll('.award-card-clickable').forEach(card => {
        card.addEventListener('click', () => {
          openHostPlayerProfile(card.dataset.playerId, card.dataset.userId);
        });
      });
    } else {
      awardsSection.style.display = 'none';
      awardsGrid.innerHTML = '';
    }
  }

  const chartSection = document.getElementById('gameover-chart-section');
  if (chartSection && data.scoreHistory) {
    chartSection.style.display = 'block';
    const chartIcon = document.getElementById('chart-title-icon');
    if (chartIcon && typeof renderIcon === 'function') {
      chartIcon.innerHTML = renderIcon('chart', { size: 24 });
    }
    if (typeof window.renderScoreChart === 'function') {
      window.renderScoreChart({
        canvas: document.getElementById('score-evolution-canvas'),
        tooltipEl: document.getElementById('score-chart-tooltip'),
        legendEl: document.getElementById('chart-legend-container'),
        toggleGroupEl: document.getElementById('chart-mode-toggle'),
        scoreHistory: data.scoreHistory
      });
    }
  } else if (chartSection) {
    chartSection.style.display = 'none';
  }
});

document.getElementById('replay-btn').addEventListener('click', () => {
  socket.emit('restart_to_lobby');
});

socket.on('back_to_lobby', (data) => {
  hideCountdownOverlay();
  audioPlayer.loop = false;
  if (roundTimerInterval) {
    clearInterval(roundTimerInterval);
    roundTimerInterval = null;
  }
  if (audioFadeInterval) {
    clearInterval(audioFadeInterval);
    audioFadeInterval = null;
  }
  audioPlayer.pause();
  audioPlayer.currentTime = 0;
  hideAudioPrompt();
  const chartSection = document.getElementById('gameover-chart-section');
  if (chartSection) chartSection.style.display = 'none';
  switchView('lobby');
  updateLobbyPlayers(data.players);
});

function launchConfetti() {
  if (typeof confetti !== 'undefined') {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      confetti({
        particleCount: 50,
        startVelocity: 30,
        spread: 360,
        origin: { x: Math.random(), y: Math.random() - 0.2 }
      });
    }, 250);
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

function spawnFloatingEmote(data) {
  const overlay = document.getElementById('reactions-overlay');
  if (!overlay) return;

  const emoteId = data && typeof data.emoteId === 'string' ? data.emoteId.trim() : '';
  if (!emoteId) return;

  const item = document.createElement('div');
  item.className = 'floating-reaction';

  const randomLeft = Math.floor(Math.random() * 70) + 15;
  const driftX = (Math.random() - 0.5) * 160;
  const rotStart = (Math.random() - 0.5) * 24;
  const rotMid = (Math.random() - 0.5) * 16;
  const rotEnd = (Math.random() - 0.5) * 20;

  item.style.left = `${randomLeft}%`;
  item.style.setProperty('--drift-x', `${driftX}px`);
  item.style.setProperty('--rot-start', `${rotStart}deg`);
  item.style.setProperty('--rot-mid', `${rotMid}deg`);
  item.style.setProperty('--rot-end', `${rotEnd}deg`);

  const iconSvg = typeof renderIcon === 'function' ? renderIcon(emoteId, { size: 54 }) : '';
  const avatarSvg = typeof renderAvatar === 'function' ? renderAvatar(data.avatar || 'fox', 18) : '';
  const safeName = escapeHtml(String(data.nickname || 'Joueur').substring(0, 14));

  item.innerHTML = `
    <div class="floating-reaction-icon">${iconSvg}</div>
    <div class="floating-reaction-sender">
      <span class="floating-reaction-avatar">${avatarSvg}</span>
      <span>${safeName}</span>
    </div>
  `;

  overlay.appendChild(item);

  playEmotePopSfx();

  const allReactions = overlay.querySelectorAll('.floating-reaction');
  if (allReactions.length > 25) {
    allReactions[0].remove();
  }

  item.addEventListener('animationend', () => {
    item.remove();
  });
}

socket.on('room_emote', (data) => {
  spawnFloatingEmote(data);
});

const SOUNDBOARD_EMOJIS = {
  vineboom: '💥',
  bruh: '🗿',
  bonk: '🏏',
  winxp: '❌',
  wow: '✨',
  emotional: '💔',
  airhorn: '📢',
  sadviolin: '🎻',
  rizz: '😏',
  tacobell: '🔔'
};

function spawnSoundboardOverlay(data) {
  const overlay = document.getElementById('floating-reactions-overlay');
  if (!overlay) return;
  const emoji = SOUNDBOARD_EMOJIS[data.soundId];
  if (!emoji) return;

  const item = document.createElement('div');
  item.className = 'floating-reaction';
  const randomLeft = 10 + Math.random() * 80;
  const driftX = (Math.random() - 0.5) * 90;
  const rotStart = (Math.random() - 0.5) * 20;
  const rotMid = (Math.random() - 0.5) * 14;
  const rotEnd = (Math.random() - 0.5) * 18;

  item.style.left = `${randomLeft}%`;
  item.style.setProperty('--drift-x', `${driftX}px`);
  item.style.setProperty('--rot-start', `${rotStart}deg`);
  item.style.setProperty('--rot-mid', `${rotMid}deg`);
  item.style.setProperty('--rot-end', `${rotEnd}deg`);

  const avatarSvg = typeof renderAvatar === 'function' ? renderAvatar(data.avatar || 'fox', 18) : '';
  const safeName = escapeHtml(String(data.nickname || 'Joueur').substring(0, 14));

  item.innerHTML = `
    <div class="floating-reaction-icon" style="font-size: 3rem; line-height: 1;">${emoji}</div>
    <div class="floating-reaction-sender">
      <span class="floating-reaction-avatar">${avatarSvg}</span>
      <span>${safeName}</span>
    </div>
  `;

  overlay.appendChild(item);
  const allReactions = overlay.querySelectorAll('.floating-reaction');
  if (allReactions.length > 25) {
    allReactions[0].remove();
  }
  item.addEventListener('animationend', () => {
    item.remove();
  });
}

function playHostSoundboardSfx(soundId) {
  if (!SOUNDBOARD_EMOJIS[soundId]) return;
  const masterVol = getMasterSfxVolume();
  if (masterVol <= 0) return;
  try {
    const audio = new Audio(`/sounds/${soundId}.mp3`);
    audio.volume = masterVol;
    audio.play().catch(() => {});
  } catch (e) {}
}

socket.on('host_soundboard', (data) => {
  if (!data || !data.soundId) return;
  playHostSoundboardSfx(data.soundId);
  spawnSoundboardOverlay(data);
});
