import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "stripe"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-04-10" })
const supabase = createClient(Deno.env.get("PROJECT_URL")!, Deno.env.get("SERVICE_ROLE_KEY")!)
const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 })

  const signature = req.headers.get("stripe-signature")
  if (!signature) return new Response("Missing stripe-signature", { status: 400 })

  // Must use raw text — NOT req.json() — for HMAC signature verification
  const rawBody = await req.text()
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, WEBHOOK_SECRET)
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const order_id = session.metadata?.order_id
    if (!order_id) return new Response("OK — no order_id", { status: 200 })

    const { error } = await supabase
      .from("orders")
      .update({ payment_status: "paid" })
      .eq("id", order_id)

    if (error) return new Response("DB update failed", { status: 500 }) // triggers Stripe retry

    // Payment advances New -> Confirmed. "Confirmed" is the stepper label for
    // the stored value "in-progress"; there is no separate status.
    //
    // Scoped to order_status = "new" on purpose: a webhook that arrives late,
    // or a Stripe retry, must never drag an order the kitchen has already moved
    // to Ready or Delivered back down the stepper.
    const { error: statusError } = await supabase
      .from("orders")
      .update({ order_status: "in-progress" })
      .eq("id", order_id)
      .eq("order_status", "new")

    if (statusError) return new Response("DB update failed", { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
})
