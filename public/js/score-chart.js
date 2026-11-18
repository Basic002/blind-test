(function() {
  const CHART_PALETTE = [
    '#00f0ff',
    '#ffd600',
    '#ff3b69',
    '#34d399',
    '#a855f7',
    '#fb923c',
    '#38bdf8',
    '#f43f5e',
    '#4ade80',
    '#e879f9',
    '#fbbf24',
    '#60a5fa'
  ];

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function hexToRgba(hex, alpha) {
    if (!hex || typeof hex !== 'string') return `rgba(255, 255, 255, ${alpha})`;
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    if (c.length !== 6) return `rgba(255, 255, 255, ${alpha})`;
    const num = parseInt(c, 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
  }

  function renderScoreChart(options) {
    const {
      canvas,
      tooltipEl,
      legendEl,
      toggleGroupEl,
      scoreHistory
    } = options;

    if (!canvas || !scoreHistory) return null;

    let currentMode = (scoreHistory.teams && scoreHistory.teams.length > 0) ? 'teams' : 'players';
    let activeHighlight = null;

    function getSeries() {
      if (currentMode === 'teams' && scoreHistory.teams && scoreHistory.teams.length > 0) {
        return scoreHistory.teams.map((t, idx) => ({
          id: t.id,
          name: t.name,
          color: t.color || CHART_PALETTE[idx % CHART_PALETTE.length],
          avatar: null,
          scores: Array.isArray(t.scores) ? t.scores : [0],
          finalScore: t.finalScore || 0
        }));
      }

      const players = scoreHistory.players || [];
      return players.map((p, idx) => ({
        id: p.id,
        name: p.nickname,
        color: CHART_PALETTE[idx % CHART_PALETTE.length],
        avatar: p.avatar,
        scores: Array.isArray(p.scores) ? p.scores : [0],
        finalScore: p.finalScore || 0
      }));
    }

    function draw(hoverPointIndex = null) {
      const series = getSeries();
      if (!series || series.length === 0) return;

      const rounds = scoreHistory.rounds || ['Départ'];
      const numRounds = rounds.length;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);

      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const width = rect.width;
      const height = rect.height;

      const padLeft = width < 480 ? 46 : 58;
      const padRight = width < 480 ? 20 : 32;
      const padTop = 26;
      const padBottom = 38;

      const plotW = Math.max(10, width - padLeft - padRight);
      const plotH = Math.max(10, height - padTop - padBottom);

      let maxScore = 0;
      for (const s of series) {
        for (const sc of s.scores) {
          if (sc > maxScore) maxScore = sc;
        }
      }
      if (maxScore <= 0) maxScore = 500;

      const yStepTarget = maxScore / 4;
      const magnitude = Math.pow(10, Math.floor(Math.log10(yStepTarget || 1)));
      const yStep = Math.ceil(yStepTarget / magnitude) * magnitude || 100;
      const yMax = Math.ceil(maxScore / yStep) * yStep || 500;

      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = '600 11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      const numYDivisions = 4;
      for (let i = 0; i <= numYDivisions; i++) {
        const val = Math.round((yMax / numYDivisions) * i);
        const y = padTop + plotH - (val / yMax) * plotH;
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(padLeft + plotW, y);
        ctx.stroke();

        ctx.fillText(`${val.toLocaleString('fr-FR')}`, padLeft - 8, y);
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const xStep = numRounds > 1 ? plotW / (numRounds - 1) : 0;

      for (let r = 0; r < numRounds; r++) {
        const x = padLeft + r * xStep;

        ctx.beginPath();
        ctx.moveTo(x, padTop);
        ctx.lineTo(x, padTop + plotH);
        ctx.strokeStyle = (hoverPointIndex === r) ? 'rgba(0, 240, 255, 0.45)' : 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = (hoverPointIndex === r) ? 1.5 : 1;
        if (hoverPointIndex === r) {
          ctx.setLineDash([4, 4]);
        } else {
          ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = (hoverPointIndex === r) ? '#00f0ff' : 'rgba(255, 255, 255, 0.6)';
        ctx.fillText(rounds[r], x, padTop + plotH + 8);
      }

      series.forEach((s) => {
        const isDimmed = (activeHighlight !== null && activeHighlight !== s.id);
        const isHighlighted = (activeHighlight === s.id);

        const lineWidth = isHighlighted ? 4 : (isDimmed ? 1.5 : 2.5);

        const points = s.scores.map((score, rIdx) => {
          const x = padLeft + rIdx * xStep;
          const y = padTop + plotH - (Math.min(yMax, Math.max(0, score)) / yMax) * plotH;
          return { x, y, score };
        });

        if (points.length < 2) return;

        if (!isDimmed) {
          const grad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
          grad.addColorStop(0, hexToRgba(s.color, isHighlighted ? 0.32 : 0.12));
          grad.addColorStop(1, hexToRgba(s.color, 0));

          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const mx = (prev.x + curr.x) / 2;
            ctx.bezierCurveTo(mx, prev.y, mx, curr.y, curr.x, curr.y);
          }
          ctx.lineTo(points[points.length - 1].x, padTop + plotH);
          ctx.lineTo(points[0].x, padTop + plotH);
          ctx.closePath();
          ctx.fillStyle = grad;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          const prev = points[i - 1];
          const curr = points[i];
          const mx = (prev.x + curr.x) / 2;
          ctx.bezierCurveTo(mx, prev.y, mx, curr.y, curr.x, curr.y);
        }
        ctx.strokeStyle = isDimmed ? hexToRgba(s.color, 0.25) : s.color;
        ctx.lineWidth = lineWidth;
        ctx.shadowBlur = isDimmed ? 0 : (isHighlighted ? 14 : 7);
        ctx.shadowColor = s.color;
        ctx.stroke();
        ctx.shadowBlur = 0;

        points.forEach((pt, rIdx) => {
          const isHoveredCol = (hoverPointIndex === rIdx);
          const radius = isHoveredCol ? 6 : (isHighlighted ? 4.5 : (isDimmed ? 2.5 : 3.5));

          ctx.beginPath();
          ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = isDimmed ? hexToRgba(s.color, 0.3) : s.color;
          ctx.fill();

          if (!isDimmed) {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, isHoveredCol ? 2.5 : 1.8, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
          }
        });
      });
    }

    function updateTooltip(rIdx, mouseX, mouseY) {
      if (!tooltipEl) return;
      if (rIdx === null) {
        tooltipEl.style.display = 'none';
        return;
      }

      const series = getSeries();
      const rounds = scoreHistory.rounds || ['Départ'];
      const roundName = rounds[rIdx] === 'Départ' ? 'Score Initial' : `Manche ${rounds[rIdx].replace(/^M/, '')}`;

      const sorted = [...series].map(s => {
        const cur = s.scores[rIdx] || 0;
        const prev = rIdx > 0 ? (s.scores[rIdx - 1] || 0) : 0;
        const diff = cur - prev;
        return {
          id: s.id,
          name: s.name,
          color: s.color,
          score: cur,
          diff,
          avatar: s.avatar
        };
      }).sort((a, b) => b.score - a.score);

      tooltipEl.innerHTML = `
        <div class="chart-tooltip-header">${roundName}</div>
        ${sorted.slice(0, 6).map(item => `
          <div class="chart-tooltip-row">
            <span class="chart-tooltip-label">
              <span class="chart-tooltip-dot" style="background: ${item.color};"></span>
              <span>${escapeHtml(item.name)}</span>
            </span>
            <span class="chart-tooltip-value">
              ${item.score.toLocaleString('fr-FR')} pts
              ${item.diff > 0 ? `<small style="color: #34d399; font-size: 0.7rem; font-weight: 700; margin-left: 3px;">+${item.diff}</small>` : ''}
            </span>
          </div>
        `).join('')}
      `;

      tooltipEl.style.display = 'block';
      const rect = canvas.getBoundingClientRect();
      const tooltipRect = tooltipEl.getBoundingClientRect();

      let left = mouseX;
      let top = mouseY - 14;

      if (left - tooltipRect.width / 2 < 10) {
        left = tooltipRect.width / 2 + 10;
      } else if (left + tooltipRect.width / 2 > rect.width - 10) {
        left = rect.width - tooltipRect.width / 2 - 10;
      }

      if (top - tooltipRect.height < 10) {
        top = mouseY + tooltipRect.height + 20;
      }

      tooltipEl.style.left = `${left}px`;
      tooltipEl.style.top = `${top}px`;
    }

    function updateLegend() {
      if (!legendEl) return;
      const series = getSeries();

      legendEl.innerHTML = series.map(s => {
        const isDimmed = (activeHighlight !== null && activeHighlight !== s.id);
        const isActive = (activeHighlight === s.id);
        const avatarHtml = s.avatar && typeof window.renderAvatar === 'function'
          ? `<span style="width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center;">${window.renderAvatar(s.avatar, 18)}</span>`
          : `<span style="width: 10px; height: 10px; border-radius: 50%; background: ${s.color}; display: inline-block;"></span>`;

        return `
          <button type="button" class="chart-legend-pill ${isActive ? 'active' : ''} ${isDimmed ? 'dimmed' : ''}" data-series-id="${s.id}" style="${isActive ? `border-color: ${s.color}; box-shadow: 0 0 10px ${s.color}66;` : ''}">
            ${avatarHtml}
            <span>${escapeHtml(s.name)}</span>
            <span style="color: ${s.color}; font-weight: 800;">${s.finalScore.toLocaleString('fr-FR')} pts</span>
          </button>
        `;
      }).join('');

      legendEl.querySelectorAll('.chart-legend-pill').forEach(btn => {
        const sId = btn.dataset.seriesId;
        btn.addEventListener('click', () => {
          if (activeHighlight === sId) {
            activeHighlight = null;
          } else {
            activeHighlight = sId;
          }
          updateLegend();
          draw();
        });
        btn.addEventListener('mouseenter', () => {
          if (activeHighlight === null) {
            activeHighlight = sId;
            draw();
          }
        });
        btn.addEventListener('mouseleave', () => {
          if (btn.classList.contains('active')) return;
          if (activeHighlight === sId && !btn.classList.contains('active')) {
            activeHighlight = null;
            draw();
          }
        });
      });
    }

    function setupEvents() {
      const handlePointerMove = (clientX, clientY) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;

        const padLeft = rect.width < 480 ? 46 : 58;
        const padRight = rect.width < 480 ? 20 : 32;
        const plotW = Math.max(10, rect.width - padLeft - padRight);
        const numRounds = (scoreHistory.rounds || []).length;
        if (numRounds <= 1) return;

        const xStep = plotW / (numRounds - 1);
        const relX = mouseX - padLeft;
        const rIdx = Math.max(0, Math.min(numRounds - 1, Math.round(relX / xStep)));

        draw(rIdx);
        updateTooltip(rIdx, mouseX, mouseY);
      };

      canvas.addEventListener('mousemove', (e) => {
        handlePointerMove(e.clientX, e.clientY);
      });

      canvas.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches[0]) {
          handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });

      canvas.addEventListener('mouseleave', () => {
        draw(null);
        updateTooltip(null);
      });

      canvas.addEventListener('touchend', () => {
        draw(null);
        updateTooltip(null);
      });

      if (toggleGroupEl) {
        if (scoreHistory.teams && scoreHistory.teams.length > 0) {
          toggleGroupEl.style.display = 'inline-flex';
          toggleGroupEl.querySelectorAll('.chart-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              toggleGroupEl.querySelectorAll('.chart-toggle-btn').forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
              currentMode = btn.dataset.chartMode;
              activeHighlight = null;
              updateLegend();
              draw();
            });
          });
        } else {
          toggleGroupEl.style.display = 'none';
        }
      }

      window.addEventListener('resize', () => {
        draw();
      });
    }

    updateLegend();
    setupEvents();
    setTimeout(() => draw(), 60);

    return {
      draw,
      setMode: (mode) => {
        currentMode = mode;
        activeHighlight = null;
        updateLegend();
        draw();
      }
    };
  }

  if (typeof window !== 'undefined') {
    window.renderScoreChart = renderScoreChart;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { renderScoreChart };
  }
})();
