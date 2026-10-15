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

1. Create a Supabase project and run [`supabase/schema.sql`](./supabase/schema.sql) in its SQL Editor. This creates the shared product catalog and an atomic order function that decrements available stock while saving each order. The row-level security policies allow public catalog reads, but only users with the trusted `marketing_admin` app-metadata role can manage products or orders.
2. In Supabase Authentication, enable email/password sign-in, disable public sign-ups, and create the marketing admin user. Set a strong password and complete any required email confirmation. In the Supabase SQL Editor, grant that account the trusted role by replacing the placeholder email below with the admin account's email:

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
     || '{"role":"marketing_admin"}'::jsonb
   where email = 'tselmeg.n2016@orkhonschool.edu.mn';
   ```

   Confirm that exactly one user was updated. The app metadata is managed by Supabase and cannot be changed by the user through normal sign-up or profile updates. If that account was already signed in, sign out and sign in again so the session receives the updated role.
3. Add these variables to `.env.local` and restart the development server:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   MARKETING_ADMIN_EMAIL=tselmeg.n2016@orkhonschool.edu.mn
   ```

   Get the project URL and publishable key from **Supabase → Project Settings → API Keys**. The legacy anon key is also supported as `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The Supabase URL and publishable/anon key are intended for browser use; the database's row-level security policies protect order data. Do not add a Supabase service-role key to the application. You can copy `.env.example` as a template, replacing its placeholders with the actual project values.
4. Open `/orders` and sign in with the configured admin account to review new requests, mark them completed, or delete them. The same admin session is required to add listings at `/sell` and manage inventory at `/products`.
5. For a deployed site, add the same variables to the hosting provider's environment-variable settings and redeploy. `.env.local` is only used for local development.

The website does not process payments. Orders remain in the Supabase database until deleted. A finite product quantity decreases only when an order is successfully saved; orders that cannot be fulfilled because stock has changed are rejected without reducing inventory. The two built-in sample products have unlimited stock.

## Admin and selling

Products and inventory are shared through Supabase. Existing browser-local listings are imported the first time the marketing admin opens `/sell` in the browser that contains those listings. Student account profiles are still browser-local and are not a shared authentication system. To apply later schema changes, run the updated `supabase/schema.sql` again in the Supabase SQL Editor; its table, policy, and function setup is safe to rerun.
