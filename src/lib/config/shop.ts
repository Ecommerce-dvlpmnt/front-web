export const shopConfig = {
  name: "Jingle Decor",
  brand: process.env.NEXT_PUBLIC_SHOP_BRAND?.trim() || "Jingle Decor",
  description: "Штучні литі ялинки, різдвяні вінки та хвойні гірлянди",
  contact: {
    phone: process.env.NEXT_PUBLIC_SHOP_PHONE ?? "",
    email: process.env.NEXT_PUBLIC_SHOP_EMAIL ?? "",
    telegram: process.env.NEXT_PUBLIC_SHOP_TELEGRAM ?? "",
    hours:
      process.env.NEXT_PUBLIC_SHOP_HOURS ?? "Пн–Пт: 09:00–19:00; Сб–Нд: 10:00–18:00",
    fallback: "Контактні дані уточнюйте на сторінці контактів",
  },
  payment: {
    ibanRecipient: process.env.NEXT_PUBLIC_IBAN_RECIPIENT ?? "",
    iban: process.env.NEXT_PUBLIC_IBAN ?? "",
  },
  returns: {
    address: process.env.NEXT_PUBLIC_RETURNS_ADDRESS ?? "",
    email: process.env.NEXT_PUBLIC_SHOP_EMAIL ?? "",
  },
  seasonal: {
    announcement: "Створіть зимовий затишок у своїй оселі · Оплата при отриманні · Доставка 1–2 дні",
    badge: "Колекція 2026",
    title: "Литі ялинки та святковий декор",
    description:
      "Литі штучні ялинки, засніжені вінки ручної роботи та пишні хвойні гірлянди для казкового затишку у вашій оселі.",
    catalogEyebrow: "Каталог продукції",
    catalogTitle: "Ялинки, вінки та декор",
  },
  navigation: [
    { label: "Ялинки", href: "/#catalog" },
    { label: "Різдвяні вінки", href: "/catalog/rizdvyani-vinky" },
    { label: "Хвойні гірлянди", href: "/catalog/khvoyni-hirlyandy" },
  ],
  footerLinks: [
    { label: "Оплата і доставка", href: "/delivery-and-payment" },
    { label: "Обмін та повернення", href: "/returns" },
    { label: "Контакти", href: "/contacts" },
    { label: "Політика конфіденційності", href: "/privacy-policy" },
    { label: "Публічна оферта", href: "/terms" },
  ],
} as const
