(() => {
  const state = { store: null, cart: [], selected: null, draft: null, orderType: 'takeaway' };
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const money = (n) => `${state.store?.settings.currency || 'USD'} ${Number(n || 0).toFixed(2)}`;

  function rule(name) {
    const n = String(name).toLowerCase();
    if (n.includes('signature')) return { sauces: 2, toppings: 4 };
    if (n.includes('large')) return { sauces: 1, toppings: 3 };
    return { sauces: 1, toppings: 2 };
  }

  async function api(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Request failed.');
    return data;
  }

  function message(text, target = $('siteMessage')) {
    target.innerHTML = text ? `<div class="error">${esc(text)}</div>` : '';
  }

  function renderMenu() {
    $('menuCards').innerHTML = state.store.menu.filter((item) => item.available).map((item) => `
      <article class="card">
        <div class="cardImg" style="background-image:url('${esc(item.image)}')"></div>
        <div class="cardBody">
          <div class="price">${money(item.price)}</div>
          <h3>${esc(item.name)}</h3>
          <p>${esc(item.description)}</p>
          <button class="secondary" data-build="${esc(item.id)}">Build this pasta</button>
        </div>
      </article>`).join('');
    document.querySelectorAll('[data-build]').forEach((button) => button.addEventListener('click', () => openBuilder(button.dataset.build)));
  }

  function itemById(id) { return state.store.menu.find((x) => x.id === id); }
  function optionById(id) { return state.store.toppings.find((x) => x.id === id); }
  function options(kind) { return state.store.toppings.filter((x) => x.kind === kind && x.available); }

  function linePrice(line) {
    const item = itemById(line.menuItemId);
    if (!item) return 0;
    const ids = [line.pastaId, ...line.sauceIds, ...line.toppingIds, ...line.cheeseIds];
    return (Number(item.price) + ids.reduce((sum, id) => sum + Number(optionById(id)?.price || 0), 0)) * line.quantity;
  }

  function renderCart() {
    $('cartTitle').textContent = state.cart.length ? `${state.cart.length} item${state.cart.length > 1 ? 's' : ''} ready` : 'Your cart is waiting.';
    $('cartLines').innerHTML = state.cart.map((line, index) => {
      const item = itemById(line.menuItemId);
      const labels = [line.pastaId, ...line.sauceIds, ...line.toppingIds, ...line.cheeseIds].map((id) => optionById(id)?.name).filter(Boolean);
      return `<div class="cartLine"><div><b>${line.quantity}× ${esc(item?.name)}</b><small>${esc(labels.join(' · '))}</small></div><div><b>${money(linePrice(line))}</b><button data-remove="${index}">Remove</button></div></div>`;
    }).join('');
    document.querySelectorAll('[data-remove]').forEach((button) => button.addEventListener('click', () => { state.cart.splice(Number(button.dataset.remove), 1); renderCart(); }));
    const subtotal = state.cart.reduce((sum, line) => sum + linePrice(line), 0);
    const total = subtotal + (state.orderType === 'delivery' ? Number(state.store.settings.deliveryFee || 0) : 0);
    $('total').textContent = money(total);
  }

  function choice(title, kind, selected, max, single = false) {
    const buttons = options(kind).map((option) => `<button type="button" class="chip ${selected.includes(option.id) ? 'active' : ''}" data-choice-kind="${kind}" data-choice-id="${esc(option.id)}" data-single="${single ? '1' : '0'}" data-max="${max}">${esc(option.emoji)} ${esc(option.name)}${Number(option.price) > 0 ? ` +${money(option.price)}` : ''}</button>`).join('');
    return `<div class="choice"><h4>${esc(title)}</h4><div class="chips">${buttons}</div></div>`;
  }

  function renderBuilder() {
    if (!state.selected || !state.draft) return;
    const r = rule(state.selected.name);
    $('builderTitle').textContent = state.selected.name;
    $('builderDescription').textContent = state.selected.description;
    $('builderChoices').innerHTML = [
      choice('1. Choose pasta', 'pasta', state.draft.pastaId ? [state.draft.pastaId] : [], 1, true),
      choice(`2. Choose ${r.sauces} sauce${r.sauces > 1 ? 's' : ''}`, 'sauce', state.draft.sauceIds, r.sauces),
      choice(`3. Choose up to ${r.toppings} toppings`, 'topping', state.draft.toppingIds, r.toppings),
      choice('4. Add cheese', 'cheese', state.draft.cheeseIds, 99)
    ].join('');
    document.querySelectorAll('[data-choice-id]').forEach((button) => button.addEventListener('click', () => selectChoice(button)));
  }

  function selectChoice(button) {
    const id = button.dataset.choiceId, kind = button.dataset.choiceKind, max = Number(button.dataset.max || 99), single = button.dataset.single === '1';
    if (single) state.draft.pastaId = id;
    else {
      const field = kind === 'sauce' ? 'sauceIds' : kind === 'topping' ? 'toppingIds' : 'cheeseIds';
      const values = state.draft[field];
      state.draft[field] = values.includes(id) ? values.filter((x) => x !== id) : values.length < max ? [...values, id] : values;
    }
    message('', $('builderMessage'));
    renderBuilder();
  }

  function openBuilder(id) {
    const item = itemById(id); if (!item) return;
    state.selected = item;
    state.draft = { menuItemId: id, quantity: 1, pastaId: '', sauceIds: [], toppingIds: [], cheeseIds: [] };
    $('builderBackdrop').classList.remove('hidden');
    message('', $('builderMessage'));
    renderBuilder();
  }

  function closeBuilder() { $('builderBackdrop').classList.add('hidden'); state.selected = null; state.draft = null; }

  function addToCart() {
    if (!state.selected || !state.draft) return;
    const r = rule(state.selected.name);
    if (state.selected.customizable && (!state.draft.pastaId || state.draft.sauceIds.length !== r.sauces)) {
      message(`Choose 1 pasta and ${r.sauces} sauce${r.sauces > 1 ? 's' : ''}.`, $('builderMessage')); return;
    }
    state.cart.push(JSON.parse(JSON.stringify(state.draft)));
    closeBuilder(); renderCart();
  }

  async function checkout() {
    message('');
    if (!state.cart.length) return message('Your cart is empty.');
    const button = $('checkoutButton'); button.disabled = true; button.textContent = 'Sending order…';
    try {
      const data = await api('api/order.php', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ orderType: state.orderType, customerName: $('customerName').value, phone: $('phone').value, address: $('address').value, notes: $('notes').value, items: state.cart }) });
      state.cart = []; renderCart();
      if (data.whatsappUrl) window.location.href = data.whatsappUrl;
      else alert(`Order ${data.orderNumber} received successfully.`);
    } catch (error) { message(error.message); }
    finally { button.disabled = false; button.textContent = 'Place order & continue to WhatsApp'; }
  }

  async function init() {
    try {
      state.store = await api('api/storefront.php');
      $('heroTitle').textContent = state.store.settings.heroTitle;
      $('heroSubtitle').textContent = state.store.settings.heroSubtitle;
      renderMenu(); renderCart();
    } catch (error) { $('menuCards').innerHTML = ''; message(error.message); }
  }

  document.querySelectorAll('[data-order-type]').forEach((button) => button.addEventListener('click', () => {
    state.orderType = button.dataset.orderType;
    document.querySelectorAll('[data-order-type]').forEach((b) => b.classList.toggle('active', b === button));
    $('address').classList.toggle('hidden', state.orderType !== 'delivery'); renderCart();
  }));
  $('closeBuilder').addEventListener('click', closeBuilder);
  $('builderBackdrop').addEventListener('click', (event) => { if (event.target === $('builderBackdrop')) closeBuilder(); });
  $('addToCart').addEventListener('click', addToCart);
  $('checkoutButton').addEventListener('click', checkout);
  init();
})();
