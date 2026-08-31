<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#921414">
  <title>Pastino | Fresh Pasta</title>
  <meta name="description" content="Build your Pastino pasta online and order for delivery or takeaway.">
  <link rel="stylesheet" href="assets/style.css?v=1">
</head>
<body>
  <header class="nav">
    <a class="logo" href="#top">PASTINO<span>.</span></a>
    <a class="navlink" href="#menu">Order online</a>
  </header>

  <main>
    <section id="top" class="hero">
      <div class="heroCopy">
        <div class="eyebrow">FRESH • FAST • YOUR WAY</div>
        <h1 id="heroTitle">Pasta made your way.</h1>
        <p id="heroSubtitle">Pick your size, pasta, sauce and toppings. We prepare it fresh.</p>
        <a class="primary" href="#menu">Build your pasta →</a>
      </div>
      <div class="heroArt">
        <div class="stamp">PASTA<br>MADE<br>FRESH</div>
        <div class="bowl" aria-hidden="true">🍝</div>
      </div>
    </section>

    <section id="menu" class="section">
      <div class="sectionHead">
        <div><div class="eyebrow dark">THE MENU</div><h2>Choose your size.</h2></div>
        <p>Pick the bowl, then make it completely yours.</p>
      </div>
      <div id="siteMessage"></div>
      <div id="menuCards" class="cards"><div class="loading">Loading menu…</div></div>
    </section>

    <section class="checkout">
      <div class="cartPanel">
        <div class="eyebrow">YOUR ORDER</div>
        <h2 id="cartTitle">Your cart is waiting.</h2>
        <div id="cartLines"></div>
      </div>
      <div class="checkoutForm">
        <div class="switch">
          <button type="button" data-order-type="takeaway" class="active">Takeaway</button>
          <button type="button" data-order-type="delivery">Delivery</button>
        </div>
        <div class="grid2">
          <input id="customerName" placeholder="Your name" autocomplete="name">
          <input id="phone" placeholder="Phone number" autocomplete="tel">
        </div>
        <input id="address" class="hidden" placeholder="Delivery address" autocomplete="street-address">
        <textarea id="notes" placeholder="Notes (optional)"></textarea>
        <div class="total"><span>Total</span><b id="total">USD 0.00</b></div>
        <button id="checkoutButton" class="primary full" type="button">Place order & continue to WhatsApp</button>
        <small class="fine">Your order is saved to Pastino before WhatsApp opens.</small>
      </div>
    </section>
  </main>

  <footer><b>PASTINO.</b><span>Fresh pasta. Built your way.</span></footer>

  <div id="builderBackdrop" class="modalBack hidden" role="dialog" aria-modal="true">
    <div class="modal">
      <button id="closeBuilder" class="close" type="button" aria-label="Close">×</button>
      <div class="eyebrow dark">BUILD YOUR BOWL</div>
      <h2 id="builderTitle">Build your pasta</h2>
      <p id="builderDescription"></p>
      <div id="builderChoices"></div>
      <div id="builderMessage"></div>
      <button id="addToCart" class="primary full" type="button">Add to order</button>
    </div>
  </div>

  <script src="assets/app.js?v=1" defer></script>
</body>
</html>
