create or replace function public.list_family_members(
  p_family_id uuid
)
returns table (
  family_id uuid,
  profile_id uuid,
  role text,
  status text,
  display_name text,
  email text,
  subscription_plan text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if not exists (
    select 1
    from public.family_members requester
    where requester.family_id = p_family_id
      and requester.profile_id = auth.uid()
      and requester.status = 'active'
  ) then
    raise exception 'FAMILY_ACCESS_DENIED';
  end if;

  return query
  select
    fm.family_id,
    fm.profile_id,
    fm.role::text,
    fm.status::text,
    coalesce(
      nullif(trim(p.display_name), ''),
      split_part(coalesce(p.email, ''), '@', 1),
      'Family member'
    ) as display_name,
    p.email,
    coalesce(p.subscription_plan, 'free')::text,
    fm.created_at
  from public.family_members fm
  left join public.profiles p
    on p.id = fm.profile_id
  where fm.family_id = p_family_id
    and fm.status = 'active'
  order by
    case when fm.role::text = 'owner' then 0 else 1 end,
    fm.created_at asc;
end;
$$;

revoke all
on function public.list_family_members(uuid)
from public;

grant execute
on function public.list_family_members(uuid)
to authenticated;
