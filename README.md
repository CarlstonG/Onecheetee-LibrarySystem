# Ong Che Tee - Bacong High School Library System

A responsive library catalog and staff dashboard built with Next.js App Router, TypeScript, Tailwind CSS, Supabase, and Lucide icons.

## Run locally

1. Install Node.js 20.9 or newer.
2. Copy `.env.example` to `.env.local` and set your Supabase project URL and anon/publishable key.
3. Run the SQL migrations in the Supabase SQL editor in timestamp order:
   - [`20261105000000_library_schema.sql`](./supabase/migrations/20261105000000_library_schema.sql)
   - [`20261105010000_book_cover_storage.sql`](./supabase/migrations/20261105010000_book_cover_storage.sql)
   - [`20261105020000_categories_featured_catalog.sql`](./supabase/migrations/20261105020000_categories_featured_catalog.sql)
4. Configure Google as an OAuth provider in Supabase if Google sign-in is needed. Add `http://localhost:3000/auth/callback` to the Supabase redirect URL allow-list. For deployment, set `NEXT_PUBLIC_SITE_URL` to the production origin and add its `/auth/callback` URL as well.
5. Run `npm run dev`, then open `http://localhost:3000`.

The public catalog is available before configuration, but will report that Supabase is not connected until the environment variables and migration are in place. Admin access always requires an authenticated Supabase account and a profile with an authorized role.

## First super admin

Create the first staff account using Supabase Auth email/password or Google OAuth. The database trigger creates its profile with the `guest` role. Promote this account once in the Supabase SQL editor, substituting the account email:

```sql
update public.profiles
set role = 'super_admin'
where email = 'library-admin@example.edu';
```

Super admins can then promote other registered accounts from **Dashboard → User roles**. Public sign-up is intentionally not exposed in the application.

## Confirming pending users

The Super Admin **Dashboard → User roles** page can confirm email addresses for existing, unconfirmed Supabase Auth accounts. To enable it locally, copy the Supabase **Secret key** (or legacy `service_role` key) into `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`, then restart the app. This key grants privileged project access: never expose it with a `NEXT_PUBLIC_` prefix, commit it, or send it in chat. For deployment, configure it as a server-side environment variable in the hosting provider. Confirmation grants the account its existing `guest` role; promote it separately if staff dashboard access is intended.

## Features

- Public catalog search across title, author, ISBN, and book code, with book details and availability.
- Public loan display includes only checkout and due dates; borrower identity, section, and address are available to staff only.
- Staff sign-in by email/password or Google OAuth.
- Admin catalog management and checkout/return workflows.
- Editable book categories with title-based category suggestions that staff can change.
- A manually curated homepage feature area (up to six books), optional author/reference and PDF links, and 12-book catalog pages with manual arrows and page selectors.
- CSV/JSON catalog imports (up to 500 books per atomic import); missing author names default to “Not listed yet”.
- Super admin role assignment and audit history.
- PostgreSQL row-level security and database functions that validate staff roles and atomically update inventory, loans, and audit entries.

Staff can upload JPEG or PNG book covers up to 5 MB to the public `book-covers` Supabase Storage bucket. The storage migration creates the bucket and limits uploads, and its policies allow only admins and super admins to upload, update, or delete covers. Existing cover URLs and externally hosted image URLs remain supported.

For a database that already has the library schema and cover-storage migrations, run [`20261105020000_categories_featured_catalog.sql`](./supabase/migrations/20261105020000_categories_featured_catalog.sql) in the Supabase SQL editor to enable categories and featured books.

## Commands

```bash
npm run dev
npm run lint
npm run build
```
