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
    monobankEnabled: process.env.NEXT_PUBLIC_MONOBANK_ENABLED === "true",
    ibanEdrpou: process.env.NEXT_PUBLIC_IBAN_EDRPOU?.trim() || "",
    ibanRecipient: process.env.NEXT_PUBLIC_IBAN_RECIPIENT?.trim() || "",
    iban: process.env.NEXT_PUBLIC_IBAN?.replace(/\s/g, "").toUpperCase() || "",
    ibanPurpose: process.env.NEXT_PUBLIC_IBAN_PURPOSE?.trim() || "Оплата замовлення №{orderNumber}",
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

export interface HeroSlide {
  id: string
  badge: string
  title: string
  description: string
  ctaText: string
  categorySlug: string
  image: string
  imageAlt: string
  card: {
    tag: string
    title: string
    subtitle: string
    price: string
    href?: string
  }
  features: string[]
  candidates?: HeroProductCandidate[]
}

export interface HeroProductCandidate {
  id: string
  image: string
  imageAlt: string
  title: string
  subtitle: string
  price: string
  href: string
}

export const heroSlides: HeroSlide[] = [
  {
    id: "trees",
    badge: "Зимова колекція 2026",
    title: "Литі ялинки для казкового затишку",
    description:
      "100% лита хвоя від українського виробника. Не обсипається, не має хімічного запаху та дарує святковий настрій вашій оселі понад 10 років.",
    ctaText: "Обрати ялинку",
    categorySlug: "lyti-yalynky",
    image:
      "https://images.unsplash.com/photo-1543589077-47d81606c1bf?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Затишна новорічна ялинка з вогниками у вітальні",
    card: {
      tag: "Хіт сезону",
      title: "Віденська лита ялинка 1.8м",
      subtitle: "100% литі гілочки · Без запаху",
      price: "2 490 ₴",
    },
    features: [
      "100% лита хвоя від виробника",
      "Заводська коробка для зберігання",
      "Оплата при отриманні",
    ],
  },
  {
    id: "wreaths",
    badge: "Ручна робота",
    title: "Різдвяні вінки з натуральними шишками",
    description:
      "Справжній символ домашнього затишку на вхідні двері або святковий стіл. Пишна лита хвоя, надійні кріплення та цупка фабрична коробка.",
    ctaText: "Переглянути вінки",
    categorySlug: "rizdvyani-vinky",
    image:
      "https://images.unsplash.com/photo-1637617066967-0bb74ff04f66?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Різдвяний вінок з хвої та шишок на дверях",
    card: {
      tag: "Новинка",
      title: "Вінок «Зимовий ліс» 50см",
      subtitle: "Натуральні шишки · Калина",
      price: "650 ₴",
    },
    features: [
      "Ручне складання декору",
      "Справжні карпатські шишки",
      "Безпечні матеріали",
    ],
  },
  {
    id: "garlands",
    badge: "Атмосфера свята",
    title: "Пишні гірлянди на камін та сходи",
    description:
      "Густа лита хвоя на міцній гнучкій основі довжиною 2.8 м. Створює чарівні спадаючі хвилі та затишок у кожному куточку вашого дому.",
    ctaText: "Обрати гірлянду",
    categorySlug: "khvoyni-hirlyandy",
    image:
      "https://images.unsplash.com/photo-1495577333576-6b302d687566?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Хвойна святкова гірлянда над каміном",
    card: {
      tag: "Популярне",
      title: "Гірлянда «Преміум хвоя» 2.8м",
      subtitle: "Гнучка основа · Густі гілки",
      price: "850 ₴",
    },
    features: [
      "Довжина 2.8 метра",
      "Гнучкий дріт усередині",
      "Швидка відправка 1–2 дні",
    ],
  },
]
