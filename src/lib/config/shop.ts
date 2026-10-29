export const shopConfig = {
  name: "Lumière",
  description: "Речі для теплих моментів",
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
    { label: "Доставка", href: "/#catalog" },
    { label: "Оплата", href: "/#catalog" },
    { label: "Контакти", href: "/#catalog" },
  ],
} as const
