/* JOGO 3 — RESGATE DO MANU 🦍 : plataforma 2D no estilo dos clássicos de arcade. */
(function () {
  'use strict';
  const W = 480, H = 640, STAGE = 'stage3';
  const cv = document.getElementById('cv3');
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const C = window.CONFIG.game3;
  const clamp = Gfx.clamp;
  const INK = '#4a2c5a';

  const G = 1500, WALK = 105, CLIMB = 82, JUMPV = -430, PS = 2; // gravidade, velocidades, escala dos sprites

  /* Plataformas (vigas inclinadas). Cada uma vai do ponto 1 ao ponto 2. */
  const PL = [
    { x1: 0,  y1: 606, x2: 480, y2: 606 },  // 0 chão
    { x1: 0,  y1: 518, x2: 440, y2: 542 },  // 1
    { x1: 40, y1: 446, x2: 480, y2: 422 },  // 2
    { x1: 0,  y1: 326, x2: 440, y2: 350 },  // 3
    { x1: 40, y1: 256, x2: 480, y2: 232 },  // 4
    { x1: 0,  y1: 150, x2: 320, y2: 150 },  // 5 (vilão)
    { x1: 170, y1: 92, x2: 330, y2: 92 }    // 6 (Manu)
  ];
  /* Escadas: broken = quebrada (não leva ao topo — é um caminho errado!) */
  const LD = [
    { x: 100, bot: 0, top: 1, broken: false },
    { x: 360, bot: 0, top: 1, broken: true },
    { x: 380, bot: 1, top: 2, broken: false },
    { x: 140, bot: 1, top: 2, broken: true },
    { x: 90,  bot: 2, top: 3, broken: false },
    { x: 330, bot: 2, top: 3, broken: true },
    { x: 400, bot: 3, top: 4, broken: false },
    { x: 170, bot: 3, top: 4, broken: true },
    { x: 210, bot: 4, top: 5, broken: false },
    { x: 70,  bot: 4, top: 5, broken: true },
    { x: 250, bot: 5, top: 6, broken: false }
  ];
  const ITEM_DEF = [
    { pl: 1, x: 240, t: 'cup' },   { pl: 2, x: 250, t: 'heart' }, { pl: 2, x: 440, t: 'star' },
    { pl: 3, x: 230, t: 'cup' },   { pl: 3, x: 60,  t: 'heart' }, { pl: 4, x: 300, t: 'star' },
    { pl: 4, x: 450, t: 'cup' },   { pl: 5, x: 190, t: 'heart' }
  ];
  const CAGE_X = 308, CAGE_FEET = 92;

  function platY(i, x) { const p = PL[i]; return p.y1 + (p.y2 - p.y1) * ((x - p.x1) / (p.x2 - p.x1)); }
  function dirOf(i) { const p = PL[i]; if (p.y2 > p.y1) return 1; if (p.y2 < p.y1) return -1; return i === 0 ? -1 : 1; }

  const keys = { left: false, right: false, up: false, down: false };
  let raf = 0, last = 0, paused = false, blocked = false, active = false, S = null;

  /* ---------------- Estado ---------------- */
  function resetAll() {
    const stars = [];
    for (let i = 0; i < 60; i++) stars.push({ x: Math.random() * W, y: Math.random() * H * 0.9, tw: Math.random() * 6 });
    S = {
      started: false, score: 0, lives: 3, time: 0, hi: App.state.hi3 || 0, stars: stars,
      items: ITEM_DEF.map(function (d) { return { pl: d.pl, x: d.x, t: d.t, taken: false }; }),
      barrels: [], parts: [], pops: [], bub: { boss: null, manu: null },
      bossT: 2.5, manuT: 1, jumpBuf: 0, act: false, throwT: 2.2, throwing: 0, shake: 0,
      cs: null, over: false, maxPl: 0, player: null, nextBarrelDir: 1
    };
    spawnPlayer();
  }
  function spawnPlayer() {
    S.player = { x: 70, y: PL[0].y1, pl: 0, state: 'ground', vx: 0, vy: 0, face: 1, anim: 0, ladder: -1, inv: 2, dead: 0, spin: 0 };
    S.barrels = []; S.throwT = 2.2; S.throwing = 0; S.maxPl = 0;
  }

  function pop(x, y, text, col) { S.pops.push({ x: x, y: y, text: text, life: 1, col: col || '#fff' }); }
  function puff(x, y, n, cols) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 40 + Math.random() * 120, life = 0.5 + Math.random() * 0.5;
      S.parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, life: life, max: life, col: cols[i % cols.length], s: 2 + (i % 3), heart: Math.random() < 0.4 });
    }
  }
  function addScore(n) {
    S.score += n;
    if (S.score > S.hi) { S.hi = S.score; App.state.hi3 = S.hi; App.save(); }
  }

  /* ---------------- Barris ---------------- */
  function bspeed() { return 86 * (1 + Math.min(0.35, S.time / 300)); }
  function spawnBarrel() {
    S.barrels.push({ x: 98, y: platY(5, 98) - 9, pl: 5, mode: 'roll', dir: 1, r: 9, rot: 0, vx: 0, vy: 0, skip: {}, jumped: false, ld: null });
  }
  function updateBarrels(dt) {
    const sp = bspeed();
    for (let i = S.barrels.length - 1; i >= 0; i--) {
      const b = S.barrels[i];
      if (b.mode === 'roll') {
        const prev = b.x;
        b.x += b.dir * sp * dt;
        b.rot += b.dir * sp * dt / b.r;
        const p = PL[b.pl];
        b.y = platY(b.pl, clamp(b.x, p.x1, p.x2)) - b.r;
        // algumas vezes o barril desce por uma escada inteira
        for (let k = 0; k < LD.length; k++) {
          const L = LD[k];
          if (L.broken || L.top !== b.pl || b.skip[L.x]) continue;
          if ((prev - L.x) * (b.x - L.x) <= 0) {
            b.skip[L.x] = true;
            if (Math.random() < 0.22) { b.mode = 'ladder'; b.ld = L; b.x = L.x; }
          }
        }
        if (b.mode === 'roll' && (b.x < p.x1 || b.x > p.x2)) { b.mode = 'fall'; b.vy = 0; b.vx = b.dir * 60; }
        if (b.mode === 'roll' && b.pl === 0 && b.x < 54) { puff(54, PL[0].y1 - 14, 8, ['#ffb347', '#ff6b6b']); S.barrels.splice(i, 1); continue; }
      } else if (b.mode === 'fall') {
        b.vy += G * 0.8 * dt;
        const py = b.y;
        b.y += b.vy * dt; b.x += b.vx * dt; b.rot += dt * 8;
        let best = -1;
        for (let k = 0; k < PL.length - 1; k++) {
          const p = PL[k];
          if (b.x >= p.x1 && b.x <= p.x2) {
            const gy = platY(k, b.x) - b.r;
            if (py <= gy + 4 && b.y >= gy && (best < 0 || gy < platY(best, b.x) - b.r)) best = k;
          }
        }
        if (best >= 0) { b.mode = 'roll'; b.pl = best; b.y = platY(best, b.x) - b.r; b.dir = dirOf(best); b.vy = 0; b.skip = {}; }
        else if (b.y > H + 40) { S.barrels.splice(i, 1); continue; }
      } else if (b.mode === 'ladder') {
        b.y += 100 * dt; b.rot += dt * 6;
        const ty = platY(b.ld.bot, b.ld.x) - b.r;
        if (b.y >= ty) { b.y = ty; b.mode = 'roll'; b.pl = b.ld.bot; b.dir = dirOf(b.pl); b.skip = {}; }
      }
    }
  }

  /* ---------------- Jogadora ---------------- */
  function findLadderUp(P) {
    let best = -1, bd = 13;
    LD.forEach(function (L, k) { const d = Math.abs(P.x - L.x); if (L.bot === P.pl && d <= bd) { bd = d; best = k; } });
    return best;
  }
  function findLadderDown(P) {
    let best = -1, bd = 13;
    LD.forEach(function (L, k) { const d = Math.abs(P.x - L.x); if (L.top === P.pl && !L.broken && d <= bd) { bd = d; best = k; } });
    return best;
  }
  function updatePlayer(dt) {
    const P = S.player;
    if (P.inv > 0) P.inv -= dt;
    const mx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    if (P.state === 'ground') {
      if (mx) { P.face = mx; P.anim += dt * 8; }
      P.x += mx * WALK * dt;
      const pl = PL[P.pl];
      P.x = clamp(P.x, pl.x1 + 6, pl.x2 - 6);
      P.y = platY(P.pl, P.x);
      if (S.jumpBuf > 0) {
        S.jumpBuf = 0; P.vy = JUMPV; P.state = 'air'; Sound.play('jump');
      } else if (keys.up) {
        const k = findLadderUp(P);
        if (k >= 0) { P.state = 'ladder'; P.ladder = k; P.x = LD[k].x; P.vy = 0; }
      } else if (keys.down) {
        const k = findLadderDown(P);
        if (k >= 0) { P.state = 'ladder'; P.ladder = k; P.x = LD[k].x; P.y = platY(LD[k].top, LD[k].x) + 3; P.vy = 0; }
      }
    } else if (P.state === 'air') {
      if (mx) P.face = mx;
      P.x = clamp(P.x + mx * WALK * dt, 10, W - 10);
      P.vy += G * dt;
      const prevY = P.y;
      P.y += P.vy * dt;
      if (P.vy > 0) {
        let best = -1;
        for (let i = 0; i < PL.length; i++) {
          const p = PL[i];
          if (P.x >= p.x1 && P.x <= p.x2) {
            const gy = platY(i, P.x);
            if (prevY <= gy + 3 && P.y >= gy && (best < 0 || gy < platY(best, P.x))) best = i;
          }
        }
        if (best >= 0) { P.state = 'ground'; P.pl = best; P.y = platY(best, P.x); P.vy = 0; Sound.play('land'); }
      }
      if (P.y > H + 80) { P.state = 'ground'; P.pl = 0; P.x = 70; P.y = PL[0].y1; }
    } else if (P.state === 'ladder') {
      const L = LD[P.ladder];
      const my = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
      P.y += my * CLIMB * dt; P.anim += Math.abs(my) * dt * 8;
      const yTop = platY(L.top, L.x), yBot = platY(L.bot, L.x);
      const limit = L.broken ? yTop + 38 : yTop;
      if (P.y <= limit) {
        if (!L.broken) { P.state = 'ground'; P.pl = L.top; P.y = yTop; } else P.y = limit;
      }
      if (P.y >= yBot) { P.state = 'ground'; P.pl = L.bot; P.y = yBot; }
    }
    // subir de nível dá pontos
    if (P.state === 'ground' && P.pl > S.maxPl) {
      S.maxPl = P.pl; addScore(150); pop(P.x, P.y - 44, '+150', '#7fe3ff'); Sound.play('point');
    }
  }

  function barrelHits() {
    const P = S.player;
    const x0 = P.x - 9, x1 = P.x + 9, y0 = P.y - 34, y1 = P.y;
    return S.barrels.some(function (b) {
      const cx = clamp(b.x, x0, x1), cy = clamp(b.y, y0, y1), dx = b.x - cx, dy = b.y - cy;
      return dx * dx + dy * dy < (b.r - 1) * (b.r - 1);
    });
  }
  function jumpOvers() {
    const P = S.player;
    if (P.state !== 'air') return;
    S.barrels.forEach(function (b) {
      if (b.mode !== 'roll' || b.jumped) return;
      const top = b.y - b.r;
      if (Math.abs(b.x - P.x) < 16 && P.y <= top + 2 && P.y > top - 46) {
        b.jumped = true; addScore(100); pop(P.x, P.y - 40, '+100', '#ffe066'); Sound.play('point');
      }
    });
  }
  function die() {
    const P = S.player;
    P.dead = 1.3; P.vy = -300; P.spin = 0; P.state = 'dead';
    S.lives--; Sound.play('hit');
    puff(P.x, P.y - 20, 14, ['#ff5c93', '#ffe066', '#fff']);
  }
  function collectItems() {
    const P = S.player;
    S.items.forEach(function (it) {
      if (it.taken) return;
      const iy = platY(it.pl, it.x) - 14;
      if (Math.abs(it.x - P.x) < 18 && Math.abs(iy - (P.y - 18)) < 26) {
        it.taken = true; addScore(200); Sound.play('gold');
        pop(it.x, iy - 12, '+200', '#ffe066'); puff(it.x, iy, 10, ['#ffe066', '#ff8fbd', '#fff']);
      }
    });
  }

  /* ---------------- Vilão e balões ---------------- */
  function updateBoss(dt) {
    S.throwT -= dt;
    if (S.throwT <= 0 && S.throwing <= 0) S.throwing = 0.7;
    if (S.throwing > 0) {
      S.throwing -= dt;
      if (S.throwing <= 0) { spawnBarrel(); S.throwT = Math.max(2.1, 3.6 - S.time / 60) + Math.random() * 0.8; }
    }
    S.bossT -= dt; S.manuT -= dt;
    if (S.bossT <= 0) { S.bub.boss = { text: C.bossTaunts[Math.floor(Math.random() * C.bossTaunts.length)], t: 2.4 }; S.bossT = 5.5; }
    if (S.manuT <= 0) { S.bub.manu = { text: C.manuCries[Math.floor(Math.random() * C.manuCries.length)], t: 2.2 }; S.manuT = 3.8; }
    ['boss', 'manu'].forEach(function (k) { if (S.bub[k]) { S.bub[k].t -= dt; if (S.bub[k].t <= 0) S.bub[k] = null; } });
  }

  /* ---------------- Cena final ---------------- */
  function startCutscene() {
    const P = S.player;
    S.cs = { phase: 'walk', t: 0, line: 0, lineT: 0, launched: 0, landed: 0, projs: [], bossX: 56, bossY: PL[5].y1, bossRot: 0,
             cageOpen: 0, manuX: CAGE_X, isaTarget: 256, box: null, boxT: 0, shake: 0, hug: 0 };
    S.barrels = []; S.bub.boss = null; S.bub.manu = null;
    P.state = 'ground'; P.pl = 6; P.vy = 0; P.inv = 0; P.y = PL[6].y1;
    Sound.play('win');
  }
  function promptBox() { return { who: 'isa', text: C.actionPrompt, prompt: true }; }
  function updateCutscene(dt) {
    const cs = S.cs, P = S.player;
    cs.t += dt;
    if (cs.shake > 0) cs.shake -= dt;
    const act = S.act; S.act = false;
    if (cs.phase === 'walk') {
      const d = cs.isaTarget - P.x;
      if (Math.abs(d) > 1) { P.x += Math.sign(d) * Math.min(Math.abs(d), 80 * dt); P.anim += dt * 8; P.face = Math.sign(d); }
      if (Math.abs(d) <= 1 || cs.t > 1.2) { P.x = cs.isaTarget; P.face = -1; cs.phase = 'jump'; cs.t = 0; Sound.play('boing'); }
    } else if (cs.phase === 'jump') {
      const u = clamp(cs.t / 1.0, 0, 1);
      cs.bossX = 56 + (196 - 56) * u;
      cs.bossY = 150 + (92 - 150) * u - Math.sin(Math.PI * u) * 80;
      if (u >= 1) { cs.phase = 'dialog'; cs.t = 0; cs.line = 0; cs.lineT = 0; cs.shake = 0.3; Sound.play('land'); }
    } else if (cs.phase === 'dialog') {
      cs.lineT += dt;
      if ((act && cs.lineT > 0.3) || cs.lineT > 3.4) {
        cs.line++; cs.lineT = 0;
        if (cs.line >= C.cutscene.length) { cs.phase = 'act'; cs.t = 0; cs.box = promptBox(); }
      }
      if (cs.phase === 'dialog') cs.box = C.cutscene[cs.line];
    } else if (cs.phase === 'act') {
      if (act && cs.launched < 3) {
        cs.launched++; cs.projs.push({ t: 0 }); Sound.play('kiss');
      }
      for (let i = cs.projs.length - 1; i >= 0; i--) {
        const pr = cs.projs[i];
        pr.t += dt / 0.45;
        if (pr.t >= 1) {
          cs.projs.splice(i, 1); cs.landed++; cs.shake = 0.5; Sound.play('hit');
          puff(cs.bossX, cs.bossY - 30, 12, ['#ff5c93', '#ffb3cf', '#fff']);
          cs.box = { who: 'boss', text: C.hitLines[Math.min(cs.landed - 1, C.hitLines.length - 1)] };
          cs.boxT = 1.4;
        }
      }
      if (cs.boxT > 0) { cs.boxT -= dt; if (cs.boxT <= 0 && cs.landed < 3) cs.box = promptBox(); }
      if (cs.landed >= 3 && cs.projs.length === 0 && cs.boxT <= 0) {
        cs.phase = 'bossout'; cs.t = 0; cs.box = { who: 'boss', text: C.exitLine }; Sound.play('boing');
      }
    } else if (cs.phase === 'bossout') {
      cs.bossX += 300 * dt; cs.bossY -= 260 * dt; cs.bossRot += dt * 14;
      if (Math.random() < 0.5) puff(cs.bossX, cs.bossY - 20, 1, ['#ffe066', '#fff']);
      if (cs.t > 1.5) { cs.phase = 'cage'; cs.t = 0; cs.box = null; Sound.play('coin'); }
    } else if (cs.phase === 'cage') {
      cs.cageOpen = clamp(cs.t / 0.9, 0, 1);
      if (cs.t > 1.0) { cs.phase = 'run'; cs.t = 0; P.face = 1; cs.box = { who: 'manu', text: C.manuLine }; }
    } else if (cs.phase === 'run') {
      const mt = 288, it = 268;
      if (cs.manuX > mt) cs.manuX = Math.max(mt, cs.manuX - 70 * dt);
      if (P.x < it) { P.x = Math.min(it, P.x + 60 * dt); P.anim += dt * 8; }
      if (cs.manuX <= mt && P.x >= it) {
        cs.phase = 'hug'; cs.t = 0; Sound.play('win');
        puff(278, 60, 30, ['#ff5c93', '#ffb3cf', '#ffe066', '#fff']);
      }
    } else if (cs.phase === 'hug') {
      cs.hug = cs.t;
      if (Math.random() < 0.35) puff(278 + (Math.random() - 0.5) * 50, 70, 1, ['#ff5c93', '#ffb3cf', '#ffe066']);
      if (cs.t > 2.8) { cs.phase = 'end'; finish(); }
    }
  }
  function finish() {
    const bonus = 1000 + S.lives * 300;
    addScore(bonus);
    App.complete('g3');
    S.over = true; blocked = true;
    App.overlay(STAGE, {
      emoji: '🦍❤️', title: C.endTitle,
      text: C.endMessage + '\nPontos: ' + S.score + '  (bônus: +' + bonus + ')',
      buttons: [
        { label: 'Jogar de novo', cls: 'primary', fn: function () { restartGame(); } },
        { label: 'Voltar ao menu', fn: function () { App.goMenu(); } }
      ]
    });
  }

  /* ---------------- Atualização geral ---------------- */
  function update(dt) {
    S.time += dt;
    if (S.jumpBuf > 0) S.jumpBuf -= dt;
    if (S.shake > 0) S.shake -= dt;
    if (S.cs) {
      updateCutscene(dt);
    } else {
      const P = S.player;
      if (P.state === 'dead') {
        P.dead -= dt; P.vy += G * dt; P.y += P.vy * dt; P.spin += dt * 10;
        if (P.dead <= 0) {
          if (S.lives <= 0) gameOver(); else spawnPlayer();
        }
      } else {
        updatePlayer(dt);
        updateBoss(dt);
      }
      updateBarrels(dt);
      if (P.state !== 'dead') {
        jumpOvers(); collectItems();
        if (P.inv <= 0 && barrelHits()) die();
        if (P.state === 'ground' && P.pl === 6 && !S.cs) startCutscene();
      }
    }
    for (let i = S.parts.length - 1; i >= 0; i--) {
      const q = S.parts[i];
      q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 300 * dt;
      if (q.life <= 0) S.parts.splice(i, 1);
    }
    for (let i = S.pops.length - 1; i >= 0; i--) {
      const q = S.pops[i]; q.life -= dt; q.y -= 36 * dt;
      if (q.life <= 0) S.pops.splice(i, 1);
    }
  }
  function gameOver() {
    S.over = true; blocked = true;
    App.overlay(STAGE, {
      emoji: '😵', title: 'Fim de jogo', text: C.gameOverText + '\nPontos: ' + S.score,
      buttons: [
        { label: 'Tentar de novo', cls: 'primary', fn: function () { restartGame(); } },
        { label: 'Voltar ao menu', fn: function () { App.goMenu(); } }
      ]
    });
  }

  /* ---------------- Desenho ---------------- */
  function star(x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 === 0 ? r : r * 0.48;
      if (i === 0) ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
  }
  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1b1035'); g.addColorStop(1, '#3a1a5e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    S.stars.forEach(function (s) {
      ctx.fillStyle = 'rgba(255,255,255,' + (0.35 + 0.35 * Math.sin(S.time * 2 + s.tw)).toFixed(2) + ')';
      ctx.fillRect(Math.round(s.x), Math.round(s.y), 2, 2);
    });
  }
  function drawGirders() {
    PL.forEach(function (p, i) {
      const th = i === 0 ? 24 : 10;
      ctx.fillStyle = '#ff6b9d';
      ctx.beginPath(); ctx.moveTo(p.x1, p.y1); ctx.lineTo(p.x2, p.y2); ctx.lineTo(p.x2, p.y2 + th); ctx.lineTo(p.x1, p.y1 + th); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#ffb3cf'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(p.x1, p.y1); ctx.lineTo(p.x2, p.y2); ctx.stroke();
      ctx.fillStyle = '#c43d73';
      for (let x = p.x1 + 8; x < p.x2; x += 24) ctx.fillRect(Math.round(x), Math.round(platY(i, x)) + 4, 3, 3);
    });
  }
  function drawLadders() {
    LD.forEach(function (L) {
      const yTop = platY(L.top, L.x), yBot = platY(L.bot, L.x);
      const y0 = L.broken ? yTop + 38 : yTop - 2;
      ctx.fillStyle = L.broken ? '#8fb5c4' : '#7fe3ff';
      ctx.fillRect(L.x - 8, y0, 3, yBot - y0);
      ctx.fillRect(L.x + 5, y0, 3, yBot - y0);
      for (let y = y0 + 4; y < yBot - 2; y += 8) ctx.fillRect(L.x - 8, Math.round(y), 16, 2);
      if (L.broken) { ctx.fillRect(L.x - 8, Math.round(y0 - 6), 3, 4); ctx.fillRect(L.x + 5, Math.round(y0 - 3), 3, 3); }
    });
  }
  function drawDrum() {
    const y = PL[0].y1;
    ctx.fillStyle = '#4b6bd8'; ctx.fillRect(8, y - 36, 36, 36);
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(8, y - 36, 36, 36);
    ctx.fillStyle = '#7f9bff'; ctx.fillRect(8, y - 28, 36, 3); ctx.fillRect(8, y - 12, 36, 3);
    const f = Math.sin(S.time * 14) * 3;
    ctx.fillStyle = '#ff7b2e'; ctx.beginPath(); ctx.moveTo(14, y - 36); ctx.lineTo(26, y - 56 - f); ctx.lineTo(38, y - 36); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd24d'; ctx.beginPath(); ctx.moveTo(20, y - 36); ctx.lineTo(26, y - 48 + f * 0.5); ctx.lineTo(32, y - 36); ctx.closePath(); ctx.fill();
  }
  function drawItem(it) {
    const x = it.x, y = platY(it.pl, it.x) - 14 + Math.sin(S.time * 4 + it.x) * 2;
    if (it.t === 'heart') Sprites.drawCenter(ctx, 'heart', x, y, 2, false);
    else if (it.t === 'star') { star(x, y, 9); ctx.fillStyle = '#ffd23f'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke(); }
    else {
      ctx.fillStyle = '#e9b27c'; ctx.fillRect(x - 6, y, 12, 8);
      ctx.fillStyle = '#ffb3cf'; ctx.beginPath(); ctx.arc(x, y - 1, 8, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#ff4f6b'; ctx.fillRect(x - 1, y - 12, 3, 3);
    }
  }
  function drawBarrel(b) {
    ctx.save();
    ctx.translate(Math.round(b.x), Math.round(b.y)); ctx.rotate(b.rot);
    ctx.fillStyle = '#c9763a'; ctx.beginPath(); ctx.arc(0, 0, b.r, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#6b3a1e'; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, b.r * 0.55, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-b.r, 0); ctx.lineTo(b.r, 0); ctx.stroke();
    ctx.restore();
  }
  function bubble(x, y, text, tx, ty) {
    ctx.font = 'bold 11px "Courier New", monospace';
    const lines = Gfx.wrap(ctx, text, 130);
    const bw = Math.min(150, Math.max.apply(null, lines.map(function (l) { return ctx.measureText(l).width; })) + 16), bh = lines.length * 14 + 12;
    Gfx.rr(ctx, x, y, bw, bh, 8); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(clamp(tx, x + 10, x + bw - 10) - 5, y + bh - 1); ctx.lineTo(tx, ty); ctx.lineTo(clamp(tx, x + 10, x + bw - 10) + 5, y + bh - 1); ctx.closePath();
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillRect(clamp(tx, x + 10, x + bw - 10) - 4, y + bh - 3, 8, 4);
    ctx.fillStyle = INK; ctx.textAlign = 'center';
    lines.forEach(function (l, i) { ctx.fillText(l, x + bw / 2, y + 16 + i * 14); });
    ctx.textAlign = 'left';
  }
  function drawCage(open) {
    const x0 = CAGE_X - 22, x1 = CAGE_X + 22, top = CAGE_FEET - 48;
    ctx.save();
    ctx.globalAlpha = 1 - open * 0.8;
    ctx.translate(0, -open * 50);
    ctx.fillStyle = '#c9c9e8';
    ctx.fillRect(x0, top, x1 - x0, 4);
    for (let k = 0; k <= 6; k++) ctx.fillRect(Math.round(x0 + k * ((x1 - x0 - 3) / 6)), top, 3, 48);
    ctx.restore();
  }
  function drawBoss(x, y, rot, flipX) {
    ctx.save();
    ctx.translate(x, y - 27); ctx.rotate(rot);
    Sprites.drawCenter(ctx, 'boss', 0, 0, 3, !!flipX);
    ctx.restore();
  }
  function drawPlayer() {
    const P = S.player;
    if (P.state === 'dead') {
      ctx.save(); ctx.translate(P.x, P.y - 20); ctx.rotate(P.spin);
      Sprites.drawFeet(ctx, 'isa1', 0, 20, PS, false);
      ctx.restore(); return;
    }
    if (P.inv > 0 && Math.floor(S.time * 14) % 2 === 0) return;
    let key = 'isa0', flip = P.face < 0;
    if (P.state === 'ground') key = Math.floor(P.anim) % 2 ? 'isa1' : 'isa0';
    else if (P.state === 'air') key = 'isa1';
    else { key = Math.floor(P.anim * 1.2) % 2 ? 'isa1' : 'isa0'; flip = Math.floor(P.anim * 1.2) % 2 === 0; }
    Sprites.drawFeet(ctx, key, P.x, P.y, PS, flip);
  }
  function drawHUD() {
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    ctx.font = 'bold 16px "Courier New", monospace';
    Gfx.text(ctx, 'PONTOS ' + String(S.score).padStart(5, '0'), 10, 22, '#fff', INK, 4);
    ctx.textAlign = 'center';
    Gfx.text(ctx, '★ ' + S.items.filter(function (i) { return i.taken; }).length + '/' + S.items.length, 250, 22, '#ffe066', INK, 4);
    for (let i = 0; i < 3; i++) {
      Sprites.drawCenter(ctx, i < S.lives ? 'heart' : 'cloud', W - 24 - i * 24, 15, i < S.lives ? 2 : 1, false);
    }
    ctx.textAlign = 'left';
  }
  function drawDialogBox(box) {
    const x = 24, y = 166, w = W - 48, h = 56;
    Gfx.rr(ctx, x, y, w, h, 10); ctx.fillStyle = 'rgba(255,246,232,.96)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    const name = box.who === 'boss' ? C.villain : (box.who === 'manu' ? 'Manu' : 'Isa');
    ctx.font = 'bold 12px "Courier New", monospace'; ctx.textAlign = 'left';
    ctx.fillStyle = box.who === 'boss' ? '#c43d73' : '#4b6bd8';
    ctx.fillText(name + ':', x + 10, y + 18);
    ctx.font = 'bold 14px "Courier New", monospace'; ctx.fillStyle = INK;
    const lines = Gfx.wrap(ctx, box.text, w - 24);
    lines.slice(0, 2).forEach(function (l, i) { ctx.fillText(l, x + 10, y + 36 + i * 16); });
    if (box.prompt && Math.floor(S.time * 3) % 2 === 0) { ctx.fillStyle = '#e8639b'; ctx.textAlign = 'right'; ctx.fillText('❤', x + w - 10, y + 18); ctx.textAlign = 'left'; }
  }

  function draw() {
    if (!S) return;
    ctx.save();
    const sh = S.cs && S.cs.shake > 0 ? (Math.random() - 0.5) * 6 : 0;
    ctx.translate(sh, 0);
    drawBackground();
    drawGirders(); drawLadders(); drawDrum();
    S.items.forEach(function (it) { if (!it.taken) drawItem(it); });

    const cs = S.cs;
    // Manu e jaula
    const manuX = cs ? cs.manuX : CAGE_X;
    const hugging = cs && cs.phase === 'hug';
    const mb = hugging ? -Math.abs(Math.sin(cs.hug * 7)) * 4 : (cs ? 0 : -Math.abs(Math.sin(S.time * 5)) * 3);
    Sprites.drawFeet(ctx, cs && cs.phase === 'run' ? (Math.floor(S.time * 8) % 2 ? 'manu1' : 'manu0') : 'manu0', manuX, CAGE_FEET + mb, PS, true);
    drawCage(cs ? cs.cageOpen : 0);

    // vilão
    if (!cs) {
      const shake = S.throwing > 0 ? (Math.random() - 0.5) * 2 : 0;
      drawBoss(56 + shake, PL[5].y1, 0, false);
      if (S.throwing > 0) {
        ctx.fillStyle = '#c9763a'; ctx.beginPath(); ctx.arc(78, PL[5].y1 - 62, 9, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = '#6b3a1e'; ctx.stroke();
      }
    } else if (cs.phase !== 'cage' && cs.phase !== 'run' && cs.phase !== 'hug' && cs.phase !== 'end') {
      drawBoss(cs.bossX + (cs.shake > 0 ? (Math.random() - 0.5) * 6 : 0), cs.bossY, cs.bossRot, cs.phase === 'dialog' || cs.phase === 'act');
    }

    S.barrels.forEach(drawBarrel);

    // jogadora (e abraço)
    if (hugging) {
      const P = S.player;
      Sprites.drawFeet(ctx, 'isa0', P.x, P.y + mb, PS, false);
      Gfx.heartPath(ctx, 278, 52 - Math.abs(Math.sin(cs.hug * 4)) * 6, 16); ctx.fillStyle = '#ff5c93'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
    } else drawPlayer();

    // projéteis de beijo
    if (cs) cs.projs.forEach(function (pr) {
      const P = S.player, x = P.x + (cs.bossX - P.x) * pr.t, y = (P.y - 30) + ((cs.bossY - 30) - (P.y - 30)) * pr.t - Math.sin(Math.PI * pr.t) * 24;
      Sprites.drawCenter(ctx, 'heart', x, y, 3, false);
    });

    // partículas e textos
    S.parts.forEach(function (q) {
      ctx.globalAlpha = clamp(q.life / q.max, 0, 1); ctx.fillStyle = q.col;
      if (q.heart) { Gfx.heartPath(ctx, q.x, q.y, q.s * 2.5); ctx.fill(); } else ctx.fillRect(Math.round(q.x), Math.round(q.y), q.s, q.s);
    });
    ctx.globalAlpha = 1;
    ctx.font = 'bold 14px "Courier New", monospace'; ctx.textAlign = 'center';
    S.pops.forEach(function (p) { ctx.globalAlpha = clamp(p.life / 0.4, 0, 1); Gfx.text(ctx, p.text, p.x, p.y, p.col, INK, 4); });
    ctx.globalAlpha = 1; ctx.textAlign = 'left';

    // balões
    if (!cs) {
      if (S.bub.boss) bubble(96, 80, S.bub.boss.text, 80, PL[5].y1 - 62);
      if (S.bub.manu) bubble(150, 6, S.bub.manu.text, CAGE_X - 10, CAGE_FEET - 40);
    } else if (cs.box) drawDialogBox(cs.box);

    drawHUD();
    ctx.restore();
  }

  /* ---------------- Laço de animação ---------------- */
  function loop(t) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, Math.max(0, (t - last) / 1000));
    last = t;
    if (S && S.started && !paused && !blocked) update(dt);
    draw();
  }
  function startLoop() { if (raf) return; last = performance.now(); raf = requestAnimationFrame(loop); }
  function stopLoop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  /* ---------------- Telas ---------------- */
  function showStart() {
    blocked = true;
    App.overlay(STAGE, {
      emoji: '🦍', title: 'Resgate do Manu',
      text: C.intro + '\nSetas ← → andam, ↑ ↓ sobem e descem escadas, ESPAÇO pula (e pula os barris!).\nCuidado: algumas escadas estão quebradas. Procure o caminho certo!',
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
  function restartGame() {
    paused = false; blocked = false; App.hideOverlay(STAGE);
    keys.left = keys.right = keys.up = keys.down = false;
    resetAll(); S.started = true; App.syncTools();
  }

  /* ---------------- Entrada ---------------- */
  function jumpPress() { if (S) { S.jumpBuf = 0.14; S.act = true; } }
  function kd(e) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { keys.left = true; e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') { keys.right = true; e.preventDefault(); }
    else if (k === 'ArrowUp' || k === 'w' || k === 'W') { keys.up = true; e.preventDefault(); }
    else if (k === 'ArrowDown' || k === 's' || k === 'S') { keys.down = true; e.preventDefault(); }
    else if (k === ' ' || k === 'k' || k === 'K' || k === 'z' || k === 'Z' || k === 'Enter') { e.preventDefault(); if (!e.repeat) jumpPress(); }
  }
  function ku(e) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.left = false;
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.right = false;
    else if (k === 'ArrowUp' || k === 'w' || k === 'W') keys.up = false;
    else if (k === 'ArrowDown' || k === 's' || k === 'S') keys.down = false;
  }
  Array.prototype.forEach.call(document.querySelectorAll('#touch3 .tbtn'), function (b) {
    App.hold(b, function (v) {
      if (b.dataset.k === 'jump') { if (v) jumpPress(); }
      else keys[b.dataset.k] = v;
    });
  });

  /* ---------------- API ---------------- */
  App.register('g3', {
    enter: function () {
      active = true; paused = false; keys.left = keys.right = keys.up = keys.down = false;
      resetAll(); showStart(); startLoop();
      window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    },
    leave: function () {
      active = false; stopLoop(); keys.left = keys.right = keys.up = keys.down = false; paused = false; blocked = false;
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
      App.hideOverlay(STAGE);
    },
    restart: function () { if (active) restartGame(); },
    pause: function (f) { setPause(!!f); },
    togglePause: function () { setPause(!paused); },
    isPaused: function () { return paused; }
  });
})();
