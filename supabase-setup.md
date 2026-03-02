# Supabase Setup Guide — Sweet Orders Bakery Tracker

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up / log in
2. Click **"New Project"**
3. Fill in:
   - **Name:** `sweet-orders` (or whatever you like)
   - **Database Password:** Choose something strong (save it!)
   - **Region:** Choose the closest to UAE → `West Asia (Mumbai)` or `Middle East (Bahrain)` if available
4. Click **Create new project** — wait ~2 minutes for it to spin up

## Step 2: Get Your Credentials

Once the project is ready:

1. Go to **Settings → API** (left sidebar)
2. Copy these two values — you'll paste them into the app:
   - **Project URL** → looks like `https://abcdefg.supabase.co`
   - **anon (public) key** → a long `eyJ...` string

## Step 3: Create the Database Tables

1. Go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Paste the entire SQL below and click **Run**

```sql
-- ═══════════════════════════════════════════════
--  SWEET ORDERS — DATABASE SCHEMA
-- ═══════════════════════════════════════════════

-- Orders table
CREATE TABLE orders (
  id            TEXT PRIMARY KEY,
  created_at    BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  customer_name TEXT NOT NULL,
  phone         TEXT DEFAULT '',
  address       TEXT DEFAULT '',
  delivery_date TEXT NOT NULL,        -- 'YYYY-MM-DD'
  delivery_time TEXT DEFAULT '',      -- 'HH:MM' or empty
  order_status  TEXT NOT NULL DEFAULT 'new'
                CHECK (order_status IN ('new', 'in-progress', 'ready', 'delivered')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid'
                CHECK (payment_status IN ('paid', 'unpaid'))
);

-- Order items table (one-to-many)
CREATE TABLE order_items (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id   TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  quantity   TEXT NOT NULL DEFAULT '1',
  unit_price TEXT NOT NULL DEFAULT '0'
);

-- Index for fast lookups
CREATE INDEX idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- ═══════════════════════════════════════════════
--  ROW LEVEL SECURITY (open access — no auth)
-- ═══════════════════════════════════════════════

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Allow all operations (no login required — trust-based)
CREATE POLICY "Allow all on orders"
  ON orders FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on order_items"
  ON order_items FOR ALL
  USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════
--  ENABLE REALTIME
-- ═══════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
```

4. You should see **"Success. No rows returned"** — that means it worked!

## Step 4: Verify

1. Go to **Table Editor** (left sidebar)
2. You should see two tables: `orders` and `order_items`
3. Both should be empty and ready to go

## Step 5: Plug Into the App

Open the `index.html` file I provided and find these two lines near the top of the `<script>`:

```javascript
const SUPABASE_URL  = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY  = 'YOUR_SUPABASE_ANON_KEY';
```

Replace them with your actual values from Step 2. That's it — the app will connect automatically!

## Step 6: Deploy (Optional — Simplest Method)

The easiest way to host a single HTML file:

**Option A: Netlify Drop**
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag and drop a folder containing your `index.html`
3. Done — you get a live URL instantly

**Option B: GitHub Pages**
1. Push `index.html` to a GitHub repo
2. Go to repo Settings → Pages → select `main` branch
3. Your site goes live at `username.github.io/repo-name`

Both are free and work perfectly for a single HTML file.
