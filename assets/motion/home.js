// Pastino homepage motion (GSAP + ScrollTrigger).
//   1. Curtain    — the PASTINO letters drop in like pasta, then the curtain lifts (once per visit).
//   2. Hero intro — the bowl rises into the light, pasta pours from the top and piles up in it,
//                   steam curls up, basil/tomato burst out, the title is revealed word by word.
//   3. Scroll     — the hero pins and dollies into the bowl (desktop); the pour gets heavier.
//   4. Page       — ambient falling pasta that reacts to scroll speed and the pointer, a
//                   velocity-driven marquee, a pinned horizontal "how it works" track,
//                   curtain-revealed menu cards, a fly-to-cart animation and a footer
//                   word that fills with tomato sauce.
// Everything is visible and usable without this file (or with reduced motion).
(function () {
  const root = document.documentElement;
  const done = () => { root.classList.remove('cine-pending'); root.classList.add('cine-ready'); };
  const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger, P = window.Pastino || {};
  const hero = document.querySelector('[data-hero]');
  const curtain = document.querySelector('[data-curtain]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];

  const pile = $('[data-pile]');
  buildPile();

  if (!gsap || !ScrollTrigger || !hero || reduce) {
    if (curtain) curtain.remove();
    done();
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  gsap.set($$('use', pile), { scale: 0, transformOrigin: '50% 50%' });

  const small = window.matchMedia('(max-width: 720px)').matches;
  const lowPower = (navigator.hardwareConcurrency || 8) <= 4 || navigator.connection?.saveData;
  const headerH = () => $('#siteHeader')?.offsetHeight || 0;

  const els = {
    word: $('[data-hero-word]', hero),
    copy: $('[data-hero-copy]', hero),
    title: $('[data-hero-title]', hero),
    bits: $$('[data-hero-copy] > [data-cine]', hero),
    meta: $('[data-hero-meta]', hero),
    metaItems: $$('[data-hero-meta] > div', hero),
    cue: $('.hero__cue', hero),
    visual: $('[data-hero-visual]', hero),
    stage: $('[data-stage]', hero),
    glow: $('[data-glow]', hero),
    back: $('[data-bowl-back]', hero),
    front: $('[data-bowl-front]', hero),
    steam: $$('[data-steam] path', hero),
    floats: $$('[data-float]', hero),
    badge: $('[data-badge]', hero),
    rain: $('[data-hero-rain]', hero),
  };

  // ── Pile of pasta inside the bowl ──────────────────────────
  // Pieces are laid out bottom → top so the pile grows upwards as pasta lands.
  function buildPile() {
    if (!pile) return;
    const shapes = ['penne', 'farfalle', 'fusilli', 'fettuccine', 'penne', 'farfalle', 'fusilli'];
    const ns = 'http://www.w3.org/2000/svg';
    const pieces = [];
    let seed = 7;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (let row = 0; row < 5; row++) {
      const n = 9 - row;
      for (let i = 0; i < n; i++) {
        const u = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
        const spanX = 160 - row * 22;
        const x = 200 + u * spanX + (rnd() - .5) * 18;
        const dome = Math.sqrt(Math.max(0, 1 - u * u * .7));
        const y = 128 - row * 16 - dome * row * 5 + (rnd() - .5) * 8;
        pieces.push({ x, y, r: Math.round(rnd() * 360), s: 54 + rnd() * 18, shape: shapes[(row * 3 + i) % shapes.length] });
      }
    }
    pieces.forEach((p) => {
      const use = document.createElementNS(ns, 'use');
      use.setAttribute('href', '#pa-' + p.shape);
      use.setAttribute('width', p.s); use.setAttribute('height', p.s);
      use.setAttribute('x', -p.s / 2); use.setAttribute('y', -p.s / 2);
      // Position lives on the group; GSAP only ever scales the <use> inside it.
      const g = document.createElementNS(ns, 'g');
      g.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.r})`);
      g.appendChild(use);
      pile.appendChild(g);
    });
  }

  // ── Split a heading into masked words ──────────────────────
  function splitWords(el) {
    if (!el) return [];
    const text = el.textContent.trim();
    el.innerHTML = text.split(/\s+/).map((w) => `<span class="w"><span class="w__in">${w.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</span></span>`).join(' ');
    return $$('.w__in', el);
  }

  // ── Wait for the menu data (the title and prices come from it) ──
  const storeReady = new Promise((resolve) => {
    if (window.PASTINO_STORE !== undefined) { resolve(); return; }
    document.addEventListener('pastino:store', () => resolve(), { once: true });
    setTimeout(resolve, 2200);
  });

  // ── 1. Curtain ─────────────────────────────────────────────
  function playCurtain() {
    let seen = false;
    try { seen = sessionStorage.getItem('pastino-curtain') === '1'; sessionStorage.setItem('pastino-curtain', '1'); } catch { /* ignore */ }
    if (!curtain) return Promise.resolve();
    if (seen) { curtain.remove(); return Promise.resolve(); }
    const letters = $$('.curtain__word span', curtain);
    const bar = $('[data-curtain-bar]', curtain);
    gsap.set(letters, { yPercent: -260, rotation: () => gsap.utils.random(-50, 50), opacity: 0 });
    return new Promise((resolve) => {
      const tl = gsap.timeline();
      tl.to(letters, { yPercent: 0, rotation: 0, opacity: 1, duration: .9, ease: 'bounce.out', stagger: { each: .07, from: 'random' } })
        .to(bar, { scaleX: 1, duration: 1.1, ease: 'power2.inOut' }, 0)
        .add(() => { storeReady.then(() => {
          gsap.timeline({ onComplete: () => curtain.remove() })
            .to(letters, { yPercent: 120, opacity: 0, duration: .5, ease: 'power3.in', stagger: .03 })
            .to(curtain, { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '-=.25')
            .add(resolve, '-=.6');
        }); });
    });
  }

  // ── Sprites + rains ────────────────────────────────────────
  let heroRain = null, ambient = null;
  const pileUses = $$('use', pile);
  let pileShown = 0, landed = 0;

  // Every second piece that lands adds one to the visible pile.
  function popPile(n, all) {
    for (let i = 0; i < n && pileShown < pileUses.length; i++, pileShown++) {
      gsap.to(pileUses[pileShown], { scale: 1, duration: all ? .8 : .55, delay: all ? i * .02 : 0, ease: 'back.out(2.4)' });
    }
    if (pileShown >= pileUses.length && heroRain && !heroRain.settled) {
      heroRain.settled = true;
      gsap.to(heroRain, { intensity: .3, duration: 2.5, ease: 'sine.out' });
    }
  }

  function mouth() {
    const c = els.rain.getBoundingClientRect(), b = els.front.getBoundingClientRect();
    const k = els.rain.offsetWidth / (c.width || 1);
    return {
      x: (b.left + b.width / 2 - c.left) * k,
      y: (b.top + b.height * (112 / 300) - c.top) * k,
      w: b.width * (372 / 400) * k,
    };
  }

  const spritesReady = P.loadSprites
    ? P.loadSprites(['penne', 'farfalle', 'fusilli', 'fettuccine', 'basil', 'tomato', 'cheese'], 128)
    : Promise.resolve({});

  function setupRains(img) {
    const pasta = ['penne', 'farfalle', 'fusilli', 'fettuccine'].filter((n) => img[n]).map((n) => ({ img: img[n], weight: 3 }));
    if (!pasta.length) return;
    const extras = ['basil', 'tomato', 'cheese'].filter((n) => img[n]).map((n) => ({ img: img[n], weight: 1 }));
    if (els.rain) {
      heroRain = new P.PastaRain({
        canvas: els.rain, mode: 'pour', sprites: pasta, size: small ? [28, 46] : [36, 60],
        target: mouth, intensity: 0,
        onLand: () => {
          if (++landed % 2 === 0) popPile(1);
          gsap.fromTo(els.front, { y: 0 }, { y: 2.5, duration: .08, yoyo: true, repeat: 1, ease: 'sine.inOut', overwrite: 'auto' });
        },
      });
    }
    const canvas = $('[data-rain]');
    if (canvas) {
      ambient = new P.PastaRain({ canvas, mode: 'ambient', sprites: [...pasta, ...extras], count: lowPower ? 12 : small ? 14 : 26, size: small ? [22, 46] : [28, 72], intensity: 0 });
      ambient.start();
      gsap.to(ambient, { intensity: 1, duration: 2.5, delay: .6, ease: 'sine.out' });
      document.addEventListener('visibilitychange', () => (document.hidden ? ambient.stop() : ambient.start()));
    }
    // Only pour while the hero is on screen.
    ScrollTrigger.create({
      trigger: hero, start: 'top bottom', end: 'bottom top',
      onToggle: (self) => { if (!heroRain) return; (self.isActive && !document.hidden ? heroRain.start() : heroRain.stop()); },
    });
  }

  // ── 2. Hero intro ──────────────────────────────────────────
  const idle = [];
  function intro() {
    const words = splitWords(els.title);
    const sb = els.stage.getBoundingClientRect();
    const centre = { x: sb.left + sb.width / 2, y: sb.top + sb.height * .55 };

    gsap.set(els.word, { opacity: 0, scale: 1.25 });
    gsap.set(els.glow, { opacity: 0, scale: .6 });
    gsap.set([els.back, els.front], { y: () => sb.height * .22, opacity: 0, scale: .82, filter: 'blur(12px)' });
    gsap.set(els.steam, { strokeDasharray: 220, strokeDashoffset: 220, opacity: 0 });
    els.floats.forEach((f) => {
      const r = f.getBoundingClientRect();
      gsap.set(f, { x: centre.x - (r.left + r.width / 2), y: centre.y - (r.top + r.height / 2), scale: 0, opacity: 0, rotation: 0 });
    });
    gsap.set(words, { yPercent: 115, rotation: 4 });
    gsap.set(els.bits, { opacity: 0, y: 28 });
    gsap.set(els.badge, { scale: 0, rotation: -40 });
    gsap.set(els.metaItems, { opacity: 0, y: 20 });
    done();

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: () => { startIdle(); heroScroll(); } });
    tl.to(els.word, { opacity: 1, scale: 1, duration: 2.4, ease: 'expo.out' }, 0)
      .to(els.glow, { opacity: 1, scale: 1, duration: 2, ease: 'sine.out' }, 0)
      .to([els.back, els.front], { y: 0, opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.6, ease: 'expo.out' }, .15)
      // The pour starts: pasta rains from the top into the bowl.
      .add(() => { if (heroRain) { heroRain.start(); gsap.to(heroRain, { intensity: 1, duration: .8 }); } }, .7)
      .to(els.steam, { opacity: .55, strokeDashoffset: 0, duration: 2.2, stagger: .25, ease: 'sine.out' }, 1.1)
      .to(els.floats, {
        x: 0, y: 0, opacity: 1, duration: 1.8, ease: 'expo.out',
        scale: (i) => parseFloat(els.floats[i].style.getPropertyValue('--s')) || 1,
        rotation: (i) => parseFloat(els.floats[i].style.getPropertyValue('--r')) || 0,
        stagger: { each: .08, from: 'random' },
      }, 1.0)
      .to(words, { yPercent: 0, rotation: 0, duration: 1.3, ease: 'expo.out', stagger: .08 }, .55)
      .to(els.bits, { opacity: 1, y: 0, duration: 1, stagger: .12 }, .9)
      .to(els.badge, { scale: 1, rotation: -12, duration: 1.1, ease: 'elastic.out(1, .5)' }, 1.8)
      .to(els.metaItems, { opacity: 1, y: 0, duration: .9, stagger: .1 }, 1.6);
    // If no sprites loaded (old browser), still show a full bowl.
    if (!heroRain) tl.add(() => popPile(pileUses.length, true), 1);
    // Safety: never leave the pile half-empty.
    gsap.delayedCall(10, () => popPile(pileUses.length, true));
    return tl;
  }

  function startIdle() {
    const sine = { ease: 'sine.inOut', yoyo: true, repeat: -1 };
    idle.push(gsap.to(els.glow, { scale: 1.08, opacity: .8, duration: 5, ...sine }));
    idle.push(gsap.to(els.badge, { y: -8, rotation: -6, duration: 3.2, ...sine }));
    els.floats.forEach((f, i) => idle.push(gsap.to(f, {
      yPercent: gsap.utils.random(-28, 28), xPercent: gsap.utils.random(-18, 18), rotation: '+=' + gsap.utils.random(-25, 25),
      duration: gsap.utils.random(3.5, 6), delay: i * .2, ...sine,
    })));
    els.steam.forEach((s, i) => idle.push(gsap.fromTo(s, { strokeDashoffset: 0, opacity: .55 }, {
      strokeDashoffset: -220, opacity: 0, duration: 3.6, delay: i * .9, repeat: -1, ease: 'sine.in',
    })));
    ScrollTrigger.create({ trigger: hero, start: 'top bottom', end: 'bottom top', onToggle: (self) => idle.forEach((t) => (self.isActive ? t.resume() : t.pause())) });
  }

  // ── 3. Hero scroll choreography ────────────────────────────
  function heroScroll() {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1025px)', () => {
      const toCenter = () => {
        const r = els.visual.getBoundingClientRect();
        return window.innerWidth / 2 - (r.left - gsap.getProperty(els.visual, 'x') + r.width / 2);
      };
      const S = { spread: 1 };
      gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: hero, start: 'top top', end: '+=85%', pin: true, scrub: .8, invalidateOnRefresh: true, anticipatePin: 1, refreshPriority: 1 },
      })
        .to(els.copy, { y: -110, opacity: 0, duration: .5, ease: 'power1.in' }, 0)
        .to(els.cue, { opacity: 0, duration: .2 }, 0)
        .to(els.visual, { x: toCenter, duration: 1, ease: 'power2.inOut' }, 0)
        .to(els.stage, { scale: 1.22, yPercent: 6, duration: 1, ease: 'power1.inOut' }, 0)
        .to(els.word, { scale: 1.6, yPercent: -12, opacity: .5, duration: 1 }, 0)
        .to(els.floats, { x: (i) => (i % 2 ? 1 : -1) * gsap.utils.random(180, 360), y: () => gsap.utils.random(-260, 140), scale: 1.4, duration: 1 }, 0)
        .to(els.badge, { scale: .6, opacity: 0, duration: .4 }, 0)
        .to(S, { spread: 2.2, duration: 1, onUpdate: () => { if (heroRain) { heroRain.spread = S.spread; heroRain.boost = (S.spread - 1) * .8; } } }, 0);
      return () => { if (heroRain) { heroRain.spread = 1; heroRain.boost = 0; } };
    });
    mm.add('(max-width: 1024px)', () => {
      gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .6 } })
        .to(els.stage, { yPercent: -8, scale: 1.08, duration: 1 }, 0)
        .to(els.word, { yPercent: -30, duration: 1 }, 0)
        .to(els.floats, { y: (i) => (i % 2 ? -1 : 1) * 70, duration: 1 }, 0);
    });
    // Created after the other pins: put it back in page order before measuring.
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  }

  // ── 4. Marquee (direction and skew follow the scroll) ──────
  function marquee() {
    const track = $('[data-marquee-track]');
    if (!track) return;
    track.innerHTML += track.innerHTML; // seamless loop
    const loop = gsap.to(track, { xPercent: -50, duration: 22, ease: 'none', repeat: -1 });
    const skew = gsap.quickTo(track, 'skewX', { duration: .4, ease: 'power3' });
    let dir = 1, ts = 1;
    // Scrolling pushes the strip faster in the scroll direction; it eases back on its own.
    const decay = () => { ts += (dir - ts) * .06; loop.timeScale(ts); skew(gsap.utils.clamp(-12, 12, (dir - ts) * 2.4)); };
    ScrollTrigger.create({
      trigger: '[data-marquee]', start: 'top bottom', end: 'bottom top',
      onUpdate: (self) => {
        dir = self.direction || dir;
        const boost = dir * (1 + Math.min(Math.abs(self.getVelocity()) / 260, 6));
        if (Math.abs(boost) > Math.abs(ts) || Math.sign(boost) !== Math.sign(ts)) ts = boost;
      },
      onToggle: (self) => { if (self.isActive) { loop.resume(); gsap.ticker.add(decay); } else { loop.pause(); gsap.ticker.remove(decay); } },
    });
  }

  // ── 5. How it works: pinned horizontal track on desktop ────
  function steps() {
    const section = $('[data-steps]'), track = $('[data-steps-track]');
    if (!section || !track) return;
    const panels = $$('[data-step]', track);
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1025px)', () => {
      const distance = () => track.scrollWidth - window.innerWidth + parseFloat(getComputedStyle(track).paddingLeft || 0);
      const move = gsap.to(track, {
        x: () => -distance(), ease: 'none',
        scrollTrigger: { trigger: section, start: () => 'top top+=' + headerH(), end: () => '+=' + distance(), pin: true, scrub: .7, invalidateOnRefresh: true, anticipatePin: 1 },
      });
      panels.forEach((panel) => {
        const art = $('[data-step-art]', panel), num = $('.step__num', panel), chips = $$('.step__chips span', panel);
        gsap.fromTo(art, { rotation: -60, scale: .6 }, { rotation: 40, scale: 1.05, ease: 'none', scrollTrigger: { trigger: panel, containerAnimation: move, start: 'left right', end: 'right left', scrub: true } });
        gsap.fromTo(num, { xPercent: 40 }, { xPercent: -40, ease: 'none', scrollTrigger: { trigger: panel, containerAnimation: move, start: 'left right', end: 'right left', scrub: true } });
        if (chips.length) gsap.from(chips, { y: 30, opacity: 0, stagger: .05, duration: .6, ease: 'back.out(2)', scrollTrigger: { trigger: panel, containerAnimation: move, start: 'left 70%' } });
      });
    });
    mm.add('(max-width: 1024px)', () => {
      panels.forEach((panel) => {
        gsap.from(panel, { y: 70, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: panel, start: 'top 88%', once: true } });
        gsap.fromTo($('[data-step-art]', panel), { rotation: -40 }, { rotation: 40, ease: 'none', scrollTrigger: { trigger: panel, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    });
  }

  // ── 6. Headings + menu cards + checkout ────────────────────
  function heads() {
    $$('[data-head]').forEach((head) => {
      const words = splitWords($('.display', head));
      const extras = $$('.eyebrow, p:not(.eyebrow)', head);
      gsap.set(words, { yPercent: 115 });
      gsap.set(extras, { opacity: 0, y: 18 });
      gsap.timeline({ scrollTrigger: { trigger: head, start: 'top 86%', once: true } })
        .to(words, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: .05 })
        .to(extras, { opacity: 1, y: 0, duration: .8, ease: 'power2.out', stagger: .08 }, .15);
    });
    const cart = $('.cartPanel');
    if (cart) gsap.from($$('.eyebrow, .display, .cartEmpty, .cartLines', cart), { y: 40, opacity: 0, duration: 1, ease: 'power3.out', stagger: .1, scrollTrigger: { trigger: cart, start: 'top 80%', once: true } });
    const form = $('.checkoutForm');
    if (form) gsap.from(form.children, { y: 30, opacity: 0, duration: .8, ease: 'power3.out', stagger: .06, scrollTrigger: { trigger: form, start: 'top 80%', once: true } });
  }

  let cardsSeen = false, cardTriggers = [];
  function cards() {
    const list = $$('[data-card]');
    cardTriggers.forEach((t) => t.kill());
    cardTriggers = [];
    if (!list.length) return;
    const media = list.map((c) => $('.card__media > *', c)).filter(Boolean);
    const bodies = list.map((c) => $('.card__body', c));
    const reveal = (batch) => {
      gsap.to(batch, { clipPath: 'inset(0% 0% 0% 0% round 28px)', duration: 1.4, ease: 'expo.inOut', stagger: .14 });
      gsap.to(batch.map((c) => $('.card__media > *', c)).filter(Boolean), { scale: 1.06, duration: 2, ease: 'expo.out', stagger: .14 });
      gsap.to(batch.map((c) => $('.card__body', c)), { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: .14, delay: .5 });
    };
    gsap.set(list, { clipPath: 'inset(100% 0% 0% 0% round 28px)' });
    gsap.set(media, { scale: 1.35 });
    gsap.set(bodies, { opacity: 0, y: 30 });
    if (cardsSeen) reveal(list);
    else { cardsSeen = true; cardTriggers.push(...ScrollTrigger.batch(list, { start: 'top 88%', once: true, onEnter: reveal })); }
    list.forEach((c) => {
      const m = $('.card__media', c), inner = $('.card__media > *', c);
      if (inner) cardTriggers.push(gsap.fromTo(inner, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: true } }).scrollTrigger);
      // Tilt towards the pointer.
      const rx = gsap.quickTo(c, 'rotationX', { duration: .5, ease: 'power3' }), ry = gsap.quickTo(c, 'rotationY', { duration: .5, ease: 'power3' });
      c.addEventListener('pointermove', (e) => { const r = c.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - .5) * 8); rx(-((e.clientY - r.top) / r.height - .5) * 8); });
      c.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
    ScrollTrigger.refresh();
  }

  // ── 7. Footer: the word fills with tomato sauce ────────────
  function footer() {
    const word = $('[data-footer-word]');
    if (!word) return;
    gsap.fromTo(word, { '--fill': '0%' }, { '--fill': '100%', ease: 'none', scrollTrigger: { trigger: word, start: 'top 95%', end: 'bottom bottom', scrub: .6 } });
    gsap.from($$('.footer__outline, .footer__fill', word), { yPercent: 40, ease: 'none', scrollTrigger: { trigger: word, start: 'top bottom', end: 'bottom bottom', scrub: true } });
  }

  // ── 8. Interactions: fly-to-cart, builder, nav ─────────────
  const flyLayer = $('[data-fly-layer]');
  const shapes = ['penne', 'farfalle', 'fusilli', 'fettuccine'];
  function piece(name, size) {
    const s = document.createElement('span');
    s.className = 'fly';
    s.style.width = s.style.height = size + 'px';
    s.innerHTML = `<svg><use href="#pa-${name}"/></svg>`;
    flyLayer.appendChild(s);
    return s;
  }

  document.addEventListener('pastino:added', (e) => {
    const pill = $('[data-cart-pill]');
    const src = e.detail?.source;
    if (!pill || !flyLayer) return;
    const from = src && src.isConnected ? src.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
    const to = pill.getBoundingClientRect();
    const fx = from.left + from.width / 2, fy = from.top + from.height / 2;
    const count = Math.min(6, 2 + (e.detail?.quantity || 1));
    for (let i = 0; i < count; i++) {
      const el = piece(shapes[i % shapes.length], 46);
      gsap.set(el, { x: fx - 23, y: fy - 23, scale: .4, rotation: gsap.utils.random(-180, 180) });
      const tx = to.left + to.width / 2 - 23, ty = to.top + to.height / 2 - 23;
      const burstX = fx - 23 + gsap.utils.random(-90, 90), burstY = fy - 23 + gsap.utils.random(-120, -40);
      gsap.timeline({ delay: i * .06, onComplete: () => el.remove() })
        .to(el, { x: burstX, y: burstY, scale: 1, rotation: '+=180', duration: .35, ease: 'power2.out' })
        .to(el, { x: tx, duration: .7, ease: 'power1.inOut' })
        .to(el, { y: ty, duration: .7, ease: 'back.in(1.6)' }, '<')
        .to(el, { scale: .3, rotation: '+=240', duration: .7, ease: 'power1.in' }, '<');
    }
    gsap.timeline({ delay: .95 + count * .06 })
      .fromTo(pill, { scale: 1 }, { scale: 1.22, duration: .16, ease: 'power2.out' })
      .to(pill, { scale: 1, duration: .7, ease: 'elastic.out(1, .4)' });
    gsap.fromTo('#cartCount', { yPercent: -120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .5, ease: 'back.out(3)', delay: 1 + count * .06 });
  });

  document.addEventListener('pastino:builder', (e) => {
    if (!e.detail?.open) return;
    const modal = $('[data-modal]');
    gsap.fromTo('#builderBackdrop', { opacity: 0 }, { opacity: 1, duration: .35, ease: 'power2.out' });
    gsap.fromTo(modal, { y: 80, scale: .96, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: .8, ease: 'expo.out' });
    gsap.fromTo($$('.modal__media > *', modal), { scale: 1.3 }, { scale: 1, duration: 1.4, ease: 'expo.out' });
    gsap.fromTo($$('.choice', modal), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .7, ease: 'power3.out', stagger: .07, delay: .15 });
  });

  document.addEventListener('pastino:pick', (e) => {
    const chip = document.querySelector(`#builderChoices [data-id="${CSS.escape(e.detail.id)}"]`);
    if (!chip) return;
    gsap.fromTo(chip, { scale: .86 }, { scale: 1, duration: .6, ease: 'elastic.out(1, .45)' });
    if (chip.classList.contains('active')) {
      const r = chip.getBoundingClientRect();
      for (let i = 0; i < 4; i++) {
        const el = piece(shapes[(i + r.left | 0) % shapes.length], 26);
        gsap.set(el, { x: r.left + r.width / 2 - 13, y: r.top + r.height / 2 - 13, scale: .3 });
        gsap.to(el, { x: `+=${gsap.utils.random(-70, 70)}`, y: `+=${gsap.utils.random(-80, -20)}`, rotation: gsap.utils.random(-200, 200), scale: 1, opacity: 0, duration: .8, ease: 'power2.out', onComplete: () => el.remove() });
      }
    }
  });

  function nav() {
    const header = $('#siteHeader');
    if (!header) return;
    ScrollTrigger.create({
      start: 80, end: 'max',
      onUpdate: (self) => {
        header.classList.toggle('is-scrolled', self.scroll() > 80);
        if (!document.body.classList.contains('is-locked')) header.classList.toggle('is-hidden', self.direction === 1 && self.scroll() > 600);
      },
    });
  }

  document.addEventListener('pastino:menu', () => { cards(); });

  // ── Boot ───────────────────────────────────────────────────
  const boot = async () => {
    try {
      const curtainDone = playCurtain();
      const img = await spritesReady;
      setupRains(img);
      await Promise.all([curtainDone, storeReady]);
      intro();
      marquee();
      steps();
      heads();
      footer();
      nav();
      if (!cardsSeen && $$('[data-card]').length) cards();
      ScrollTrigger.refresh();
    } catch (e) {
      console.error(e);
      if (curtain && curtain.isConnected) curtain.remove();
      gsap.set('[data-hero] [data-cine], [data-stage] > *, [data-stage] use', { clearProps: 'all' });
      done();
    }
  };
  boot();

  window.addEventListener('load', () => ScrollTrigger.refresh());
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (heroRain) heroRain.resize(); if (ambient) ambient.resize(); }, 150); });
})();
