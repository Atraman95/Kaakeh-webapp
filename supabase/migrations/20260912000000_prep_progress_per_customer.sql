-- Prep checkmarks move from item level to per-customer.
--
-- Before: one row per (date, catalog, item)        -- "30 Zaatar is done"
-- After:  one row per (date, catalog, item, order) -- "Hind's 15 is done"
--
-- Non-destructive: the two pre-existing item-level rows are retained and parked
-- under a sentinel order_id rather than deleted. Both have prepared_quantity = 0,
-- and the sentinel can never match a real order id, so they are inert.

alter table public.prep_progress add column order_id text;

update public.prep_progress set order_id = '__legacy_item_level__' where order_id is null;

alter table public.prep_progress alter column order_id set not null;

alter table public.prep_progress
  add constraint prep_progress_order_id_check
  check (length(order_id) >= 1 and length(order_id) <= 200);

alter table public.prep_progress
  drop constraint prep_progress_pkey,
  add constraint prep_progress_pkey
  primary key (delivery_date, catalog, item_key, order_id);

comment on column public.prep_progress.order_id is
  'The customer order this checkmark belongs to. Prep is tracked per person, per item, per date.';
