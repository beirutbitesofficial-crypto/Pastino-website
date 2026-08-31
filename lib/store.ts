type D1Statement = {
  bind: (...values: unknown[]) => D1Statement;
  run: () => Promise<unknown>;
  first: <T = Record<string, unknown>>() => Promise<T | null>;
  all: <T = Record<string, unknown>>() => Promise<{ results: T[] }>;
};

type D1Database = { prepare: (sql: string) => D1Statement };
type R2Object = { body: ReadableStream; httpEtag?: string; writeHttpMetadata?: (headers: Headers) => void };
type R2Bucket = {
  put: (key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }) => Promise<unknown>;
  get: (key: string) => Promise<R2Object | null>;
};
export type WorkerEnv = { DB?: D1Database; MEDIA?: R2Bucket; PASTINO_ADMIN_PASSWORD?: string };

export type MenuItem = { id: string; name: string; description: string; price: number; image: string; category: string; available: boolean; customizable: boolean; sortOrder: number };
export type OptionItem = { id: string; name: string; price: number; emoji: string; kind: "pasta" | "sauce" | "topping" | "cheese"; available: boolean; sortOrder: number };
export type StoreSettings = { id: string; brandName: string; heroTitle: string; heroSubtitle: string; whatsappNumber: string; currency: string; deliveryFee: number };

const seedMenu = [
  ["menu-medium", "Medium", "1 sauce · 2 toppings included", 7, "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=88", 10],
  ["menu-large", "Large", "1 sauce · 3 toppings included", 8, "https://images.unsplash.com/photo-1556761223-4c4282c73f77?auto=format&fit=crop&w=1200&q=88", 20],
  ["menu-signature", "The Signature", "2 sauces · 4 toppings included", 9, "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=88", 30],
] as const;

const seedOptions = [
  ["pasta-penne", "Penne", 0, "🍝", "pasta", 10], ["pasta-fusilli", "Fusilli", 0, "🍝", "pasta", 20],
  ["pasta-fettuccine", "Fettuccine", 0, "🍝", "pasta", 30], ["pasta-farfalle", "Farfalle", 0, "🍝", "pasta", 40],
  ["sauce-tomato", "Tomato sauce", 0, "🍅", "sauce", 50], ["sauce-alfredo", "Alfredo sauce", 0, "🥣", "sauce", 60],
  ["topping-chicken", "Grilled chicken", 0, "🍗", "topping", 70], ["topping-shrimp", "Shrimp", 0, "🍤", "topping", 80],
  ["topping-mushrooms", "Mushrooms", 0, "🍄", "topping", 90], ["topping-bell-peppers", "Bell peppers", 0, "🫑", "topping", 100],
  ["topping-green-peppers", "Green peppers", 0, "🌶️", "topping", 110], ["cheese-parmesan", "Parmesan", 1, "🧀", "cheese", 120],
  ["cheese-mozzarella", "Mozzarella", 1, "🧀", "cheese", 130],
] as const;

export async function getWorkerEnv(): Promise<WorkerEnv> {
  const mod = await import("cloudflare:workers");
  return mod.env as WorkerEnv;
}

export async function getDb() {
  const env = await getWorkerEnv();
  if (!env.DB) throw new Error("DB D1 binding is not configured.");
  return env.DB;
}

export async function ensureSchema() {
  const db = await getDb();
  const statements = [
    `CREATE TABLE IF NOT EXISTS web_menu_items (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', price REAL NOT NULL, image TEXT NOT NULL DEFAULT '', category TEXT NOT NULL DEFAULT 'Pasta', available INTEGER NOT NULL DEFAULT 1, customizable INTEGER NOT NULL DEFAULT 1, sort_order INTEGER NOT NULL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS web_toppings (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, price REAL NOT NULL DEFAULT 0, emoji TEXT NOT NULL DEFAULT '✦', kind TEXT NOT NULL DEFAULT 'topping', available INTEGER NOT NULL DEFAULT 1, sort_order INTEGER NOT NULL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS web_settings (id TEXT PRIMARY KEY NOT NULL, brand_name TEXT NOT NULL DEFAULT 'Pastino', hero_title TEXT NOT NULL DEFAULT 'Pasta made your way.', hero_subtitle TEXT NOT NULL DEFAULT '', whatsapp_number TEXT NOT NULL DEFAULT '', currency TEXT NOT NULL DEFAULT 'USD', delivery_fee REAL NOT NULL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS online_orders (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, order_number TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'new', order_type TEXT NOT NULL, customer_name TEXT NOT NULL, phone TEXT NOT NULL, address TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', subtotal REAL NOT NULL, delivery_fee REAL NOT NULL DEFAULT 0, total REAL NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS online_order_items (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, order_id INTEGER NOT NULL, menu_item_id TEXT NOT NULL, name TEXT NOT NULL, quantity INTEGER NOT NULL DEFAULT 1, unit_price REAL NOT NULL, toppings_json TEXT NOT NULL DEFAULT '[]', line_total REAL NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS online_orders_created_at_idx ON online_orders(created_at)`,
    `CREATE INDEX IF NOT EXISTS online_order_items_order_id_idx ON online_order_items(order_id)`,
  ];
  for (const sql of statements) await db.prepare(sql).run();
  const menuCount = await db.prepare("SELECT COUNT(*) AS count FROM web_menu_items").first<{ count: number }>();
  if (!menuCount?.count) for (const [id, name, description, price, image, sortOrder] of seedMenu) await db.prepare("INSERT INTO web_menu_items (id,name,description,price,image,category,available,customizable,sort_order) VALUES (?,?,?,?,?,'Pasta',1,1,?)").bind(id,name,description,price,image,sortOrder).run();
  const optionCount = await db.prepare("SELECT COUNT(*) AS count FROM web_toppings").first<{ count: number }>();
  if (!optionCount?.count) for (const [id, name, price, emoji, kind, sortOrder] of seedOptions) await db.prepare("INSERT INTO web_toppings (id,name,price,emoji,kind,available,sort_order) VALUES (?,?,?,?,?,1,?)").bind(id,name,price,emoji,kind,sortOrder).run();
  await db.prepare("INSERT OR IGNORE INTO web_settings (id,brand_name,hero_title,hero_subtitle,whatsapp_number,currency,delivery_fee) VALUES ('default','Pastino','Pasta made your way.','Pick your size, pasta, sauce and toppings. We prepare it fresh and send your order straight to Pastino.','','USD',0)").run();
  return db;
}

function menuRow(row: any): MenuItem { return { id: row.id, name: row.name, description: row.description, price: Number(row.price), image: row.image, category: row.category, available: Boolean(row.available), customizable: Boolean(row.customizable), sortOrder: Number(row.sort_order) }; }
function optionRow(row: any): OptionItem { return { id: row.id, name: row.name, price: Number(row.price), emoji: row.emoji, kind: row.kind, available: Boolean(row.available), sortOrder: Number(row.sort_order) }; }
function settingsRow(row: any): StoreSettings { return { id: row.id, brandName: row.brand_name, heroTitle: row.hero_title, heroSubtitle: row.hero_subtitle, whatsappNumber: row.whatsapp_number, currency: row.currency, deliveryFee: Number(row.delivery_fee) }; }

export async function getStorefrontData() {
  const db = await ensureSchema();
  const [menu, options, settings] = await Promise.all([
    db.prepare("SELECT * FROM web_menu_items ORDER BY sort_order,id").all<any>(),
    db.prepare("SELECT * FROM web_toppings ORDER BY sort_order,id").all<any>(),
    db.prepare("SELECT * FROM web_settings WHERE id='default'").first<any>(),
  ]);
  return { menu: menu.results.map(menuRow), toppings: options.results.map(optionRow), settings: settingsRow(settings) };
}

export async function requireAdmin(request: Request) {
  const env = await getWorkerEnv();
  const expected = env.PASTINO_ADMIN_PASSWORD?.trim();
  if (!expected) return { ok: false as const, status: 503, error: "PASTINO_ADMIN_PASSWORD is not configured." };
  if (request.headers.get("x-admin-password") !== expected) return { ok: false as const, status: 401, error: "Invalid admin password." };
  return { ok: true as const };
}

export async function getOrders(limit = 100) {
  const db = await ensureSchema();
  const orders = (await db.prepare("SELECT * FROM online_orders ORDER BY id DESC LIMIT ?").bind(Math.min(Math.max(limit,1),200)).all<any>()).results;
  const items = (await db.prepare("SELECT * FROM online_order_items ORDER BY id").all<any>()).results;
  return orders.map((o: any) => ({ id:o.id, orderNumber:o.order_number, status:o.status, orderType:o.order_type, customerName:o.customer_name, phone:o.phone, address:o.address, notes:o.notes, subtotal:Number(o.subtotal), deliveryFee:Number(o.delivery_fee), total:Number(o.total), createdAt:o.created_at, updatedAt:o.updated_at, items:items.filter((i:any)=>i.order_id===o.id).map((i:any)=>({ id:i.id, orderId:i.order_id, menuItemId:i.menu_item_id, name:i.name, quantity:i.quantity, unitPrice:Number(i.unit_price), lineTotal:Number(i.line_total), toppings:JSON.parse(i.toppings_json||"[]") })) }));
}
