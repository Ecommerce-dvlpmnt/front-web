import { graph, seoNodes } from "@/lib/seo/structured-data"
import { siteUrl } from "@/lib/config/site"
import { shopConfig } from "@/lib/config/shop"

export const shopFaq = [
  { question: "Як дізнатися ціну та наявність товару?", answer: "Актуальна ціна у гривнях і статус наявності вказані на сторінці кожного товару. Для вибору довжини або висоти скористайтеся доступними варіантами." },
  { question: "Як відправляють замовлення?", answer: "Комплектація замовлення триває 1–2 робочих дні після підтвердження даних. Доставка Новою Поштою у відділення, поштомат або кур’єром оплачується за тарифами перевізника." },
  { question: "Де переглянути умови оплати та повернення?", answer: "Актуальні способи оплати наведено на сторінці «Доставка й оплата», а умови, строки та порядок повернення — на сторінці «Обмін і повернення»." },
]

export function homeGraph(backend: unknown) {
  const nodes = seoNodes(backend).filter((node) => !["WebSite", "OnlineStore", "Organization"].includes(String(node["@type"])))
  nodes.push({ "@type": "OnlineStore", "@id": `${siteUrl()}#organization`, name: "Jingle Decor", url: siteUrl(),
    description: shopConfig.description, currenciesAccepted: "UAH", areaServed: "UA",
    ...(shopConfig.contact.phone ? { telephone: shopConfig.contact.phone } : {}),
    ...(shopConfig.contact.email ? { email: shopConfig.contact.email } : {}),
  }, { "@type": "WebSite", "@id": `${siteUrl()}#website`, url: siteUrl(), name: "Jingle Decor", inLanguage: "uk-UA",
    publisher: { "@id": `${siteUrl()}#organization` },
  }, { "@type": "FAQPage", "@id": `${siteUrl()}#faq`, mainEntity: shopFaq.map((faq) => ({
    "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })) })
  return graph(nodes)
}
