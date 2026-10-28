/* Menu principal, navegação, progresso salvo, som, sobreposições e tela final. */
(function () {
  'use strict';
  const CFG = window.CONFIG;
  const KEY = 'pedacinho_do_meu_amor_v1';
  const $ = function (s, r) { return (r || document).querySelector(s); };
  const $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  const IDS = ['g1', 'g2', 'g3'];

  /* ---------------- Progresso salvo (localStorage) ---------------- */
  function defaults() {
    return { done: { g1: false, g2: false, g3: false }, hi1: 0, hi3: 0, prizes: [], tries2: null, sound: true, finalSeen: false };
  }
  function load() {
    const base = defaults();
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s && typeof s === 'object') {
        Object.assign(base, s);
        base.done = Object.assign({ g1: false, g2: false, g3: false }, s.done || {});
        if (!Array.isArray(base.prizes)) base.prizes = [];
      }
    } catch (e) { /* sem localStorage: segue sem salvar */ }
    return base;
  }
  const state = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  Sound.setEnabled(state.sound !== false);

  const games = {};
  let current = 'menu';
  let currentGame = null;

  /* ---------------- Navegação ---------------- */
  function show(id) {
    if (currentGame && games[currentGame]) { try { games[currentGame].leave(); } catch (e) { console.error(e); } }
    currentGame = null;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    const screenId = /^g[123]$/.test(id) ? 'game' + id.charAt(1) : id;
    $$('.screen').forEach(function (s) { s.classList.toggle('active', s.id === screenId); });
    current = id;
    if (id === 'menu') { renderMenu(); startMenuAnim(); } else stopMenuAnim();
    if (id === 'final') startFinal(); else stopFinal();
    if (games[id]) {
      currentGame = id;
      requestAnimationFrame(function () {
        fitAll();
        if (current === id) { games[id].enter(); syncTools(); }
      });
    }
  }
  function goMenu() {
    show('menu');
    if (allDone() && !state.finalSeen) {
      setTimeout(function () { if (current === 'menu') show('final'); }, 900);
    }
  }
  function allDone() { return IDS.every(function (k) { return state.done[k]; }); }
  function complete(id) {
    if (state.done[id]) return false;
    state.done[id] = true; save(); return true;
  }
  function register(id, api) { games[id] = api; }

  /* ---------------- Ajuste do canvas à tela ---------------- */
  function fit(stage) {
    const cv = $('canvas.game-canvas', stage);
    if (!cv) return;
    const r = stage.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    const s = Math.min(r.width / cv.width, r.height / cv.height);
    cv.style.width = Math.floor(cv.width * s) + 'px';
    cv.style.height = Math.floor(cv.height * s) + 'px';
  }
  function fitAll() { $$('.stage').forEach(fit); }
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(function (entries) { entries.forEach(function (e) { fit(e.target); }); });
    $$('.stage').forEach(function (st) { ro.observe(st); });
  }
  window.addEventListener('resize', fitAll);
  window.addEventListener('orientationchange', function () { setTimeout(fitAll, 250); });

  /* ---------------- Sobreposições ---------------- */
  function overlay(stageId, o) {
    const st = document.getElementById(stageId);
    let ov = $('.overlay', st);
    if (!ov) { ov = document.createElement('div'); ov.className = 'overlay'; st.appendChild(ov); }
    ov.innerHTML = '';
    const box = document.createElement('div');
    box.className = 'ov-box';
    if (o.emoji) { const e = document.createElement('div'); e.className = 'ov-emoji'; e.textContent = o.emoji; box.appendChild(e); }
    if (o.node) box.appendChild(o.node);
    if (o.title) { const h = document.createElement('h3'); h.textContent = o.title; box.appendChild(h); }
    if (o.text) {
      String(o.text).split('\n').forEach(function (line) {
        const p = document.createElement('p'); p.textContent = line; box.appendChild(p);
      });
    }
    if (o.buttons && o.buttons.length) {
      const row = document.createElement('div'); row.className = 'ov-btns';
      o.buttons.forEach(function (b) {
        const bt = document.createElement('button');
        bt.className = 'btn' + (b.cls ? ' ' + b.cls : '');
        bt.textContent = b.label;
        bt.addEventListener('click', function () { Sound.unlock(); Sound.play('click'); if (b.fn) b.fn(); });
        row.appendChild(bt);
      });
      box.appendChild(row);
    }
    ov.appendChild(box);
    ov.classList.add('show');
  }
  function hideOverlay(stageId) {
    const st = document.getElementById(stageId);
    const ov = $('.overlay', st);
    if (ov) ov.classList.remove('show');
  }

  /* ---------------- Botões de toque (segurar) ---------------- */
  function hold(el, set) {
    function down(e) {
      e.preventDefault();
      el.classList.add('down');
      try { el.setPointerCapture(e.pointerId); } catch (x) {}
      Sound.unlock();
      set(true);
    }
    function up() { if (el.classList.contains('down')) { el.classList.remove('down'); set(false); } }
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  let toastTimer = 0;
  function toast(msg, ms) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, ms || 2200);
  }

  /* ---------------- Barra de ferramentas (pausa / reiniciar / som) ---------------- */
  function syncTools() {
    $$('[data-act="sound"]').forEach(function (b) { b.textContent = Sound.isEnabled() ? '🔊' : '🔇'; });
    if (currentGame && games[currentGame]) {
      const sc = document.getElementById(currentGame);
      const pb = $('[data-act="pause"]', sc);
      if (pb) pb.textContent = games[currentGame].isPaused() ? '▶' : '⏸';
    }
  }
  $$('[data-act]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      Sound.unlock();
      const act = btn.dataset.act;
      if (act === 'menu') { Sound.play('click'); goMenu(); return; }
      if (act === 'sound') {
        state.sound = !Sound.isEnabled(); Sound.setEnabled(state.sound); save(); syncTools();
        if (state.sound) Sound.play('click');
        return;
      }
      const g = currentGame && games[currentGame];
      if (!g) return;
      if (act === 'pause') g.togglePause();
      if (act === 'restart') g.restart();
      syncTools();
      btn.blur();
    });
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden && currentGame && games[currentGame]) { games[currentGame].pause(true); syncTools(); }
  });
  window.addEventListener('keydown', function (e) {
    Sound.unlock();
    if (currentGame && games[currentGame] && (e.key === 'p' || e.key === 'P' || e.key === 'Escape')) {
      games[currentGame].togglePause(); syncTools();
    }
  });
  window.addEventListener('pointerdown', function () { Sound.unlock(); }, { passive: true });

  /* ---------------- Menu ---------------- */
  function buildTitle() {
    const h = $('#title');
    h.innerHTML = '';
    let i = 0;
    String(CFG.siteTitle).split(' ').forEach(function (word) {
      const w = document.createElement('span'); w.className = 'w';
      Array.from(word).forEach(function (ch) {
        const c = document.createElement('span'); c.className = 'c'; c.textContent = ch;
        c.style.animationDelay = (i * 0.07) + 's'; i++; w.appendChild(c);
      });
      h.appendChild(w); h.appendChild(document.createTextNode(' '));
    });
  }
  function bgHearts() {
    const box = $('#bg-hearts'), sy = ['❤', '💗', '💕', '♥'];
    for (let i = 0; i < 20; i++) {
      const s = document.createElement('span');
      s.textContent = sy[i % 4];
      s.style.left = (Math.random() * 100) + '%';
      s.style.fontSize = (14 + Math.random() * 26) + 'px';
      s.style.animationDuration = (10 + Math.random() * 12) + 's';
      s.style.animationDelay = (-Math.random() * 20) + 's';
      s.style.opacity = (0.22 + Math.random() * 0.3).toFixed(2);
      box.appendChild(s);
    }
  }
  function renderMenu() {
    const n = IDS.filter(function (k) { return state.done[k]; }).length;
    $('#progressText').textContent = n + '/3 jogos concluídos';
    $$('#progressHearts .ph').forEach(function (el, i) { el.classList.toggle('on', !!state.done[IDS[i]]); });
    $$('.card[data-game]').forEach(function (c) {
      const k = c.dataset.game;
      c.classList.toggle('done', !!state.done[k]);
      $('.badge', c).textContent = '✔ Concluído';
    });
    $('#rec1').textContent = 'Recorde: ' + (state.hi1 || 0);
    $('#rec2').textContent = 'Presentes: ' + state.prizes.length + '/' + CFG.game2.prizes.length;
    $('#rec3').textContent = 'Melhor: ' + (state.hi3 || 0);
    const all = n === 3;
    $('#finalBtn').disabled = !all;
    $('#finalCard').classList.toggle('locked', !all);
    $('.lock', $('#finalCard')).textContent = all ? '💌' : '🔒';
    $('#finalHint').textContent = all ? 'Sua surpresa está liberada! 💌' : 'Conclua os 3 jogos para liberar a surpresa final.';
  }
  $$('[data-play]').forEach(function (b) {
    b.addEventListener('click', function () { Sound.unlock(); Sound.play('click'); show(b.dataset.play); });
  });
  $('#finalBtn').addEventListener('click', function () { if (allDone()) show('final'); });
  $('#finalBack').addEventListener('click', function () { Sound.play('click'); show('menu'); });
  $('#resetAll').addEventListener('click', function () {
    if (!confirm('Apagar todo o progresso salvo (recordes, presentes e jogos concluídos)?')) return;
    const fresh = defaults(); fresh.sound = state.sound;
    Object.keys(state).forEach(function (k) { delete state[k]; });
    Object.assign(state, fresh); save(); renderMenu();
    toast('Progresso apagado.');
  });

  /* ---------------- Ilustrações em pixel art ---------------- */
  let menuRaf = 0;
  function drawCouple(ctx, w, h, t) {
    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false;
    // chão fofo
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath(); ctx.ellipse(w / 2, h - 12, 100, 11, 0, 0, Math.PI * 2); ctx.fill();
    const bob = Math.round(Math.sin(t * 2.4) * 2);
    Sprites.drawFeet(ctx, 'isa0', w / 2 - 38, h - 14 + bob, 6, false);
    Sprites.drawFeet(ctx, 'manu0', w / 2 + 38, h - 14 - bob, 6, true);
    const s = 1 + Math.sin(t * 4) * 0.08;
    Sprites.drawCenter(ctx, 'heart', w / 2, 34 + Math.round(Math.sin(t * 3) * 3), Math.round(5 * s), false);
  }
  function startMenuAnim() {
    if (menuRaf) return;
    const cv = $('#coupleCv'), ctx = cv.getContext('2d');
    if (!ctx) return;
    (function loop(ts) {
      menuRaf = requestAnimationFrame(loop);
      drawCouple(ctx, cv.width, cv.height, ts / 1000);
    })(performance.now());
  }
  function stopMenuAnim() { if (menuRaf) { cancelAnimationFrame(menuRaf); menuRaf = 0; } }

  function drawArt(cv) {
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const w = cv.width, h = cv.height, k = cv.dataset.art;
    ctx.imageSmoothingEnabled = false;
    if (k === '1') {
      const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffb98a'); g.addColorStop(1, '#ff8fb8');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff1a8'; ctx.beginPath(); ctx.arc(170, 70, 30, 0, 7); ctx.fill();
      ctx.fillStyle = '#ff9fbe'; ctx.fillRect(0, h - 22, w, 22);
      Sprites.drawFeet(ctx, 'isa0', 100, h - 8, 3, false);
      [[40, 24, 'heart', 2], [200, 22, 'gold', 2], [150, 50, 'heart', 2], [60, 70, 'heart', 2], [215, 90, 'heart', 2]].forEach(function (a) {
        Sprites.drawCenter(ctx, a[2], a[0], a[1], a[3], false);
      });
    } else if (k === '2') {
      const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffe3f0'); g.addColorStop(1, '#e2d8ff');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ff9ec7'; ctx.fillRect(60, 6, 120, 120);
      ctx.strokeStyle = '#4a2c5a'; ctx.lineWidth = 3; ctx.strokeRect(60, 6, 120, 120);
      ctx.fillStyle = '#fff6fb'; ctx.fillRect(70, 22, 100, 70);
      ctx.fillStyle = '#6b4a8a'; ctx.fillRect(70, 92, 100, 28);
      // prêmios
      const cols = ['#c98b5b', '#ff5c93', '#ffd23f', '#9ad7ff', '#b9b2d8'];
      cols.forEach(function (c, i) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(88 + i * 18, 78, 9, 0, 7); ctx.fill(); ctx.stroke(); });
      // garra
      ctx.strokeStyle = '#8a7aa0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(130, 22); ctx.lineTo(130, 46); ctx.stroke();
      ctx.strokeStyle = '#4a2c5a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(130, 46); ctx.lineTo(118, 62); ctx.lineTo(124, 66); ctx.moveTo(130, 46); ctx.lineTo(142, 62); ctx.lineTo(136, 66); ctx.stroke();
      Sprites.drawCenter(ctx, 'heart', 30, 40, 3, false);
      Sprites.drawCenter(ctx, 'gold', 210, 60, 3, false);
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1b1035'); g.addColorStop(1, '#3a1a5e');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff'; [[20, 14], [90, 30], [200, 12], [160, 40], [230, 60]].forEach(function (p) { ctx.fillRect(p[0], p[1], 2, 2); });
      function girder(x1, y1, x2, y2) {
        ctx.fillStyle = '#ff6b9d'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x2, y2 + 6); ctx.lineTo(x1, y1 + 6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffb3cf'; ctx.fillRect(x1, y1 - 1, x2 - x1, 1);
      }
      girder(0, 30, 130, 30); girder(20, 66, 240, 58); girder(0, 100, 220, 112);
      ctx.fillStyle = '#7fe3ff'; ctx.fillRect(190, 60, 2, 40); ctx.fillRect(200, 60, 2, 40);
      for (let y = 64; y < 100; y += 6) ctx.fillRect(190, y, 12, 1);
      Sprites.drawFeet(ctx, 'boss', 40, 30, 2, false);
      Sprites.drawFeet(ctx, 'manu0', 120, 30, 1, false);
      Sprites.drawFeet(ctx, 'isa0', 100, 112, 2, false);
      ctx.fillStyle = '#c9763a'; ctx.strokeStyle = '#6b3a1e'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(60, 56, 6, 0, 7); ctx.fill(); ctx.stroke();
    }
  }
  $$('canvas.art').forEach(drawArt);

  /* ---------------- Tela final ---------------- */
  let finalRaf = 0, finalTimer = 0, finalParts = [];
  function startFinal() {
    state.finalSeen = true; save();
    $('#finalTitle').textContent = CFG.finalTitle;
    const el = $('#finalText'); el.textContent = '';
    const full = CFG.finalText; let i = 0;
    clearInterval(finalTimer);
    finalTimer = setInterval(function () {
      i += 1; el.textContent = full.slice(0, i);
      if (i >= full.length) clearInterval(finalTimer);
    }, 32);
    Sound.play('win');
    const cv = $('#finalCv'), ctx = cv.getContext('2d');
    if (!ctx || finalRaf) return;
    finalParts = [];
    (function loop(ts) {
      finalRaf = requestAnimationFrame(loop);
      const t = ts / 1000, w = cv.width, h = cv.height;
      ctx.clearRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = false;
      if (Math.random() < 0.22) finalParts.push({ x: 20 + Math.random() * (w - 40), y: h - 20, vy: 30 + Math.random() * 50, s: 1 + Math.floor(Math.random() * 3), gold: Math.random() < 0.2, ph: Math.random() * 6, a: 1 });
      finalParts = finalParts.filter(function (p) { return p.y > -20; });
      finalParts.forEach(function (p) {
        p.y -= p.vy * 0.016; p.x += Math.sin(t * 2 + p.ph) * 0.4;
        Sprites.drawCenter(ctx, p.gold ? 'gold' : 'heart', p.x, p.y, p.s, false);
      });
      ctx.fillStyle = 'rgba(255,255,255,.6)';
      ctx.beginPath(); ctx.ellipse(w / 2, h - 18, 130, 12, 0, 0, Math.PI * 2); ctx.fill();
      const bob = Math.round(Math.sin(t * 2.6) * 3);
      Sprites.drawFeet(ctx, 'isa0', w / 2 - 54, h - 20 + bob, 8, false);
      Sprites.drawFeet(ctx, 'manu0', w / 2 + 54, h - 20 - bob, 8, true);
      const s = 1 + Math.sin(t * 4) * 0.1;
      Sprites.drawCenter(ctx, 'heart', w / 2, 70 + Math.round(Math.sin(t * 3) * 4), Math.round(9 * s), false);
    })(performance.now());
  }
  function stopFinal() {
    clearInterval(finalTimer);
    if (finalRaf) { cancelAnimationFrame(finalRaf); finalRaf = 0; }
  }

  /* ---------------- API pública ---------------- */
  window.App = {
    state: state, save: save, register: register, show: show, goMenu: goMenu,
    complete: complete, allDone: allDone, overlay: overlay, hideOverlay: hideOverlay,
    hold: hold, toast: toast, syncTools: syncTools, fit: fitAll
  };

  /* ---------------- Início ---------------- */
  function init() {
    buildTitle(); bgHearts(); renderMenu(); startMenuAnim(); syncTools(); fitAll();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
