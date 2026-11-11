export const shopConfig = {
  name: "Lumière",
  description: "Речі для теплих моментів",
  contact: {
    phone: process.env.NEXT_PUBLIC_SHOP_PHONE ?? "",
    email: process.env.NEXT_PUBLIC_SHOP_EMAIL ?? "",
    telegram: process.env.NEXT_PUBLIC_SHOP_TELEGRAM ?? "",
    hours:
      process.env.NEXT_PUBLIC_SHOP_HOURS ?? "Пн–Пт: 09:00–19:00; Сб–Нд: 10:00–18:00",
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
    announcement: "🎄 Новорічний настрій вже тут · -20% на сезонну колекцію",
    badge: "Новорічна колекція · -20%",
    title: "Додайте святам трохи магії",
    description:
      "Свічки, декор та подарунки для затишних вечорів, теплих зустрічей і моментів, які хочеться запам’ятати.",
    catalogEyebrow: "Подарунки з настроєм",
    catalogTitle: "Новорічні товари",
  },
  navigation: [
    { label: "Новинки", href: "/#catalog" },
    { label: "Декор", href: "/#catalog" },
    { label: "Свічки", href: "/#catalog" },
    { label: "Подарунки", href: "/#catalog" },
  ],
  footerLinks: [
    { label: "Доставка й оплата", href: "/delivery-and-payment" },
    { label: "Обмін і повернення", href: "/returns" },
    { label: "Контакти", href: "/contacts" },
    { label: "Політика конфіденційності", href: "/privacy-policy" },
    { label: "Публічна оферта", href: "/terms" },
  ],
} as const
