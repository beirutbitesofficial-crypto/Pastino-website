<!doctype html>
<html lang="en" class="no-js">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#3b0a0d">
  <title>Pastino | Fresh Pasta, Built Your Way</title>
  <meta name="description" content="Build your Pastino pasta online — choose your size, pasta, sauce and toppings — and order for delivery or takeaway.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,500..900,100;1,9..144,500..900,100&family=Manrope:wght@400;600;700;800&display=swap">
  <link rel="stylesheet" href="assets/site.css?v=2">
  <script>/* Hide animated layers until the motion script takes over (never longer than 3.5s). */
    (function (d) { d.classList.remove('no-js'); if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      d.classList.add('cine-pending'); try { if (sessionStorage.getItem('pastino-curtain') === '1') d.classList.add('curtain-seen'); } catch (e) {} setTimeout(function () { d.classList.remove('cine-pending'); }, 3500); })(document.documentElement);</script>
</head>
<body>
  <!-- Intro curtain: the letters drop in like pasta, then the curtain lifts. -->
  <div class="curtain" data-curtain aria-hidden="true">
    <div class="curtain__word"><span>P</span><span>A</span><span>S</span><span>T</span><span>I</span><span>N</span><span>O</span></div>
    <div class="curtain__bar"><i data-curtain-bar></i></div>
  </div>

  <canvas class="rain" data-rain aria-hidden="true"></canvas>

  <header class="nav" id="siteHeader">
    <a class="logo" href="#top" aria-label="Pastino home">PASTINO<span>.</span></a>
    <nav class="nav__links" aria-label="Main">
      <a href="#how">How it works</a>
      <a href="#menu">Menu</a>
      <a href="#order">Checkout</a>
    </nav>
    <a class="cartPill" href="#order" data-cart-pill aria-label="Go to your order">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9h18l-1.6 9.2a2 2 0 0 1-2 1.8H6.6a2 2 0 0 1-2-1.8L3 9Z"/><path d="M8 9V7a4 4 0 0 1 8 0v2"/></svg>
      <span class="cartPill__label">Order</span>
      <b id="cartCount">0</b>
    </a>
  </header>

  <main>
    <section id="top" class="hero" data-hero>
      <div class="hero__word" data-hero-word aria-hidden="true">PASTA</div>
      <div class="hero__grid">
        <div class="hero__copy" data-hero-copy>
          <p class="eyebrow" data-cine>Fresh <i>•</i> Fast <i>•</i> Your way</p>
          <h1 class="hero__title" id="heroTitle" data-hero-title>Pasta made your way.</h1>
          <p class="hero__lede" id="heroSubtitle" data-cine>Pick your size, pasta, sauce and toppings. We prepare it fresh and send your order straight to Pastino.</p>
          <div class="hero__actions" data-cine>
            <a class="btn btn--gold" href="#menu">Build your bowl <span aria-hidden="true">→</span></a>
            <a class="btn btn--ghost" href="#how">How it works</a>
          </div>
          <dl class="hero__meta" data-hero-meta>
            <div data-cine><dt>Sizes</dt><dd id="metaSizes">3</dd></div>
            <div data-cine><dt>Combinations</dt><dd id="metaCombos">500+</dd></div>
            <div data-cine><dt>Made</dt><dd>Fresh</dd></div>
          </dl>
        </div>

        <div class="hero__visual" data-hero-visual aria-hidden="true">
          <div class="stage" data-stage>
            <span class="stage__glow" data-glow></span>
            <svg class="bowl bowl--back" data-bowl-back viewBox="0 0 400 300">
              <defs>
                <radialGradient id="bowlInside" cx="50%" cy="30%" r="70%"><stop offset="0" stop-color="#5a0b10"/><stop offset="1" stop-color="#2a0507"/></radialGradient>
                <clipPath id="pileClip"><path d="M14 112 C24 -20 376 -20 386 112 A186 44 0 0 1 14 112Z"/></clipPath>
              </defs>
              <ellipse cx="200" cy="112" rx="186" ry="44" fill="url(#bowlInside)"/>
              <g clip-path="url(#pileClip)"><g data-pile></g></g>
            </svg>
            <canvas class="stage__rain" data-hero-rain></canvas>
            <svg class="bowl bowl--front" data-bowl-front viewBox="0 0 400 300">
              <defs>
                <linearGradient id="bowlBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset=".55" stop-color="#f3e2c3"/><stop offset="1" stop-color="#cdb48a"/></linearGradient>
                <linearGradient id="bowlShine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".3" stop-color="#fff" stop-opacity=".75"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>
              </defs>
              <path d="M14 112 A186 44 0 0 0 386 112 C380 214 306 276 200 276 C94 276 20 214 14 112Z" fill="url(#bowlBody)"/>
              <path d="M30 168 C80 196 320 196 370 168 L362 186 C310 214 90 214 38 186Z" fill="#b3121b"/>
              <text x="200" y="236" text-anchor="middle" class="bowl__brand">PASTINO</text>
              <path d="M14 112 A186 44 0 0 0 386 112 C380 214 306 276 200 276 C94 276 20 214 14 112Z" fill="url(#bowlShine)" opacity=".7"/>
              <ellipse cx="200" cy="112" rx="186" ry="44" fill="none" stroke="#fffaf0" stroke-width="8"/>
              <ellipse cx="200" cy="112" rx="186" ry="44" fill="none" stroke="#d9c39b" stroke-width="2" transform="translate(0 4)"/>
            </svg>
            <svg class="stage__steam" data-steam viewBox="0 0 200 160">
              <path d="M60 150 C40 120 80 100 60 70 C40 40 70 20 60 0"/>
              <path d="M100 150 C80 115 120 95 100 60 C85 35 110 20 100 5"/>
              <path d="M140 150 C120 120 160 100 140 70 C120 45 150 25 140 8"/>
            </svg>
            <span class="stage__shadow"></span>
            <div class="stage__floats" data-floats>
              <span class="float" data-float style="--x:4%;--y:18%;--r:-24deg;--s:1"><svg><use href="#pa-basil"/></svg></span>
              <span class="float" data-float style="--x:84%;--y:10%;--r:30deg;--s:.8"><svg><use href="#pa-tomato"/></svg></span>
              <span class="float" data-float style="--x:90%;--y:54%;--r:60deg;--s:.9"><svg><use href="#pa-basil"/></svg></span>
              <span class="float" data-float style="--x:-2%;--y:62%;--r:12deg;--s:.75"><svg><use href="#pa-cheese"/></svg></span>
              <span class="float" data-float style="--x:70%;--y:-6%;--r:-50deg;--s:.65"><svg><use href="#pa-farfalle"/></svg></span>
              <span class="float" data-float style="--x:18%;--y:-4%;--r:40deg;--s:.6"><svg><use href="#pa-penne"/></svg></span>
            </div>
            <div class="stage__badge" data-badge><small>From</small><b id="fromPrice">$7</b></div>
          </div>
        </div>
      </div>
      <a class="hero__cue" href="#how" data-cine aria-label="Scroll down"><span></span></a>
    </section>

    <div class="marquee" data-marquee aria-hidden="true">
      <div class="marquee__track" data-marquee-track>
        <span>Penne</span><i>✦</i><span>Fusilli</span><i>✦</i><span>Fettuccine</span><i>✦</i><span>Farfalle</span><i>✦</i><span>Alfredo</span><i>✦</i><span>Pomodoro</span><i>✦</i>
      </div>
    </div>

    <section id="how" class="steps" data-steps>
      <div class="steps__head" data-head>
        <p class="eyebrow eyebrow--dark">How it works</p>
        <h2 class="display">Four moves to your perfect bowl.</h2>
      </div>
      <div class="steps__track" data-steps-track>
        <article class="step step--cream" data-step>
          <div class="step__num">01</div>
          <div class="step__art"><svg data-step-art><use href="#pa-penne"/></svg></div>
          <div class="step__body"><h3>Pick your pasta</h3><p>Every bowl starts with a shape. Ridged, twisted, ribboned or bow-tied.</p><div class="step__chips" data-step-kind="pasta"></div></div>
        </article>
        <article class="step step--tomato" data-step>
          <div class="step__num">02</div>
          <div class="step__art"><svg data-step-art><use href="#pa-tomato"/></svg></div>
          <div class="step__body"><h3>Choose the sauce</h3><p>Slow-cooked tomato or silky alfredo — or both on The Signature.</p><div class="step__chips" data-step-kind="sauce"></div></div>
        </article>
        <article class="step step--basil" data-step>
          <div class="step__num">03</div>
          <div class="step__art"><svg data-step-art><use href="#pa-basil"/></svg></div>
          <div class="step__body"><h3>Load the toppings</h3><p>Grilled chicken, shrimp, mushrooms, peppers. Your size decides how many.</p><div class="step__chips" data-step-kind="topping"></div></div>
        </article>
        <article class="step step--gold" data-step>
          <div class="step__num">04</div>
          <div class="step__art"><svg data-step-art><use href="#pa-cheese"/></svg></div>
          <div class="step__body"><h3>Finish with cheese</h3><p>A shower of parmesan or a melt of mozzarella. Then we cook it fresh.</p><div class="step__chips" data-step-kind="cheese"></div></div>
        </article>
      </div>
    </section>

    <section id="menu" class="menu">
      <div class="menu__head" data-head>
        <div>
          <p class="eyebrow eyebrow--dark">The menu</p>
          <h2 class="display">Choose your size.</h2>
        </div>
        <p class="menu__lede">Pick the bowl, then make it completely yours. Prices and availability come live from the Pastino kitchen.</p>
      </div>
      <div class="tabs hidden" id="menuTabs" role="tablist" aria-label="Menu categories"></div>
      <div id="siteMessage" role="alert"></div>
      <div id="menuCards" class="cards" data-cards><div class="loading">Loading menu…</div></div>
    </section>

    <section id="order" class="checkout">
      <div class="cartPanel">
        <p class="eyebrow">Your order</p>
        <h2 class="display display--light" id="cartTitle">Your bowl is waiting.</h2>
        <div id="cartLines" class="cartLines"></div>
        <div class="cartEmpty" id="cartEmpty">
          <svg aria-hidden="true"><use href="#pa-fusilli"/></svg>
          <p>Nothing here yet. <a href="#menu">Build your first bowl →</a></p>
        </div>
      </div>
      <div class="checkoutForm">
        <div class="switch" role="group" aria-label="Order type">
          <button type="button" data-order-type="takeaway" class="active">Takeaway</button>
          <button type="button" data-order-type="delivery">Delivery</button>
        </div>
        <div class="grid2">
          <label class="field"><span>Name</span><input id="customerName" placeholder="Your name" autocomplete="name"></label>
          <label class="field"><span>Phone</span><input id="phone" placeholder="Phone number" autocomplete="tel" inputmode="tel"></label>
        </div>
        <label class="field hidden" id="addressField"><span>Delivery address</span><input id="address" placeholder="Building, street, area" autocomplete="street-address"></label>
        <label class="field"><span>Notes</span><textarea id="notes" placeholder="Anything we should know? (optional)"></textarea></label>
        <div class="totals">
          <div><span>Subtotal</span><b id="subtotal">USD 0.00</b></div>
          <div id="deliveryRow" class="hidden"><span>Delivery</span><b id="deliveryFee">USD 0.00</b></div>
          <div class="totals__grand"><span>Total</span><b id="total">USD 0.00</b></div>
        </div>
        <div id="checkoutMessage" role="alert"></div>
        <button id="checkoutButton" class="btn btn--tomato btn--full" type="button">Place order & continue to WhatsApp</button>
        <small class="fine">Your order is saved to Pastino before WhatsApp opens.</small>
      </div>
    </section>
  </main>

  <footer class="footer" data-footer>
    <div class="footer__word" data-footer-word aria-hidden="true">
      <span class="footer__outline">PASTINO</span>
      <span class="footer__fill">PASTINO</span>
    </div>
    <div class="footer__row">
      <b>PASTINO.</b>
      <span>Fresh pasta. Built your way.</span>
      <a href="#top">Back to top ↑</a>
    </div>
  </footer>

  <div id="builderBackdrop" class="modalBack hidden" role="dialog" aria-modal="true" aria-labelledby="builderTitle">
    <div class="modal" data-modal>
      <button id="closeBuilder" class="modal__close" type="button" aria-label="Close">×</button>
      <div class="modal__media" id="builderMedia"></div>
      <div class="modal__body">
        <p class="eyebrow eyebrow--dark">Build your bowl</p>
        <h2 class="display" id="builderTitle">Build your pasta</h2>
        <p id="builderDescription" class="modal__desc"></p>
        <div id="builderChoices"></div>
        <div id="builderMessage" role="alert"></div>
      </div>
      <div class="modal__foot">
        <div class="qty" aria-label="Quantity">
          <button type="button" id="qtyMinus" aria-label="Fewer">−</button>
          <b id="qtyValue">1</b>
          <button type="button" id="qtyPlus" aria-label="More">+</button>
        </div>
        <button id="addToCart" class="btn btn--tomato" type="button">Add to order · <span id="builderPrice">USD 0.00</span></button>
      </div>
    </div>
  </div>

  <div class="flyLayer" data-fly-layer aria-hidden="true"></div>

  <!-- Pasta & ingredient art, shared by the page (<use>) and the falling-pasta canvases. -->
  <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false" data-pasta-sprite>
    <defs>
      <linearGradient id="pgDough" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe6a6"/><stop offset=".5" stop-color="#f4b84a"/><stop offset="1" stop-color="#c97c16"/></linearGradient>
      <linearGradient id="pgDoughLight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0c4"/><stop offset="1" stop-color="#e9a83a"/></linearGradient>
      <radialGradient id="pgTomato" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#ff7a5c"/><stop offset=".55" stop-color="#d4191f"/><stop offset="1" stop-color="#7d0c12"/></radialGradient>
      <linearGradient id="pgBasil" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7cc46a"/><stop offset=".6" stop-color="#2f7a3f"/><stop offset="1" stop-color="#174d2b"/></linearGradient>
      <linearGradient id="pgCheese" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff7d6"/><stop offset="1" stop-color="#f1cf6b"/></linearGradient>
      <symbol id="pa-penne" viewBox="0 0 100 100"><g transform="rotate(-38 50 50)"><path d="M10 64 L24 36 L90 36 L76 64Z" fill="url(#pgDough)"/><path d="M20 43H84M17 50H82M14 57H79" stroke="#a65c0c" stroke-opacity=".35" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="83" cy="50" rx="6.5" ry="14" transform="rotate(26 83 50)" fill="#ffe3a0"/><ellipse cx="83" cy="50" rx="3.6" ry="9.5" transform="rotate(26 83 50)" fill="#8a4708"/></g></symbol>
      <symbol id="pa-farfalle" viewBox="0 0 100 100"><path d="M50 50C42 32 26 18 12 22 6 26 4 34 7 40 4 46 4 54 7 60 4 66 6 74 12 78 26 82 42 68 50 50Z" fill="url(#pgDough)"/><path d="M50 50C58 32 74 18 88 22 94 26 96 34 93 40 96 46 96 54 93 60 96 66 94 74 88 78 74 82 58 68 50 50Z" fill="url(#pgDough)"/><path d="M46 50 18 32M46 50 14 50M46 50 18 68M54 50 82 32M54 50 86 50M54 50 82 68" stroke="#a65c0c" stroke-opacity=".3" stroke-width="2" stroke-linecap="round"/><ellipse cx="50" cy="50" rx="6" ry="12" fill="url(#pgDoughLight)" stroke="#b56a10" stroke-opacity=".4" stroke-width="1.5"/></symbol>
      <symbol id="pa-fusilli" viewBox="0 0 100 100"><g transform="rotate(-30 50 50)"><ellipse cx="50" cy="16" rx="22" ry="8" transform="rotate(-18 50 16)" fill="#f4b84a"/><ellipse cx="50" cy="30" rx="23" ry="8" transform="rotate(-18 50 30)" fill="#e09a2c"/><ellipse cx="50" cy="44" rx="23" ry="8" transform="rotate(-18 50 44)" fill="#f7c35e"/><ellipse cx="50" cy="58" rx="23" ry="8" transform="rotate(-18 50 58)" fill="#e09a2c"/><ellipse cx="50" cy="72" rx="22" ry="8" transform="rotate(-18 50 72)" fill="#f7c35e"/><ellipse cx="50" cy="85" rx="18" ry="7" transform="rotate(-18 50 85)" fill="#d48a22"/><path d="M34 20C46 18 58 26 66 22M34 34C46 32 58 40 66 36M34 48C46 46 58 54 66 50M34 62C46 60 58 68 66 64M36 76C46 74 58 82 64 78" stroke="#fff3c8" stroke-opacity=".6" stroke-width="2.4" fill="none" stroke-linecap="round"/></g></symbol>
      <symbol id="pa-fettuccine" viewBox="0 0 100 100"><path d="M8 70C22 30 40 86 56 50S84 20 94 34" fill="none" stroke="#c97c16" stroke-width="13" stroke-linecap="round"/><path d="M8 70C22 30 40 86 56 50S84 20 94 34" fill="none" stroke="url(#pgDoughLight)" stroke-width="9" stroke-linecap="round"/><path d="M10 66C24 30 40 80 56 46S82 18 92 30" fill="none" stroke="#fff6d8" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/></symbol>
      <symbol id="pa-basil" viewBox="0 0 100 100"><path d="M50 94C20 74 14 38 50 8 86 38 80 74 50 94Z" fill="url(#pgBasil)"/><path d="M50 90V16M50 40 34 28M50 54 30 44M50 68 34 62M50 40 66 28M50 54 70 44M50 68 66 62" stroke="#c8f0b4" stroke-opacity=".45" stroke-width="2" stroke-linecap="round" fill="none"/></symbol>
      <symbol id="pa-tomato" viewBox="0 0 100 100"><circle cx="50" cy="54" r="38" fill="url(#pgTomato)"/><ellipse cx="38" cy="40" rx="9" ry="6" transform="rotate(-30 38 40)" fill="#fff" fill-opacity=".45"/><path d="M50 20 42 10 50 16 56 6 56 18 68 14 58 22" fill="#2f7a3f" stroke="#2f7a3f" stroke-width="3" stroke-linejoin="round"/></symbol>
      <symbol id="pa-cheese" viewBox="0 0 100 100"><path d="M10 70 60 22 92 50 92 78 10 78Z" fill="url(#pgCheese)"/><path d="M10 70 60 22 92 50Z" fill="#fff9e3"/><circle cx="40" cy="64" r="6" fill="#e5b84a"/><circle cx="70" cy="62" r="4.5" fill="#e5b84a"/><circle cx="78" cy="72" r="3" fill="#e5b84a"/></symbol>
    </defs>
  </svg>

  <script src="assets/vendor/gsap/gsap.min.js?v=3.13.0" defer></script>
  <script src="assets/vendor/gsap/ScrollTrigger.min.js?v=3.13.0" defer></script>
  <script src="assets/motion/pasta-rain.js?v=2" defer></script>
  <script src="assets/app.js?v=2" defer></script>
  <script src="assets/motion/home.js?v=2" defer></script>
</body>
</html>
