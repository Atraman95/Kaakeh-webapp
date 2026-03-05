# Kaakeh — Order Management System

Internal order management web app for Kaakeh, a Palestinian home-based food business in the UAE. Tracks customer orders, delivery schedules, and payment status in real time.

---

## Features

- **Order tracking** — create, edit, and delete customer orders
- **Status pipeline** — New → Confirmed → Ready → Delivered
- **Payment management** — mark orders paid/unpaid, generate Stripe payment links
- **WhatsApp import** — paste a WhatsApp order summary message to auto-create an order
- **Calendar view** — visualize orders by delivery date
- **Real-time sync** — all connected tabs update live via Supabase Realtime
- **Search & filter** — filter by order status, payment status, or search by name/phone/item

---

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla HTML/CSS/JS (single `index.html`, no build step) |
| Database | Supabase PostgreSQL |
| Realtime | Supabase Realtime subscriptions |
| Backend | Deno edge functions on Supabase |
| Payments | Stripe Checkout (AED currency) |

---

## Getting Started

No build step needed. Just open `index.html` in a browser — it connects to Supabase via CDN.

For local development with edge functions:

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Start local Supabase
supabase start

# Deploy edge functions
supabase functions deploy create-order
supabase functions deploy stripe-webhook
```

---

## Edge Functions

### `create-order`
Creates a new order (or updates an existing one) and generates a Stripe Checkout payment link.

**Requires:** JWT auth header

**Request body:**
```json
{
  "order_id": "optional — omit for new, provide for edit",
  "customer_name": "string",
  "phone": "string",
  "address": "string",
  "delivery_date": "YYYY-MM-DD",
  "delivery_time": "HH:MM",
  "delivery": "yes | no",
  "items": [{ "sku_id": "uuid", "qty": 2 }]
}
```

**Response:**
```json
{
  "order_id": "uuid",
  "subtotal": 120,
  "grand_total": 160,
  "payment_link": "https://checkout.stripe.com/..."
}
```

### `stripe-webhook`
Listens for `checkout.session.completed` events from Stripe and marks the matching order as `paid`.

**No JWT required** (webhook endpoint, verified by Stripe signature).

---

## Database Schema

### `orders`

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT | Primary key |
| `customer_name` | TEXT | Required |
| `phone` | TEXT | |
| `address` | TEXT | |
| `delivery_date` | TEXT | YYYY-MM-DD |
| `delivery_time` | TEXT | HH:MM |
| `order_status` | TEXT | `new` \| `in-progress` \| `ready` \| `delivered` |
| `payment_status` | TEXT | `paid` \| `unpaid` |
| `subtotal` | DECIMAL | |
| `grand_total` | DECIMAL | |
| `payment_link` | TEXT | Stripe Checkout URL |
| `created_at` | BIGINT | Unix ms |

### `order_items`

| Column | Type | Notes |
|--------|------|-------|
| `id` | BIGINT | Auto PK |
| `order_id` | TEXT | FK → orders (cascade delete) |
| `sku_id` | TEXT | References SKUs table |
| `product_name` | TEXT | |
| `qty` | INT | |
| `unit_price` | DECIMAL | |
| `line_total` | DECIMAL | |

---

## Environment Variables

Set these as Supabase Edge Function secrets:

```
SERVICE_ROLE_KEY      # Supabase service role key (admin access)
STRIPE_SECRET_KEY     # Stripe secret API key
STRIPE_WEBHOOK_SECRET # Stripe webhook signing secret
STRIPE_SUCCESS_URL    # Redirect URL after successful payment
STRIPE_CANCEL_URL     # Redirect URL if payment is cancelled
```

---

## Currency

All prices are in **AED (UAE Dirham)**. Stripe amounts are passed in fils (smallest unit), so multiply by 100 — e.g. AED 120 → `12000`.
