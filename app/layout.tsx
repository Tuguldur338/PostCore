import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = (() => {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured);
    } catch {
      // Fall through to the local default when the configured URL is invalid.
    }
  }
  return new URL("http://localhost:3000");
})();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "PostCore — Orkhon School's student marketplace",
    template: "%s · PostCore",
  },
  description:
    "Buy and sell notebooks, snacks, study tools, and campus essentials with students at Orkhon School. Browse the shelves, request what you need, and collect it on campus.",
  applicationName: "PostCore",
  keywords: [
    "Orkhon School",
    "student marketplace",
    "school supplies",
    "campus resale",
    "PostCore",
  ],
  authors: [{ name: "PostCore" }],
  creator: "PostCore",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "PostCore",
    title: "PostCore — Orkhon School's student marketplace",
    description:
      "A student-run marketplace for notebooks, snacks, study tools, and everyday campus essentials. Request online, collect on campus.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "PostCore — the student marketplace at Orkhon School",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PostCore — Orkhon School's student marketplace",
    description:
      "A student-run marketplace for notebooks, snacks, study tools, and everyday campus essentials.",
    images: ["/og.png"],
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1e7" },
    { media: "(prefers-color-scheme: dark)", color: "#101814" },
  ],
  colorScheme: "light dark",
};

const themeInitScript = `(function(){try{var stored=window.localStorage.getItem("postcore-theme");var theme=stored==="dark"?"dark":"light";document.documentElement.dataset.theme=theme;}catch(e){document.documentElement.dataset.theme="light";}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
