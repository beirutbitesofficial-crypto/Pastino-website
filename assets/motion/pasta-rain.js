// Falling pasta: canvas particles rendered from the inline SVG art (#pa-* symbols).
//   ambient — a slow, deep rain across the whole page. Pieces sit at different depths,
//             drift with the scroll (parallax), speed up with scroll velocity and dodge the pointer.
//   pour    — pieces fall from the top of the hero into the bowl; each one that lands
//             calls onLand() so the pile in the bowl can grow.
(function () {
  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);

  // Turn each <symbol> into a standalone SVG image, then into a bitmap.
  function loadSprites(names, px) {
    const sprite = document.querySelector('[data-pasta-sprite]');
    if (!sprite) return Promise.resolve({});
    const defs = [...sprite.querySelectorAll('linearGradient, radialGradient')].map((g) => g.outerHTML).join('');
    const size = px || 128;
    return Promise.all(names.map((name) => new Promise((resolve) => {
      const symbol = sprite.querySelector('#pa-' + name);
      if (!symbol) { resolve([name, null]); return; }
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${symbol.getAttribute('viewBox')}" width="${size}" height="${size}"><defs>${defs}</defs>${symbol.innerHTML}</svg>`;
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = c.height = size;
        c.getContext('2d').drawImage(img, 0, 0, size, size);
        resolve([name, c]);
      };
      img.onerror = () => resolve([name, null]);
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }))).then((pairs) => Object.fromEntries(pairs.filter((p) => p[1])));
  }

  function PastaRain(opts) {
    this.canvas = opts.canvas;
    this.ctx = this.canvas.getContext('2d');
    this.mode = opts.mode || 'ambient';
    this.sprites = opts.sprites;              // [{ img, weight }]
    this.count = opts.count || 40;            // ambient: pieces on screen
    this.size = opts.size || [26, 64];        // css px at depth 1
    this.target = opts.target || null;        // pour: () => ({ x, y, w }) in canvas css px
    this.onLand = opts.onLand || null;
    this.intensity = opts.intensity ?? 1;     // 0…1, scales spawn rate / opacity
    this.spread = 1;
    this.parts = [];
    this.pointer = { x: -1e4, y: -1e4 };
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    this.lastScroll = window.scrollY;
    this.vel = 0;
    this.carry = 0;
    this.tick = this.tick.bind(this);
    const total = this.sprites.reduce((s, x) => s + (x.weight || 1), 0);
    this.pick = () => {
      let r = Math.random() * total;
      for (const s of this.sprites) { r -= s.weight || 1; if (r <= 0) return s.img; }
      return this.sprites[0].img;
    };
    this.resize();
    if (this.mode === 'ambient') for (let i = 0; i < this.count; i++) this.parts.push(this.make(true));
    if (opts.pointer !== false && this.mode === 'ambient') {
      window.addEventListener('pointermove', (e) => { this.pointer.x = e.clientX; this.pointer.y = e.clientY; }, { passive: true });
      document.addEventListener('pointerleave', () => { this.pointer.x = this.pointer.y = -1e4; });
    }
  }

  PastaRain.prototype.resize = function () {
    const r = this.canvas.getBoundingClientRect();
    this.w = this.canvas.offsetWidth || r.width;
    this.h = this.canvas.offsetHeight || r.height;
    this.canvas.width = Math.max(1, Math.round(this.w * this.dpr));
    this.canvas.height = Math.max(1, Math.round(this.h * this.dpr));
  };

  PastaRain.prototype.make = function (anywhere) {
    const z = rand(.35, 1);
    const p = {
      img: this.pick(), z,
      s: rand(this.size[0], this.size[1]) * z,
      x: rand(0, this.w), y: anywhere ? rand(-40, this.h) : rand(-160, -40),
      vx: rand(-12, 12), vy: rand(30, 70) * z,
      rot: rand(0, TAU), vr: rand(-1.4, 1.4), sway: rand(0, TAU), swayAmp: rand(6, 22),
      pushX: 0, pushY: 0,
    };
    if (this.mode === 'pour' && this.target) {
      const t = this.target();
      p.z = rand(.75, 1);
      p.s = rand(this.size[0], this.size[1]) * p.z;
      p.x = t.x + rand(-.5, .5) * t.w * .82 * this.spread;
      p.y = rand(-120, -30);
      p.vy = rand(120, 240);
      p.vx = rand(-18, 18);
      p.vr = rand(-4, 4);
    }
    return p;
  };

  PastaRain.prototype.start = function () {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.lastScroll = window.scrollY;
    window.gsap.ticker.add(this.tick);
  };

  PastaRain.prototype.stop = function () {
    this.running = false;
    window.gsap.ticker.remove(this.tick);
  };

  PastaRain.prototype.tick = function () {
    const now = performance.now();
    const dt = Math.min(.05, (now - this.last) / 1000);
    this.last = now;
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    if (this.mode === 'ambient') this.ambient(dt); else this.pour(dt);
  };

  PastaRain.prototype.draw = function (p, alpha) {
    const ctx = this.ctx;
    ctx.globalAlpha = alpha;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.drawImage(p.img, -p.s / 2, -p.s / 2, p.s, p.s);
    ctx.restore();
  };

  PastaRain.prototype.ambient = function (dt) {
    const sy = window.scrollY;
    const dy = sy - this.lastScroll;
    this.lastScroll = sy;
    const v = dy / Math.max(dt, .001);
    this.vel += (v - this.vel) * Math.min(1, dt * 6);
    const boost = Math.min(4, Math.abs(this.vel) / 600);
    const px = this.pointer.x, py = this.pointer.y;

    for (let i = 0; i < this.parts.length; i++) {
      const p = this.parts[i];
      p.sway += dt * (.6 + p.z * .5);
      // Fall, plus a push in the scroll direction so the rain feels like it is in the page.
      p.y += (p.vy * (1 + boost * .9)) * dt - dy * p.z * .35;
      p.x += (p.vx + Math.cos(p.sway) * p.swayAmp) * dt;
      p.rot += p.vr * dt * (1 + boost);
      // Pointer: pieces near the cursor are nudged away and drift back.
      const ddx = p.x - px, ddy = p.y - py, d2 = ddx * ddx + ddy * ddy;
      if (d2 < 16000) {
        const d = Math.sqrt(d2) || 1, f = (1 - d / 126) * 900 * dt;
        p.pushX += (ddx / d) * f; p.pushY += (ddy / d) * f;
      }
      p.pushX *= .92; p.pushY *= .92;
      p.x += p.pushX * dt * 10; p.y += p.pushY * dt * 10;

      if (p.y > this.h + p.s) Object.assign(p, this.make(false));
      else if (p.y < -p.s * 3) { Object.assign(p, this.make(false)); p.y = this.h + p.s; }
      if (p.x < -p.s) p.x = this.w + p.s; else if (p.x > this.w + p.s) p.x = -p.s;
      this.draw(p, (.18 + p.z * .55) * this.intensity);
    }
    this.ctx.globalAlpha = 1;
  };

  PastaRain.prototype.pour = function (dt) {
    const t = this.target();
    // Spawn proportional to intensity (fractional spawns carry over between frames).
    this.carry += (8 + 18 * this.spread) * Math.max(this.intensity, this.boost || 0) * dt;
    while (this.carry >= 1 && this.parts.length < 90) { this.parts.push(this.make()); this.carry -= 1; }
    if (this.carry > 1) this.carry = 1;

    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.vy += 720 * dt;
      p.vx += (t.x - p.x) * .25 * dt;           // a gentle pull towards the bowl
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      const inMouth = Math.abs(p.x - t.x) < t.w * .44;
      if (p.y >= t.y && inMouth) {
        this.parts.splice(i, 1);
        if (this.onLand) this.onLand(p);
        continue;
      }
      if (p.y > this.h + p.s) { this.parts.splice(i, 1); continue; }
      // Fade in from the top edge so pieces never pop into view.
      this.draw(p, Math.min(1, (p.y + 120) / 140));
    }
    this.ctx.globalAlpha = 1;
  };

  window.Pastino = window.Pastino || {};
  window.Pastino.loadSprites = loadSprites;
  window.Pastino.PastaRain = PastaRain;
})();
