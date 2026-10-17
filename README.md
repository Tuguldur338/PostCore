This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# PostCore

## Purchase requests and order management

Purchase requests are stored in Supabase instead of being sent by email. To set up order management:

1. Create a Supabase project and run [`supabase/schema.sql`](./supabase/schema.sql) in its SQL Editor. This creates the shared product catalog, atomic stock deduction, and marketplace role tables. The bootstrap roles are `ADMIN` for `tuguldur09252@gmail.com` and `Marketplace Admin` for `tuguldur.b2016@orkhonschool.edu.mn` and `irmuun.s2016@orkhonschool.edu.mn`.
2. In Supabase Authentication, enable email/password sign-in and public sign-ups. Email confirmation is recommended. Register the three bootstrap addresses through the marketplace account form and confirm each address if confirmation is enabled. Then mark their Supabase Auth accounts as marketplace admins in the SQL Editor:

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
     || '{"role":"marketing_admin"}'::jsonb
   where email in (
     'tuguldur.b2016@orkhonschool.edu.mn',
     'irmuun.s2016@orkhonschool.edu.mn',
     'tuguldur09252@gmail.com'
   );
   ```

   The `marketing_admin` app-metadata role grants trusted Supabase admin access. The separate marketplace profile role controls the badge distinction: Tuguldur09252@gmail.com is `ADMIN`, and the two school addresses are `Marketplace Admin`. If an account was already signed in, sign out and back in after running the update.
3. Add these variables to `.env.local` and restart the development server:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   MARKETING_ADMIN_EMAIL=tuguldur.b2016@orkhonschool.edu.mn,irmuun.s2016@orkhonschool.edu.mn,tuguldur09252@gmail.com
   ```

   Get the project URL and publishable key from **Supabase → Project Settings → API Keys**. The legacy anon key is also supported as `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The Supabase URL and publishable/anon key are intended for browser use; database row-level security protects role, order, and inventory updates. Do not add a Supabase service-role key to the application. `MARKETING_ADMIN_EMAIL` is an informational setting retained from older setups; the Supabase profile roles created by `schema.sql` are authoritative.
4. Open the marketplace and sign in with a Supabase account. Go to `/orders` to review new requests, mark them completed, or delete them. The same Marketplace Admin or ADMIN account can add listings at `/sell` and manage inventory at `/products`. ADMIN accounts can also assign account badges from the role controls on `/orders`.
5. For a deployed site, add the Supabase URL and publishable key to the hosting provider's environment-variable settings and redeploy. `.env.local` is only used for local development.

The website does not process payments. Orders remain in the Supabase database until deleted. A finite product quantity decreases only when an order is successfully saved; orders that cannot be fulfilled because stock has changed are rejected without reducing inventory. The two built-in sample products have unlimited stock.

## Admin and selling

Products and inventory are shared through Supabase. Existing browser-local listings are imported the first time an authorized admin opens `/sell` in the browser that contains those listings. Marketplace accounts now use Supabase Auth, and their roles are stored in Supabase rather than browser storage. Accounts created before this change were local to the browser; register them through Supabase to use shared sign-in. Cached profile pictures and delivery details are retained locally when an account signs in with the same email. To apply later schema changes, run the updated `supabase/schema.sql` again in the Supabase SQL Editor; its table, policy, and function setup is safe to rerun.
