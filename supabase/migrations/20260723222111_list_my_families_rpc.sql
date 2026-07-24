create or replace function public.list_my_families()
returns table (
  family_id uuid,
  family_name text,
  member_role text,
  family_created_at timestamptz,
  family_updated_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    f.id as family_id,
    coalesce(nullif(trim(f.name), ''), 'BabyNest Family') as family_name,
    fm.role::text as member_role,
    f.created_at as family_created_at,
    f.updated_at as family_updated_at
  from public.family_members fm
  join public.families f
    on f.id = fm.family_id
  where fm.profile_id = auth.uid()
  order by f.created_at asc;
$$;

revoke all on function public.list_my_families() from public;
grant execute on function public.list_my_families() to authenticated;
