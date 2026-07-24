create or replace function public.update_family_member_role(
  requested_family_id uuid,
  requested_profile_id uuid,
  requested_role text
)
returns table (
  family_id uuid,
  profile_id uuid,
  role text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.family_members fm
    where fm.family_id = requested_family_id
      and fm.profile_id = auth.uid()
      and fm.role::text = 'owner'
  ) then
    raise exception 'Only the family owner can change member roles';
  end if;

  if requested_role not in (
    'parent',
    'guardian',
    'grandparent',
    'babysitter',
    'doctor',
    'viewer'
  ) then
    raise exception 'Invalid family role';
  end if;

  if not exists (
    select 1
    from public.family_members fm
    where fm.family_id = requested_family_id
      and fm.profile_id = requested_profile_id
  ) then
    raise exception 'Family member not found';
  end if;

  if exists (
    select 1
    from public.family_members fm
    where fm.family_id = requested_family_id
      and fm.profile_id = requested_profile_id
      and fm.role::text = 'owner'
  ) then
    raise exception 'The owner role cannot be changed here';
  end if;

  update public.family_members fm
  set role = requested_role::public.family_role
  where fm.family_id = requested_family_id
    and fm.profile_id = requested_profile_id;

  return query
  select
    fm.family_id,
    fm.profile_id,
    fm.role::text
  from public.family_members fm
  where fm.family_id = requested_family_id
    and fm.profile_id = requested_profile_id;
end;
$$;

revoke all on function public.update_family_member_role(
  uuid,
  uuid,
  text
) from public;

grant execute on function public.update_family_member_role(
  uuid,
  uuid,
  text
) to authenticated;
