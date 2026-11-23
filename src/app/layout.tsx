import type { Metadata } from "next";
import { Suspense } from "react";
import { Manrope, Onest } from "next/font/google";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { WinterSnow } from "@/components/ambient/WinterSnow";
import { SmoothScroll } from "@/components/ambient/SmoothScroll";
import { GoogleTag } from "@/components/analytics/GoogleTag";
import { CartProvider } from "@/components/cart/CartContext";
import { ReferralCapture } from "@/components/referral/ReferralCapture";
import { buildCategoryTree, getCategories } from "@/lib/api/categories";

import "./globals.css";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

const fontSans = Manrope({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-loaded",
  display: "swap",
});

const fontHeading = Onest({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-heading-loaded",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jingle Decor — литі ялинки та святковий декор",
  description: "Штучні литі ялинки, різдвяні вінки та хвойні гірлянди від українського бренду Jingle Decor.",
  verification: {
    google: "tPPCgIQXOn90KqtTyOWijD8BJbErg1Pj-kNWpFqty4",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories({ onlyActive: true })
    .then(buildCategoryTree)
    .catch(() => [])

  return (
    <html
      lang="uk"
      className={`h-full antialiased ${fontSans.variable} ${fontHeading.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <GoogleTag id={process.env.NEXT_PUBLIC_GOOGLE_TAG_ID} ga4Id={process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID} />
        <Suspense fallback={null}>
          <ReferralCapture />
        </Suspense>
        <SmoothScroll />
        <WinterSnow />
        <CartProvider>
          <Header categories={categories} />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
