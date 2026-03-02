import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const supabase = createClient(
  Deno.env.get("PROJECT_URL")!,
  Deno.env.get("SERVICE_ROLE_KEY")!
)

const DELIVERY_SKU_ID = "76f384c5-d815-4d14-90ce-ea3dfbaf5bec"

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const body = await req.json()

    const {
      customer_name,
      phone,
      address,
      delivery_date,
      delivery_time,
      delivery,
      items
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

    let subtotal = 0

    const { data: order, error: orderError } = await supabase
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

    if (orderError) throw orderError

    const orderItems = []

    for (const item of items) {
      const sku = skus?.find((s: any) => s.id === item.sku_id)
      if (!sku) continue

      const unit_price =
        sku.pricing_type === "per_pack"
          ? sku.price / sku.base_quantity
          : sku.price

      const line_total = unit_price * item.qty
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

    await supabase
      .from("orders")
      .update({
        subtotal,
        grand_total: subtotal
      })
      .eq("id", order.id)

    return new Response(
      JSON.stringify({
        order_id: order.id,
        subtotal,
        grand_total: subtotal
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )

} catch (err) {
  console.error("FULL ERROR:", err);

  return new Response(
    JSON.stringify({
      raw: err,
      message: err?.message,
      stack: err?.stack
    }),
    {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  )
}
})