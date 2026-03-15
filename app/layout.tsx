import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { auth } from "@/lib/auth";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "@/components/theme-provider";
import { LenisProvider } from "@/components/lenis-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXTAUTH_URL || "https://worklog-app.vercel.app",
  ),
  title: {
    default: "Worklog — ACM Tech Operations",
    template: "%s | Worklog",
  },
  description:
    "Team worklog management system for ACM Tech Operations. Track project progress, manage teams, and review member contributions.",
  applicationName: "Worklog",
  keywords: ["worklog", "project management", "team management", "ACM"],
  authors: [{ name: "ACM Tech Operations" }],
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  openGraph: {
    type: "website",
    siteName: "Worklog",
    title: "Worklog — ACM Tech Operations",
    description: "Team worklog management for ACM Tech Operations.",
  },
  twitter: {
    card: "summary",
    title: "Worklog — ACM Tech Operations",
    description: "Team worklog management for ACM Tech Operations.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
        >
          <LenisProvider>
            <main>
              <Providers session={session}>
                <Toaster />
                {children}
              </Providers>
            </main>
          </LenisProvider>
          <SpeedInsights />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
