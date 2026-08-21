import type { Metadata, Viewport } from "next";
import { Inter_Tight, JetBrains_Mono, Noto_Sans_Devanagari } from "next/font/google";
import { notFound } from "next/navigation";

import "../globals.css";

import { PointerGlow } from "@/components/pointer-glow";
import { AppProviders } from "@/components/providers";
import { ServiceWorkerRegistrar } from "@/components/service-worker-registrar";
import { AppShell } from "@/components/shell/app-shell";
import { PreferencesScript } from "@/components/shell/preferences-script";
import { isLocale, locales, localeTags } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

const sans = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

const devanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF9F5" },
    { media: "(prefers-color-scheme: dark)", color: "#14120F" },
  ],
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);

  return {
    title: {
      default: `${dict.app.name} — ${dict.home.heading}`,
      template: `%s · ${dict.app.name}`,
    },
    description: dict.app.tagline,
    applicationName: dict.app.name,
    manifest: "/manifest.webmanifest",
    other: {
      // Sahayak ships its own light/dark themes. Without this, Dark Reader
      // re-colours the page on top of them — wrong colours in light mode, and
      // a hydration mismatch from the attributes it injects into <html>.
      "darkreader-lock": "true",
    },
    appleWebApp: {
      capable: true,
      title: dict.app.name,
      statusBarStyle: "default",
    },
    icons: {
      icon: [
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return (
    <html
      lang={localeTags[locale]}
      suppressHydrationWarning
      className={`${sans.variable} ${devanagari.variable} ${mono.variable} h-full`}
    >
      <head>
        <PreferencesScript />
      </head>
      <body className="min-h-full">
        <AppProviders>
          <AppShell locale={locale} dict={dict}>
            {children}
          </AppShell>
          <PointerGlow />
          <ServiceWorkerRegistrar />
        </AppProviders>
      </body>
    </html>
  );
}
