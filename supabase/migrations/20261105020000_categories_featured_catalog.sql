create table public.book_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

insert into public.book_categories (name, slug)
values
  ('Fiction & Popular', 'fiction-popular'),
  ('Chemistry', 'chemistry'),
  ('Physics', 'physics'),
  ('Mathematics', 'mathematics'),
  ('Biology & Life Science', 'biology-life-science'),
  ('Science Series', 'science-series'),
  ('Social Studies & History', 'social-studies-history'),
  ('English & Language Arts', 'english-language-arts'),
  ('Computer & IT', 'computer-it'),
  ('Health & Home', 'health-home'),
  ('Economics & Business', 'economics-business'),
  ('Travel & Geography', 'travel-geography'),
  ('Parenting & Family', 'parenting-family'),
  ('Religion & Spirituality', 'religion-spirituality'),
  ('Other / Needs Review', 'other-needs-review')
on conflict (slug) do update set name = excluded.name;

alter table public.books
  add column category_id uuid references public.book_categories(id) on delete restrict,
  add column is_featured boolean not null default false,
  add column featured_description text,
  add column author_url text,
  add column pdf_url text;

create index books_category_id_idx on public.books (category_id);
create index books_featured_idx on public.books (is_featured) where is_featured;

create or replace function public.classify_book_category(p_title text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when p_title ~* '(organic chemistry|chemistry|chemical|geochemistry)' then 'chemistry'
    when p_title ~* '(physics|thermodynamics)' then 'physics'
    when p_title ~* '(mathemat|maths|math |math$|algebra|geometry|calculus|probability|number and data|saxon|construction mathematics)' then 'mathematics'
    when p_title ~* '(sci-bytes|science explorer|focus on physical science|active science)' then 'science-series'
    when p_title ~* '(biology|life science|animal behavior|evolutionary genetics)' then 'biology-life-science'
    when p_title ~* '(history|historical|geography|geology|sose|lands and peoples|ethnic new york|classical greece|search for security|australia in the twentieth century|pieces of australian history)' then 'social-studies-history'
    when p_title ~* '(english|writing|reading|spelling|language arts|communication arts|literature|filipino literature|think, talk and write|cuklas)' then 'english-language-arts'
    when p_title ~* '(computer|dos |windows|os/2|digital design|java how to program|z80|machine shop|automotive mechanics|manufacturing processes)' then 'computer-it'
    when p_title ~* '(health|fitness|nutrition|medical|pediatric|cardiovascular|allergy|cancer|physical education|mapeh|swim|tennis|running|athletics|chess|water safety|soy solution|human sexuality|vital signs|body in balance|healthy living)' then 'health-home'
    when p_title ~* '(economics|business|financial|profit|tax |tax$|selling|entrepreneur|retail|money guide|financial services|small business|office tax)' then 'economics-business'
    when p_title ~* '(travel|switzerland|malaysia|italy|beijing)' then 'travel-geography'
    when p_title ~* '(parent|baby|babies|family|preemie|twins|potty|motherhood|detox|volunteering|student to student)' then 'parenting-family'
    when p_title ~* '(bible|testament|church|christ|holy ambition|rich in love)' then 'religion-spirituality'
    when p_title ~* '(fortunate life|great ring-in|montana 1948|funky fishing|paper toys|nicolas,|good to read|jane eyre|slave of frankenstein|gulliver|songs in ordinary time|bourne|game and yours|richest man in babylon|star trek|uncle tom|stormqueen|two minute mysteries|iron mask|catfantastic|doon|somewhere safe|twanged|microtrends|shrinking man|windwitch|yellow sun|clash of kings|dragon can.t dance|miss nightingale|pool of two moons|second wind|devil.s teardrop|slam|red badge|barshinskeys|mqueen|wild fire|returning|feathers|unbelonging|king lear|inner circle|copenhagen|baghdad|thomas covenant|horse.s arse|examination|manhattan beach|echoes of time|line doggie|last baroness|rich in love)' then 'fiction-popular'
    else 'other-needs-review'
  end
$$;

update public.books b
set category_id = c.id
from public.book_categories c
where c.slug = public.classify_book_category(b.title);

create or replace function public.assign_default_book_category()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.category_id is null then
    select id into new.category_id
    from public.book_categories
    where slug = public.classify_book_category(new.title);
  end if;
  return new;
end;
$$;

create trigger assign_default_book_category_before_write
  before insert or update of title on public.books
  for each row execute function public.assign_default_book_category();

alter table public.book_categories enable row level security;
grant select on public.book_categories to anon, authenticated;

create policy "Book categories are publicly browsable"
  on public.book_categories for select to anon, authenticated using (true);

drop function public.search_public_books(text);

create function public.search_public_books(p_query text default '')
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
  created_at timestamptz,
  category_id uuid,
  category_name text,
  category_slug text,
  is_featured boolean,
  featured_description text,
  author_url text,
  pdf_url text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select b.id, b.book_code, b.isbn, b.title, b.author, b.date_published,
         b.short_description, b.cover_image_url, b.status, b.created_at,
         b.category_id, c.name, c.slug, b.is_featured, b.featured_description,
         b.author_url, b.pdf_url
  from public.books b
  left join public.book_categories c on c.id = b.category_id
  where coalesce(trim(p_query), '') = ''
     or position(lower(trim(p_query)) in lower(concat_ws(' ', b.title, b.author, b.isbn, b.book_code, c.name))) > 0
  order by b.title, b.book_code
  limit 1000
$$;

drop function public.save_book(uuid, text, text, text, text, date, text, text);

create function public.save_book(
  p_id uuid,
  p_book_code text,
  p_isbn text,
  p_title text,
  p_author text,
  p_date_published date,
  p_short_description text,
  p_cover_image_url text,
  p_category_id uuid,
  p_is_featured boolean,
  p_featured_description text,
  p_author_url text,
  p_pdf_url text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_action text;
  v_category_id uuid;
begin
  if coalesce(public.app_role(), '') not in ('admin', 'super_admin') then
    raise exception 'Administrator access required';
  end if;
  if nullif(trim(p_book_code), '') is null
     or nullif(trim(p_title), '') is null
     or nullif(trim(p_author), '') is null then
    raise exception 'Book code, title, and author are required';
  end if;
  if p_is_featured and (
    select count(*) from public.books
    where is_featured and id is distinct from p_id
  ) >= 6 then
    raise exception 'Only six books can be featured at a time';
  end if;
  if p_category_id is null then
    select id into v_category_id
    from public.book_categories
    where slug = public.classify_book_category(p_title);
  else
    v_category_id := p_category_id;
  end if;

  if p_id is null then
    insert into public.books (
      book_code, isbn, title, author, date_published, short_description, cover_image_url,
      category_id, is_featured, featured_description, author_url, pdf_url
    )
    values (
      trim(p_book_code), nullif(trim(p_isbn), ''), trim(p_title), trim(p_author), p_date_published,
      nullif(trim(p_short_description), ''), nullif(trim(p_cover_image_url), ''),
      v_category_id, coalesce(p_is_featured, false), nullif(trim(p_featured_description), ''),
      nullif(trim(p_author_url), ''), nullif(trim(p_pdf_url), '')
    )
    returning id into v_id;
    v_action := 'ADD_BOOK';
  else
    update public.books
    set book_code = trim(p_book_code), isbn = nullif(trim(p_isbn), ''), title = trim(p_title),
        author = trim(p_author), date_published = p_date_published,
        short_description = nullif(trim(p_short_description), ''),
        cover_image_url = nullif(trim(p_cover_image_url), ''),
        category_id = v_category_id, is_featured = coalesce(p_is_featured, false),
        featured_description = nullif(trim(p_featured_description), ''),
        author_url = nullif(trim(p_author_url), ''), pdf_url = nullif(trim(p_pdf_url), '')
    where id = p_id
    returning id into v_id;
    if v_id is null then raise exception 'Book not found'; end if;
    v_action := 'EDIT_BOOK';
  end if;

  insert into public.audit_logs (admin_id, action, details)
  values (
    auth.uid(),
    v_action,
    jsonb_build_object(
      'book_id', v_id,
      'title', trim(p_title),
      'book_code', trim(p_book_code),
      'category_id', v_category_id,
      'is_featured', coalesce(p_is_featured, false)
    )
  );
  return v_id;
end;
$$;

create or replace function public.save_book_category(p_id uuid, p_name text, p_slug text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_old_name text;
begin
  if coalesce(public.app_role(), '') not in ('admin', 'super_admin') then
    raise exception 'Administrator access required';
  end if;
  if nullif(trim(p_name), '') is null or coalesce(p_slug, '') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'Enter a category name containing letters or numbers';
  end if;
  if p_id is null then
    insert into public.book_categories (name, slug)
    values (trim(p_name), p_slug)
    returning id into v_id;
    insert into public.audit_logs (admin_id, action, details)
    values (auth.uid(), 'ADD_CATEGORY', jsonb_build_object('category_id', v_id, 'name', trim(p_name)));
  else
    select name into v_old_name from public.book_categories where id = p_id for update;
    if not found then raise exception 'Category not found'; end if;
    if p_slug = 'other-needs-review' then
      raise exception 'The review category cannot be renamed';
    end if;
    update public.book_categories set name = trim(p_name), slug = p_slug where id = p_id;
    v_id := p_id;
    insert into public.audit_logs (admin_id, action, details)
    values (auth.uid(), 'EDIT_CATEGORY', jsonb_build_object('category_id', v_id, 'old_name', v_old_name, 'name', trim(p_name)));
  end if;
  return v_id;
end;
$$;

create or replace function public.delete_book_category(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name text;
  v_slug text;
begin
  if coalesce(public.app_role(), '') not in ('admin', 'super_admin') then
    raise exception 'Administrator access required';
  end if;
  select name, slug into v_name, v_slug from public.book_categories where id = p_id for update;
  if not found then raise exception 'Category not found'; end if;
  if v_slug = 'other-needs-review' then raise exception 'The review category cannot be deleted'; end if;
  if exists (select 1 from public.books where category_id = p_id) then
    raise exception 'Move books to another category before deleting this category';
  end if;
  delete from public.book_categories where id = p_id;
  insert into public.audit_logs (admin_id, action, details)
  values (auth.uid(), 'DELETE_CATEGORY', jsonb_build_object('category_id', p_id, 'name', v_name));
end;
$$;

revoke all on function public.classify_book_category(text) from public;
revoke all on function public.assign_default_book_category() from public;
revoke all on function public.save_book(uuid, text, text, text, text, date, text, text, uuid, boolean, text, text, text) from public;
revoke all on function public.save_book_category(uuid, text, text) from public;
revoke all on function public.delete_book_category(uuid) from public;

grant execute on function public.search_public_books(text) to anon, authenticated;
grant execute on function public.save_book(uuid, text, text, text, text, date, text, text, uuid, boolean, text, text, text) to authenticated;
grant execute on function public.save_book_category(uuid, text, text) to authenticated;
grant execute on function public.delete_book_category(uuid) to authenticated;
