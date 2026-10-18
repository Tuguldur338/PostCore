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

1. Create a Supabase project and run [`supabase/schema.sql`](./supabase/schema.sql) in its SQL Editor. This creates the shared product catalog, atomic stock deduction, buyer-linked orders, and marketplace profile/role tables. Public users can read the catalog; only Marketplace Admins and ADMINs can manage products or orders.
2. In Supabase Authentication, enable email/password sign-in and public sign-ups (or invite users manually). For registration confirmation emails to reach student addresses, configure custom SMTP under **Authentication → SMTP Settings**. Supabase's built-in email service is for testing only: it sends only to addresses belonging to the Supabase organization and is currently limited to 2 emails per hour. The confirmed `tuguldur09252@gmail.com` account is automatically assigned the protected ADMIN badge by the schema. Existing confirmed Supabase accounts with the trusted `marketing_admin` app-metadata role are migrated to Marketplace Admin. Marketplace registration and sign-in use Supabase Auth, so accounts work across localhost and Vercel deployments connected to this same Supabase project. Accounts created previously in browser storage must register once with Supabase; their old passwords are not migrated.
3. Add these variables to `.env.local` and restart the development server:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   ```

   Get the project URL and publishable key from **Supabase → Project Settings → API Keys**. The legacy anon key is also supported as `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Do not add a Supabase service-role key to the application.
4. Open `/orders` and sign in with a configured admin account to review new requests, mark them completed, or delete them. The same admin session is required to add listings at `/sell` and manage inventory at `/products`.
5. For a deployed site, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the hosting provider's environment-variable settings for **Production** and **Preview**, then redeploy. These values must point to the same Supabase project as local development. Add the production and preview site URLs to **Supabase → Authentication → URL Configuration → Redirect URLs** so confirmation emails return to the right deployment. `.env.local` is only used for local development.

The website does not process payments. Users must be signed in to place an order so it can be linked to their account. Their purchase receipts, including the database purchase date, are shown on `/account`; users can only read their own receipts, while marketplace admins can review all orders on `/orders`. New orders receive a unique six-character uppercase letter/digit reference; the database enforces uniqueness and the app retries if a rare collision occurs. Orders remain in the Supabase database until deleted. A finite product quantity decreases only when an order is successfully saved; orders that cannot be fulfilled because stock has changed are rejected without reducing inventory. The two built-in sample products have unlimited stock. Orders created before buyer IDs were added cannot be reliably associated with a user and will not appear in individual purchase history.

## Marketplace account badges

The latest `supabase/schema.sql` creates shared marketplace profiles and assigns the confirmed `tuguldur09252@gmail.com` account the protected `ADMIN` badge. Existing Supabase users with the trusted `marketing_admin` app-metadata role are migrated to Marketplace Admin. Run the latest schema in the Supabase SQL Editor, then sign out and back in to load the badge. On `/orders`, both ADMIN and Marketplace Admin accounts can assign Student, Marketplace Admin, or ADMIN badges to other registered accounts; the primary ADMIN account cannot be changed. Only marketplace admins can manage products and orders.

## Admin and selling

Products and inventory are shared through Supabase. Listings are added explicitly on `/sell`; opening the page does not import stale browser-local listings, so deleted listings cannot be recreated from old local data. Phone photos are optimized to preserve more detail and can now use up to 1 MB of image data; run the latest `supabase/schema.sql` in the Supabase SQL Editor to apply the updated product-image limit. Authentication is shared through Supabase; profile pictures and delivery details remain cached in the browser. To apply later schema changes, run the updated `supabase/schema.sql` again in the Supabase SQL Editor; its table, policy, and function setup is safe to rerun.
