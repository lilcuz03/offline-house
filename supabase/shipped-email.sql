-- Run in the Supabase SQL editor to enable one-time shipping notifications.
alter table public.orders
  add column if not exists shipped_email_sent_at timestamptz;
