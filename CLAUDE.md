# Kaakeh Webapp — Claude Code Guide

## Project Overview
Order management system for Kaakeh, a Palestinian home-based food business in the UAE. 
Single-stack: one self-contained `index.html` frontend + Supabase backend + Deno edge 
functions + Stripe payments in AED.

@frontend.md

---

## Repository Structure
```
/
├── index.html              # The entire frontend app (4000+ lines, self-contained)
├── supabase/
│   ├── config.toml
│   └── functions/
│       ├── create-order/   # Creates/edits orders + Stripe checkout (JWT required)
│       └── stripe-webhook/ # Marks orders paid on checkout.session.completed
└── supabase-setup.md       # DB schema reference
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla HTML/CSS/JS — no framework |
| Database | Supabase PostgreSQL (realtime enabled) |
| Backend | Deno edge functions (TypeScript) |
| Payments | Stripe (AED, checkout sessions + webhooks) |
| CDN deps | Supabase and Stripe loaded via CDN in index.html |

---

## Supabase
- Project URL: `https://maoyacaiwerynhvhonai.supabase.co`
- Supabase and anon key are hardcoded in `index.html` (public anon key, acceptable)
- RLS enabled but fully permissive (`USING (true)`)
- Realtime subscriptions active on `orders` and `order_items`

---

## Database Schema

**orders**
- `id` TEXT PK, `customer_name`, `phone`, `address`
- `delivery_date` TEXT (YYYY-MM-DD), `delivery_time` TEXT (HH:MM)
- `order_status`: `new` | `in-progress` | `ready` | `delivered`
- `payment_status`: `paid` | `unpaid`
- `subtotal`, `grand_total` DECIMAL, `payment_link` TEXT
- `created_at` BIGINT (ms)

**order_items**
- `id` BIGINT, `order_id` FK → orders (CASCADE)
- `sku_id`, `product_name`, `qty`, `unit_price`, `line_total`

---

## Edge Functions

**`create-order`** — POST, JWT required
- Takes order data + `items[]` with `sku_id` + `qty`
- Fetches SKU pricing, calculates totals, creates Stripe checkout session
- Edit mode: updates order, deletes old items, re-inserts new ones
- Returns `{ order_id, subtotal, grand_total, payment_link }`

**`stripe-webhook`** — POST, no JWT
- Handles `checkout.session.completed` → sets `payment_status = 'paid'`

⚠️ Do not modify the stripe-webhook function or Supabase RLS policies unless explicitly asked.

---

## Key Environment Variables (Edge Functions)
- `SERVICE_ROLE_KEY` — Supabase admin key
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`

---

## Key Conventions
- **Currency**: AED everywhere. Stripe amounts in fils (integer × 100)
- **Dates**: YYYY-MM-DD strings, times HH:MM
- No build step — editing index.html is immediate


