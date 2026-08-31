# Pastino Website

Standalone Pastino customer ordering website using the same online-order database structure as the Pastino system.

## Pages

- `/` — customer ordering website
- `/admin` — website menu/settings/image admin
- `/orders` — online order queue

## Hosting

Bind the same Cloudflare D1 database as the Pastino system using binding `DB` so both repositories see the same catalog and online orders. Bind an R2 bucket as `MEDIA` for menu images.

Set the server secret `PASTINO_ADMIN_PASSWORD` before using `/admin` or `/orders`.

## WhatsApp

Set the destination number from `/admin` using country code only, for example `961xxxxxxxx`. Checkout is saved to D1 first, then the customer is sent to WhatsApp with a pre-filled message. The customer still presses Send; fully automatic messages require the Meta WhatsApp Business Cloud API.
