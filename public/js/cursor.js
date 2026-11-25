(() => {
  if (!window.matchMedia || !window.matchMedia('(pointer: fine)').matches) {
    return;
  }

  let dot = null;
  let mouseX = -100;
  let mouseY = -100;
  let lastSmokeX = -100;
  let lastSmokeY = -100;
  let lastSmokeTime = 0;
  let isVisible = false;
  let isHoverState = false;

  const INTERACTIVE_SELECTOR = [
    'a',
    'button',
    'select',
    'label',
    '[role="button"]',
    '.avatar-option',
    '.choice-btn',
    '.soundboard-pad',
    '.selfie-filter-btn',
    '.selfie-card',
    '.reaction-btn',
    '.chart-toggle-btn',
    '.auth-tab-btn',
    '.btn',
    'input[type="checkbox"]',
    'input[type="radio"]',
    'input[type="range"]',
    'input[type="file"]'
  ].join(', ');

  const TEXT_SELECTOR = 'input[type="text"], input[type="password"], input[type="search"], input[type="email"], input[type="number"], textarea';

  function ensureElements() {
    if (dot) return true;
    if (!document.body) return false;

    dot = document.createElement('div');
    dot.id = 'bt-cursor-dot';
    dot.className = 'bt-cursor-dot is-hidden';

    document.body.appendChild(dot);
    return true;
  }

  function showCursor() {
    if (!ensureElements()) return;
    if (!isVisible) {
      isVisible = true;
      dot.classList.remove('is-hidden');
      document.documentElement.classList.add('bt-custom-cursor-active');
    }
  }

  function hideCursor() {
    isVisible = false;
    document.documentElement.classList.remove('bt-custom-cursor-active');
    if (dot) dot.classList.add('is-hidden');
  }

  function updateTargetState(target) {
    if (!dot || !target || !target.closest) return;
    const isText = Boolean(target.closest(TEXT_SELECTOR));
    const isInteractive = !isText && Boolean(target.closest(INTERACTIVE_SELECTOR));
    isHoverState = isInteractive;

    dot.classList.toggle('is-text', isText);
    dot.classList.toggle('is-hovering', isInteractive);
  }

  function spawnSmoke(x, y) {
    if (!document.body || !isVisible) return;
    const now = performance.now();
    const dx = x - lastSmokeX;
    const dy = y - lastSmokeY;
    const distSq = dx * dx + dy * dy;
    if (distSq < 16 && now - lastSmokeTime < 35) return;
    if (now - lastSmokeTime < 16) return;

    lastSmokeX = x;
    lastSmokeY = y;
    lastSmokeTime = now;

    const smoke = document.createElement('div');
    smoke.className = isHoverState ? 'bt-cursor-smoke is-hovering' : 'bt-cursor-smoke';
    const size = 14 + Math.random() * 10;
    const driftX = (Math.random() - 0.5) * 18 - dx * 0.15;
    const driftY = (Math.random() - 0.5) * 18 - dy * 0.15 - 6;

    smoke.style.width = `${size}px`;
    smoke.style.height = `${size}px`;
    smoke.style.left = `${x}px`;
    smoke.style.top = `${y}px`;
    smoke.style.setProperty('--sx', `${driftX.toFixed(1)}px`);
    smoke.style.setProperty('--sy', `${driftY.toFixed(1)}px`);

    document.body.appendChild(smoke);
    smoke.addEventListener('animationend', () => smoke.remove());
  }

  function spawnRipple(x, y) {
    if (!document.body || !isVisible) return;
    const ripple = document.createElement('div');
    ripple.className = 'bt-cursor-ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    document.body.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    showCursor();
    if (dot) {
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
    }
    updateTargetState(e.target);
    spawnSmoke(mouseX, mouseY);
  }, { passive: true });

  document.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || !isVisible) return;
    if (dot) dot.classList.add('is-clicking');
    spawnRipple(e.clientX, e.clientY);
  });

  document.addEventListener('mouseup', () => {
    if (dot) dot.classList.remove('is-clicking');
  });

  document.addEventListener('mouseleave', () => {
    hideCursor();
  });

  window.addEventListener('blur', () => {
    hideCursor();
  });

  document.addEventListener('touchstart', () => {
    hideCursor();
  }, { passive: true });
})();
