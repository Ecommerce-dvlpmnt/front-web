import type { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { WinterSnow } from "@/components/ambient/WinterSnow";
import { SmoothScroll } from "@/components/ambient/SmoothScroll";
import { GoogleTagManager } from "@/components/analytics/GoogleTagManager";
import { CartProvider } from "@/components/cart/CartContext";
import { buildCategoryTree, getCategories } from "@/lib/api/categories";

import "./globals.css";
import "leaflet/dist/leaflet.css";

export const metadata: Metadata = {
  title: "Jingle & Light — литі ялинки та святковий декор",
  description: "Штучні литі ялинки, різдвяні вінки та хвойні гірлянди від українського бренду Jingle & Light.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getCategories({ onlyActive: true })
    .then(buildCategoryTree)
    .catch(() => []);

  return (
    <html
      lang="uk"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <GoogleTagManager id={process.env.NEXT_PUBLIC_GTM_ID} />
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
