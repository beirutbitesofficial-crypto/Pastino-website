"use client";

import { useEffect, useMemo, useState } from "react";

type Menu = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  customizable: boolean;
};

type Opt = {
  id: string;
  name: string;
  price: number;
  emoji: string;
  kind: "pasta" | "sauce" | "topping" | "cheese";
  available: boolean;
};

type Settings = {
  brandName: string;
  heroTitle: string;
  heroSubtitle: string;
  whatsappNumber: string;
  currency: string;
  deliveryFee: number;
};

type Store = { menu: Menu[]; toppings: Opt[]; settings: Settings };
type Draft = {
  menuItemId: string;
  quantity: number;
  pastaId: string;
  sauceIds: string[];
  toppingIds: string[];
  cheeseIds: string[];
};

const emptySettings: Settings = {
  brandName: "Pastino",
  heroTitle: "Pasta made your way.",
  heroSubtitle: "Fresh pasta, built by you.",
  whatsappNumber: "",
  currency: "USD",
  deliveryFee: 0,
};

function limits(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes("signature")) return { sauces: 2, toppings: 4 };
  if (normalized.includes("large")) return { sauces: 1, toppings: 3 };
  return { sauces: 1, toppings: 2 };
}

export default function Home() {
  const [store, setStore] = useState<Store>({ menu: [], toppings: [], settings: emptySettings });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Menu | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [cart, setCart] = useState<Draft[]>([]);
  const [orderType, setOrderType] = useState<"takeaway" | "delivery">("takeaway");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/storefront", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || data.error) throw new Error(data.error || "Unable to load menu.");
        return data as Store;
      })
      .then(setStore)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load menu."))
      .finally(() => setLoading(false));
  }, []);

  const itemById = useMemo(() => new Map(store.menu.map((item) => [item.id, item])), [store.menu]);
  const optionById = useMemo(() => new Map(store.toppings.map((option) => [option.id, option])), [store.toppings]);

  const byKind = (kind: Opt["kind"]) => store.toppings.filter((option) => option.kind === kind && option.available);

  function start(item: Menu) {
    setSelected(item);
    setDraft({ menuItemId: item.id, quantity: 1, pastaId: "", sauceIds: [], toppingIds: [], cheeseIds: [] });
    setError("");
  }

  function toggle(field: "sauceIds" | "toppingIds" | "cheeseIds", id: string, max = 99) {
    if (!draft) return;
    const current = draft[field];
    const next = current.includes(id) ? current.filter((value) => value !== id) : current.length < max ? [...current, id] : current;
    setDraft({ ...draft, [field]: next });
  }

  function addToCart() {
    if (!draft || !selected) return;
    const rule = limits(selected.name);
    if (selected.customizable && (!draft.pastaId || draft.sauceIds.length !== rule.sauces)) {
      setError(`Choose 1 pasta and ${rule.sauces} sauce${rule.sauces > 1 ? "s" : ""}.`);
      return;
    }
    setCart((current) => [...current, draft]);
    setSelected(null);
    setDraft(null);
    setError("");
  }

  function linePrice(line: Draft) {
    const item = itemById.get(line.menuItemId);
    if (!item) return 0;
    const optionIds = [line.pastaId, ...line.sauceIds, ...line.toppingIds, ...line.cheeseIds];
    const extras = optionIds.reduce((sum, id) => sum + (optionById.get(id)?.price || 0), 0);
    return (item.price + extras) * line.quantity;
  }

  const subtotal = cart.reduce((sum, line) => sum + linePrice(line), 0);
  const total = subtotal + (orderType === "delivery" ? store.settings.deliveryFee : 0);

  async function checkout() {
    setError("");
    if (!cart.length) {
      setError("Your cart is empty.");
      return;
    }
    setSending(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderType, customerName: name, phone, address, notes, items: cart }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Order failed.");
      setCart([]);
      if (data.whatsappUrl) window.location.href = data.whatsappUrl;
      else window.alert(`Order ${data.orderNumber} received successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order failed.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main>
      <header className="nav">
        <a className="logo" href="#top">PASTINO<span>.</span></a>
        <a className="navlink" href="#menu">Order online</a>
      </header>

      <section id="top" className="hero">
        <div className="heroCopy">
          <div className="eyebrow">FRESH • FAST • YOUR WAY</div>
          <h1>{store.settings.heroTitle}</h1>
          <p>{store.settings.heroSubtitle}</p>
          <a className="primary" href="#menu">Build your pasta →</a>
        </div>
        <div className="heroArt">
          <div className="stamp">PASTA<br />MADE<br />FRESH</div>
          <div className="bowl">🍝</div>
        </div>
      </section>

      <section id="menu" className="section">
        <div className="sectionHead">
          <div>
            <div className="eyebrow dark">THE MENU</div>
            <h2>Choose your size.</h2>
          </div>
          <p>Pick the bowl, then make it completely yours.</p>
        </div>
        {error && <div className="error">{error}</div>}
        {loading ? (
          <div className="loading">Loading menu…</div>
        ) : (
          <div className="cards">
            {store.menu.filter((item) => item.available).map((item) => (
              <article className="card" key={item.id}>
                <div className="cardImg" style={{ backgroundImage: `url(${item.image})` }} />
                <div className="cardBody">
                  <div className="price">{store.settings.currency} {item.price.toFixed(2)}</div>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <button className="secondary" onClick={() => start(item)}>Build this pasta</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="checkout">
        <div className="cartPanel">
          <div className="eyebrow">YOUR ORDER</div>
          <h2>{cart.length ? `${cart.length} item${cart.length > 1 ? "s" : ""} ready` : "Your cart is waiting."}</h2>
          {cart.map((line, index) => {
            const item = itemById.get(line.menuItemId);
            const labels = [line.pastaId, ...line.sauceIds, ...line.toppingIds, ...line.cheeseIds]
              .map((id) => optionById.get(id)?.name)
              .filter(Boolean);
            return (
              <div className="cartLine" key={`${line.menuItemId}-${index}`}>
                <div>
                  <b>{line.quantity}× {item?.name}</b>
                  <small>{labels.join(" · ")}</small>
                </div>
                <div>
                  <b>{store.settings.currency} {linePrice(line).toFixed(2)}</b>
                  <button onClick={() => setCart((current) => current.filter((_, i) => i !== index))}>Remove</button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="checkoutForm">
          <div className="switch">
            <button className={orderType === "takeaway" ? "active" : ""} onClick={() => setOrderType("takeaway")}>Takeaway</button>
            <button className={orderType === "delivery" ? "active" : ""} onClick={() => setOrderType("delivery")}>Delivery</button>
          </div>
          <div className="grid2">
            <input placeholder="Your name" value={name} onChange={(event) => setName(event.target.value)} />
            <input placeholder="Phone number" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </div>
          {orderType === "delivery" && <input placeholder="Delivery address" value={address} onChange={(event) => setAddress(event.target.value)} />}
          <textarea placeholder="Notes (optional)" value={notes} onChange={(event) => setNotes(event.target.value)} />
          <div className="total"><span>Total</span><b>{store.settings.currency} {total.toFixed(2)}</b></div>
          <button className="primary full" disabled={sending} onClick={checkout}>{sending ? "Sending order…" : "Place order & continue to WhatsApp"}</button>
          <small className="fine">Your order is saved to Pastino before WhatsApp opens.</small>
        </div>
      </section>

      <footer><b>PASTINO.</b><span>Fresh pasta. Built your way.</span></footer>

      {selected && draft && (
        <div className="modalBack">
          <div className="modal">
            <button className="close" onClick={() => { setSelected(null); setDraft(null); }}>×</button>
            <div className="eyebrow dark">BUILD YOUR BOWL</div>
            <h2>{selected.name}</h2>
            <p>{selected.description}</p>
            <Choice title="1. Choose pasta" options={byKind("pasta")} selected={[draft.pastaId]} onClick={(id) => setDraft({ ...draft, pastaId: id })} />
            <Choice title={`2. Choose ${limits(selected.name).sauces} sauce${limits(selected.name).sauces > 1 ? "s" : ""}`} options={byKind("sauce")} selected={draft.sauceIds} onClick={(id) => toggle("sauceIds", id, limits(selected.name).sauces)} />
            <Choice title={`3. Choose up to ${limits(selected.name).toppings} toppings`} options={byKind("topping")} selected={draft.toppingIds} onClick={(id) => toggle("toppingIds", id, limits(selected.name).toppings)} />
            <Choice title="4. Add cheese" options={byKind("cheese")} selected={draft.cheeseIds} onClick={(id) => toggle("cheeseIds", id)} />
            {error && <div className="error">{error}</div>}
            <button className="primary full" onClick={addToCart}>Add to order</button>
          </div>
        </div>
      )}
    </main>
  );
}

function Choice({ title, options, selected, onClick }: { title: string; options: Opt[]; selected: string[]; onClick: (id: string) => void }) {
  return (
    <div className="choice">
      <h4>{title}</h4>
      <div className="chips">
        {options.map((option) => (
          <button key={option.id} className={selected.includes(option.id) ? "chip active" : "chip"} onClick={() => onClick(option.id)}>
            {option.emoji} {option.name}{option.price > 0 ? ` +$${option.price}` : ""}
          </button>
        ))}
      </div>
    </div>
  );
}
