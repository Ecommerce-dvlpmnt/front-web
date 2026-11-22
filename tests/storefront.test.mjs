import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { Script } from "node:vm"
import test from "node:test"
import ts from "typescript"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const nativeRequire = createRequire(import.meta.url)
const origin = "https://www.jingledecor.com.ua"

// Run the real API adapters and feed against deterministic HTTP responses,
// without Next's runtime or a new test dependency.
function sourceLoader({ fetch, overrides = {}, env: extraEnv = {} } = {}) {
  const cache = new Map()
  const env = { API_URL: "https://api.test/api", NEXT_PUBLIC_SITE_URL: origin, ...extraEnv }
  function load(name) {
    if (Object.hasOwn(overrides, name)) return overrides[name]
    if (!name.startsWith("@/") && name !== "@next-config") return nativeRequire(name)
    if (cache.has(name)) return cache.get(name).exports
    const base = name === "@next-config" ? path.join(root, "next.config") : path.join(root, "src", name.slice(2))
    let file
    try { file = readFileSync(`${base}.ts`, "utf8") }
    catch { file = readFileSync(`${base}.tsx`, "utf8") }
    const output = ts.transpileModule(file, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText
    const commonjsModule = { exports: {} }
    cache.set(name, commonjsModule)
    const execute = new Script(`(function(require,module,exports,process,fetch){${output}\n})`, { filename: base }).runInThisContext()
    execute(load, commonjsModule, commonjsModule.exports, { env }, fetch)
    return commonjsModule.exports
  }
  return load
}

function renderStorefront(load, Component, props) {
  const { ImageConfigContext } = nativeRequire("next/dist/shared/lib/image-config-context.shared-runtime")
  const { imageConfigDefault } = nativeRequire("next/dist/shared/lib/image-config")
  const config = { ...imageConfigDefault, ...load("@next-config").default.images }
  return renderToStaticMarkup(React.createElement(ImageConfigContext.Provider, { value: config }, React.createElement(Component, props)))
}

function product(index, extra = {}) {
  return {
    id: `p-${index}`, slug: `product-${index}`, name: `Товар ${index}`, price: 200,
    stock: 5, isActive: true, mainImageUrl: "https://demo.supabase.co/storage/v1/object/public/products/tree.webp",
    ...extra,
  }
}

function pagedApi(items, { size = 48, totals = true, countOnly = false } = {}) {
  const calls = []
  return {
    calls,
    fetch: async (url, init) => {
      const query = new URL(url).searchParams
      const page = Number(query.get("PageNumber"))
      calls.push({ query, init })
      return Response.json({
        items: items.slice((page - 1) * size, page * size),
        ...(totals ? { totalCount: items.length, pageSize: size, ...(!countOnly ? { totalPages: Math.ceil(items.length / size) } : {}) } : {}),
      })
    },
  }
}

for (const options of [{}, { countOnly: true }, { totals: false }]) {
  test(`loads all 441 products with a 48-item server cap: ${JSON.stringify(options)}`, async () => {
    const api = pagedApi(Array.from({ length: 441 }, (_, i) => product(i)), options)
    const products = await sourceLoader(api)("@/lib/api/products").getProducts({ pageSize: 1000 })
    assert.equal(products.length, 441)
    assert.equal(new Set(products.map(p => p.id)).size, 441)
    assert.equal(products.at(-1).id, "p-440")
    for (const call of api.calls) {
      assert.equal(call.query.get("OnlyActive"), "true")
      assert.equal(call.query.get("Summary"), "true")
      assert.equal(call.init.next.revalidate, 300)
      assert.notEqual(call.init.cache, "no-store")
    }
  })
}

test("rejects malformed responses instead of returning an empty feed", async () => {
  const load = sourceLoader({ fetch: async () => Response.json({ totalCount: 441 }) })
  await assert.rejects(load("@/lib/api/products").getProducts(), /invalid products response/)
})

test("rejects repeated pages and incomplete catalog totals", async () => {
  for (const payload of [
    { items: [product(1)], totalCount: 2, totalPages: 2 },
    { items: [product(1)], totalCount: 441, totalPages: 1 },
  ]) {
    const load = sourceLoader({ fetch: async () => Response.json(payload) })
    await assert.rejects(load("@/lib/api/products").getProducts(), /repeated|incomplete/)
  }
})

test("a failed later page does not publish a partial feed", async () => {
  const load = sourceLoader({ fetch: async (url) => new URL(url).searchParams.get("PageNumber") === "1"
    ? Response.json({ items: [product(1)], totalCount: 2, totalPages: 2 })
    : new Response("Unavailable", { status: 503 }) })
  await assert.rejects(load("@/app/feed.xml/route").GET(), /503/)
})

test("feed contains all eligible products, sale prices, escaped XML and canonical image URLs", async () => {
  const items = Array.from({ length: 441 }, (_, i) => product(i))
  items[0] = product(0, { oldPrice: 300, name: 'Ялинка & <декор> "Свято"', description: "<p>Опис & деталі</p>" })
  items[1] = product(1, { oldPrice: 100 })
  items.push(product(441, { isActive: false }), product(442, { stock: 0 }))
  const api = pagedApi(items)
  const response = await sourceLoader(api)("@/app/feed.xml/route").GET()
  assert.match(response.headers.get("Content-Type"), /application\/xml/)
  const xml = await response.text()
  const entries = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(match => match[1])
  assert.equal(entries.length, 441)
  assert.match(entries[0], /<g:price>300.00 UAH<\/g:price>/)
  assert.match(entries[0], /<g:sale_price>200.00 UAH<\/g:sale_price>/)
  assert.match(entries[0], /Ялинка &amp; &lt;декор&gt; &quot;Свято&quot;/)
  assert.match(entries[1], /<g:price>200.00 UAH<\/g:price>/)
  assert.doesNotMatch(entries[1], /sale_price/)
  assert.doesNotMatch(entries[2], /sale_price/)
  for (const [, encodedUrl] of xml.matchAll(/<(?:g:link|link|g:image_link)>(.*?)<\/(?:g:link|link|g:image_link)>/g)) {
    const url = new URL(encodedUrl.replaceAll("&amp;", "&"))
    assert.equal(url.origin, origin)
    if (url.pathname === "/_next/image") assert.match(url.searchParams.get("url"), /demo.supabase.co/)
  }
  assert.ok(api.calls.every(call => call.query.get("Summary") === "false"))
})

test("product and category GETs use 300-second server caching", async () => {
  const calls = []
  const load = sourceLoader({ fetch: async (url, init) => {
    calls.push(init)
    return Response.json(url.includes("categories") ? [] : product(1))
  } })
  await load("@/lib/api/products").getProductBySlug("product-1")
  await load("@/lib/api/categories").getCategories()
  assert.ok(calls.every(call => call.next.revalidate === 300 && call.cache !== "no-store"))
})

const payment = { iban: `UA${"1".repeat(27)}`, ibanRecipient: "Тестовий отримувач", ibanEdrpou: "00000000" }

test("IBAN confirmation renders the authoritative amount and order reference", () => {
  const load = sourceLoader({ overrides: { "@/lib/config/shop": { shopConfig: { payment } } } })
  const Component = load("@/features/checkout/IbanPaymentDetails").IbanPaymentDetails
  const html = renderToStaticMarkup(React.createElement(Component, { amount: 1234.50, orderNumber: "12345" }))
  assert.match(html, /Оплата замовлення №12345/)
  assert.match(html, /00000000/)
  assert.match(html, /1\s*234[,.]50/)
  assert.match(html, /Скопіювати IBAN/)
  assert.match(html, /role="status"/)
})

test("IBAN copy writes only the account number and announces success or failure", async () => {
  for (const fails of [false, true]) {
    let written, message
    const load = sourceLoader({ overrides: {
      react: { ...React, useState: () => ["", (value) => { message = value }] },
      "@/lib/config/shop": { shopConfig: { payment } },
    } })
    const previous = Object.getOwnPropertyDescriptor(globalThis, "navigator")
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: { clipboard: { writeText: async value => {
      if (fails) throw new Error("Clipboard denied")
      written = value
    } } } })
    try {
      const tree = load("@/features/checkout/IbanPaymentDetails").IbanPaymentDetails({ amount: 200, orderNumber: "1" })
      const button = tree.props.children.find(child => child?.props?.onClick)
      await button.props.onClick()
      assert.equal(written, fails ? undefined : payment.iban)
      assert.match(message, fails ? /Не вдалося/ : /IBAN скопійовано/)
    } finally {
      if (previous) Object.defineProperty(globalThis, "navigator", previous)
      else delete globalThis.navigator
    }
  }
})

test("missing payment settings show a useful message and disable copying", () => {
  const load = sourceLoader({ overrides: { "@/lib/config/shop": { shopConfig: { payment: { iban: "", ibanRecipient: "", ibanEdrpou: "" } } } } })
  const Component = load("@/features/checkout/IbanPaymentDetails").IbanPaymentDetails
  const html = renderToStaticMarkup(React.createElement(Component, { amount: 200 }))
  assert.match(html, /уточніть у менеджера/)
  assert.match(html, /disabled/)
  assert.doesNotMatch(html, /NEXT_PUBLIC|Не налаштовано/)
})

test("product cards render lazy responsive images without fabricated ratings", () => {
  const load = sourceLoader({ overrides: {
    "@/components/cart/CartContext": { useCart: () => ({ addItem() {}, items: [] }) },
  } })
  const Card = load("@/components/catalog/ProductCard").ProductCard
  const html = renderStorefront(load, Card, { product: product(1) })
  assert.match(html, /loading="lazy"/)
  assert.match(html, /sizes=/)
  assert.doesNotMatch(html, /відгук|lucide-star|4\.8|4\.9/)
})

test("product details omit artificial reviews and eagerly load the main gallery image", () => {
  const load = sourceLoader({ overrides: {
    "@/components/cart/CartContext": { useCart: () => ({ addItem() {}, items: [] }) },
  } })
  const Details = load("@/components/product/ProductDetails").ProductDetails
  const html = renderStorefront(load, Details, { product: product(1) })
  assert.match(html, /loading="eager"/)
  assert.doesNotMatch(html, /Відгуки покупців|reviews-section|lucide-star|Безкоштовна доставка/)
})

test("footer shows configured contact links and has no dummy phone or email", () => {
  for (const configured of [true, false]) {
    const base = sourceLoader()("@/lib/config/shop").shopConfig
    const contact = { ...base.contact, phone: configured ? "+380000000000" : "", email: configured ? "shop@example.test" : "" }
    const load = sourceLoader({ overrides: { "@/lib/config/shop": { shopConfig: { ...base, contact } } } })
    const html = renderToStaticMarkup(React.createElement(load("@/components/layout/Footer").Footer))
    if (configured) {
      assert.match(html, /href="tel:\+380000000000"/)
      assert.match(html, /href="mailto:shop@example.test"/)
    } else {
      assert.doesNotMatch(html, /href="(?:tel:|mailto:)|Контактні дані уточнюйте/)
    }
  }
})

test("IBAN checkout and public payment terms appear only with a nonempty IBAN", () => {
  for (const iban of ["", "   \t  ", payment.iban]) {
    const enabled = Boolean(iban.trim())
    const load = sourceLoader({ env: { NEXT_PUBLIC_IBAN: iban }, overrides: {
      "next/navigation": { useRouter: () => ({ push() {} }) },
      "@/components/cart/CartContext": { useCart: () => ({ isHydrated: true, items: [{ product: product(1), quantity: 1 }], totalPrice: 200, clearCart() {} }) },
      "./NovaPoshtaPickerModal": { NovaPoshtaPickerModal: () => null },
    } })
    const Checkout = load("@/components/checkout/CheckoutForm").CheckoutForm
    const checkout = renderStorefront(load, Checkout, {})
    const terms = renderToStaticMarkup(React.createElement(load("@/app/delivery-and-payment/page").default))
    const Details = load("@/components/product/ProductDetails").ProductDetails
    const details = renderStorefront(load, Details, { product: product(1) })
    assert.match(checkout, /value="CashOnDelivery"/)
    assert.equal(checkout.includes('value="Online"'), enabled)
    assert.equal(checkout.includes("Оплата за реквізитами IBAN"), enabled)
    assert.equal(terms.includes("IBAN"), enabled)
    assert.equal(details.includes("IBAN"), enabled)
    if (!enabled) assert.doesNotMatch(checkout, /Скопіювати IBAN|уточніть у менеджера/)
  }
})
