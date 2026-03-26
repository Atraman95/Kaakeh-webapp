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

      const unit_price =
        sku.pricing_type === "per_pack"
          ? sku.price / sku.base_quantity
          : sku.price

      const line_total =
        sku.pricing_type === "per_pack"
          ? (sku.price / sku.base_quantity) * item.qty
          : sku.price * item.qty
      subtotal += line_total

      orderItems.push({
        order_id: order.id,
        sku_id: sku.id,
        product_name: sku.name,
        qty: item.qty,
        unit_price,
        line_total
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
          line_total: deliverySku.price
        })
      }
    }

    if (orderItems.length > 0) {
      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems)

      if (itemsError) throw itemsError
    }

    // Stripe Checkout Session — CREATE mode, or on explicit regeneration
    let payment_link: string | null = null
    if (!order_id || regenerate_payment_link) {
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
        success_url: "https://atraman95.github.io/Kaakeh-webapp/thank-you.html",
        cancel_url: "https://stripe.com",
        metadata: { order_id: order.id, customer_name },
      })
      payment_link = session.url
    }

    await supabase
      .from("orders")
      .update({ subtotal, grand_total: subtotal, ...(payment_link ? { payment_link } : {}) })
      .eq("id", order.id)

    return new Response(
      JSON.stringify({
        order_id: order.id,
        subtotal,
        grand_total: subtotal,
        payment_link,
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