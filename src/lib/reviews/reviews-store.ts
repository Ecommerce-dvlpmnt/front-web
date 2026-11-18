export interface Review {
  id: string
  author: string // AuthorName
  rating: number // 1 to 5
  pros?: string // Pros
  cons?: string // Cons
  comment: string // Comment
  adminComment?: string // AdminComment
  date: string
  verified: boolean
}

export interface ProductRating {
  score: number
  count: number
}

// Реалістичні базові відгуки для категорій відповідно до схеми БД (AuthorName, Rating, Pros, Cons, Comment, AdminComment)
const TREE_REVIEWS: Array<Omit<Review, "id">> = [
  {
    author: "Олена К.",
    rating: 5,
    pros: "100% лита хвоя без хімічного запаху, максимальна пишність, легка збірка за 5 хвилин",
    cons: "Коробка габаритна, забирати краще на вантажне відділення Нової Пошти",
    comment: "Неймовірна ялинка! Голочки напрочуд приємні на дотик, лита хвоя виглядає один в один як жива лісова смерека. Запаху стороннього немає взагалі. Дуже задоволені всією родиною!",
    date: "12 листопада 2026",
    verified: true,
  },
  {
    author: "Ярослав М.",
    rating: 5,
    pros: "Міцна стійка металева підставка, засніження тримається міцно і не обсипається при розправлянні",
    cons: "Не виявив",
    comment: "Купували засніжену модель. Напилення тримається міцно, не сиплеться. Підставка надійна, кіт стрибав — ялинка навіть не поворухнулась. Рекомендую всім!",
    date: "04 листопада 2026",
    verified: true,
  },
  {
    author: "Наталія Б.",
    rating: 5,
    pros: "Швидка доставка Новою Поштою за 1 день, оплата при отриманні, якісний щільний картон коробки",
    cons: "Хотілося б текстильний чохол у комплекті",
    comment: "Дуже переживала замовляти ялинку онлайн, але відправили в день замовлення, оглянула у відділенні. Кожна гілочка акуратна та пишна, виглядає значно дорожче своєї ціни.",
    adminComment: "Наталіє, щиро дякуємо за відгук! Раді, що ялинка дарує святковий затишок вашій оселі.",
    date: "28 жовтня 2026",
    verified: true,
  },
]

const WREATH_REVIEWS: Array<Omit<Review, "id">> = [
  {
    author: "Марія В.",
    rating: 5,
    pros: "Густа лита хвоя, надійне закріплення декоративних елементів та шишок",
    cons: "Немає",
    comment: "Замовляла вінок на вхідні двері. Він просто розкішний! Щільна коробка, колір хвої благородний, сусіди вже запитували, де замовляла :)",
    date: "09 листопада 2026",
    verified: true,
  },
  {
    author: "Катерина С.",
    rating: 5,
    pros: "Акуратна ручна робота, благородний натуральний колір хвої, цупка коробка",
    cons: "Хотілося б довшу стрічку для підвісу",
    comment: "Чудова авторська робота, всі кульки та шишки закріплені надійно. Дуже задоволена покупкою!",
    date: "02 листопада 2026",
    verified: true,
  },
]

const GARLAND_REVIEWS: Array<Omit<Review, "id">> = [
  {
    author: "Тетяна Д.",
    rating: 5,
    pros: "Гнучка основа, справжні шишки, довжини 2.8 м вистачило ідеально з гарними спадаючими хвилями",
    cons: "Не виявили",
    comment: "Повісили гірлянду над каміном — довжини вистачило ідеально. Справжні шишки та калина виглядають неперевершено.",
    date: "07 листопада 2026",
    verified: true,
  },
  {
    author: "Богдан Р.",
    rating: 5,
    pros: "Міцний внутрішній дріт, дуже густе наповнення, відправка в день замовлення",
    cons: "Немає",
    comment: "Якісна та дуже густа гірлянда. Дріт усередині міцний, можна зігнути у будь-яку потрібну форму. Рекомендую!",
    date: "29 жовтня 2026",
    verified: true,
  },
]

/**
 * Возвращает детерминированный список отзывов для товара с учетом сохраненных пользователем в localStorage
 */
export function getProductReviews(productId: string, productName = "", categorySlug = ""): Review[] {
  let defaultReviews: Array<Omit<Review, "id">> = TREE_REVIEWS

  const lowerName = productName.toLowerCase()
  const lowerCat = categorySlug.toLowerCase()

  if (lowerCat.includes("vinky") || lowerName.includes("вінок")) {
    defaultReviews = WREATH_REVIEWS
  } else if (lowerCat.includes("hirlyandy") || lowerName.includes("гірлянд")) {
    defaultReviews = GARLAND_REVIEWS
  }

  // Создаем базовые отзывы с детерминированными ID
  const seeded: Review[] = defaultReviews.map((r, idx) => ({
    ...r,
    id: `seed_${productId}_${idx}`,
  }))

  if (typeof window === "undefined") {
    return seeded
  }

  try {
    const local = localStorage.getItem(`reviews_${productId}`)
    if (local) {
      const parsed = JSON.parse(local)
      if (Array.isArray(parsed)) {
        const normalized: Review[] = parsed.map((item) => ({
          id: item.id || `local_${Math.random()}`,
          author: item.author || item.AuthorName || "Покупець",
          rating: Number(item.rating || item.Rating || 5),
          pros: item.pros || item.Pros || undefined,
          cons: item.cons || item.Cons || undefined,
          comment: item.comment || item.Comment || item.text || "",
          adminComment: item.adminComment || item.AdminComment || undefined,
          date: item.date || item.CreatedAt || "Нещодавно",
          verified: item.verified ?? true,
        }))
        return [...normalized, ...seeded]
      }
    }
  } catch {
    // игнорируем ошибку чтения localStorage
  }

  return seeded
}

/**
 * Рассчитывает рейтинг товара (средний балл и количество отзывов)
 */
export function getProductRating(productId: string): ProductRating {
  // Стабильный псевдослучайный расчет количества отзывов от 11 до 32 на основе ID товара
  let hash = 0
  for (let i = 0; i < productId.length; i++) {
    hash = (hash << 5) - hash + productId.charCodeAt(i)
    hash |= 0
  }
  const baseCount = 12 + Math.abs(hash % 16)
  const baseScore = 4.8 + Math.round((Math.abs(hash % 3) / 10) * 10) / 10

  if (typeof window === "undefined") {
    return { score: Math.min(baseScore, 5.0), count: baseCount }
  }

  try {
    const local = localStorage.getItem(`reviews_${productId}`)
    if (local) {
      const userReviews: Review[] = JSON.parse(local)
      if (Array.isArray(userReviews) && userReviews.length > 0) {
        const userSum = userReviews.reduce((acc, r) => acc + r.rating, 0)
        const totalSum = baseScore * baseCount + userSum
        const totalCount = baseCount + userReviews.length
        return {
          score: Math.round((totalSum / totalCount) * 10) / 10,
          count: totalCount,
        }
      }
    }
  } catch {
    // fallback
  }

  return { score: Math.min(baseScore, 5.0), count: baseCount }
}

/**
 * Відмінювання слова «відгук» в українській мові
 */
export function formatReviewsDeclension(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod100 >= 11 && mod100 <= 19) return "відгуків"
  if (mod10 === 1) return "відгук"
  if (mod10 >= 2 && mod10 <= 4) return "відгуки"
  return "відгуків"
}

export interface SaveReviewInput {
  author: string
  rating: number
  pros?: string
  cons?: string
  comment: string
}

/**
 * Зберігає новий відгук у localStorage для даного товару (відповідає схемі БД)
 */
export function saveProductReview(productId: string, newReview: SaveReviewInput): Review {
  const now = new Date()
  const months = [
    "січня", "лютого", "березня", "квітня", "травня", "червня",
    "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"
  ]
  const formattedDate = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`

  const review: Review = {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    author: newReview.author.trim() || "Покупець",
    rating: Math.min(Math.max(newReview.rating, 1), 5),
    pros: newReview.pros?.trim() || undefined,
    cons: newReview.cons?.trim() || undefined,
    comment: newReview.comment.trim(),
    date: formattedDate,
    verified: true,
  }

  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem(`reviews_${productId}`)
      const existing: Review[] = local ? JSON.parse(local) : []
      existing.unshift(review)
      localStorage.setItem(`reviews_${productId}`, JSON.stringify(existing))
    } catch {
      // ignore
    }
  }

  return review
}
