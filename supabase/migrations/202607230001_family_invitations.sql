create table if not exists public.family_invitations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  invited_by uuid not null references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null check (
    role in (
      'parent',
      'guardian',
      'grandparent',
      'babysitter',
      'doctor',
      'viewer'
    )
  ),
  invite_code text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz not null,
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists family_invitations_family_id_idx
  on public.family_invitations(family_id);

create index if not exists family_invitations_email_idx
  on public.family_invitations(lower(email));

create index if not exists family_invitations_status_idx
  on public.family_invitations(status);

alter table public.family_invitations
  enable row level security;

create policy "Family members can view invitations"
on public.family_invitations
for select
using (
  exists (
    select 1
    from public.family_members fm
    where fm.family_id = family_invitations.family_id
      and fm.profile_id = auth.uid()
  )
  or lower(coalesce(email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

create policy "Owners can create invitations"
on public.family_invitations
for insert
with check (
  invited_by = auth.uid()
  and exists (
    select 1
    from public.family_members fm
    where fm.family_id = family_invitations.family_id
      and fm.profile_id = auth.uid()
      and fm.role = 'owner'
  )
);

create policy "Owners can update invitations"
on public.family_invitations
for update
using (
  exists (
    select 1
    from public.family_members fm
    where fm.family_id = family_invitations.family_id
      and fm.profile_id = auth.uid()
      and fm.role = 'owner'
  )
  or lower(coalesce(email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
)
with check (
  exists (
    select 1
    from public.family_members fm
    where fm.family_id = family_invitations.family_id
      and fm.profile_id = auth.uid()
      and fm.role = 'owner'
  )
  or lower(coalesce(email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
);
