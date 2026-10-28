# PostCore

PostCore is a student-run marketplace for **Orkhon School**: notebooks, snacks,
study tools, phone cases, and the everyday things that make a school bag work.
Students browse the shelves, save what they like, and send a purchase request;
marketplace admins review requests and buyers collect their items on campus.

There is **no online payment** and **no delivery**. PostCore is a request and
pickup-coordination tool, not a payment processor.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- React 19 + TypeScript
- Tailwind CSS v4
- Supabase Auth, Postgres, and Row Level Security
- `next/font` (Geist + Geist Mono) with a system serif display face
- No UI component library — every component and illustration is custom

## The experience

- **A real storefront.** Editorial hero, category shelves, live featured items,
  how-it-works and seller sections, safety guidance, and a full footer.
- **Product-first browsing.** Search, category chips, sorting, stock states,
  quick-view dialogs, save-for-later, and a share action.
- **A coherent account.** Dedicated `/signin`, profile with local avatar,
  receipts with order codes, password management, and admin-only account tools.
- **A guided seller flow.** Photo optimisation, live listing preview, pickup
  details, and a clear success state.
- **Light and dark themes.** Both driven by the same semantic design tokens.
- **Mobile-first navigation.** Sticky search header, full-screen menu, and
  touch-friendly controls.
- **Accessible interactions.** Focus-trapped dialogs, Escape handling, labelled
  controls, reduced-motion support, and a skip link.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Storefront: hero, categories, featured listings, how it works |
| `/products` | Full catalog with search, category, and sort filters |
| `/saved` | Items saved in this browser |
| `/signin` | Sign in or register (`?mode=register`) |
| `/account` | Profile, receipts (`?tab=receipts`), security (`?tab=security`) |
| `/sell` | Admin-only listing form with live preview |
| `/orders` | Admin order desk and role management |
| `/contacts` | Help, pickup safety, how it works, FAQ |

## Local setup

### 1. Install

```bash
npm install
```

### 2. Create a Supabase project

Run [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL Editor.
The script is safe to re-run. **Re-run it after this update even if the project
was already set up**: the role-change policy now requires the platform ADMIN.
It creates:

- `marketplace_profiles`, with `student`, `marketplace_admin`, and `admin` roles
- the shared `products` catalog, with atomic stock deduction
- buyer-linked `orders`, with unique six-character order codes
- RLS policies that let the public read products while only marketplace admins
  can manage products or orders
- the protected primary `ADMIN` account
- two starter listings so a fresh project is not empty

### 3. Environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
NEXT_PUBLIC_SITE_URL=https://your-site.vercel.app
```

- Get the URL and publishable key from **Supabase → Project Settings → API Keys**.
- `NEXT_PUBLIC_SITE_URL` is the public URL used in confirmation emails. On
  localhost it is required for registration, because the confirmation link must
  point at the deployed site.
- The legacy anon key is supported as `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Never** add a Supabase service-role key to this app; all privileged writes go
  through the authenticated session and RLS.

### 4. Auth settings

Enable email/password sign-in and public sign-ups in Supabase Authentication.
For student confirmation emails, configure custom SMTP under
**Authentication → SMTP Settings** — the built-in mailer only sends to the
Supabase organization and is rate-limited.

Set the Supabase **Site URL** to the deployed site, and add the deployed URL
under **Authentication → URL Configuration → Redirect URLs**.

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Accounts and roles

- Students can browse, save, and request items.
- **Marketplace admins** can add listings, edit stock, mark items unavailable,
  remove listings, and manage orders. They cannot change anyone's marketplace
  role or badge.
- The **ADMIN** account is the only account that can view or change
  `student`, `marketplace_admin`, and `admin` badges. On `/orders`, the ADMIN
  searches for the account's registered email, selects the matching account,
  and only then can assign a new badge. There is no free-form role editing.
- Marketplace admins do not see the badge controls; they can still manage
  listings and orders.
- The primary admin account is protected by a database trigger and cannot be
  demoted.
- Profile photos are stored in this browser only and are never uploaded.

## Listing and order flow

1. An admin adds a listing on `/sell` with a compressed photo and optional
   pickup class, room, and meet-up note.
2. A signed-in student sends a request from a product dialog. No destination or
   payment details are collected.
3. The database function `place_order` locks the product row, checks stock, and
   decrements inventory atomically. A request that cannot be fulfilled is
   rejected without reducing stock.
4. The buyer receives a six-character uppercase code and can see the request on
   `/account?tab=receipts`.
5. A marketplace admin reviews the request on `/orders` and marks it completed
   after the campus hand-off.

## Design system

Design tokens live in [`app/globals.css`](./app/globals.css):

- warm paper / deep pine / tangerine palette
- semantic colors (`paper`, `surface`, `ink`, `line`, `accent`, `pine`, `gold`)
  that switch for light and dark themes
- reusable classes for buttons, fields, chips, cards, ticker, dialogs, and
  skeletons
- system serif display type paired with Geist for UI text
- custom SVG category art in `public/images/categories/` and product art in
  `public/images/student/`

## Scripts

```bash
npm run dev      # development server
npm run build    # production build
npm run start    # production server
npm run lint      # ESLint
npm run typecheck # TypeScript check
```

## Deploying

Add the same environment variables in the hosting provider for **Production** and
**Preview**, point them at the same Supabase project, set `NEXT_PUBLIC_SITE_URL`
to the production URL, then redeploy. Add that URL to the Supabase redirect
allow-list.

## Data notes

- Orders persist in Supabase until deleted by an admin.
- The two starter listings have unlimited stock (`quantity = null`); listings
  created later can have finite stock.
- Orders created before buyer IDs were introduced cannot be linked to an account
  and will not appear in individual receipt histories.
- The contact address in the UI (`hello@postcore.student`) is a placeholder;
  update it to the team's real address before launch.
