import type { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { GoogleTagManager } from "@/components/analytics/GoogleTagManager";
import { CartProvider } from "@/components/cart/CartContext";
import { buildCategoryTree, getCategories } from "@/lib/api/categories";

import "./globals.css";

export const metadata: Metadata = {
  title: "Lumière — речі для теплих моментів",
  description: "Мінімалістичний магазин декору, свічок та особливих подарунків.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const categories = await getCategories({ onlyActive: true })
    .then(buildCategoryTree)
    .catch(() => [])

  return (
    <html
      lang="uk"
      className="h-full antialiased"
    >
      <body className="flex min-h-full flex-col">
        <GoogleTagManager id={process.env.NEXT_PUBLIC_GTM_ID} />
        <CartProvider>
          <Header categories={categories} />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
