# Pastino Website — Hostinger PHP/MySQL

This repository is a Hostinger-friendly Pastino ordering website built with HTML/CSS/JavaScript + PHP + MySQL. It does not require Node.js, Cloudflare D1, or R2.

## Public URLs

- `/` — customer ordering website
- `/admin/` — website/menu admin
- `/orders/` — live online order queue

## Hostinger deployment

1. In hPanel create a MySQL database and database user.
2. Upload this repository into `public_html` (or connect the GitHub repo to the website files).
3. Open `config.php` in File Manager and replace the database placeholders with the values shown by Hostinger.
4. Change `admin_password` to a strong private password.
5. Change `system_api_key` to a long random private key if the Pastino POS will use the integration endpoint.
6. Visit the website once. The PHP backend automatically creates the required tables and seeds the initial Pastino menu.
7. Open `/admin/` and enter your admin password. Set the WhatsApp number using country code only, for example `961xxxxxxxx`.

## Images

Admin image uploads are stored in `/uploads`. The folder must be writable by PHP. Hostinger normally allows this automatically; if upload fails, set folder permissions to 755 or 775 from File Manager.

## Online orders

Every checkout is validated and recalculated on the server, then saved to MySQL before WhatsApp opens. The customer is redirected to a pre-filled WhatsApp message after the order is stored.

## Menu sync with the Pastino POS

The POS is the source of truth for the menu. When a manager edits the menu in the POS, it pushes the whole menu to:

- `POST /api/system-menu.php` with header `X-Pastino-Key: <system_api_key>` and body `{ "menu": [...], "toppings": [...] }` (the POS's own `pastino-menu-v2` / `pastino-toppings-v2` data)

The website then matches the POS exactly: same item ids, names, prices, images, categories, availability, portion rules (how many pastas / sauces / toppings each size includes) and options. Items removed in the POS are removed here. `GET` on the same URL returns the current website menu for checking.

To turn it on, set `PASTINO_WEBSITE_URL` and `PASTINO_WEBSITE_KEY` (= `system_api_key` above) on the POS server — see the POS README. Once synced, `/admin/` shows the last sync time; edit the menu in the POS, since admin edits are replaced on the next sync.

## Design and motion

The homepage uses GSAP + ScrollTrigger (vendored in `assets/vendor/gsap`, no build step):

- `assets/site.css` — customer website styles (`assets/style.css` stays for `/admin/` and `/orders/`)
- `assets/motion/pasta-rain.js` — falling-pasta canvas engine (ambient page rain + the pour into the hero bowl)
- `assets/motion/home.js` — intro curtain, hero pour and pile-up, pinned scroll scenes, marquee, menu card reveals, fly-to-cart and the sauce-filled footer
- `assets/app.js` — menu, builder, cart and checkout logic

Visitors with "reduce motion" turned on get the full, static page.

## POS integration endpoint

The website exposes:

- `GET /api/system-orders.php` with header `X-Pastino-Key: <system_api_key>`
- `PATCH /api/order-status.php?id=<order_id>` with the same `X-Pastino-Key` header and JSON body `{ "status": "accepted" }`

This is the bridge the separate Pastino POS can poll so website orders appear inside the system without sharing browser localStorage.

## Security

`config.php` is blocked from direct web access by `.htaccess`. Keep database credentials, admin password and system API key private.
