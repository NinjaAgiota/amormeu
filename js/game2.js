/* JOGO 2 — MÁQUINA DE PRESENTES 🎁 : garra de fliperama com física simples. */
(function () {
  'use strict';
  const W = 480, H = 640, STAGE = 'stage2';
  const cv = document.getElementById('cv2');
  const ctx = cv.getContext('2d');
  const C = window.CONFIG.game2;
  const clamp = Gfx.clamp;
  const INK = '#4a2c5a';

  // Geometria da máquina
  const GL = 44, GR = 436, GT = 96, GB = 432;   // vidro (esquerda, direita, topo, base)
  const FLOOR = 420;                             // chão onde os presentes ficam
  const RAIL = 112, REST = 146;                  // trilho e altura de descanso do pulso da garra
  const CHUTE = 88, TIPOFF = 42;                 // x da saída e distância pulso→ponta
  const DOOR_Y = 478;                            // altura em que o presente "entra" na porta

  const RAD = { teddy: 27, heart: 26, flower: 25, star: 25, gift: 27, cat: 26, bunny: 26, cupcake: 25, coin: 20 };
  const keys = { left: false, right: false };
  let raf = 0, last = 0, paused = false, blocked = false, active = false, S = null;

  /* ---------------- Desenho dos presentes ---------------- */
  function circ(c, x, y, r, fill, stroke) {
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = INK; c.lineWidth = 2; c.stroke(); }
  }
  function drawPrize(c, type, x, y, r) {
    c.save();
    c.lineJoin = 'round'; c.lineCap = 'round';
    if (type === 'teddy') {
      circ(c, x - r * 0.52, y - r * 0.82, r * 0.3, '#c98b5b', true);
      circ(c, x + r * 0.52, y - r * 0.82, r * 0.3, '#c98b5b', true);
      circ(c, x, y + r * 0.25, r * 0.78, '#c98b5b', true);
      circ(c, x, y - r * 0.38, r * 0.66, '#d9a06c', true);
      circ(c, x, y - r * 0.25, r * 0.3, '#f1cfa4', true);
      circ(c, x - r * 0.25, y - r * 0.5, r * 0.07, INK); circ(c, x + r * 0.25, y - r * 0.5, r * 0.07, INK);
      circ(c, x, y - r * 0.3, r * 0.08, INK);
      c.fillStyle = '#ff7fae'; c.beginPath(); c.moveTo(x, y + r * 0.1); c.lineTo(x - r * 0.3, y); c.lineTo(x - r * 0.3, y + r * 0.22); c.closePath();
      c.moveTo(x, y + r * 0.1); c.lineTo(x + r * 0.3, y); c.lineTo(x + r * 0.3, y + r * 0.22); c.closePath(); c.fill();
    } else if (type === 'heart') {
      Gfx.heartPath(c, x, y, r * 1.1); c.fillStyle = '#ff5c93'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
      circ(c, x - r * 0.42, y - r * 0.25, r * 0.13, '#ffd0e0');
    } else if (type === 'flower') {
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        circ(c, x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.38, '#ff9ecb', true);
      }
      circ(c, x, y, r * 0.32, '#ffe066', true);
    } else if (type === 'star') {
      c.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 === 0 ? r : r * 0.48;
        const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
        if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.closePath(); c.fillStyle = '#ffd23f'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
      circ(c, x - r * 0.18, y, r * 0.06, INK); circ(c, x + r * 0.18, y, r * 0.06, INK);
    } else if (type === 'gift') {
      c.fillStyle = '#9ad7ff'; c.fillRect(x - r * 0.8, y - r * 0.35, r * 1.6, r * 1.15); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(x - r * 0.8, y - r * 0.35, r * 1.6, r * 1.15);
      c.fillStyle = '#7cc4f5'; c.fillRect(x - r * 0.9, y - r * 0.62, r * 1.8, r * 0.34); c.strokeRect(x - r * 0.9, y - r * 0.62, r * 1.8, r * 0.34);
      c.fillStyle = '#ff5c93'; c.fillRect(x - r * 0.12, y - r * 0.62, r * 0.24, r * 1.42);
      circ(c, x - r * 0.28, y - r * 0.8, r * 0.22, '#ff5c93', true); circ(c, x + r * 0.28, y - r * 0.8, r * 0.22, '#ff5c93', true);
    } else if (type === 'cat') {
      c.fillStyle = '#b9b2d8';
      c.beginPath(); c.moveTo(x - r * 0.85, y - r * 0.2); c.lineTo(x - r * 0.7, y - r * 1.0); c.lineTo(x - r * 0.15, y - r * 0.6); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(x + r * 0.85, y - r * 0.2); c.lineTo(x + r * 0.7, y - r * 1.0); c.lineTo(x + r * 0.15, y - r * 0.6); c.closePath(); c.fill(); c.stroke();
      circ(c, x, y, r * 0.88, '#c9c3e6', true);
      circ(c, x - r * 0.33, y - r * 0.1, r * 0.1, INK); circ(c, x + r * 0.33, y - r * 0.1, r * 0.1, INK);
      circ(c, x, y + r * 0.15, r * 0.1, '#ff7fae');
      c.strokeStyle = INK; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(x - r * 0.5, y + r * 0.2); c.lineTo(x - r * 1.0, y + r * 0.12); c.moveTo(x - r * 0.5, y + r * 0.32); c.lineTo(x - r * 1.0, y + r * 0.4);
      c.moveTo(x + r * 0.5, y + r * 0.2); c.lineTo(x + r * 1.0, y + r * 0.12); c.moveTo(x + r * 0.5, y + r * 0.32); c.lineTo(x + r * 1.0, y + r * 0.4); c.stroke();
    } else if (type === 'bunny') {
      [-1, 1].forEach(function (s) {
        c.beginPath(); c.ellipse(x + s * r * 0.38, y - r * 0.95, r * 0.2, r * 0.6, s * 0.12, 0, Math.PI * 2); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
        c.beginPath(); c.ellipse(x + s * r * 0.38, y - r * 0.95, r * 0.09, r * 0.4, s * 0.12, 0, Math.PI * 2); c.fillStyle = '#ffc2d9'; c.fill();
      });
      circ(c, x, y + r * 0.05, r * 0.82, '#ffffff', true);
      circ(c, x - r * 0.3, y - r * 0.05, r * 0.09, INK); circ(c, x + r * 0.3, y - r * 0.05, r * 0.09, INK);
      circ(c, x, y + r * 0.2, r * 0.1, '#ff7fae');
      circ(c, x - r * 0.45, y + r * 0.22, r * 0.12, 'rgba(255,127,174,.5)'); circ(c, x + r * 0.45, y + r * 0.22, r * 0.12, 'rgba(255,127,174,.5)');
    } else if (type === 'cupcake') {
      c.fillStyle = '#e9b27c';
      c.beginPath(); c.moveTo(x - r * 0.7, y + r * 0.1); c.lineTo(x + r * 0.7, y + r * 0.1); c.lineTo(x + r * 0.5, y + r * 0.85); c.lineTo(x - r * 0.5, y + r * 0.85); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
      circ(c, x - r * 0.42, y - r * 0.05, r * 0.38, '#ffb3cf', true); circ(c, x + r * 0.42, y - r * 0.05, r * 0.38, '#ffb3cf', true);
      circ(c, x, y - r * 0.38, r * 0.5, '#ffc2d9', true);
      circ(c, x, y - r * 0.92, r * 0.16, '#ff4f6b', true);
    } else if (type === 'coin') {
      circ(c, x, y, r, '#ffd23f', true);
      circ(c, x, y, r * 0.72, '#ffe98a', true);
      Gfx.heartPath(c, x, y, r * 0.5); c.fillStyle = '#ff5c93'; c.fill();
    }
    c.restore();
  }

  /* ---------------- Estado da máquina ---------------- */
  function mk(def, coin) {
    const r = RAD[def.type] || 26;
    return { id: def.id, type: def.type, def: def, coin: coin, diff: def.difficulty || 0.3, r: r,
             baseX: 0, x: 0, y: 0, rest: 0, vy: 0, ph: Math.random() * 6, carried: false, drop: false };
  }
  function wob(p) { return p.diff >= 0.6 ? Math.sin(S.time * 0.9 + p.ph) * 14 : 0; }

  function resettle() {
    const list = S.prizes.filter(function (p) { return !p.carried && !p.drop; }).sort(function (a, b) { return b.y - a.y; });
    const done = [];
    list.forEach(function (p) {
      let y = FLOOR - p.r;
      done.forEach(function (o) {
        const dx = Math.abs(p.baseX - o.baseX), lim = (p.r + o.r) * 0.9;
        if (dx < lim) { const yy = o.rest - Math.sqrt(lim * lim - dx * dx); if (yy < y) y = yy; }
      });
      p.rest = y; done.push(p);
    });
  }
  function createMachine() {
    const have = App.state.prizes;
    const list = C.prizes.filter(function (d) { return have.indexOf(d.id) < 0; }).map(function (d) { return mk(d, false); });
    for (let i = 0; i < 2; i++) list.push(mk({ id: 'coin' + i, type: 'coin', difficulty: 0.1 }, true));
    for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = list[i]; list[i] = list[j]; list[j] = t; }
    const minX = GL + 92, maxX = GR - 8, n = list.length, span = maxX - minX;
    list.forEach(function (p, i) {
      const cx = minX + (i + 0.5) / n * span + (Math.random() - 0.5) * 16;
      p.baseX = clamp(cx, minX + p.r, maxX - p.r);
      p.x = p.baseX; p.y = FLOOR - p.r; p.rest = p.y; p.vy = 0;
    });
    S.prizes = list;
    resettle();
    S.prizes.forEach(function (p) { p.y = p.rest; });
  }
  function spawnCoin() {
    const p = mk({ id: 'coin' + Math.floor(Math.random() * 1e6), type: 'coin', difficulty: 0.1 }, true);
    p.baseX = clamp(GL + 92 + p.r + Math.random() * (GR - GL - 120), GL + 92 + p.r, GR - 8 - p.r);
    p.x = p.baseX; p.y = GT + 24; p.vy = 0;
    S.prizes.push(p); resettle();
  }

  function saveTries() { App.state.tries2 = S.tries; App.save(); }

  function reset(fullTries) {
    const tries = (fullTries || App.state.tries2 == null) ? C.startTries : App.state.tries2;
    S = {
      started: false, time: 0, tries: tries, prizes: [], bonus: null, toastMsg: '', toastT: 0,
      allShown: false, offered: false, tick: 0,
      claw: { x: 260, y: REST, state: 'idle', open: 1, t: 0, cand: null, dx: 0, carry: null, slipY: -1, startY: REST }
    };
    createMachine();
    if (fullTries) saveTries();
  }

  function toast(msg) { S.toastMsg = msg; S.toastT = 2; }

  /* ---------------- Regras da garra ---------------- */
  function pressDrop() {
    if (!S || !S.started || paused || blocked) return;
    if (S.bonus) { resolveBonus(); return; }
    const c = S.claw;
    if (c.state !== 'idle') return;
    if (S.tries <= 0) { offerBonus(); return; }
    S.tries--; saveTries();
    c.state = 'down'; Sound.play('drop');
  }

  function decide() {
    const c = S.claw, p = c.cand;
    let grabbed = false;
    if (p) {
      const err = c.dx / (p.r + 6);                                   // 0 = bem no centro, 1 = na beirada
      const chance = clamp(0.97 - p.diff * 0.5 - err * 0.4, 0.08, 0.97);
      grabbed = Math.random() < chance;
      if (grabbed) {
        c.carry = p; p.carried = true;
        const slip = Math.random() < p.diff * 0.45 * (0.5 + err);      // pode escorregar na subida
        c.slipY = slip ? c.startY - (c.startY - REST) * (0.25 + Math.random() * 0.5) : -1;
        Sound.play('grab');
        resettle();
      }
    }
    if (!grabbed) { toast(p ? 'Escorregou! Tente alinhar melhor.' : 'Pegou só ar...'); Sound.play('fail'); }
    c.state = 'up';
  }

  function updateClaw(dt) {
    const c = S.claw;
    if (c.state === 'idle') {
      if (!blocked && !S.bonus) {
        const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
        if (dir) {
          c.x = clamp(c.x + dir * 150 * dt, GL + 30, GR - 30);
          S.tick -= dt; if (S.tick <= 0) { Sound.play('claw'); S.tick = 0.16; }
        }
      }
    } else if (c.state === 'down') {
      c.y += 170 * dt;
      const tip = c.y + TIPOFF;
      let hit = null, bd = 1e9;
      S.prizes.forEach(function (p) {
        if (p.carried || p.drop) return;
        const dx = Math.abs(p.x - c.x);
        if (dx <= p.r + 6 && tip >= p.y - p.r * 0.55 && dx < bd) { bd = dx; hit = p; }
      });
      if (hit || tip >= FLOOR - 2) {
        c.cand = hit; c.dx = hit ? Math.abs(hit.x - c.x) : 0;
        c.t = 0; c.startY = c.y; c.state = 'close'; Sound.play('claw');
      }
    } else if (c.state === 'close') {
      c.t += dt; c.open = Math.max(0, 1 - c.t / 0.5);
      if (c.t >= 0.55) decide();
    } else if (c.state === 'up') {
      c.y -= (c.carry ? 125 : 210) * dt;
      if (c.carry) {
        c.carry.x = c.x; c.carry.y = c.y + 38;
        if (c.slipY > 0 && c.y <= c.slipY) {
          const p = c.carry;
          p.carried = false; p.baseX = p.x - wob(p); p.vy = 0;
          c.carry = null; c.slipY = -1; resettle();
          toast('Ih... escapou!'); Sound.play('fail');
        }
      }
      if (c.y <= REST) { c.y = REST; c.state = c.carry ? 'toChute' : 'idle'; }
    } else if (c.state === 'toChute') {
      const d = CHUTE - c.x, st = 170 * dt;
      if (Math.abs(d) <= st) { c.x = CHUTE; c.state = 'release'; c.t = 0; } else c.x += Math.sign(d) * st;
      c.carry.x = c.x; c.carry.y = c.y + 38;
    } else if (c.state === 'release') {
      c.t += dt;
      if (c.t >= 0.45) {
        const p = c.carry;
        p.carried = false; p.drop = true; p.vy = 40; c.carry = null; c.state = 'idle';
        Sound.play('drop');
      }
    }
    // abertura da garra
    if (c.state !== 'close') {
      const tgt = c.state === 'release' ? 1 : (c.carry ? 0 : 1);
      c.open += clamp(tgt - c.open, -dt * 3, dt * 3);
    }
  }

  function finishDrop(p) {
    S.prizes = S.prizes.filter(function (q) { return q !== p; });
    resettle();
    if (p.coin) {
      S.tries += C.coinTries; saveTries(); S.offered = false;
      toast('+' + C.coinTries + ' fichas! 🪙'); Sound.play('coin'); spawnCoin();
    } else {
      if (App.state.prizes.indexOf(p.id) < 0) { App.state.prizes.push(p.id); App.save(); }
      if (collectionComplete()) App.complete('g2'); // salva a conclusão mesmo se sair antes de fechar o aviso
      renderCollection(); Sound.play('win');
      showReveal(p.def, true);
    }
  }

  function update(dt) {
    S.time += dt;
    if (S.toastT > 0) S.toastT -= dt;
    S.prizes.slice().forEach(function (p) {
      if (p.carried) return;
      if (p.drop) {
        p.vy += 1100 * dt; p.y += p.vy * dt;
        if (p.y >= DOOR_Y) finishDrop(p);
        return;
      }
      p.x = p.baseX + wob(p);
      if (p.y < p.rest) { p.vy += 1000 * dt; p.y = Math.min(p.rest, p.y + p.vy * dt); if (p.y >= p.rest) p.vy = 0; }
      else p.y = p.rest;
    });
    updateClaw(dt);
    if (S.bonus) {
      const b = S.bonus;
      b.m += b.dir * 300 * dt;
      if (b.m >= 1) { b.m = 1; b.dir = -1; } else if (b.m <= 0) { b.m = 0; b.dir = 1; }
    }
    // acabou as fichas? oferece o bônus
    if (S.tries > 0) S.offered = false;
    if (S.tries <= 0 && !S.offered && !S.bonus && !blocked && S.claw.state === 'idle' &&
        !S.prizes.some(function (p) { return p.drop || p.carried; })) {
      S.offered = true; offerBonus();
    }
  }

  /* ---------------- Ficha bônus (barrinha de timing) ---------------- */
  function offerBonus() {
    blocked = true;
    App.overlay(STAGE, {
      emoji: '🪙', title: 'Acabaram as fichas!', text: C.noTriesText,
      buttons: [
        { label: 'Pedir uma ficha 🪙', cls: 'primary', fn: startBonus },
        { label: 'Voltar ao menu', fn: function () { App.goMenu(); } }
      ]
    });
  }
  function startBonus() {
    App.hideOverlay(STAGE); blocked = false;
    const zw = 0.16 + Math.random() * 0.06;
    S.bonus = { m: 0, dir: 1, zc: 0.25 + Math.random() * 0.5, zw: zw };
  }
  function resolveBonus() {
    const b = S.bonus;
    const hit = Math.abs(b.m - b.zc) <= b.zw / 2;
    const gain = hit ? 2 : 1;
    S.tries += gain; saveTries(); S.offered = false; S.bonus = null;
    toast(hit ? 'Perfeito! +2 fichas 💗' : 'Quase! O Manu deu +1 ficha 💕');
    Sound.play(hit ? 'coin' : 'collect');
  }

  /* ---------------- Telas: início, pausa, presente, conclusão ---------------- */
  function showStart() {
    blocked = true;
    App.overlay(STAGE, {
      emoji: '🎁', title: 'Máquina de Presentes',
      text: 'Mova a garra com ← → (ou A D) e aperte ESPAÇO / PEGAR para descer.\nQuanto mais bem alinhada, maior a chance de pegar. Presentes difíceis balançam e escorregam!\nCada presente revela uma surpresa. Pegue as moedas douradas para ganhar fichas.',
      buttons: [{ label: 'Jogar ▶', cls: 'primary', fn: function () { App.hideOverlay(STAGE); S.started = true; blocked = false; paused = false; App.syncTools(); } }]
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
  function collectionComplete() {
    return C.prizes.every(function (p) { return App.state.prizes.indexOf(p.id) >= 0; });
  }
  function showReveal(def, fresh) {
    blocked = true;
    const wrap = document.createElement('div');
    const pc = document.createElement('canvas');
    pc.width = pc.height = 110; pc.className = 'ov-prize';
    const x = pc.getContext('2d');
    if (x) drawPrize(x, def.type, 55, 60, 38);
    wrap.appendChild(pc);
    const tag = document.createElement('div'); tag.className = 'ov-tag'; tag.textContent = def.kind;
    wrap.appendChild(tag);
    App.overlay(STAGE, {
      node: wrap, title: def.name, text: def.text,
      buttons: [{ label: fresh ? 'Guardar na coleção 💝' : 'Fechar', cls: 'primary', fn: function () { closeReveal(fresh); } }]
    });
  }
  function closeReveal(fresh) {
    App.hideOverlay(STAGE); blocked = false;
    if (fresh && collectionComplete() && !S.allShown) { S.allShown = true; showAll(); }
  }
  function showAll() {
    blocked = true;
    App.complete('g2'); Sound.play('win');
    App.overlay(STAGE, {
      emoji: '🎁', title: C.allDoneTitle, text: C.allDoneText,
      buttons: [
        { label: 'Ver minha coleção', cls: 'primary', fn: function () { App.hideOverlay(STAGE); blocked = false; } },
        { label: 'Voltar ao menu', fn: function () { App.goMenu(); } }
      ]
    });
  }

  function renderCollection() {
    const box = document.getElementById('collection');
    box.innerHTML = '';
    let n = 0;
    C.prizes.forEach(function (def) {
      const got = App.state.prizes.indexOf(def.id) >= 0;
      if (got) n++;
      const b = document.createElement('button');
      b.className = 'slot' + (got ? ' got' : '');
      b.title = got ? def.name : '???';
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const x = c.getContext('2d');
      if (x) {
        if (got) drawPrize(x, def.type, 32, 34, 22);
        else { x.fillStyle = 'rgba(74,44,90,.35)'; x.font = 'bold 34px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('?', 32, 34); }
      }
      b.appendChild(c);
      b.addEventListener('click', function () {
        if (got && S && S.started && !blocked && !paused) { Sound.play('click'); showReveal(def, false); }
      });
      box.appendChild(b);
    });
    document.getElementById('collCount').textContent = n + '/' + C.prizes.length;
  }

  /* ---------------- Desenho ---------------- */
  function drawClaw() {
    const c = S.claw, x = c.x, y = c.y;
    ctx.strokeStyle = '#8a7aa0'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, RAIL); ctx.lineTo(x, y - 12); ctx.stroke();
    // carrinho no trilho
    ctx.fillStyle = '#ff7fae'; Gfx.rr(ctx, x - 16, RAIL - 9, 32, 18, 5); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    // cabeça
    ctx.fillStyle = '#ffb3cf'; Gfx.rr(ctx, x - 13, y - 14, 26, 16, 5); ctx.fill(); ctx.stroke();
    // garras
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    [-1, 1].forEach(function (s) {
      const a = 0.15 + c.open * 0.65;
      const kx = x + s * (10 + Math.sin(a) * 26), ky = y + Math.cos(a) * 24;
      const tx = x + s * (10 + Math.sin(a) * 26 - 11 + (1 - c.open) * 2), ty = y + TIPOFF;
      ctx.strokeStyle = INK; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(x + s * 9, y); ctx.lineTo(kx, ky); ctx.lineTo(x + s * (Math.abs(kx - x) - 11 > 2 ? (Math.abs(kx - x) - 11) : 2), ty); ctx.stroke();
      ctx.strokeStyle = '#d7d0ea'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x + s * 9, y); ctx.lineTo(kx, ky); ctx.lineTo(x + s * (Math.abs(kx - x) - 11 > 2 ? (Math.abs(kx - x) - 11) : 2), ty); ctx.stroke();
      void tx;
    });
  }

  function drawMachine() {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ffe3f0'); g.addColorStop(1, '#e2d8ff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // gabinete
    ctx.fillStyle = '#ff9ec7'; Gfx.rr(ctx, 16, 14, 448, 612, 22); ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    for (let y = 110; y < 430; y += 34) { circ(ctx, 30, y, 5, 'rgba(255,255,255,.35)'); circ(ctx, 450, y, 5, 'rgba(255,255,255,.35)'); }

    // letreiro
    ctx.fillStyle = '#fff6e8'; Gfx.rr(ctx, 40, 26, 400, 56, 14); ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 30px "Courier New", monospace';
    Gfx.text(ctx, C.machineTitle + ' ❤', 240, 56, '#e8639b', '#4a2c5a', 5);
    for (let i = 0; i < 18; i++) {
      const on = (Math.floor(S.time * 3) + i) % 2 === 0;
      circ(ctx, 52 + i * 22.7, i % 2 ? 31 : 77, 3.5, on ? '#ffe066' : '#f3c9a0');
    }

    // vidro (interior)
    ctx.save();
    ctx.beginPath(); ctx.rect(GL, GT, GR - GL, GB - GT); ctx.clip();
    const bg = ctx.createLinearGradient(0, GT, 0, GB); bg.addColorStop(0, '#fff6fb'); bg.addColorStop(1, '#ffe3f1');
    ctx.fillStyle = bg; ctx.fillRect(GL, GT, GR - GL, GB - GT);
    ctx.fillStyle = 'rgba(255,143,184,.25)';
    for (let y = GT + 20; y < FLOOR; y += 40) for (let x = GL + 20 + ((y / 40) % 2) * 20; x < GR; x += 40) Gfx.heartPath(ctx, x, y, 6), ctx.fill();
    // chão e saída
    ctx.fillStyle = '#cdb8f5'; ctx.fillRect(GL + 88, FLOOR, GR - GL - 88, GB - FLOOR);
    ctx.fillStyle = '#b79ae6'; ctx.fillRect(GL + 88, FLOOR, GR - GL - 88, 4);
    ctx.fillStyle = '#5a3a7a'; ctx.fillRect(GL, FLOOR, 88, GB - FLOOR);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px "Courier New", monospace'; ctx.fillText('SAÍDA ⬇', CHUTE, FLOOR + 14);
    // trilho
    ctx.fillStyle = '#8a7aa0'; ctx.fillRect(GL, RAIL - 4, GR - GL, 8);
    ctx.fillStyle = '#b9aed0'; ctx.fillRect(GL, RAIL - 4, GR - GL, 3);
    // presentes
    S.prizes.forEach(function (p) { if (!p.drop) drawPrize(ctx, p.type, p.x, p.y, p.r); });
    drawClaw();
    ctx.restore();

    // reflexo do vidro
    ctx.fillStyle = 'rgba(255,255,255,.2)';
    ctx.beginPath(); ctx.moveTo(GL + 40, GT); ctx.lineTo(GL + 110, GT); ctx.lineTo(GL + 40, GB); ctx.lineTo(GL - 30, GB); ctx.closePath();
    ctx.save(); ctx.beginPath(); ctx.rect(GL, GT, GR - GL, GB - GT); ctx.clip(); ctx.fill(); ctx.restore();
    ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.strokeRect(GL, GT, GR - GL, GB - GT);

    // painel de controle
    ctx.fillStyle = '#6b4a8a'; Gfx.rr(ctx, 30, 440, 420, 176, 16); ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
    // porta de saída
    ctx.fillStyle = '#2a1a33'; Gfx.rr(ctx, GL, 452, 88, 62, 8); ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#b79ae6'; ctx.font = 'bold 12px "Courier New", monospace'; ctx.fillText('RETIRE AQUI', GL + 44, 534);
    // visor de fichas
    ctx.fillStyle = '#0f0a16'; Gfx.rr(ctx, 150, 452, 150, 64, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7dffb3'; ctx.font = 'bold 13px "Courier New", monospace'; ctx.fillText('FICHAS', 225, 468);
    ctx.font = 'bold 30px "Courier New", monospace'; ctx.fillText(String(S.tries).padStart(2, '0'), 225, 497);
    // joystick e botão (decorativos)
    circ(ctx, 345, 500, 22, '#3a2652', true); ctx.strokeStyle = INK; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(345, 500); ctx.lineTo(345, 474); ctx.stroke(); circ(ctx, 345, 470, 11, '#ff5c93', true);
    circ(ctx, 405, 495, 22, '#c93a62', true); circ(ctx, 405, 493, 16, '#ff5c93');
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillText('◀ ▶ mover   ESPAÇO pegar', 240, 566);
    ctx.fillStyle = '#d9c7ff'; ctx.font = '12px "Courier New", monospace';
    ctx.fillText('presentes difíceis balançam!', 240, 588);

    // presente caindo pela saída (na frente do painel)
    ctx.save(); ctx.beginPath(); ctx.rect(GL, GT, 100, DOOR_Y + 20 - GT); ctx.clip();
    S.prizes.forEach(function (p) { if (p.drop) drawPrize(ctx, p.type, p.x, p.y, p.r); });
    ctx.restore();

    // aviso
    if (S.toastT > 0) {
      ctx.globalAlpha = clamp(S.toastT / 0.4, 0, 1);
      ctx.font = 'bold 16px "Courier New", monospace';
      const tw = ctx.measureText(S.toastMsg).width + 28;
      ctx.fillStyle = 'rgba(255,255,255,.95)'; Gfx.rr(ctx, 240 - tw / 2, GT + 22, tw, 34, 12); ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = INK; ctx.fillText(S.toastMsg, 240, GT + 40);
      ctx.globalAlpha = 1;
    }
    // minijogo da ficha
    if (S.bonus) {
      const b = S.bonus;
      ctx.fillStyle = 'rgba(74,44,90,.55)'; ctx.fillRect(GL, GT, GR - GL, GB - GT);
      ctx.fillStyle = '#fff6e8'; Gfx.rr(ctx, 64, 190, 352, 170, 16); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = INK; ctx.font = 'bold 20px "Courier New", monospace'; ctx.fillText('Peça uma ficha ao Manu! 🪙', 240, 220);
      ctx.font = '13px "Courier New", monospace'; ctx.fillText('Aperte PEGAR / ESPAÇO na zona verde', 240, 245);
      const bx = 90, bw = 300, by = 285;
      ctx.fillStyle = '#e7dff5'; Gfx.rr(ctx, bx, by, bw, 26, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#6ee7a8'; ctx.fillRect(bx + (b.zc - b.zw / 2) * bw, by + 2, b.zw * bw, 22);
      ctx.fillStyle = '#e8639b'; ctx.fillRect(bx + b.m * bw - 3, by - 6, 6, 38);
    }
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  function draw() { if (S) drawMachine(); }

  /* ---------------- Laço de animação ---------------- */
  function loop(t) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, Math.max(0, (t - last) / 1000));
    last = t;
    if (S && S.started && !paused) update(dt);
    draw();
  }
  function startLoop() { if (raf) return; last = performance.now(); raf = requestAnimationFrame(loop); }
  function stopLoop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  /* ---------------- Entrada ---------------- */
  function kd(e) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { keys.left = true; e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') { keys.right = true; e.preventDefault(); }
    else if (k === ' ' || k === 'Enter' || k === 'ArrowDown' || k === 's' || k === 'S') {
      e.preventDefault(); if (!e.repeat) pressDrop();
    }
  }
  function ku(e) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.left = false;
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.right = false;
  }
  Array.prototype.forEach.call(document.querySelectorAll('#touch2 .tbtn'), function (b) {
    App.hold(b, function (v) {
      if (b.dataset.k === 'drop') { if (v) pressDrop(); }
      else keys[b.dataset.k] = v;
    });
  });
  document.getElementById('resetColl').addEventListener('click', function () {
    if (!confirm('Recomeçar a coleção de presentes do zero?')) return;
    App.state.prizes = []; App.save();
    if (S) { S.allShown = false; reset(true); S.started = true; blocked = false; paused = false; App.hideOverlay(STAGE); }
    renderCollection();
  });

  /* ---------------- API ---------------- */
  App.register('g2', {
    enter: function () {
      active = true; paused = false; blocked = false; keys.left = keys.right = false;
      reset(false); renderCollection(); showStart(); startLoop();
      window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    },
    leave: function () {
      active = false; stopLoop(); keys.left = keys.right = false; paused = false; blocked = false;
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
      App.hideOverlay(STAGE);
    },
    restart: function () {
      if (!active) return;
      paused = false; blocked = false; App.hideOverlay(STAGE);
      reset(true); S.started = true; renderCollection();
    },
    pause: function (f) { setPause(!!f); },
    togglePause: function () { setPause(!paused); },
    isPaused: function () { return paused; }
  });
  renderCollection();
})();
