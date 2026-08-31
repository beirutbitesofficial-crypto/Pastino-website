import { ensureSchema, getOrders, getStorefrontData, requireAdmin } from "@/lib/store";

type Selection = { menuItemId?: string; quantity?: number; pastaId?: string; sauceIds?: string[]; toppingIds?: string[]; cheeseIds?: string[] };

function clean(value: unknown, max = 300) { return typeof value === "string" ? value.trim().slice(0,max) : ""; }
function rules(name: string) { const n=name.toLowerCase(); return n.includes("signature") ? { sauces:2, toppings:4 } : n.includes("large") ? { sauces:1, toppings:3 } : { sauces:1, toppings:2 }; }

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });
  try { return Response.json({ orders: await getOrders(150) }, { headers:{"Cache-Control":"no-store"} }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to load orders." }, { status:500 }); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string,unknown>;
    const orderType = body.orderType === "delivery" ? "delivery" : "takeaway";
    const customerName = clean(body.customerName,100), phone = clean(body.phone,50), address = clean(body.address,300), notes = clean(body.notes,500);
    if (customerName.length < 2 || phone.length < 5) return Response.json({ error:"Name and phone are required." }, { status:400 });
    if (orderType === "delivery" && address.length < 5) return Response.json({ error:"Delivery address is required." }, { status:400 });
    const selections = Array.isArray(body.items) ? body.items as Selection[] : [];
    if (!selections.length || selections.length > 20) return Response.json({ error:"Your cart is empty." }, { status:400 });

    const store = await getStorefrontData();
    const menuById = new Map(store.menu.filter(i=>i.available).map(i=>[i.id,i]));
    const optionById = new Map(store.toppings.filter(i=>i.available).map(i=>[i.id,i]));
    const lines: { menuItemId:string; name:string; quantity:number; unitPrice:number; lineTotal:number; labels:string[] }[] = [];

    for (const selection of selections) {
      const item = menuById.get(clean(selection.menuItemId,100));
      if (!item) return Response.json({ error:"A menu item is unavailable." }, { status:400 });
      const quantity = Math.min(Math.max(Math.round(Number(selection.quantity)||1),1),20);
      const chosen = [selection.pastaId, ...(selection.sauceIds||[]), ...(selection.toppingIds||[]), ...(selection.cheeseIds||[])].filter(Boolean).map(id=>optionById.get(String(id))).filter(Boolean) as typeof store.toppings;
      const pasta = chosen.filter(o=>o.kind==="pasta"), sauces=chosen.filter(o=>o.kind==="sauce"), toppings=chosen.filter(o=>o.kind==="topping"), cheeses=chosen.filter(o=>o.kind==="cheese");
      const limit = rules(item.name);
      if (item.customizable && (pasta.length !== 1 || sauces.length !== limit.sauces || toppings.length > limit.toppings)) return Response.json({ error:`Please complete ${item.name} selections correctly.` }, { status:400 });
      const unitPrice = item.price + chosen.reduce((sum,o)=>sum+o.price,0);
      const labels = [...pasta,...sauces,...toppings,...cheeses].map(o=>`${o.emoji} ${o.name}`);
      lines.push({ menuItemId:item.id, name:item.name, quantity, unitPrice, lineTotal:unitPrice*quantity, labels });
    }

    const subtotal = lines.reduce((s,l)=>s+l.lineTotal,0), deliveryFee = orderType === "delivery" ? store.settings.deliveryFee : 0, total=subtotal+deliveryFee;
    const db = await ensureSchema();
    const now = new Date().toISOString();
    const orderNumber = `WEB-${Date.now().toString().slice(-7)}-${Math.floor(Math.random()*900+100)}`;
    const inserted = await db.prepare("INSERT INTO online_orders (order_number,status,order_type,customer_name,phone,address,notes,subtotal,delivery_fee,total,created_at,updated_at) VALUES (?,'new',?,?,?,?,?,?,?,?,?,?) RETURNING id").bind(orderNumber,orderType,customerName,phone,address,notes,subtotal,deliveryFee,total,now,now).first<{id:number}>();
    if (!inserted?.id) throw new Error("Order could not be saved.");
    for (const line of lines) await db.prepare("INSERT INTO online_order_items (order_id,menu_item_id,name,quantity,unit_price,toppings_json,line_total) VALUES (?,?,?,?,?,?,?)").bind(inserted.id,line.menuItemId,line.name,line.quantity,line.unitPrice,JSON.stringify(line.labels),line.lineTotal).run();

    const money=(n:number)=>`${store.settings.currency} ${n.toFixed(2)}`;
    const message = [`🍝 *NEW PASTINO ORDER*`,`Order: ${orderNumber}`,`Type: ${orderType.toUpperCase()}`,`Customer: ${customerName}`,`Phone: ${phone}`,orderType==="delivery"?`Address: ${address}`:"",``,...lines.flatMap(l=>[`${l.quantity}× ${l.name} — ${money(l.lineTotal)}`,...l.labels.map(x=>`  ${x}`)]),``,`Subtotal: ${money(subtotal)}`,deliveryFee?`Delivery: ${money(deliveryFee)}`:"",`*Total: ${money(total)}*`,notes?`Notes: ${notes}`:""].filter(Boolean).join("\n");
    const number = store.settings.whatsappNumber.replace(/\D/g,"");
    return Response.json({ ok:true, orderNumber, total, whatsappUrl:number?`https://wa.me/${number}?text=${encodeURIComponent(message)}`:null });
  } catch (error) {
    return Response.json({ error:error instanceof Error ? error.message : "Unable to place order." }, { status:500 });
  }
}
