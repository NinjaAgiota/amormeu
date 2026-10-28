/* Efeitos sonoros gerados pelo próprio código (WebAudio) — sem arquivos de som. */
(function () {
  'use strict';
  let ctx = null, master = null, enabled = true;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try {
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.6;
        master.connect(ctx.destination);
      } catch (e) { ctx = null; return null; }
    }
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }

  function tone(freq, dur, type, vol, delay, freq2) {
    const c = ensure();
    if (!c) return;
    const t = c.currentTime + (delay || 0);
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (freq2) o.frequency.exponentialRampToValueAtTime(freq2, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.06, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.03);
  }

  function seq(notes, dur, type, vol, gap) {
    notes.forEach(function (f, i) { tone(f, dur, type, vol, i * (gap || 0.08)); });
  }

  const lib = {
    click:   function () { tone(520, 0.06, 'square', 0.04); },
    collect: function () { tone(740, 0.07, 'square', 0.05); tone(988, 0.09, 'square', 0.05, 0.06); },
    gold:    function () { seq([880, 1175, 1568], 0.12, 'triangle', 0.07, 0.07); },
    msg:     function () { seq([660, 784, 988, 1318], 0.14, 'triangle', 0.06, 0.09); },
    cloud:   function () { tone(240, 0.28, 'sawtooth', 0.05, 0, 110); },
    jump:    function () { tone(300, 0.16, 'square', 0.04, 0, 720); },
    land:    function () { tone(140, 0.07, 'square', 0.03); },
    hit:     function () { tone(220, 0.45, 'sawtooth', 0.07, 0, 55); },
    win:     function () { seq([523, 659, 784, 1047, 1319], 0.16, 'triangle', 0.07, 0.1); },
    claw:    function () { tone(190, 0.05, 'square', 0.025); },
    grab:    function () { tone(340, 0.14, 'square', 0.05, 0, 220); },
    fail:    function () { tone(320, 0.16, 'triangle', 0.06, 0, 200); tone(210, 0.26, 'triangle', 0.06, 0.13, 120); },
    drop:    function () { tone(620, 0.28, 'sine', 0.06, 0, 200); },
    coin:    function () { tone(988, 0.08, 'square', 0.05); tone(1319, 0.2, 'square', 0.05, 0.08); },
    point:   function () { tone(1000, 0.08, 'square', 0.04); tone(1500, 0.08, 'square', 0.04, 0.07); },
    kiss:    function () { tone(900, 0.18, 'sine', 0.06, 0, 1500); },
    boing:   function () { tone(200, 0.3, 'sine', 0.07, 0, 600); }
  };

  window.Sound = {
    unlock: ensure,
    setEnabled: function (v) { enabled = !!v; },
    isEnabled: function () { return enabled; },
    play: function (name) {
      if (!enabled) return;
      try { if (lib[name]) lib[name](); } catch (e) {}
    }
  };
})();
