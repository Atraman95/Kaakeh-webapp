-- Branded short code for the Stripe checkout URL already held in payment_link.
-- Serves pay.kaakeh.ae/<code>, which 302s to payment_link.
--
-- Nullable: every existing order stays null and keeps working off payment_link
-- exactly as before. Postgres allows multiple NULLs under a unique index, so no
-- partial index is needed.
alter table public.orders add column payment_code text;

create unique index orders_payment_code_key on public.orders (payment_code);

comment on column public.orders.payment_code is
  'Short code served at pay.kaakeh.ae/<code>, redirecting to payment_link. Rewritten whenever the payment link is regenerated, which invalidates the previous code.';
