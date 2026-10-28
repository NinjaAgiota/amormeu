/* Pixel art feita no próprio código (sem imagens externas) + helpers de desenho. */
(function () {
  'use strict';

  function make(rows, pal) {
    const h = rows.length, w = rows[0].length;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    if (!x) return c;
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const ch = rows[j][i];
        if (ch !== '.' && pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(i, j, 1, 1); }
      }
    }
    return c;
  }

  /* ---------- Isa: garota parda, cabelo preto cacheado, vestido rosa ---------- */
  const ISA_PAL = { K: '#2a1a33', k: '#4b3358', S: '#b97b57', D: '#9a6140', E: '#1b1020', W: '#ffffff',
                    R: '#e98a8a', M: '#8a3550', P: '#ff8fbd', Q: '#e8639b', Y: '#ffe066', B: '#7a5aa8' };
  const ISA_TOP = [
    '....KKKKKK....',
    '..KKKKKKKYKK..',
    '.KKkKKKKKkKKK.',
    '.KKKSSSSSSKKK.',
    'KkKSSSSSSSSKkK',
    'KKKSWESSWESKKK',
    'KKKSSSSSSSSKKK',
    'KKKSRSSSSRSKKK',
    '.KKKSSMMSSKKK.',
    '..KKKSSSSKKK..',
    '...KKSDDSKK...',
    '..SPPPPPPPPS..',
    '..SPPQPPQPPS..',
    '...PPPPPPPP...',
    '..PPPPYYPPPP..',
    '.PPQPPPPPPQPP.',
    '.PPPPPPPPPPPP.'
  ];
  const ISA_LEGS_A = ['....SS..SS....', '....SS..SS....', '...BBB..BBB...'];
  const ISA_LEGS_B = ['...SS....SS...', '...SS....SS...', '..BBB....BBB..'];

  /* ---------- Manu ---------- */
  const MANU_PAL = { H: '#3a2a22', S: '#d9a273', W: '#ffffff', E: '#1b1020', M: '#8a3550',
                     G: '#7fd1b9', g: '#5fb39b', T: '#6a7fc9', B: '#5a4a6a' };
  const MANU_TOP = [
    '....HHHHHH....',
    '...HHHHHHHH...',
    '..HHHHHHHHHH..',
    '..HHSSSSSSHH..',
    '..HSSSSSSSSH..',
    '..SSWESSWESS..',
    '..SSSSSSSSSS..',
    '..SSSSMMSSSS..',
    '...SSSSSSSS...',
    '....SSSSSS....',
    '...GGGGGGGG...',
    '..GGGGGGGGGG..',
    '.SGGGgGGgGGGS.',
    '.SGGGGGGGGGGS.',
    '..GGGGGGGGGG..',
    '..GGGGGGGGGG..',
    '....TTTTTT....'
  ];
  const MANU_LEGS_A = ['....TT..TT....', '....TT..TT....', '...BBB..BBB...'];
  const MANU_LEGS_B = ['...TT....TT...', '...TT....TT...', '..BBB....BBB..'];

  /* ---------- Vilão fictício: Barão Bananão (gorila de coroinha) ---------- */
  const BOSS_PAL = { F: '#7a4f3a', f: '#d7a77f', W: '#ffffff', E: '#1b1020', C: '#ffd24d',
                     T: '#e0506a', M: '#5a2a2a' };
  const BOSS = [
    '......C.C.C.....',
    '......CCCCC.....',
    '....FFFFFFFF....',
    '...FFFFFFFFFF...',
    '...FFffffffFF...',
    '..FFfWEffWEfFF..',
    '..FFffffffffFF..',
    '..FFffMMMMffFF..',
    '...FFffffffFF...',
    '....FFFTTFFF....',
    '..FFFFFTTFFFFF..',
    '.FFFFFFTTFFFFFF.',
    'FFFFFFFTTFFFFFFF',
    'FFFFFFFFFFFFFFFF',
    'FFFFFFFFFFFFFFFF',
    '.FFFFFFFFFFFFFF.',
    '..FFFF....FFFF..',
    '..FFFF....FFFF..'
  ];

  const HEART = [
    '.HHH.HHH.',
    'HHHHHHHHH',
    'HHWHHHHHH',
    'HHHHHHHHH',
    '.HHHHHHH.',
    '..HHHHH..',
    '...HHH...',
    '....H....'
  ];
  const CLOUD = [
    '...CCCC.....',
    '..CCCCCC.CC.',
    '.CCCCCCCCCCC',
    'CCCEECCEECCC',
    'CCCCCCCCCCCC',
    '.CCCCCCCCCC.'
  ];

  const spr = {};
  function build() {
    spr.isa0 = make(ISA_TOP.concat(ISA_LEGS_A), ISA_PAL);
    spr.isa1 = make(ISA_TOP.concat(ISA_LEGS_B), ISA_PAL);
    spr.manu0 = make(MANU_TOP.concat(MANU_LEGS_A), MANU_PAL);
    spr.manu1 = make(MANU_TOP.concat(MANU_LEGS_B), MANU_PAL);
    spr.boss = make(BOSS, BOSS_PAL);
    spr.heart = make(HEART, { H: '#ff5c93', W: '#ffd0e0' });
    spr.gold = make(HEART, { H: '#ffc933', W: '#fff3b0' });
    spr.cloud = make(CLOUD, { C: '#9aa0c8', E: '#3b3b5c' });
  }
  build();

  const Sprites = {
    get: function (k) { return spr[k]; },
    /* desenha com o "pé" (centro-baixo) na posição indicada */
    drawFeet: function (ctx, key, cx, fy, scale, flip, sy) {
      const s = spr[key]; if (!s) return;
      const w = s.width * scale, h = s.height * scale * (sy || 1);
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.translate(Math.round(cx), Math.round(fy));
      if (flip) ctx.scale(-1, 1);
      ctx.drawImage(s, Math.round(-w / 2), Math.round(-h), w, h);
      ctx.restore();
    },
    /* desenha centralizado */
    drawCenter: function (ctx, key, cx, cy, scale, flip) {
      const s = spr[key]; if (!s) return;
      const w = s.width * scale, h = s.height * scale;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.translate(Math.round(cx), Math.round(cy));
      if (flip) ctx.scale(-1, 1);
      ctx.drawImage(s, Math.round(-w / 2), Math.round(-h / 2), w, h);
      ctx.restore();
    }
  };
  window.Sprites = Sprites;

  /* ---------- Helpers gerais de desenho ---------- */
  window.Gfx = {
    clamp: function (v, a, b) { return Math.max(a, Math.min(b, v)); },
    rr: function (ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    },
    wrap: function (ctx, text, maxW) {
      const words = String(text).split(' ');
      const lines = []; let cur = '';
      for (let i = 0; i < words.length; i++) {
        const t = cur ? cur + ' ' + words[i] : words[i];
        if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = words[i]; }
        else cur = t;
      }
      if (cur) lines.push(cur);
      return lines;
    },
    text: function (ctx, str, x, y, fill, stroke, lw) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = lw || 4;
      ctx.strokeStyle = stroke || '#4a2c5a';
      ctx.strokeText(str, x, y);
      ctx.fillStyle = fill || '#fff';
      ctx.fillText(str, x, y);
    },
    heartPath: function (ctx, x, y, s) {
      ctx.beginPath();
      ctx.moveTo(x, y + s * 0.4);
      ctx.bezierCurveTo(x - s, y - s * 0.1, x - s * 0.55, y - s * 0.9, x, y - s * 0.35);
      ctx.bezierCurveTo(x + s * 0.55, y - s * 0.9, x + s, y - s * 0.1, x, y + s * 0.4);
      ctx.closePath();
    }
  };
})();
