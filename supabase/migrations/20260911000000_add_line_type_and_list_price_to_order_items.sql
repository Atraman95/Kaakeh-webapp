-- Adds sample-line support to order_items.
-- line_type: 'sale' (charged normally) or 'sample' (given free, charged 0).
-- list_price: the SKU's normal unit price at time of order, retained on sample
-- lines so the UI can render "35.00 -> 0.00 (Sample)".
--
-- Backfill is implicit for line_type: the NOT NULL DEFAULT 'sale' stamps every
-- existing row as a sale. list_price is backfilled from the existing unit_price.

alter table public.order_items
  add column line_type text not null default 'sale',
  add column list_price numeric;

alter table public.order_items
  add constraint order_items_line_type_check
  check (line_type = any (array['sale'::text, 'sample'::text]));

comment on column public.order_items.line_type is
  'sale = customer charged normally; sample = given free, unit_price and line_total are 0.';
comment on column public.order_items.list_price is
  'The SKU unit price at time of order, retained even when the line is a sample charged at 0.';

update public.order_items set list_price = unit_price where list_price is null;
