create or replace function public.get_family_subscription(
  p_family_id uuid
)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select
    case
      when exists (
        select 1
        from public.family_members fm
        join public.profiles p
          on p.id = fm.profile_id
        where fm.family_id = p_family_id
          and fm.status = 'active'
          and p.subscription_plan = 'premium'
      )
      then 'premium'
      else 'free'
    end;
$$;

revoke all
on function public.get_family_subscription(uuid)
from public;

grant execute
on function public.get_family_subscription(uuid)
to authenticated;
