
alter table public.subscriptions
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists status text,
  add column if not exists current_period_start timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists cancel_at_period_end boolean default false,
  add column if not exists environment text default 'sandbox';

create unique index if not exists subscriptions_stripe_sub_uidx on public.subscriptions(stripe_subscription_id) where stripe_subscription_id is not null;
create index if not exists subscriptions_user_env_idx on public.subscriptions(user_id, environment);

grant all on public.subscriptions to service_role;
