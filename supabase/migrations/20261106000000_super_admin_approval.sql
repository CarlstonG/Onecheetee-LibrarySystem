create or replace function public.assign_profile_role(p_user_id uuid, p_role text, p_admin_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text;
begin
  if public.app_role() is distinct from 'super_admin'
     or p_admin_id is distinct from auth.uid() then
    raise exception 'Super admin access required';
  end if;
  if p_role is null or p_role not in ('admin', 'guest', 'super_admin') then
    raise exception 'Role must be admin, guest, or super_admin';
  end if;
  select email into v_email from public.profiles where id = p_user_id for update;
  if not found then raise exception 'User profile not found'; end if;
  if exists (select 1 from public.profiles where id = p_user_id and role = 'super_admin') then
    raise exception 'Super admin roles cannot be changed here';
  end if;
  update public.profiles set role = p_role where id = p_user_id;
  insert into public.audit_logs (admin_id, action, details)
  values (auth.uid(), 'ASSIGN_ROLE', jsonb_build_object('user_id', p_user_id, 'email', v_email, 'role', p_role));
end;
$$;

revoke all on function public.assign_profile_role(uuid, text, uuid) from public;
grant execute on function public.assign_profile_role(uuid, text, uuid) to authenticated;
