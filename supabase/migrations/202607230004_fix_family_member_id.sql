alter table public.family_members
alter column id
set default gen_random_uuid();

create or replace function public.accept_family_invitation(
  p_invite_code text
)
returns table (
  family_id uuid,
  invitation_id uuid,
  assigned_role text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_user_email text;
  v_invitation public.family_invitations%rowtype;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  select lower(coalesce(email, ''))
    into v_user_email
  from public.profiles
  where id = v_user_id;

  select *
    into v_invitation
  from public.family_invitations
  where upper(invite_code) = upper(trim(p_invite_code))
  for update;

  if not found then
    raise exception 'INVITATION_NOT_FOUND';
  end if;

  if v_invitation.status <> 'pending' then
    raise exception 'INVITATION_NOT_PENDING';
  end if;

  if v_invitation.expires_at <= now() then
    update public.family_invitations
    set
      status = 'expired',
      updated_at = now()
    where id = v_invitation.id;

    raise exception 'INVITATION_EXPIRED';
  end if;

  if
    v_invitation.email is not null
    and trim(v_invitation.email) <> ''
    and lower(trim(v_invitation.email)) <>
        lower(trim(coalesce(v_user_email, '')))
  then
    raise exception 'INVITATION_EMAIL_MISMATCH';
  end if;

  if exists (
    select 1
    from public.family_members fm
    where fm.family_id = v_invitation.family_id
      and fm.profile_id = v_user_id
  ) then
    update public.family_invitations
    set
      status = 'accepted',
      accepted_by = v_user_id,
      accepted_at = coalesce(accepted_at, now()),
      updated_at = now()
    where id = v_invitation.id;

    return query
    select
      v_invitation.family_id,
      v_invitation.id,
      v_invitation.role;

    return;
  end if;

  insert into public.family_members (
    id,
    family_id,
    profile_id,
    role
  )
  values (
    gen_random_uuid(),
    v_invitation.family_id,
    v_user_id,
    v_invitation.role::public.family_role
  );

  update public.family_invitations
  set
    status = 'accepted',
    accepted_by = v_user_id,
    accepted_at = now(),
    updated_at = now()
  where id = v_invitation.id;

  return query
  select
    v_invitation.family_id,
    v_invitation.id,
    v_invitation.role;
end;
$$;

revoke all
on function public.accept_family_invitation(text)
from public;

grant execute
on function public.accept_family_invitation(text)
to authenticated;
