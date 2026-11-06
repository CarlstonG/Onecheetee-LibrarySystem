# Deploy the live library to Vercel

The app already includes its Supabase integration. The catalog calls `GET /api/books`, and that route reads from the configured Supabase project. You do not need to create an API service, Vercel API key, or second database.

> **Live-data warning:** The deployed site will read and write real library data. Take a Supabase backup before launch. Do not run these repository migrations against the live database until you have checked whether it already has the required schema; the initial migrations create tables and policies and are not safe to rerun blindly.

## 1. Push the repository to GitHub

Push your changes to the GitHub repository connected to this workspace: [CarlstonG/Onecheetee-LibrarySystem](https://github.com/CarlstonG/Onecheetee-LibrarySystem). Wait for the push to finish before importing or redeploying in Vercel.

## 2. Link the GitHub repository in Vercel

1. In Vercel, choose **Add New → Project**.
2. Select **CarlstonG/Onecheetee-LibrarySystem** and choose **Import**.
3. Keep the framework preset set to **Next.js** and the root directory at the repository root.
4. Choose the production branch you push to (usually `main`). Vercel will build it with the existing `npm run build` script.
5. Before the first production deployment, add the environment variables below. Set the live Supabase variables under **Production**. Do not select **Preview** unless you intentionally want preview deployments to access and modify live library data.

## 3. Add the live Supabase API values

In the existing live Supabase project, open **Project Settings → API** (or **API Keys**) and copy the project URL and anon/publishable key. In Vercel, add:

| Variable | Value | Required |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL from the existing Supabase project | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Its anon/publishable key | Yes |
| `NEXT_PUBLIC_SITE_URL` | The deployed site's exact HTTPS origin, with no trailing slash; e.g. `https://your-site.vercel.app` | Only for Google OAuth; recommended |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret/service-role key | Optional; only for pending-user email confirmation |

Use the **anon/publishable** key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`. It is designed to be used by the app with its database row-level security policies. Do not put a secret/service-role key in this variable. `SUPABASE_SERVICE_ROLE_KEY`, if needed, must remain server-only: never prefix it with `NEXT_PUBLIC_`, put it in browser code, commit it, or send it in chat. The catalog API does not need it.

After adding variables, deploy or redeploy the Production deployment so the build and server receive them.

## 4. Check the live database before running SQL

The app expects the schema in these repository migrations:

1. [`supabase/migrations/20261105000000_library_schema.sql`](./supabase/migrations/20261105000000_library_schema.sql) — profiles, books, loans, audit history, access policies, and database functions.
2. [`supabase/migrations/20261105010000_book_cover_storage.sql`](./supabase/migrations/20261105010000_book_cover_storage.sql) — public `book-covers` storage bucket and policies.
3. [`supabase/migrations/20261105020000_categories_featured_catalog.sql`](./supabase/migrations/20261105020000_categories_featured_catalog.sql) — categories, featured-book columns, and related functions.
4. [`supabase/migrations/20261106000000_super_admin_approval.sql`](./supabase/migrations/20261106000000_super_admin_approval.sql) — allows a super admin to approve staff access or appoint another super admin.

If the existing live project already has the schema used by this app, **do not run these migrations again**. If it does not, first take a fresh backup and have the database changes reviewed against the live schema before applying them in Supabase's SQL Editor, in timestamp order. Do not try to make a live deployment work by pasting the initial schema over existing tables or dropping/resetting library data.

If the first three migrations are already installed, apply only the new super-admin approval migration after reviewing it.

## 5. Configure sign-in redirects if using Google

For Google registration and sign-in:

1. Set `NEXT_PUBLIC_SITE_URL` in Vercel to the deployed origin, for example `https://your-site.vercel.app` (no trailing slash).
2. In the live Supabase project, open **Authentication → URL Configuration**. Set **Site URL** to the production origin and add `https://your-site.vercel.app/auth/callback` under **Redirect URLs**.
3. Keep `http://localhost:3000/auth/callback` in the allow-list if you still sign in locally.
4. In **Authentication → Sign In / Providers**, enable Google, allow new users to sign up, and configure Google's authorized callback URI to the Supabase callback URL displayed in the provider settings. This Google-to-Supabase callback is different from the app's Supabase-to-Vercel `/auth/callback`.
5. If you use a custom Vercel domain, update `NEXT_PUBLIC_SITE_URL`, the Supabase **Site URL**, and the allow-listed `<custom-domain>/auth/callback`, then redeploy.

The Google button supports both registration and sign-in. A new Google account is created in `public.profiles` with the `guest` role, which is limited to read-only book scanning. A super admin can approve the account as an admin or appoint it as another super admin from **Dashboard → User roles**. Role changes are recorded in the audit log. New users cannot grant themselves staff roles.

For the first super admin only, register and sign in with the intended Google account, then have the Supabase project owner promote that exact email in the SQL Editor:

```sql
update public.profiles
set role = 'super_admin'
where email = lower('your-authorized-email@example.com');
```

Confirm that exactly one intended profile was updated. Once a super admin exists, use **Dashboard → User roles** to approve other accounts; do not use this bootstrap SQL to promote additional users.

## 6. Verify the live deployment

1. Open `https://<your-vercel-domain>/api/books`. A successful response is JSON containing `books`, `borrowStatus`, and `categories`.
2. Try `https://<your-vercel-domain>/api/books?q=history` and confirm the search response.
3. Check the home page and the book detail pop-up. Register or sign in with Google; a new account should have Guest access only.
4. Sign in as a super admin and open **Dashboard → User roles**. Approve a trusted account as admin, or appoint another super admin. Confirm the role change appears in the audit trail.
5. Open **Dashboard → Scan a book**, allow camera access, and scan a label whose QR value is the book's catalog code. The lookup shows public book details and, for books on loan, borrowed date, due date, and elapsed days out. It never shows borrower identity. Guest accounts are limited to this read-only screen; staff can use **Edit book information** to open the catalog editor. Camera access requires HTTPS on the deployed site.
6. To test checkout, staff can open **Dashboard → Transactions**, choose **Scan book**, and scan a catalog code for an available book. The manual book selector remains available if scanning is not supported or a code does not match.
7. Any add/edit/delete, checkout/return, role change, or cover upload now affects the live Supabase project. Use a known-safe record if checking a write workflow.
8. If the API returns **503**, check that both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set for **Production**, then redeploy. If it returns **500**, inspect the Vercel Function Logs and Supabase logs/schema; do not blindly rerun migrations.

For reference, the variable names are also listed in [`.env.example`](./.env.example).
