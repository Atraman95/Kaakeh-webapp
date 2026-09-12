import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "stripe"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const supabase = createClient(
  Deno.env.get("PROJECT_URL")!,
  Deno.env.get("SERVICE_ROLE_KEY")!
)

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-04-10",
})

const DELIVERY_SKU_ID = "76f384c5-d815-4d14-90ce-ea3dfbaf5bec"

// Short payment code alphabet: no 0/O and no 1/I/L, so a code read aloud or
// typed from a phone screen is unambiguous. 31^4 = 923,521 combinations.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"

function randomCode(): string {
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  let out = ""
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length]
  return out
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const body = await req.json()

    const {
      order_id,
      customer_name,
      phone,
      address,
      delivery_date,
      delivery_time,
      delivery,
      items,
      regenerate_payment_link,
    } = body

    if (!customer_name || !items || items.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    const skuIds = items.map((i: any) => i.sku_id)
    if (delivery === "yes") skuIds.push(DELIVERY_SKU_ID)

    const { data: skus, error: skuError } = await supabase
      .from("skus")
      .select("*")
      .in("id", skuIds)

    if (skuError) throw skuError

    // Catalog separation applies before any order or item mutation.
    const requestedCatalog = body.catalog;
    if (requestedCatalog !== undefined && !["kaakeh", "kamra"].includes(requestedCatalog)) {
      throw new Error("Invalid catalog");
    }
    let catalog = requestedCatalog || "kaakeh";
    if (order_id) {
      const { data: existing, error: existingError } = await supabase
        .from("orders").select("catalog").eq("id", order_id).single();
      if (existingError) throw existingError;
      catalog = existing.catalog || "kaakeh";
      if (requestedCatalog && requestedCatalog !== catalog) throw new Error("Cannot change an order's catalog");
    }
    for (const item of items) {
      const sku = skus?.find((s: any) => s.id === item.sku_id);
      if (!sku || !Number.isFinite(Number(item.qty)) || Number(item.qty) <= 0) {
        throw new Error("Invalid SKU or quantity");
      }
      if (item.line_type !== undefined && !["sale", "sample"].includes(item.line_type)) {
        throw new Error("Invalid line_type");
      }
      if (sku.id !== DELIVERY_SKU_ID && (sku.catalog || "kaakeh") !== catalog) {
        throw new Error("Items must belong to the order's catalog");
      }
    }

    let order: any

    // 🔁 EDIT MODE
    if (order_id) {
      const { data, error } = await supabase
        .from("orders")
        .update({
          customer_name,
          phone,
          address,
          delivery_date,
          delivery_time
        })
        .eq("id", order_id)
        .select()
        .single()

      if (error) throw error
      order = data

      const { error: deleteError } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", order_id)

      if (deleteError) throw deleteError

    } else {
      // 🆕 CREATE MODE
      const { data, error } = await supabase
        .from("orders")
        .insert({
          customer_name,
          phone,
          address,
          delivery_date,
          delivery_time,
          catalog,
          order_status: "new",
          payment_status: "unpaid"
        })
        .select()
        .single()

      if (error) throw error
      order = data
    }

    let subtotal = 0
    const orderItems = []

    for (const item of items) {
      const sku = skus?.find((s: any) => s.id === item.sku_id)
      if (!sku) continue

      const line_type = item.line_type === "sample" ? "sample" : "sale"

      // Prices stay server-derived from the SKU. A sample is charged 0, but the
      // SKU's normal price is retained in list_price for display.
      const list_price =
        sku.pricing_type === "per_pack"
          ? sku.price / sku.base_quantity
          : sku.price

      const unit_price = line_type === "sample" ? 0 : list_price
      const line_total = line_type === "sample" ? 0 : unit_price * item.qty
      subtotal += line_total

      orderItems.push({
        order_id: order.id,
        sku_id: sku.id,
        product_name: sku.name,
        qty: item.qty,
        unit_price,
        line_total,
        line_type,
        list_price
      })
    }

    if (delivery === "yes") {
      const deliverySku = skus?.find((s: any) => s.id === DELIVERY_SKU_ID)

      if (deliverySku) {
        subtotal += deliverySku.price

        orderItems.push({
          order_id: order.id,
          sku_id: deliverySku.id,
          product_name: deliverySku.name,
          qty: 1,
          unit_price: deliverySku.price,
          line_total: deliverySku.price,
          line_type: "sale",
          list_price: deliverySku.price
        })
      }
    }

    if (orderItems.length > 0) {
      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems)

      if (itemsError) throw itemsError
    }

    // Stripe Checkout Session — CREATE mode, or on explicit regeneration.
    // Skipped when nothing is chargeable (e.g. an all-sample order): Stripe
    // rejects a zero-amount session, which would fail the request after the
    // order row has already been written.
    let payment_link: string | null = null
    if ((!order_id || regenerate_payment_link) && subtotal > 0) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "aed",
            product_data: { name: `Kaakeh Order — ${customer_name}` },
            unit_amount: Math.round(subtotal * 100),  // AED → fils
          },
          quantity: 1,
        }],
        mode: "payment",
        success_url: `https://kaakeh.ae/thank-you?order=${order.id}`,
        cancel_url: "https://stripe.com",
        metadata: { order_id: order.id, customer_name },
      })
      payment_link = session.url
    }

    // Allocate the short code by writing it: the unique index on payment_code is
    // the arbiter, so two sessions created concurrently cannot share a code.
    // Regenerating overwrites payment_code and payment_link together, which
    // retires the previous code by design.
    let payment_code: string | null = null
    if (payment_link) {
      for (let attempt = 1; ; attempt++) {
        const candidate = randomCode()
        const { error: codeError } = await supabase
          .from("orders")
          .update({ subtotal, grand_total: subtotal, payment_link, payment_code: candidate })
          .eq("id", order.id)
        if (!codeError) { payment_code = candidate; break }
        if (codeError.code !== "23505") throw codeError   // not a collision
        if (attempt >= 5) throw new Error("Could not allocate a unique payment code")
      }
    } else {
      await supabase
        .from("orders")
        .update({ subtotal, grand_total: subtotal })
        .eq("id", order.id)
    }

    return new Response(
      JSON.stringify({
        order_id: order.id,
        subtotal,
        grand_total: subtotal,
        payment_link,
        payment_code,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err?.message || err
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
})
