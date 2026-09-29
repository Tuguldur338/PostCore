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

## Purchase requests

Checkout sends the purchase request through the server using Resend. Add these settings to `.env.local`:

```env
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=orders@your-verified-domain.com
# Optional fallback for older listings without a seller email
SELLER_NOTIFICATION_EMAIL=your-inbox@gmail.com
```

Create a Resend account and API key, verify a sending domain, and use an address on that domain for `RESEND_FROM_EMAIL`. New listings use the signed-in seller's account email. If server email is unavailable, checkout provides a prefilled email draft link; the buyer must open and send it. Built-in sample listings have no seller contact and cannot accept purchase requests. Keep the API key private in `.env.local`, which is ignored by Git, and restart the development server after setting the values.

For the deployed Netlify site, `.env.local` is not used. Add `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and optionally `SELLER_NOTIFICATION_EMAIL` under **Project configuration → Environment variables** in the Netlify UI (make sure the **Functions** scope is included), then trigger a new deploy so the values take effect. The site does not process payments or keep a shared order database.

## Admin and selling

The first account to establish a signed-in session in a browser is assigned the marketplace admin role. Only that account can create listings; later accounts are student accounts. Accounts and roles are stored in that browser's local storage, so this is suitable only for a local prototype. A shared school-wide admin and secure role enforcement require server-side authentication and shared persistent storage. Accounts in this prototype do not verify ownership of their email address.
