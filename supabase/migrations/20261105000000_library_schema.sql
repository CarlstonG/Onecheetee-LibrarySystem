create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null default 'guest' check (role in ('super_admin', 'admin', 'guest')),
  created_at timestamptz not null default now()
);

create table public.books (
  id uuid primary key default gen_random_uuid(),
  book_code text not null unique,
  isbn text,
  title text not null,
  author text not null,
  date_published date,
  short_description text,
  cover_image_url text,
  status text not null default 'available' check (status in ('available', 'borrowed', 'reserved')),
  created_at timestamptz not null default now()
);

create table public.borrow_records (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete restrict,
  borrower_name text not null,
  borrower_type text not null check (borrower_type in ('student', 'faculty', 'outsider')),
  section text,
  address text,
  borrowed_at timestamptz not null default now(),
  due_date timestamptz not null,
  returned_at timestamptz,
  approved_by uuid references public.profiles(id)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id),
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index books_title_search_idx on public.books using gin (to_tsvector('simple', title));
create index books_author_search_idx on public.books using gin (to_tsvector('simple', author));
create index books_isbn_idx on public.books (isbn);
create index books_code_idx on public.books (book_code);
create index borrow_records_active_due_idx on public.borrow_records (due_date) where returned_at is null;
create unique index borrow_records_one_active_per_book_idx on public.borrow_records (book_id) where returned_at is null;
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);

create or replace function public.app_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role from public.profiles where id = (select auth.uid())
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert or update of email on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.borrow_records enable row level security;
alter table public.audit_logs enable row level security;

grant select on public.profiles to authenticated;
grant select on public.books to anon, authenticated;
grant select on public.borrow_records to authenticated;
grant select on public.audit_logs to authenticated;

create policy "Profiles are visible to their owner and super admins"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.app_role() = 'super_admin');
create policy "Books are publicly browsable"
  on public.books for select to anon, authenticated using (true);

create policy "Staff can view borrower records"
  on public.borrow_records for select to authenticated
  using (public.app_role() in ('admin', 'super_admin'));

create policy "Super admins can view audit history"
  on public.audit_logs for select to authenticated
  using (public.app_role() = 'super_admin');

create or replace view public.public_borrow_status
with (security_invoker = false)
as
  select book_id, borrowed_at, due_date
  from public.borrow_records
  where returned_at is null;

grant select on public.public_borrow_status to anon, authenticated;

create or replace function public.search_public_books(p_query text default '')
returns table (
  id uuid,
  book_code text,
  isbn text,
  title text,
  author text,
  date_published date,
  short_description text,
  cover_image_url text,
  status text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select b.id, b.book_code, b.isbn, b.title, b.author, b.date_published,
         b.short_description, b.cover_image_url, b.status, b.created_at
  from public.books b
  where coalesce(trim(p_query), '') = ''
     or position(lower(trim(p_query)) in lower(concat_ws(' ', b.title, b.author, b.isbn, b.book_code))) > 0
  order by b.title
  limit 250
$$;

grant execute on function public.search_public_books(text) to anon, authenticated;

create or replace function public.save_book(
  p_id uuid,
  p_book_code text,
  p_isbn text,
  p_title text,
  p_author text,
  p_date_published date,
  p_short_description text,
  p_cover_image_url text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_action text;
begin
  if coalesce(public.app_role(), '') not in ('admin', 'super_admin') then
    raise exception 'Administrator access required';
  end if;
  if nullif(trim(p_book_code), '') is null
     or nullif(trim(p_title), '') is null
     or nullif(trim(p_author), '') is null then
    raise exception 'Book code, title, and author are required';
  end if;

  if p_id is null then
    insert into public.books (book_code, isbn, title, author, date_published, short_description, cover_image_url)
    values (trim(p_book_code), nullif(trim(p_isbn), ''), trim(p_title), trim(p_author), p_date_published,
            nullif(trim(p_short_description), ''), nullif(trim(p_cover_image_url), ''))
    returning id into v_id;
    v_action := 'ADD_BOOK';
  else
    update public.books
    set book_code = trim(p_book_code), isbn = nullif(trim(p_isbn), ''), title = trim(p_title),
        author = trim(p_author), date_published = p_date_published,
        short_description = nullif(trim(p_short_description), ''),
        cover_image_url = nullif(trim(p_cover_image_url), '')
    where id = p_id
    returning id into v_id;
    if v_id is null then raise exception 'Book not found'; end if;
    v_action := 'EDIT_BOOK';
  end if;

  insert into public.audit_logs (admin_id, action, details)
  values (auth.uid(), v_action, jsonb_build_object('book_id', v_id, 'title', trim(p_title), 'book_code', trim(p_book_code)));
  return v_id;
end;
$$;

create or replace function public.import_books(p_books jsonb)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_book jsonb;
  v_id uuid;
  v_book_code text;
  v_title text;
  v_author text;
  v_count integer := 0;
begin
  if coalesce(public.app_role(), '') not in ('admin', 'super_admin') then
    raise exception 'Administrator access required';
  end if;
  if coalesce(jsonb_typeof(p_books), '') <> 'array' then
    raise exception 'Import data must be an array';
  end if;
  if jsonb_array_length(p_books) < 1 or jsonb_array_length(p_books) > 500 then
    raise exception 'Import between 1 and 500 books at a time';
  end if;

  for v_book in select value from jsonb_array_elements(p_books) as rows(value)
  loop
    v_book_code := nullif(trim(v_book ->> 'book_code'), '');
    v_title := nullif(trim(v_book ->> 'title'), '');
    v_author := nullif(trim(v_book ->> 'author'), '');
    if v_book_code is null or v_title is null or v_author is null then
      raise exception 'Every book must include book_code, title, and author';
    end if;

    insert into public.books (book_code, isbn, title, author, date_published, short_description, cover_image_url)
    values (
      v_book_code,
      nullif(trim(v_book ->> 'isbn'), ''),
      v_title,
      v_author,
      nullif(trim(v_book ->> 'date_published'), '')::date,
      nullif(trim(v_book ->> 'short_description'), ''),
      nullif(trim(v_book ->> 'cover_image_url'), '')
    )
    returning id into v_id;

    insert into public.audit_logs (admin_id, action, details)
    values (auth.uid(), 'ADD_BOOK', jsonb_build_object('book_id', v_id, 'title', v_title, 'book_code', v_book_code, 'source', 'bulk_import'));
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

create or replace function public.delete_book_by_id(p_book_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_title text;
  v_code text;
begin
  if coalesce(public.app_role(), '') not in ('admin', 'super_admin') then
    raise exception 'Administrator access required';
  end if;
  select title, book_code into v_title, v_code from public.books where id = p_book_id for update;
  if not found then raise exception 'Book not found'; end if;
  delete from public.books where id = p_book_id;
  insert into public.audit_logs (admin_id, action, details)
  values (auth.uid(), 'DELETE_BOOK', jsonb_build_object('book_id', p_book_id, 'title', v_title, 'book_code', v_code));
end;
$$;

create or replace function public.checkout_book(
  p_book_id uuid,
  p_borrower_name text,
  p_borrower_type text,
  p_section text,
  p_address text,
  p_due_date timestamptz,
  p_approved_by uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_status text;
  v_record_id uuid;
begin
  if coalesce(public.app_role(), '') not in ('admin', 'super_admin')
     or p_approved_by is distinct from auth.uid() then
    raise exception 'Administrator access required';
  end if;
  if nullif(trim(p_borrower_name), '') is null or p_due_date <= now() then
    raise exception 'Borrower name and a future due date are required';
  end if;
  select status into v_status from public.books where id = p_book_id for update;
  if not found or v_status <> 'available' then raise exception 'Book is not available'; end if;

  insert into public.borrow_records (book_id, borrower_name, borrower_type, section, address, due_date, approved_by)
  values (p_book_id, trim(p_borrower_name), p_borrower_type, nullif(trim(p_section), ''),
          nullif(trim(p_address), ''), p_due_date, auth.uid())
  returning id into v_record_id;
  update public.books set status = 'borrowed' where id = p_book_id;
  insert into public.audit_logs (admin_id, action, details)
  values (auth.uid(), 'APPROVE_BORROW', jsonb_build_object('record_id', v_record_id, 'book_id', p_book_id, 'borrower_name', trim(p_borrower_name), 'due_date', p_due_date));
  return v_record_id;
end;
$$;

create or replace function public.approve_book_return(p_record_id uuid, p_approved_by uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_book_id uuid;
  v_title text;
begin
  if coalesce(public.app_role(), '') not in ('admin', 'super_admin')
     or p_approved_by is distinct from auth.uid() then
    raise exception 'Administrator access required';
  end if;
  select r.book_id, b.title into v_book_id, v_title
  from public.borrow_records r join public.books b on b.id = r.book_id
  where r.id = p_record_id and r.returned_at is null
  for update of r, b;
  if not found then raise exception 'Active checkout not found'; end if;
  update public.borrow_records set returned_at = now(), approved_by = auth.uid() where id = p_record_id;
  update public.books set status = 'available' where id = v_book_id;
  insert into public.audit_logs (admin_id, action, details)
  values (auth.uid(), 'APPROVE_RETURN', jsonb_build_object('record_id', p_record_id, 'book_id', v_book_id, 'title', v_title));
end;
$$;

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
  if p_role not in ('admin', 'guest') then raise exception 'Role must be admin or guest'; end if;
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

revoke all on function public.save_book(uuid, text, text, text, text, date, text, text) from public;
revoke all on function public.import_books(jsonb) from public;
revoke all on function public.delete_book_by_id(uuid) from public;
revoke all on function public.checkout_book(uuid, text, text, text, text, timestamptz, uuid) from public;
revoke all on function public.approve_book_return(uuid, uuid) from public;
revoke all on function public.assign_profile_role(uuid, text, uuid) from public;
grant execute on function public.save_book(uuid, text, text, text, text, date, text, text) to authenticated;
grant execute on function public.import_books(jsonb) to authenticated;
grant execute on function public.delete_book_by_id(uuid) to authenticated;
grant execute on function public.checkout_book(uuid, text, text, text, text, timestamptz, uuid) to authenticated;
grant execute on function public.approve_book_return(uuid, uuid) to authenticated;
grant execute on function public.assign_profile_role(uuid, text, uuid) to authenticated;
