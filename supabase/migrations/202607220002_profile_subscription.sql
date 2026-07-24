begin;

alter table public.profiles
  add column subscription_plan text not null default 'free'
  check (subscription_plan in ('free', 'premium'));

revoke update on public.profiles from authenticated;
grant update (display_name) on public.profiles to authenticated;

commit;
