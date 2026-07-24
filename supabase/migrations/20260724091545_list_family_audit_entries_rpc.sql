create or replace function public.list_family_audit_entries(
  requested_family_id uuid,
  requested_limit integer default 100
)
returns table (
  id uuid,
  family_id uuid,
  actor_profile_id uuid,
  action text,
  entity_type text,
  entity_id uuid,
  description_key text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
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
  ) then
    raise exception 'Not a member of this family';
  end if;

  return query
  select
    audit.id,
    audit.family_id,
    audit.actor_profile_id,
    audit.action,
    audit.entity_type,
    audit.entity_id,
    audit.description_key,
    audit.created_at
  from public.family_audit_log audit
  where audit.family_id = requested_family_id
  order by audit.created_at desc
  limit greatest(1, least(coalesce(requested_limit, 100), 250));
end;
$$;

revoke all on function public.list_family_audit_entries(uuid, integer)
from public;

grant execute on function public.list_family_audit_entries(uuid, integer)
to authenticated;
