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

## Gmail order notifications

Purchase requests are completed only after the server emails the seller. Add these settings to `.env.local`:

```env
GMAIL_USER=your-sender@gmail.com
GMAIL_APP_PASSWORD=your-google-app-password
# Optional fallback for older listings without a seller email
SELLER_NOTIFICATION_EMAIL=your-inbox@gmail.com
```

New listings are tied to the signed-in seller's account email, and purchase requests are emailed to that address. The fallback inbox is used only for older listings without a seller email. Create a Google App Password for `GMAIL_USER` with 2-Step Verification enabled; do not use your regular Gmail password. `.env.local` is ignored by Git. Restart the development server after setting these values. Without the Gmail settings, the form reports that the email was not sent and does not mark the request complete. The site does not process payments or keep a shared order database; the email is the purchase request sent to the seller. Accounts in this prototype are browser-local and do not verify ownership of their email address.
