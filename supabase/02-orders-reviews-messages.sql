-- Offline House: adds the tables your database is missing.
-- Run ONCE in the Supabase SQL editor. Safe to re-run: it skips anything that
-- already exists. It does not touch your existing categories or products tables.
--
-- Your database currently has only `categories` and `products`. The newsletter
-- form, contact form, reviews and checkout all need the tables created here.

-- ------------------------------------------------------------ subscribers
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'website',
  created_at timestamptz not null default now(),
  constraint subscribers_email_lowercase check (email = lower(email))
);

-- -------------------------------------------------------- contact messages
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  topic text not null,
  order_number text,
  message text not null,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------- reviews
create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text not null,
  verified boolean not null default false,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists product_reviews_product_idx
  on public.product_reviews (product_id, status);

-- Keeps products.rating and products.review_count in step with APPROVED
-- reviews only (your catalog already reads both columns).
create or replace function public.refresh_product_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare pid uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products p
     set rating = coalesce((select round(avg(r.rating)::numeric, 1)
                              from public.product_reviews r
                             where r.product_id = pid and r.status = 'approved'), 0),
         review_count = (select count(*)
                           from public.product_reviews r
                          where r.product_id = pid and r.status = 'approved')
   where p.id = pid;
  return null;
end
$$;

drop trigger if exists product_reviews_rating on public.product_reviews;
create trigger product_reviews_rating
after insert or update or delete on public.product_reviews
for each row execute function public.refresh_product_rating();

-- ------------------------------------------------------------------ orders
-- Order numbers come from a sequence: OH-100001, OH-100002, ...
create sequence if not exists public.order_number_seq start 100001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique
    default ('OH-' || nextval('public.order_number_seq')::text),
  -- Secret per order: the confirmation page needs the number AND this token,
  -- so order numbers alone cannot be guessed to view someone's order.
  access_token text not null
    default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  phone text not null,
  first_name text not null,
  last_name text not null,
  address1 text not null,
  address2 text,
  suburb text not null,
  city text not null,
  province text not null,
  postal_code text not null,
  notes text,
  shipping_method text not null,
  shipping_cents integer not null check (shipping_cents >= 0),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid', 'failed', 'refunded')),
  payment_provider text,              -- 'payfast' or 'stitch'
  payment_reference text,
  tracking_url text,
  carrier text,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,                 -- snapshot, so history survives edits
  variant text,
  image text,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity between 1 and 99)
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- Marks an order paid exactly once, then takes stock and counts the sales.
-- Calling it twice does nothing the second time.
create or replace function public.fulfil_order(p_order_id uuid, p_reference text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare was_unpaid boolean;
begin
  update public.orders
     set payment_status = 'paid',
         status = case when status = 'pending' then 'confirmed' else status end,
         payment_reference = p_reference
   where id = p_order_id and payment_status <> 'paid'
  returning true into was_unpaid;

  if was_unpaid then
    update public.products p
       set stock = greatest(p.stock - oi.q, 0),
           sales_count = p.sales_count + oi.q
      from (
        select product_id, sum(quantity)::int as q
          from public.order_items
         where order_id = p_order_id and product_id is not null
         group by product_id
      ) oi
     where p.id = oi.product_id;
  end if;

  return coalesce(was_unpaid, false);
end
$$;

-- Only the server (service role key) may call it
revoke all on function public.fulfil_order(uuid, text) from public, anon, authenticated;
grant execute on function public.fulfil_order(uuid, text) to service_role;

-- ---------------------------------------------------- row level security
alter table public.subscribers enable row level security;
alter table public.contact_messages enable row level security;
alter table public.product_reviews enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- subscribers and contact_messages: no public policies at all, so only the
-- server (service role) can write to or read them.

drop policy if exists "Public reads approved reviews" on public.product_reviews;
create policy "Public reads approved reviews" on public.product_reviews
  for select using (status = 'approved');

-- Signed-in customers may read their own orders. Creating and changing orders
-- happens only on the server with the service role key.
drop policy if exists "Customers read own orders" on public.orders;
create policy "Customers read own orders" on public.orders
  for select using (auth.uid() = user_id);

drop policy if exists "Customers read own order items" on public.order_items;
create policy "Customers read own order items" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
       where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );