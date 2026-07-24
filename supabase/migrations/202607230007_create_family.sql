create or replace function public.create_family(
  p_name text
)
returns table (
  family_id uuid,
  family_name text,
  assigned_role text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_family_id uuid;
  v_family_name text;
begin
  v_user_id := auth.uid();
  v_family_name := trim(p_name);

  if v_user_id is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if v_family_name is null or length(v_family_name) < 2 then
    raise exception 'FAMILY_NAME_TOO_SHORT';
  end if;

  if length(v_family_name) > 80 then
    raise exception 'FAMILY_NAME_TOO_LONG';
  end if;

  insert into public.families (
    id,
    name
  )
  values (
    gen_random_uuid(),
    v_family_name
  )
  returning id into v_family_id;

  insert into public.family_members (
    id,
    family_id,
    profile_id,
    role,
    status
  )
  values (
    gen_random_uuid(),
    v_family_id,
    v_user_id,
    'owner'::public.family_role,
    'active'
  );

  return query
  select
    v_family_id,
    v_family_name,
    'owner'::text;
end;
$$;

revoke all
on function public.create_family(text)
from public;

grant execute
on function public.create_family(text)
to authenticated;
