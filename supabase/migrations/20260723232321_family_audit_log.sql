create table if not exists public.family_audit_log (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  actor_profile_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  description_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists family_audit_log_family_created_idx
  on public.family_audit_log (family_id, created_at desc);

alter table public.family_audit_log enable row level security;

drop policy if exists "Family members can read family audit" 
  on public.family_audit_log;

create policy "Family members can read family audit"
on public.family_audit_log
for select
to authenticated
using (
  exists (
    select 1
    from public.family_members fm
    where fm.family_id = family_audit_log.family_id
      and fm.profile_id = auth.uid()
  )
);

create or replace function public.create_family_audit_entry(
  requested_family_id uuid,
  requested_action text,
  requested_entity_type text,
  requested_entity_id uuid,
  requested_description_key text
)
returns public.family_audit_log
language plpgsql
security definer
set search_path = public
as $$
declare
  created_entry public.family_audit_log;
begin
  if not exists (
    select 1
    from public.family_members fm
    where fm.family_id = requested_family_id
      and fm.profile_id = auth.uid()
  ) then
    raise exception 'Not a member of this family';
  end if;

  insert into public.family_audit_log (
    family_id,
    actor_profile_id,
    action,
    entity_type,
    entity_id,
    description_key
  )
  values (
    requested_family_id,
    auth.uid(),
    requested_action,
    requested_entity_type,
    requested_entity_id,
    requested_description_key
  )
  returning * into created_entry;

  return created_entry;
end;
$$;

revoke all on function public.create_family_audit_entry(
  uuid,
  text,
  text,
  uuid,
  text
) from public;

grant execute on function public.create_family_audit_entry(
  uuid,
  text,
  text,
  uuid,
  text
) to authenticated;
