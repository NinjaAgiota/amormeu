/* JOGO 1 — AMOR INFINITO 💗 : coleta infinita de corações, sem derrota. */
(function () {
  'use strict';
  const W = 480, H = 640, STAGE = 'stage1', GROUND = H - 70;
  const cv = document.getElementById('cv1');
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const C = window.CONFIG.game1;
  const clamp = Gfx.clamp;

  const keys = { left: false, right: false };
  let raf = 0, last = 0, paused = false, blocked = false, active = false, S = null;

  /* ---------- Cenário que muda com a pontuação ---------- */
  const STOPS = [
    { s: 0,    top: '#ffb98a', bot: '#ff8fb8', gnd: '#ff9fbe' }, // pôr do sol
    { s: 300,  top: '#7b5ea7', bot: '#ff9aa8', gnd: '#a56bb0' }, // entardecer
    { s: 600,  top: '#1c1850', bot: '#5a3a8a', gnd: '#3b2a6e' }, // céu estrelado
    { s: 1000, top: '#07051c', bot: '#2a1a5e', gnd: '#1f1445' }, // universo
    { s: 1600, top: '#020008', bot: '#150a35', gnd: '#120a2a' }
  ];
  function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function mix(a, b, t) {
    const A = hex(a), B = hex(b);
    return 'rgb(' + A.map(function (v, i) { return Math.round(v + (B[i] - v) * t); }).join(',') + ')';
  }
  function palette(score) {
    let i = 0;
    while (i < STOPS.length - 2 && score >= STOPS[i + 1].s) i++;
    const a = STOPS[i], b = STOPS[i + 1];
    const t = clamp((score - a.s) / (b.s - a.s), 0, 1);
    return { top: mix(a.top, b.top, t), bot: mix(a.bot, b.bot, t), gnd: mix(a.gnd, b.gnd, t) };
  }
  function stageName(score) {
    if (score < 300) return 'Pôr do sol';
    if (score < 700) return 'Noite estrelada';
    return 'Universo';
  }

  /* ---------- Estado ---------- */
  function reset() {
    const stars = [];
    for (let i = 0; i < 80; i++) stars.push({ x: Math.random() * W, y: Math.random() * (GROUND - 20), r: Math.random() < 0.2 ? 2 : 1, tw: Math.random() * 6 });
    S = {
      started: false, score: 0, time: 0, hi: App.state.hi1 || 0, newRec: false,
      p: { x: W / 2, tx: null, face: 1, anim: 0, slow: 0, squash: 0 },
      hearts: [], clouds: [], parts: [], texts: [],
      spawn: 0.6, cloudT: 8,
      msg: '', msgT: 0, msgSpecial: false, nextMsg: 100, sp: {},
      stars: stars, doneShown: !!App.state.done.g1, completeT: 0, drag: false
    };
  }

  function spawnHeart(forceGold) {
    const gold = forceGold || Math.random() < 0.06;
    const base = 130 + Math.min(S.score, 1500) * 0.12;
    const x = 34 + Math.random() * (W - 68);
    S.hearts.push({
      x: x, x0: x, y: -20, vy: (base + Math.random() * 50) * (gold ? 1.2 : 1), gold: gold,
      amp: S.score > 200 ? Math.random() * 22 : 0, ph: Math.random() * 6, t: 0, r: gold ? 18 : 14
    });
  }
  function spawnCloud() {
    S.clouds.push({ x: 40 + Math.random() * (W - 80), y: -30, vy: 120 + Math.min(S.score, 1500) * 0.06 });
  }
  function rain(n) {
    for (let i = 0; i < n; i++) {
      const x = 34 + Math.random() * (W - 68);
      S.hearts.push({ x: x, x0: x, y: -20 - i * 46, vy: 190 + Math.random() * 40, gold: i % 6 === 0, amp: 0, ph: 0, t: 0, r: i % 6 === 0 ? 18 : 14 });
    }
  }
  function burst(x, y, n, gold) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 180, life = 0.6 + Math.random() * 0.5;
      S.parts.push({
        x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 80, life: life, max: life,
        col: gold ? ['#ffe066', '#fff3b0', '#ffc933'][i % 3] : ['#ff5c93', '#ffb3cf', '#ffffff'][i % 3],
        s: 2 + Math.floor(Math.random() * 3), heart: Math.random() < 0.35
      });
    }
  }
  function fireworks() {
    for (let k = 0; k < 5; k++) {
      const x = 60 + Math.random() * (W - 120), y = 90 + Math.random() * 220;
      const cols = ['#ff5c93', '#ffe066', '#7fe3ff', '#c7a6ff', '#ffffff'];
      for (let i = 0; i < 22; i++) {
        const a = (i / 22) * Math.PI * 2, sp = 90 + Math.random() * 90, life = 0.9 + Math.random() * 0.5;
        S.parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: life, max: life, col: cols[k % cols.length], s: 3, heart: false });
      }
    }
  }
  function floatText(x, y, text, col) { S.texts.push({ x: x, y: y, text: text, life: 0.9, col: col || '#fff' }); }
  function showMsg(text, special) { S.msg = text; S.msgT = special ? 5.5 : 4; S.msgSpecial = !!special; }

  function addScore(n) {
    S.score += n;
    if (S.score > S.hi) {
      S.hi = S.score; S.newRec = true; App.state.hi1 = S.hi; App.save();
    }
    while (S.score >= S.nextMsg) {
      const idx = (S.nextMsg / 100 - 1) % C.messages.length;
      showMsg(C.messages[idx], false); Sound.play('msg');
      S.nextMsg += 100;
    }
    C.specials.forEach(function (sp) {
      if (!S.sp[sp.at] && S.score >= sp.at) {
        S.sp[sp.at] = true;
        showMsg(sp.text, true); fireworks(); rain(12); Sound.play('win');
      }
    });
    if (!S.doneShown && S.score >= C.completeAt) { S.doneShown = true; S.completeT = 2.4; }
  }

  function collect(h) {
    const pts = h.gold ? 50 : 10;
    addScore(pts);
    burst(h.x, h.y, h.gold ? 22 : 12, h.gold);
    floatText(h.x, h.y - 10, '+' + pts, h.gold ? '#ffe066' : '#ffffff');
    Sound.play(h.gold ? 'gold' : 'collect');
    S.p.squash = 0.25;
  }

  /* ---------- Atualização ---------- */
  function update(dt) {
    S.time += dt;
    const p = S.p;
    if (p.slow > 0) p.slow -= dt;
    const sp = p.slow > 0 ? 0.45 : 1;
    const mx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    if (mx) {
      p.tx = null; p.x += mx * 380 * sp * dt; p.face = mx; p.anim += dt * 10;
    } else if (p.tx != null) {
      const d = p.tx - p.x, step = 520 * sp * dt;
      if (Math.abs(d) <= step) p.x = p.tx;
      else { p.x += Math.sign(d) * step; p.face = Math.sign(d); p.anim += dt * 10; }
    }
    p.x = clamp(p.x, 30, W - 30);
    p.squash = Math.max(0, p.squash - dt * 2.5);

    S.spawn -= dt;
    if (S.spawn <= 0) { spawnHeart(false); S.spawn = Math.max(0.32, 0.95 - S.score * 0.0005) * (0.8 + Math.random() * 0.4); }
    if (S.score >= 150) {
      S.cloudT -= dt;
      if (S.cloudT <= 0) { spawnCloud(); S.cloudT = Math.max(3.5, 9 - S.score / 250) + Math.random() * 2; }
    }

    for (let i = S.hearts.length - 1; i >= 0; i--) {
      const h = S.hearts[i];
      h.t += dt; h.y += h.vy * dt;
      h.x = clamp(h.x0 + Math.sin(h.t * 3 + h.ph) * h.amp, 14, W - 14);
      if (h.y + h.r >= GROUND - 100 && h.y - h.r <= GROUND - 20 && Math.abs(h.x - p.x) < 30 + h.r * 0.5) {
        collect(h); S.hearts.splice(i, 1);
      } else if (h.y > GROUND + 20) {
        S.hearts.splice(i, 1);
      }
    }
    for (let i = S.clouds.length - 1; i >= 0; i--) {
      const c = S.clouds[i];
      c.y += c.vy * dt;
      if (Math.abs(c.x - p.x) < 42 && c.y > GROUND - 130 && c.y < GROUND - 20) {
        p.slow = 1.6; Sound.play('cloud'); floatText(p.x, GROUND - 100, 'Ops! 😵', '#c9cdf5');
        S.clouds.splice(i, 1);
      } else if (c.y > H + 40) S.clouds.splice(i, 1);
    }
    for (let i = S.parts.length - 1; i >= 0; i--) {
      const q = S.parts[i];
      q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 380 * dt;
      if (q.life <= 0) S.parts.splice(i, 1);
    }
    for (let i = S.texts.length - 1; i >= 0; i--) {
      const t = S.texts[i];
      t.life -= dt; t.y -= 42 * dt;
      if (t.life <= 0) S.texts.splice(i, 1);
    }
    if (S.msgT > 0) S.msgT -= dt;
    if (S.completeT > 0) { S.completeT -= dt; if (S.completeT <= 0) showComplete(); }
  }

  /* ---------- Desenho ---------- */
  function nebula(x, y, r, col, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(' + col + ',' + a.toFixed(3) + ')');
    g.addColorStop(1, 'rgba(' + col + ',0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function drawBackground() {
    const pal = palette(S.score);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, pal.top); g.addColorStop(1, pal.bot);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    const na = clamp((S.score - 800) / 500, 0, 1);
    if (na > 0) {
      nebula(120, 180, 190, '255,120,200', na * 0.35);
      nebula(380, 300, 210, '110,140,255', na * 0.35);
      nebula(240, 480, 170, '190,110,255', na * 0.3);
      for (let i = 0; i < 120; i++) {
        const ang = i * 0.35 + S.time * 0.12, rad = i * 1.5;
        const x = 340 + Math.cos(ang) * rad * 0.7, y = 120 + Math.sin(ang) * rad * 0.3;
        ctx.fillStyle = 'rgba(255,230,255,' + (na * (1 - i / 130)).toFixed(2) + ')';
        ctx.fillRect(Math.round(x), Math.round(y), 2, 2);
      }
    }
    const sa = clamp((S.score - 250) / 350, 0, 1);
    if (sa > 0) {
      S.stars.forEach(function (s) {
        const a = sa * (0.5 + 0.5 * Math.sin(S.time * 2 + s.tw));
        ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')';
        ctx.fillRect(Math.round(s.x), Math.round(s.y), s.r, s.r);
      });
    }
    const sunA = clamp(1 - S.score / 420, 0, 1);
    if (sunA > 0) {
      ctx.globalAlpha = sunA;
      ctx.fillStyle = '#fff1a8';
      ctx.beginPath(); ctx.arc(W * 0.7, 190 + S.score * 0.45, 48, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    const ma = clamp((S.score - 350) / 300, 0, 1) * clamp(1 - (S.score - 1000) / 700, 0.3, 1);
    if (ma > 0) {
      ctx.globalAlpha = ma;
      ctx.fillStyle = '#fff6c9';
      ctx.beginPath(); ctx.arc(90, 120, 26, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = pal.top;
      ctx.beginPath(); ctx.arc(100, 114, 24, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    // chão
    ctx.fillStyle = pal.gnd; ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = 'rgba(255,255,255,.28)';
    for (let x = 0; x < W; x += 24) ctx.fillRect(x, GROUND - 4 + ((x / 24) % 2) * 4, 24, 6);
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(0, GROUND + 22, W, H);
  }

  function drawHUD() {
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.font = 'bold 26px "Courier New", monospace';
    Gfx.text(ctx, '💗 ' + S.score, 14, 36, '#fff', '#4a2c5a', 5);
    ctx.font = 'bold 13px "Courier New", monospace';
    Gfx.text(ctx, stageName(S.score), 14, 56, '#fff', '#4a2c5a', 4);
    ctx.textAlign = 'right';
    ctx.font = 'bold 14px "Courier New", monospace';
    Gfx.text(ctx, 'Recorde ' + S.hi, W - 14, 30, '#fff', '#4a2c5a', 4);
    if (S.newRec && Math.floor(S.time * 3) % 2 === 0) Gfx.text(ctx, 'NOVO RECORDE!', W - 14, 50, '#ffe066', '#4a2c5a', 4);
    ctx.textAlign = 'center';
    if (S.msgT > 0) {
      const a = clamp(Math.min(S.msgT, 0.5) / 0.5, 0, 1) * clamp((S.msgSpecial ? 5.5 : 4) - S.msgT, 0, 0.3) / 0.3;
      ctx.globalAlpha = clamp(a, 0, 1);
      ctx.font = 'bold 18px "Courier New", monospace';
      const lines = Gfx.wrap(ctx, S.msg, 340);
      const bh = lines.length * 24 + 24;
      Gfx.rr(ctx, 40, 84, W - 80, bh, 14);
      ctx.fillStyle = S.msgSpecial ? 'rgba(255,246,200,.95)' : 'rgba(255,255,255,.92)'; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = '#4a2c5a'; ctx.stroke();
      ctx.fillStyle = '#4a2c5a';
      lines.forEach(function (l, i) { ctx.fillText(l, W / 2, 84 + 30 + i * 24); });
      ctx.globalAlpha = 1;
    }
    ctx.textAlign = 'left';
  }

  function draw() {
    if (!S) return;
    drawBackground();
    // corações
    S.hearts.forEach(function (h) {
      const sc = h.gold ? 4 : 3;
      Sprites.drawCenter(ctx, h.gold ? 'gold' : 'heart', h.x, h.y, sc, false);
      if (h.gold) {
        const k = Math.sin(S.time * 8 + h.ph) * 3;
        ctx.fillStyle = '#fff';
        ctx.fillRect(Math.round(h.x - 24 + k), Math.round(h.y - 4), 4, 4);
        ctx.fillRect(Math.round(h.x + 22 - k), Math.round(h.y - 14), 4, 4);
      }
    });
    S.clouds.forEach(function (c) { Sprites.drawCenter(ctx, 'cloud', c.x, c.y, 5, false); });
    // personagem
    const p = S.p;
    const moving = (keys.left || keys.right) || (p.tx != null && Math.abs(p.tx - p.x) > 2);
    const frame = moving ? (Math.floor(p.anim) % 2 ? 'isa1' : 'isa0') : 'isa0';
    const idle = moving ? 0 : Math.sin(S.time * 3) * 0.02;
    Sprites.drawFeet(ctx, frame, p.x, GROUND + 6, 4, p.face < 0, 1 + idle - p.squash * 0.6 + (p.squash > 0 ? 0 : 0));
    if (p.slow > 0) {
      Sprites.drawCenter(ctx, 'cloud', p.x, GROUND - 100 + Math.sin(S.time * 10) * 2, 3, false);
    }
    // partículas
    S.parts.forEach(function (q) {
      ctx.globalAlpha = clamp(q.life / q.max, 0, 1);
      ctx.fillStyle = q.col;
      if (q.heart) { Gfx.heartPath(ctx, q.x, q.y, q.s * 2.5); ctx.fill(); }
      else ctx.fillRect(Math.round(q.x), Math.round(q.y), q.s, q.s);
    });
    ctx.globalAlpha = 1;
    ctx.font = 'bold 20px "Courier New", monospace'; ctx.textAlign = 'center';
    S.texts.forEach(function (t) {
      ctx.globalAlpha = clamp(t.life / 0.5, 0, 1);
      Gfx.text(ctx, t.text, t.x, t.y, t.col, '#4a2c5a', 4);
    });
    ctx.globalAlpha = 1;
    drawHUD();
  }

  /* ---------- Laço de animação (um único loop) ---------- */
  function loop(t) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, Math.max(0, (t - last) / 1000));
    last = t;
    if (S && S.started && !paused && !blocked) update(dt);
    draw();
  }
  function startLoop() { if (raf) return; last = performance.now(); raf = requestAnimationFrame(loop); }
  function stopLoop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  /* ---------- Telas (início, pausa, conclusão) ---------- */
  function showStart() {
    blocked = true;
    App.overlay(STAGE, {
      emoji: '💗', title: 'Amor Infinito',
      text: 'Colete os corações — os dourados valem mais!\nCuidado com as nuvenzinhas ranzinzas: elas só atrasam, não machucam.\nNão tem derrota nem fim: é só continuar.\nMova com ← → (ou A D) ou arraste o dedo.',
      buttons: [{ label: 'Jogar ▶', cls: 'primary', fn: begin }]
    });
  }
  function begin() {
    App.hideOverlay(STAGE); S.started = true; blocked = false; paused = false; App.syncTools();
  }
  function showComplete() {
    blocked = true;
    Sound.play('win');
    App.complete('g1');
    App.overlay(STAGE, {
      emoji: '💗', title: 'Amor Infinito concluído!', text: C.completeText,
      buttons: [
        { label: 'Continuar coletando', cls: 'primary', fn: function () { App.hideOverlay(STAGE); blocked = false; } },
        { label: 'Voltar ao menu', fn: function () { App.goMenu(); } }
      ]
    });
  }
  function setPause(flag) {
    if (!S || !S.started || blocked) return;
    paused = flag;
    if (paused) {
      App.overlay(STAGE, {
        emoji: '⏸', title: 'Pausado',
        buttons: [
          { label: 'Continuar ▶', cls: 'primary', fn: function () { setPause(false); App.syncTools(); } },
          { label: 'Menu', fn: function () { App.goMenu(); } }
        ]
      });
    } else App.hideOverlay(STAGE);
  }

  /* ---------- Entrada ---------- */
  function kd(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { keys.left = true; e.preventDefault(); }
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { keys.right = true; e.preventDefault(); }
    else if (e.key === ' ') e.preventDefault();
  }
  function ku(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
  }
  function px(e) { const r = cv.getBoundingClientRect(); return (e.clientX - r.left) / r.width * W; }
  cv.addEventListener('pointerdown', function (e) {
    if (!S || !S.started || paused || blocked) return;
    S.drag = true; S.p.tx = px(e);
    try { cv.setPointerCapture(e.pointerId); } catch (x) {}
  });
  cv.addEventListener('pointermove', function (e) { if (S && S.drag) S.p.tx = px(e); });
  ['pointerup', 'pointercancel'].forEach(function (ev) {
    cv.addEventListener(ev, function () { if (S) { S.drag = false; S.p.tx = null; } });
  });
  Array.prototype.forEach.call(document.querySelectorAll('#touch1 .tbtn'), function (b) {
    App.hold(b, function (v) { keys[b.dataset.k] = v; });
  });

  /* ---------- API ---------- */
  App.register('g1', {
    enter: function () {
      active = true; paused = false; keys.left = keys.right = false;
      reset(); showStart(); startLoop();
      window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    },
    leave: function () {
      active = false; stopLoop(); keys.left = keys.right = false; paused = false; blocked = false;
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
      App.hideOverlay(STAGE);
    },
    restart: function () {
      if (!active) return;
      paused = false; App.hideOverlay(STAGE); reset(); S.started = true; blocked = false;
    },
    pause: function (f) { setPause(!!f); },
    togglePause: function () { setPause(!paused); },
    isPaused: function () { return paused; }
  });
})();
