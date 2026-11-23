export const shopConfig = {
  name: "Jingle Decor",
  brand: process.env.NEXT_PUBLIC_SHOP_BRAND?.trim() || "Jingle Decor",
  description: "Штучні литі ялинки, різдвяні вінки та хвойні гірлянди",
  contact: {
    phone: process.env.NEXT_PUBLIC_SHOP_PHONE?.trim() || "",
    email: process.env.NEXT_PUBLIC_SHOP_EMAIL?.trim() || "",
    telegram: process.env.NEXT_PUBLIC_SHOP_TELEGRAM ?? "",
    hours:
      process.env.NEXT_PUBLIC_SHOP_HOURS ?? "Пн–Пт: 09:00–19:00; Сб–Нд: 10:00–18:00",
    fallback: "Контактні дані уточнюйте на сторінці контактів",
  },
  payment: {
    ibanEdrpou: process.env.NEXT_PUBLIC_IBAN_EDRPOU?.trim() || "",
    ibanRecipient: process.env.NEXT_PUBLIC_IBAN_RECIPIENT?.trim() || "",
    iban: process.env.NEXT_PUBLIC_IBAN?.replace(/\s/g, "").toUpperCase() || "",
  },
  returns: {
    address:
      process.env.NEXT_PUBLIC_RETURNS_ADDRESS?.trim() ||
      "64102, Харківська обл., м. Златопіль, мікрорайон 4, буд. 13",
    email: process.env.NEXT_PUBLIC_SHOP_EMAIL?.trim() || "",
  },
  seasonal: {
    announcement: "Створіть зимовий затишок у своїй оселі · Оплата при отриманні · Доставка за тарифами Нової Пошти",
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
