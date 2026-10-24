// Player Controller Script
const socket = io();

// State
let selectedAvatar = '🦊';
let myPlayerInfo = null;
let currentOptions = [];
let playerTimerInterval = null;
let hasAnsweredCurrentRound = false;

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

// Avatar selection
document.querySelectorAll('.avatar-option').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    selectedAvatar = el.dataset.avatar;
    vibrate(20);
  });
});

// Join Button
const btnJoin = document.getElementById('btn-join');
btnJoin.addEventListener('click', () => {
  const roomCode = document.getElementById('input-room-code').value.trim().toUpperCase();
  const nickname = document.getElementById('input-nickname').value.trim();

  if (!roomCode || roomCode.length < 3) {
    alert('Entre un code de salon valide !');
    return;
  }

  if (!nickname) {
    alert('Choisis un pseudo !');
    return;
  }

  btnJoin.disabled = true;
  btnJoin.textContent = 'CONNEXION...';

  socket.emit('join_room', {
    roomCode,
    nickname,
    avatar: selectedAvatar
  });
});

// Join response handlers
socket.on('join_success', (data) => {
  myPlayerInfo = data.player;
  
  document.getElementById('player-avatar-badge').textContent = data.player.avatar;
  document.getElementById('player-name-badge').textContent = data.player.nickname;
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
      modeText.style.color = "var(--apple-yellow)";
    } else if (data.isAnime) {
      modeText.textContent = "Trouve l'animé !";
      modeText.style.color = "var(--apple-red)";
    } else {
      modeText.textContent = "Trouve le morceau !";
      modeText.style.color = "var(--apple-blue)";
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
    resultTitle.style.color = 'var(--apple-green)';
    resultPoints.textContent = `+${data.pointsEarned.toLocaleString('fr-FR')} pts`;
    resultPoints.style.color = 'var(--apple-green)';
  } else {
    vibrate(180);
    resultIcon.textContent = '✕';
    resultTitle.textContent = 'Manqué';
    resultTitle.style.color = 'var(--apple-red)';
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
    finalRankTitle.style.color = 'var(--apple-yellow)';
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
