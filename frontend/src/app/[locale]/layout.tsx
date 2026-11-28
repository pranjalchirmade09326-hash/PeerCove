import type { Metadata, Viewport } from "next";
import "../globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import NextTopLoader from "nextjs-toploader";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { ServerColdStartBanner } from "@/components/common/ServerColdStartBanner";
import { QueryProvider } from "@/providers/QueryProvider";

const dmSans = { className: "" };

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://peercove.space"),
  title: {
    default: "PeerCove",
    template: "%s | PeerCove",
  },
  description:
    "Stepped-care peer mental wellness platform with AI grounding companion, guided chat and LiveKit voice intake, trained Peer Listener rooms, and <2ms Crisis Sentinel guardrails.",
  applicationName: "PeerCove",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon",
  },
  openGraph: {
    title: "PeerCove",
    description:
      "Stepped-care peer mental wellness platform with AI grounding companion, guided chat and LiveKit voice intake, trained Peer Listener rooms, and <2ms Crisis Sentinel guardrails.",
    siteName: "PeerCove",
    type: "website",
    images: [
      {
        url: "/en/opengraph-image",
        width: 1200,
        height: 630,
        alt: "PeerCove — Stepped-Care Peer Mental Wellness & Guided Support",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PeerCove",
    description:
      "Stepped-care peer mental wellness platform with AI grounding companion, guided chat and LiveKit voice intake, trained Peer Listener rooms, and <2ms Crisis Sentinel guardrails.",
    images: ["/en/opengraph-image"],
  },
};

export const viewport: Viewport = {
  themeColor: "#102F2A",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const resolvedParams = await params;
  console.log("RootLayout params:", resolvedParams);
  const locale = resolvedParams?.locale || "en";

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages().catch(() => ({}));

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${dmSans.className} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <QueryProvider>
            <NextIntlClientProvider messages={messages} locale={locale}>
              <TooltipProvider>{children}</TooltipProvider>
            </NextIntlClientProvider>
            <Toaster />
            <ServerColdStartBanner />
            <NextTopLoader showSpinner={false} color="var(--progress-bar)" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
