# Cowork Task: Set Up Supabase for Sweet Orders

## What you're doing
You're connecting the Sweet Orders bakery tracker app to a Supabase database so it syncs across devices in real time.

## Files in this folder
- `index.html` — the bakery tracker app (already refactored for Supabase)
- `supabase-setup.md` — contains the SQL schema to create the database tables

---

## Step 1: Run the SQL schema in Supabase

1. Open the browser and go to https://supabase.com/dashboard
2. Open the project (it should be the only one, or the most recent one)
3. In the left sidebar, click **SQL Editor**
4. Click **New query**
5. Paste the following SQL and click **Run**:

```sql
CREATE TABLE orders (
  id            TEXT PRIMARY KEY,
  created_at    BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  customer_name TEXT NOT NULL,
  phone         TEXT DEFAULT '',
  address       TEXT DEFAULT '',
  delivery_date TEXT NOT NULL,
  delivery_time TEXT DEFAULT '',
  order_status  TEXT NOT NULL DEFAULT 'new'
                CHECK (order_status IN ('new', 'in-progress', 'ready', 'delivered')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid'
                CHECK (payment_status IN ('paid', 'unpaid'))
);

CREATE TABLE order_items (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id   TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  quantity   TEXT NOT NULL DEFAULT '1',
  unit_price TEXT NOT NULL DEFAULT '0'
);

CREATE INDEX idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on orders"
  ON orders FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on order_items"
  ON order_items FOR ALL
  USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
```

6. Confirm you see "Success. No rows returned"

## Step 2: Get the API credentials

1. In the left sidebar, click **Settings**
2. Then click **API** (under Configuration)
3. Copy the **Project URL** — it looks like `https://abcdefg.supabase.co`
4. Copy the **anon public** key — it's a long string starting with `eyJ`

## Step 3: Update index.html

1. Open `index.html` in this folder
2. Find these two lines near the top of the `<script>` section:

```javascript
const SUPABASE_URL  = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY  = 'YOUR_SUPABASE_ANON_KEY';
```

3. Replace `YOUR_SUPABASE_URL` with the Project URL you copied
4. Replace `YOUR_SUPABASE_ANON_KEY` with the anon key you copied
5. Save the file

## Step 4: Verify it works

1. Open `index.html` in the browser
2. Check that the sync dot in the header turns **green** and says **"Live"**
3. If it shows red or "Offline", double-check the URL and key are correct

## Done!
The app is now connected to Supabase with real-time sync.
