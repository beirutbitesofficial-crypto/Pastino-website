(() => {
  const kinds = ['pasta', 'sauce', 'topping', 'cheese'];
  const cartKey = 'pastino-web-cart-v2';
  const state = { store: null, cart: [], selected: null, draft: null, orderType: 'takeaway', category: '' };
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const money = (n) => `${state.store?.settings.currency || 'USD'} ${Number(n || 0).toFixed(2)}`;
  const emit = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }));

  // Same portion rules as the Pastino POS (synced per menu item).
  const portion = (item) => item?.portion || { pasta: 1, sauce: 1, topping: 2 };
  const limit = (item, kind) => kind === 'cheese' ? 99 : portion(item)[kind];

  async function api(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Request failed.');
    return data;
  }

  function message(text, target = $('siteMessage')) {
    target.innerHTML = text ? `<div class="error">${esc(text)}</div>` : '';
  }

  const itemById = (id) => state.store.menu.find((x) => x.id === id && x.available);
  const optionById = (id) => state.store.toppings.find((x) => x.id === id && x.available);
  const options = (kind) => state.store.toppings.filter((x) => x.kind === kind && x.available);
  const lineIds = (line) => kinds.flatMap((kind) => line.picks[kind] || []);

  // ── Menu ───────────────────────────────────────────────────
  function categories() {
    return [...new Set(state.store.menu.filter((x) => x.available).map((x) => x.category || 'Pasta'))];
  }

  function renderTabs() {
    const list = categories();
    if (!list.includes(state.category)) state.category = list[0] || '';
    $('menuTabs').classList.toggle('hidden', list.length < 2);
    $('menuTabs').innerHTML = list.map((c) => `<button type="button" role="tab" aria-selected="${c === state.category}" class="${c === state.category ? 'active' : ''}" data-category="${esc(c)}">${esc(c)}</button>`).join('');
    $('menuTabs').querySelectorAll('[data-category]').forEach((b) => b.addEventListener('click', () => { state.category = b.dataset.category; renderTabs(); renderMenu(); }));
  }

  function includes(item) {
    if (!item.customizable) return item.description;
    const p = portion(item);
    const bits = [];
    if (p.pasta) bits.push(`${p.pasta} pasta`);
    if (p.sauce) bits.push(`${p.sauce} sauce${p.sauce > 1 ? 's' : ''}`);
    if (p.topping) bits.push(`${p.topping} topping${p.topping > 1 ? 's' : ''}`);
    return bits.join(' · ');
  }

  const placeholder = (i) => `<svg class="card__placeholder" aria-hidden="true"><use href="#pa-${['penne', 'farfalle', 'fusilli', 'fettuccine'][i % 4]}"/></svg>`;

  function renderMenu() {
    const items = state.store.menu.filter((item) => item.available && (item.category || 'Pasta') === state.category);
    if (!items.length) { $('menuCards').innerHTML = '<div class="loading">The menu is being updated. Check back in a moment.</div>'; return; }
    $('menuCards').innerHTML = items.map((item, i) => `
      <article class="card" data-card>
        <div class="card__media">${item.image ? `<img src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy" decoding="async">` : placeholder(i)}</div>
        <span class="card__index">${String(i + 1).padStart(2, '0')}</span>
        <div class="card__body">
          <div class="card__top"><h3>${esc(item.name)}</h3><span class="card__price">${money(item.price)}</span></div>
          ${item.description ? `<p>${esc(item.description)}</p>` : ''}
          ${item.customizable && !item.description ? `<p class="card__includes">${esc(includes(item))}</p>` : ''}
          <button class="btn btn--dark btn--full" type="button" data-build="${esc(item.id)}">${item.customizable ? 'Build this bowl' : 'Add to order'} <span aria-hidden="true">→</span></button>
        </div>
      </article>`).join('');
    // A broken image link from the POS falls back to the pasta illustration.
    document.querySelectorAll('.card__media img').forEach((img, i) => img.addEventListener('error', () => { img.outerHTML = placeholder(i); }, { once: true }));
    document.querySelectorAll('[data-build]').forEach((button) => button.addEventListener('click', () => {
      const item = itemById(button.dataset.build);
      if (!item) return;
      if (item.customizable) openBuilder(item.id);
      else addLine({ menuItemId: item.id, quantity: 1, picks: {} }, button);
    }));
    emit('pastino:menu', { count: items.length });
  }

  function renderSteps() {
    document.querySelectorAll('[data-step-kind]').forEach((box) => {
      box.innerHTML = options(box.dataset.stepKind).map((o) => `<span>${esc(o.emoji)} ${esc(o.name)}</span>`).join('');
    });
  }

  function renderHero() {
    const s = state.store.settings;
    if (s.heroTitle) $('heroTitle').textContent = s.heroTitle;
    if (s.heroSubtitle) $('heroSubtitle').textContent = s.heroSubtitle;
    const pastas = state.store.menu.filter((x) => x.available && x.customizable);
    const prices = (pastas.length ? pastas : state.store.menu.filter((x) => x.available)).map((x) => Number(x.price));
    if (prices.length) $('fromPrice').textContent = `${s.currency === 'USD' ? '$' : s.currency + ' '}${Math.min(...prices).toFixed(Math.min(...prices) % 1 ? 2 : 0)}`;
    $('metaSizes').textContent = String(pastas.length || state.store.menu.length);
    // Rough count of distinct bowls: pasta × sauce × topping choices for the biggest size.
    const n = (k) => Math.max(1, options(k).length);
    const combos = pastas.length ? n('pasta') * n('sauce') * Math.pow(2, Math.min(n('topping'), 6)) * pastas.length : 0;
    if (combos) $('metaCombos').textContent = combos >= 100 ? `${Math.floor(combos / 100) * 100}+` : String(combos);
  }

  // ── Cart ───────────────────────────────────────────────────
  function linePrice(line) {
    const item = itemById(line.menuItemId);
    if (!item) return 0;
    return (Number(item.price) + lineIds(line).reduce((sum, id) => sum + Number(optionById(id)?.price || 0), 0)) * line.quantity;
  }

  function saveCart() {
    try { localStorage.setItem(cartKey, JSON.stringify(state.cart)); } catch { /* private mode */ }
  }

  function loadCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(cartKey) || '[]');
      // Drop anything the POS has removed or made unavailable since the visit.
      state.cart = Array.isArray(saved) ? saved.filter((line) => line && itemById(line.menuItemId) && lineIds({ picks: line.picks || {} }).every((id) => optionById(id))) : [];
    } catch { state.cart = []; }
  }

  function renderCart() {
    const count = state.cart.reduce((sum, line) => sum + line.quantity, 0);
    $('cartCount').textContent = String(count);
    $('cartTitle').textContent = count ? `${count} bowl${count > 1 ? 's' : ''} ready to cook` : 'Your bowl is waiting.';
    $('cartEmpty').classList.toggle('hidden', count > 0);
    $('cartLines').innerHTML = state.cart.map((line, index) => {
      const item = itemById(line.menuItemId);
      const labels = lineIds(line).map((id) => { const o = optionById(id); return o ? `${o.emoji} ${o.name}` : ''; }).filter(Boolean);
      return `<div class="cartLine" data-line="${index}">
        <div class="cartLine__info"><b>${esc(item?.name)}</b><small>${esc(labels.join(' · '))}</small></div>
        <div class="cartLine__side">
          <b>${money(linePrice(line))}</b>
          <div class="qty qty--small"><button type="button" data-dec="${index}" aria-label="Fewer">−</button><span>${line.quantity}</span><button type="button" data-inc="${index}" aria-label="More">+</button></div>
        </div>
      </div>`;
    }).join('');
    document.querySelectorAll('[data-inc]').forEach((b) => b.addEventListener('click', () => { const l = state.cart[+b.dataset.inc]; l.quantity = Math.min(20, l.quantity + 1); changed(); }));
    document.querySelectorAll('[data-dec]').forEach((b) => b.addEventListener('click', () => { const i = +b.dataset.dec; state.cart[i].quantity -= 1; if (state.cart[i].quantity < 1) state.cart.splice(i, 1); changed(); }));
    const subtotal = state.cart.reduce((sum, line) => sum + linePrice(line), 0);
    const fee = state.orderType === 'delivery' ? Number(state.store.settings.deliveryFee || 0) : 0;
    $('subtotal').textContent = money(subtotal);
    $('deliveryFee').textContent = money(fee);
    $('deliveryRow').classList.toggle('hidden', !(state.orderType === 'delivery' && fee > 0));
    $('total').textContent = money(subtotal + fee);
  }

  function changed() { saveCart(); renderCart(); }

  function addLine(line, source) {
    const same = state.cart.find((l) => l.menuItemId === line.menuItemId && JSON.stringify(l.picks) === JSON.stringify(line.picks));
    if (same) same.quantity = Math.min(20, same.quantity + line.quantity);
    else state.cart.push(line);
    changed();
    emit('pastino:added', { source, quantity: line.quantity });
  }

  // ── Builder ────────────────────────────────────────────────
  const titles = { pasta: 'Choose your pasta', sauce: 'Choose your sauce', topping: 'Add toppings', cheese: 'Finish with cheese' };

  function choiceGroup(kind) {
    const max = limit(state.selected, kind);
    const list = options(kind);
    if (!max || !list.length) return '';
    const picked = state.draft.picks[kind];
    const hint = kind === 'cheese' ? 'Optional · extra' : kind === 'topping' ? `Up to ${max}` : max > 1 ? `Pick 1–${max}` : 'Pick 1';
    const chips = list.map((o) => {
      const on = picked.includes(o.id);
      const full = !on && picked.length >= max && max > 1;
      return `<button type="button" class="chip ${on ? 'active' : ''}" ${full ? 'data-full' : ''} aria-pressed="${on}" data-kind="${kind}" data-id="${esc(o.id)}"><span class="chip__emoji">${esc(o.emoji)}</span>${esc(o.name)}${Number(o.price) > 0 ? `<em>+${money(o.price)}</em>` : ''}</button>`;
    }).join('');
    return `<div class="choice"><div class="choice__head"><h4>${titles[kind]}</h4><span class="choice__count ${picked.length ? 'is-on' : ''}">${kind === 'cheese' ? picked.length || '' : `${picked.length}/${max}`}</span><small>${hint}</small></div><div class="chips">${chips}</div></div>`;
  }

  function draftPrice() {
    return linePrice(state.draft);
  }

  function renderBuilder() {
    if (!state.selected || !state.draft) return;
    $('builderTitle').textContent = state.selected.name;
    $('builderDescription').textContent = includes(state.selected);
    $('builderChoices').innerHTML = kinds.map(choiceGroup).join('');
    $('qtyValue').textContent = String(state.draft.quantity);
    $('builderPrice').textContent = money(draftPrice());
    document.querySelectorAll('#builderChoices [data-id]').forEach((button) => button.addEventListener('click', () => selectChoice(button)));
  }

  function selectChoice(button) {
    const { kind, id } = button.dataset;
    const max = limit(state.selected, kind);
    const values = state.draft.picks[kind];
    if (values.includes(id)) state.draft.picks[kind] = values.filter((x) => x !== id);
    else if (max === 1) state.draft.picks[kind] = [id]; // single choice: tap swaps it
    else if (values.length < max) state.draft.picks[kind] = [...values, id];
    else { message(`You can pick up to ${max} for ${state.selected.name}.`, $('builderMessage')); return; }
    message('', $('builderMessage'));
    renderBuilder();
    emit('pastino:pick', { kind, id });
  }

  function openBuilder(id) {
    const item = itemById(id); if (!item) return;
    state.selected = item;
    state.draft = { menuItemId: id, quantity: 1, picks: { pasta: [], sauce: [], topping: [], cheese: [] } };
    message('', $('builderMessage'));
    $('builderMedia').innerHTML = item.image ? `<img src="${esc(item.image)}" alt="">` : '<svg aria-hidden="true"><use href="#pa-farfalle"/></svg>';
    $('builderMedia').querySelector('img')?.addEventListener('error', () => { $('builderMedia').innerHTML = '<svg aria-hidden="true"><use href="#pa-farfalle"/></svg>'; }, { once: true });
    renderBuilder();
    $('builderBackdrop').classList.remove('hidden');
    document.body.classList.add('is-locked');
    emit('pastino:builder', { open: true });
    $('closeBuilder').focus({ preventScroll: true });
  }

  function closeBuilder() {
    if ($('builderBackdrop').classList.contains('hidden')) return;
    $('builderBackdrop').classList.add('hidden');
    document.body.classList.remove('is-locked');
    state.selected = null; state.draft = null;
    emit('pastino:builder', { open: false });
  }

  function addToCart() {
    if (!state.selected || !state.draft) return;
    const p = portion(state.selected);
    const missing = ['pasta', 'sauce'].filter((k) => p[k] > 0 && options(k).length && state.draft.picks[k].length < 1);
    if (missing.length) { message(`Choose at least one ${missing.join(' and one ')}.`, $('builderMessage')); return; }
    const line = JSON.parse(JSON.stringify(state.draft));
    const source = $('addToCart');
    addLine(line, source);
    closeBuilder();
  }

  // ── Checkout ───────────────────────────────────────────────
  async function checkout() {
    const target = $('checkoutMessage');
    message('', target);
    if (!state.cart.length) return message('Your cart is empty.', target);
    const button = $('checkoutButton'); button.disabled = true; button.textContent = 'Sending order…';
    try {
      const items = state.cart.map((line) => ({ menuItemId: line.menuItemId, quantity: line.quantity, pastaIds: line.picks.pasta || [], sauceIds: line.picks.sauce || [], toppingIds: line.picks.topping || [], cheeseIds: line.picks.cheese || [] }));
      const data = await api('api/order.php', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ orderType: state.orderType, customerName: $('customerName').value, phone: $('phone').value, address: $('address').value, notes: $('notes').value, items }) });
      state.cart = []; changed();
      if (data.whatsappUrl) window.location.href = data.whatsappUrl;
      else target.innerHTML = `<div class="notice">Order ${esc(data.orderNumber)} received. Thank you!</div>`;
    } catch (error) { message(error.message, target); }
    finally { button.disabled = false; button.textContent = 'Place order & continue to WhatsApp'; }
  }

  async function init() {
    try {
      state.store = await api('api/storefront.php');
      window.PASTINO_STORE = state.store;
      renderHero(); renderSteps(); renderTabs(); renderMenu();
      loadCart(); renderCart();
      emit('pastino:store', state.store);
    } catch (error) {
      $('menuCards').innerHTML = ''; message(error.message);
      window.PASTINO_STORE = false;
      emit('pastino:store', null);
    }
  }

  document.querySelectorAll('[data-order-type]').forEach((button) => button.addEventListener('click', () => {
    state.orderType = button.dataset.orderType;
    document.querySelectorAll('[data-order-type]').forEach((b) => b.classList.toggle('active', b === button));
    $('addressField').classList.toggle('hidden', state.orderType !== 'delivery');
    if (state.store) renderCart();
  }));
  $('closeBuilder').addEventListener('click', closeBuilder);
  $('builderBackdrop').addEventListener('click', (event) => { if (event.target === $('builderBackdrop')) closeBuilder(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeBuilder(); });
  $('qtyMinus').addEventListener('click', () => { if (!state.draft) return; state.draft.quantity = Math.max(1, state.draft.quantity - 1); renderBuilder(); });
  $('qtyPlus').addEventListener('click', () => { if (!state.draft) return; state.draft.quantity = Math.min(20, state.draft.quantity + 1); renderBuilder(); });
  $('addToCart').addEventListener('click', addToCart);
  $('checkoutButton').addEventListener('click', checkout);
  init();
})();
