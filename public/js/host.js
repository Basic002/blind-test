const socket = io();

let roomCode = null;
let currentThemes = [];
let selectedThemeId = 'disney';
let roundTimerInterval = null;
let audioFadeInterval = null;
let audioPlayer = document.getElementById('audio-player');
let currentPlayers = [];
let currentAudioFallback = null;

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

function showAudioPrompt() {
  let prompt = document.getElementById('audio-unmute-prompt');
  if (!prompt) {
    prompt = document.createElement('div');
    prompt.id = 'audio-unmute-prompt';
    prompt.className = 'audio-unmute-pill';
    prompt.innerHTML = `<span>🔊</span> Cliquer pour activer le son`;
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
});

const sfxToggleBtn = document.getElementById('sfx-toggle-btn');
if (sfxToggleBtn) {
  sfxToggleBtn.addEventListener('click', () => {
    sfxEnabled = !sfxEnabled;
    sfxToggleBtn.textContent = sfxEnabled ? '🔔 Bruitages ON' : '🔕 Bruitages OFF';
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

socket.emit('create_room');

socket.on('room_created', (data) => {
  roomCode = data.roomCode;
  currentThemes = data.themes;

  document.getElementById('display-room-code').textContent = data.roomCode;
  document.getElementById('display-join-url').textContent = data.joinUrl;
  document.getElementById('qr-code-img').src = data.qrDataUrl;

  renderThemes(data.themes, data.themeId);
  document.getElementById('rounds-select').value = data.settings.totalRounds;
  document.getElementById('duration-select').value = data.settings.roundDuration;
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
      <div class="theme-icon">${theme.icon}</div>
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
    roundDuration: duration
  });
}

document.getElementById('rounds-select').addEventListener('change', sendSettingsUpdate);
document.getElementById('duration-select').addEventListener('change', sendSettingsUpdate);
document.getElementById('custom-playlist-input').addEventListener('input', sendSettingsUpdate);

socket.on('player_joined', (data) => {
  currentPlayers = data.players;
  updateLobbyPlayers(data.players);
});

socket.on('player_left', (data) => {
  currentPlayers = data.players;
  updateLobbyPlayers(data.players);
});

function updateLobbyPlayers(players) {
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
    startBtn.textContent = 'LANCER LA PARTIE ➔';
  } else {
    grid.innerHTML = players.map(p => `
      <div class="player-chip">
        <span class="player-avatar">${p.avatar}</span>
        <span class="player-name">${escapeHtml(p.nickname)}</span>
        <span class="player-level-badge">Nv.${p.level || 1}</span>
      </div>
    `).join('');
    startBtn.disabled = false;
    startBtn.textContent = `LANCER LA PARTIE ➔ (${count})`;
  }
}

const startBtn = document.getElementById('start-game-btn');
startBtn.addEventListener('click', () => {
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
  startBtn.textContent = data.message || 'Chargement...';
});

socket.on('game_start_error', (data) => {
  alert('Erreur: ' + data.message);
  startBtn.disabled = false;
  startBtn.textContent = 'Lancer la Partie 🚀';
});

socket.on('round_start_host', (data) => {
  if (audioFadeInterval) {
    clearInterval(audioFadeInterval);
    audioFadeInterval = null;
  }

  playRoundStartSfx();
  switchView('round');

  document.getElementById('round-number-display').textContent = `Manche 0${data.roundIndex} / 0${data.totalRounds}`.replace(/0(\d\d)/g, '$1');
  
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
  container.innerHTML = players.map(p => `
    <div id="round-player-${p.id}" class="player-chip" style="opacity: 0.55; transition: all 0.25s ease;">
      <span class="player-avatar">${p.avatar}</span>
      <span class="player-name">${escapeHtml(p.nickname)}</span>
      <span class="player-level-badge">Nv.${p.level || 1}</span>
      <span class="answer-check" style="display: none; margin-left: 0.3rem;">⚡</span>
    </div>
  `).join('');
}

socket.on('player_answered', (data) => {
  playPlayerAnswerSfx();
  updateAnsweredCount(data.answeredCount, data.totalPlayers);

  const playerChip = document.getElementById(`round-player-${data.playerId}`);
  if (playerChip) {
    playerChip.style.opacity = '1';
    playerChip.style.borderColor = 'rgba(48, 209, 88, 0.6)';
    playerChip.style.background = 'rgba(48, 209, 88, 0.12)';
    playerChip.style.boxShadow = '0 0 16px rgba(48, 209, 88, 0.25)';
    const check = playerChip.querySelector('.answer-check');
    if (check) check.style.display = 'inline';
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
  
  if (audioFadeInterval) clearInterval(audioFadeInterval);
  let fadeVolume = audioPlayer.volume;
  audioFadeInterval = setInterval(() => {
    if (fadeVolume > 0.05) {
      fadeVolume -= 0.05;
      audioPlayer.volume = Math.max(0, fadeVolume);
    } else {
      clearInterval(audioFadeInterval);
      audioFadeInterval = null;
      audioPlayer.pause();
      audioPlayer.volume = parseFloat(volumeSlider.value);
    }
  }, 50);

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

  renderLeaderboard(data.leaderboard);
});

function renderLeaderboard(leaderboard) {
  const container = document.getElementById('reveal-leaderboard');
  container.innerHTML = leaderboard.slice(0, 6).map((player, index) => {
    const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : '';
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`;

    return `
      <div class="leaderboard-row ${rankClass}">
        <div class="leaderboard-player-info">
          <span style="font-size: 1.15rem; width: 28px; text-align: center; color: var(--text-secondary);">${medal}</span>
          <span class="player-avatar">${player.avatar}</span>
          <div style="display: flex; flex-direction: column; text-align: left;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-weight: 700;">${escapeHtml(player.nickname)}</span>
              <span class="player-level-badge">Nv.${player.level || 1}</span>
            </div>
            <span style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">${escapeHtml(player.title || 'Novice')}</span>
          </div>
          ${player.streak > 1 ? `<span class="streak-badge">🔥 ${player.streak}</span>` : ''}
        </div>
        <div class="leaderboard-score">${player.score.toLocaleString('fr-FR')} <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-tertiary);">pts</span></div>
      </div>
    `;
  }).join('');
}

socket.on('game_over_host', (data) => {
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

  const podium = data.podium || [];
  
  if (podium[0]) {
    const p1 = document.getElementById('podium-1');
    p1.querySelector('.podium-avatar').textContent = podium[0].avatar;
    p1.querySelector('.podium-name').textContent = podium[0].nickname;
    p1.querySelector('.podium-score').textContent = `${podium[0].score.toLocaleString('fr-FR')} pts`;
    const lvl1 = p1.querySelector('.podium-level');
    if (lvl1) lvl1.textContent = `Nv.${podium[0].level || 1} · ${podium[0].title || 'Novice'}`;
  }

  if (podium[1]) {
    const p2 = document.getElementById('podium-2');
    p2.querySelector('.podium-avatar').textContent = podium[1].avatar;
    p2.querySelector('.podium-name').textContent = podium[1].nickname;
    p2.querySelector('.podium-score').textContent = `${podium[1].score.toLocaleString('fr-FR')} pts`;
    const lvl2 = p2.querySelector('.podium-level');
    if (lvl2) lvl2.textContent = `Nv.${podium[1].level || 1} · ${podium[1].title || 'Novice'}`;
  }

  if (podium[2]) {
    const p3 = document.getElementById('podium-3');
    p3.querySelector('.podium-avatar').textContent = podium[2].avatar;
    p3.querySelector('.podium-name').textContent = podium[2].nickname;
    p3.querySelector('.podium-score').textContent = `${podium[2].score.toLocaleString('fr-FR')} pts`;
    const lvl3 = p3.querySelector('.podium-level');
    if (lvl3) lvl3.textContent = `Nv.${podium[2].level || 1} · ${podium[2].title || 'Novice'}`;
  }
});

document.getElementById('replay-btn').addEventListener('click', () => {
  socket.emit('restart_to_lobby');
});

socket.on('back_to_lobby', (data) => {
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
