 -- Offline House store schema. Run once in the Supabase SQL editor.
--
-- If you ALREADY have a products table, do not run this blindly: compare the
-- columns first, or send me your columns and I will adapt the code instead.
-- Prices are stored in cents (R449.00 = 44900) and converted to rands in
-- src/lib/catalog.ts.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  category text,                         -- display label, e.g. 'Tech'
  collections text[] not null default '{}',  -- collection slugs, e.g. {tech,chargers}
  price_cents integer not null check (price_cents >= 0),
  compare_at_cents integer check (compare_at_cents is null or compare_at_cents > 0),
  on_sale boolean generated always as (
    compare_at_cents is not null and compare_at_cents > price_cents
  ) stored,
  images text[] not null default '{}',   -- first = main photo, second = hover photo
  badge text,                            -- e.g. 'New'
  stock integer not null default 0 check (stock >= 0),
  variants jsonb not null default '[]',  -- [{"name":"Colour","options":["Black","Sand"]}]
  details text[] not null default '{}',  -- bullet points for the Details accordion
  sales_count integer not null default 0,
  rating_avg numeric(2,1),
  rating_count integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists products_collections_idx on public.products using gin (collections);
create index if not exists products_sales_idx on public.products (sales_count desc);

-- ----------------------------------------------------------------- reviews
create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text not null,
  verified boolean not null default false,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create index if not exists product_reviews_product_idx on public.product_reviews (product_id, status);

-- Keep the cached rating on products in step with APPROVED reviews only
create or replace function public.refresh_product_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare pid uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products p set
    rating_avg = (select round(avg(rating)::numeric, 1) from public.product_reviews
                  where product_id = pid and status = 'approved'),
    rating_count = (select count(*) from public.product_reviews
                    where product_id = pid and status = 'approved')
  where p.id = pid;
  return null;
end $$;

drop trigger if exists product_reviews_rating on public.product_reviews;
create trigger product_reviews_rating
after insert or update or delete on public.product_reviews
for each row execute function public.refresh_product_rating();

-- ------------------------------------------------------------------ orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,           -- e.g. 'OH-482913', shown to customers
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
    check (status in ('pending','confirmed','packed','shipped','delivered','cancelled')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','paid','failed','refunded')),
  payment_provider text,                 -- 'payfast' or 'stitch'
  payment_reference text,
  tracking_url text,
  carrier text,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,                    -- snapshot, so history survives edits
  variant text,
  image text,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity between 1 and 99)
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- --------------------------------------------------------------- messaging
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  topic text not null,
  order_number text,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'website',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------- row level security
alter table public.products enable row level security;
alter table public.product_reviews enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.contact_messages enable row level security;
alter table public.subscribers enable row level security;

-- Anyone may read active products and approved reviews
drop policy if exists "Public reads active products" on public.products;
create policy "Public reads active products" on public.products
  for select using (active);

drop policy if exists "Public reads approved reviews" on public.product_reviews;
create policy "Public reads approved reviews" on public.product_reviews
  for select using (status = 'approved');

-- Signed-in customers may read their own orders. Creating and changing orders
-- and reviews happens only on the server with the service role key.
drop policy if exists "Customers read own orders" on public.orders;
create policy "Customers read own orders" on public.orders
  for select using (auth.uid() = user_id);

drop policy if exists "Customers read own order items" on public.order_items;
create policy "Customers read own order items" on public.order_items
  for select using (
    exists (select 1 from public.orders o
            where o.id = order_items.order_id and o.user_id = auth.uid())
  );
