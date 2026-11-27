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
function sourceLoader({ fetch, overrides: suppliedOverrides = {}, env: extraEnv = {} } = {}) {
  const overrides = {
    "next/navigation": { useRouter: () => ({ push() {}, replace() {} }) },
    ...suppliedOverrides,
  }
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
      compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText
    const commonjsModule = { exports: {} }
    cache.set(name, commonjsModule)
    const execute = new Script(`(function(require,module,exports,process,fetch){${output}\n})`, { filename: base }).runInThisContext()
    const sourceRequire = (request) => {
      if (Object.hasOwn(overrides, request)) return overrides[request]
      return load(request.startsWith(".") ? path.posix.join(path.posix.dirname(name), request) : request)
    }
    execute(sourceRequire, commonjsModule, commonjsModule.exports, { env }, fetch)
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

test("next/image uses direct CDN URLs when optimization is disabled", () => {
  const load = sourceLoader()
  const Image = nativeRequire("next/image").default
  const cdnUrl = "https://pub-579e9008393e47219443a996a9a7c1d9.r2.dev/products/tree.webp"
  const html = renderStorefront(load, Image, { src: cdnUrl, width: 120, height: 120, alt: "Ялинка" })
  assert.equal(load("@next-config").default.images.unoptimized, true)
  assert.match(html, /src="https:\/\/pub-579e9008393e47219443a996a9a7c1d9\.r2\.dev\/products\/tree\.webp"/)
  assert.doesNotMatch(html, /\/_next\/image/)
})

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

test("catalog filters reach the backend before pagination", async () => {
  const api = pagedApi([product(1)], { size: 24 })
  const load = sourceLoader(api)
  await load("@/lib/api/products").getCatalogProductsPage({
    search: "смерека", sortBy: "price_asc", minPrice: 100, maxPrice: 500, inStock: true,
  })
  const query = api.calls[0].query
  assert.equal(query.get("Search"), "смерека")
  assert.equal(query.get("SortBy"), "price_asc")
  assert.equal(query.get("MinPrice"), "100")
  assert.equal(query.get("MaxPrice"), "500")
  assert.equal(query.get("InStock"), "true")
  assert.equal(query.get("PageSize"), "24")
})

test("admin products load only the requested server page with search and filters", async () => {
  const paths = []
  const item = product(1, { supplierId: "supplier-1", categoryId: "category-1", sku: "TREE-1", dropPrice: 100,
    show_on_homepage: true, is_recommended: true, is_featured: true })
  const load = sourceLoader({ overrides: {
    "@/lib/api/admin/auth": { adminApiFetch: async path => {
      paths.push(path)
      return { items: [item], totalCount: 487, pageNumber: 3, pageSize: 25, totalPages: 20 }
    } },
  } })
  const page = await load("@/lib/api/admin/products").getAdminProductsPage({ pageNumber: 3, pageSize: 25, search: "TREE", categoryId: "category-1", supplierId: "supplier-1", onlyActive: false })
  assert.equal(paths.length, 1)
  const params = new URL(`https://api.test/${paths[0]}`).searchParams
  assert.equal(params.get("PageNumber"), "3")
  assert.equal(params.get("PageSize"), "25")
  assert.equal(params.get("Search"), "TREE")
  assert.equal(params.get("CategoryId"), "category-1")
  assert.equal(params.get("SupplierId"), "supplier-1")
  assert.equal(page.totalCount, 487)
  assert.equal(page.items.length, 1)
  assert.equal(page.items[0].showOnHomepage, true)
  assert.equal(page.items[0].isRecommended, true)
  assert.equal(page.items[0].isFeatured, true)
})

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

test("feed contains all eligible products, sale prices, escaped XML and direct image URLs", async () => {
  const items = Array.from({ length: 441 }, (_, i) => product(i))
  items[0] = product(0, { oldPrice: 300, name: 'Ялинка & <декор> "Свято"', description: "<p>Опис & деталі</p>" })
  items[1] = product(1, { oldPrice: 100 })
  items[3] = product(3, { mainImageUrl: "/uploads/products/tree.webp" })
  items.push(product(441, { isActive: false }), product(442, { stock: 0 }))
  const api = pagedApi(items)
  const response = await sourceLoader(api)("@/app/feed.xml/route").GET()
  assert.match(response.headers.get("Content-Type"), /application\/xml/)
  const xml = await response.text()
  const entries = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(match => match[1])
  assert.equal(entries.length, 441)
  assert.match(entries[0], /<g:price>300.00 UAH<\/g:price>/)
  assert.match(entries[0], /<g:sale_price>200.00 UAH<\/g:sale_price>/)
  assert.match(entries[0], /<g:title>Ялинка &amp; &quot;Свято&quot;<\/g:title>/)
  assert.match(entries[0], /<g:description>Опис &amp; деталі<\/g:description>/)
  assert.match(entries[1], /<g:price>200.00 UAH<\/g:price>/)
  assert.doesNotMatch(entries[1], /sale_price/)
  assert.doesNotMatch(entries[2], /sale_price/)
  for (const [, encodedUrl] of xml.matchAll(/<(?:g:link|link)>(.*?)<\/(?:g:link|link)>/g)) {
    const url = new URL(encodedUrl.replaceAll("&amp;", "&"))
    assert.equal(url.origin, origin)
  }
  const imageUrls = [...xml.matchAll(/<g:image_link>(.*?)<\/g:image_link>/g)].map(([, value]) => value.replaceAll("&amp;", "&"))
  assert.equal(imageUrls[0], "https://demo.supabase.co/storage/v1/object/public/products/tree.webp")
  assert.equal(imageUrls[3], "https://api.test/uploads/products/tree.webp")
  assert.ok(imageUrls.every(url => !url.includes("/_next/image")))
  assert.ok(api.calls.every(call => call.query.get("Summary") === "false"))
})

test("feed removes ineligible products and never emits a rounded equal sale price", () => {
  const generate = sourceLoader()("@/features/catalog/google-feed").generateGoogleFeed
  const items = [
    product(1, { oldPrice: 200.004, price: 200.003 }),
    product(2, { price: 0 }), product(3, { stock: -1 }),
    product(4, { stock: 1.5 }), product(5, { isActive: false }),
    product(6, { mainImageUrl: "/product-placeholder.svg" }),
    product(7, { mainImageUrl: "javascript:alert(1)" }),
    product(8, { mainImageUrl: "/uploads/x.webp" }),
    product(9, { slug: "" }),
  ]
  const xml = generate(items, origin)
  assert.equal((xml.match(/<item>/g) ?? []).length, 1)
  assert.match(xml, /<g:price>200.00 UAH<\/g:price>/)
  assert.doesNotMatch(xml, /<g:sale_price>/)
  assert.doesNotMatch(xml, /localhost|javascript:/)
})

test("feed uses the full cleaned API description instead of promotional SEO summaries", () => {
  const generate = sourceLoader()("@/features/catalog/google-feed").generateGoogleFeed
  const fullDescription = "<p>Гірлянда 200 м &amp; святкова.</p><p>Характеристики: 200 м, 2000 LED. Колір &quot;білий&quot;, дріт 'тонкий'.</p>"
  const xml = generate([product(1, {
    name: `<b>${"Я".repeat(160)}</b> &amp; 'дерево'`,
    description: fullDescription,
    metaDescription: "Скорочений SEO-текст…… Ціна 1999 грн. Доставка по Україні.",
    attributes: JSON.stringify({ brand: "Майстер & Син", identifierExists: false }),
  })], origin)
  const title = xml.match(/<g:title>(.*?)<\/g:title>/)?.[1]
  assert.equal(title, "Я".repeat(150))
  assert.match(xml, /<g:description>Гірлянда 200 м &amp; святкова\. Характеристики: 200 м, 2000 LED\. Колір &quot;білий&quot;, дріт &apos;тонкий&apos;\.<\/g:description>/)
  assert.doesNotMatch(xml, /Скорочений SEO-текст|……|Ціна 1999 грн|<p>/)
  assert.match(xml, /<g:brand>Майстер &amp; Син<\/g:brand>/)
  assert.match(xml, /<g:identifier_exists>no<\/g:identifier_exists>/)
  const noIdentifiers = generate([product(3)], origin)
  assert.match(noIdentifiers, /<g:brand>Jingle Decor<\/g:brand>/)
  assert.match(noIdentifiers, /<g:identifier_exists>no<\/g:identifier_exists>/)
  for (const identifiers of [{ gtin: "1234567890123" }, { mpn: "MODEL-123" }]) {
    const identified = generate([product(4, { attributes: JSON.stringify(identifiers) })], origin)
    assert.doesNotMatch(identified, /<g:identifier_exists>no<\/g:identifier_exists>/)
    assert.doesNotMatch(identified, /<g:brand>Jingle Decor<\/g:brand>/)
  }
  const long = generate([product(2, { description: "А".repeat(6000) })], origin)
  assert.equal([...long.match(/<g:description>(.*?)<\/g:description>/)?.[1] ?? ""].length, 5000)
  const fallback = generate([product(5, { name: "Назва товару", description: "<p> </p>", metaDescription: "Ціна 100 грн……" })], origin)
  assert.match(fallback, /<g:description>Назва товару<\/g:description>/)
  assert.doesNotMatch(fallback, /Ціна 100 грн|……/)
})

test("feed groups tree and garland SKUs and exports galleries and categories", () => {
  const generate = sourceLoader()("@/features/catalog/google-feed").generateGoogleFeed
  const image = "https://pub-example.r2.dev/tree.webp"
  const items = [
    product(1, { name: "Ялинка Мрія 1,8 м", categoryId: "trees", categoryName: "Литі ялинки",
      images: [{ id: "a", url: image, sortOrder: 2 }, { id: "b", url: image, sortOrder: 3 },
        { id: "c", url: "not a URL", sortOrder: 4 }] }),
    product(2, { name: "Ялинка Мрія 2,1 м", categoryId: "trees", categoryName: "Литі ялинки" }),
    product(3, { name: "Гірлянда Роса 200 м теплий білий", categoryId: "lights", categoryName: "Світлові гірлянди" }),
    product(4, { name: "Гірлянда Роса 200 м холодний білий", categoryId: "lights", categoryName: "Світлові гірлянди" }),
  ]
  const entries = [...generate(items, origin).matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => match[1])
  assert.equal(entries.length, 4)
  const group = (entry) => entry.match(/<g:item_group_id>(.*?)<\/g:item_group_id>/)?.[1]
  assert.equal(group(entries[0]), group(entries[1]))
  assert.notEqual(group(entries[0]), group(entries[2]))
  assert.equal(group(entries[2]), group(entries[3]))
  assert.match(entries[0], /<g:size>1\.8 м<\/g:size>/)
  assert.match(entries[2], /<g:color>Теплий білий<\/g:color>/)
  assert.equal((entries[0].match(/<g:additional_image_link>/g) ?? []).length, 1)
  assert.match(entries[0], /<g:additional_image_link>https:\/\/pub-example\.r2\.dev\/tree\.webp<\/g:additional_image_link>/)
  assert.match(entries[0], /<g:google_product_category>6265<\/g:google_product_category>/)
  assert.match(entries[2], /<g:google_product_category>2608<\/g:google_product_category>/)
  assert.match(entries[2], /<g:product_type>Світлові гірлянди<\/g:product_type>/)
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

const payment = { iban: `UA${"1".repeat(27)}`, ibanRecipient: "Тестовий отримувач", ibanEdrpou: "00000000", ibanPurpose: "Оплата замовлення №{orderNumber}" }

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

test("IBAN payment purpose uses public env and retains the order number", () => {
  const env = {
    NEXT_PUBLIC_IBAN: payment.iban,
    NEXT_PUBLIC_IBAN_RECIPIENT: payment.ibanRecipient,
    NEXT_PUBLIC_IBAN_EDRPOU: payment.ibanEdrpou,
    NEXT_PUBLIC_IBAN_PURPOSE: "Оплата товарів, замовлення {orderNumber}",
  }
  const load = sourceLoader({ env })
  const Component = load("@/features/checkout/IbanPaymentDetails").IbanPaymentDetails
  const html = renderToStaticMarkup(React.createElement(Component, { amount: 100, orderNumber: "12345" }))
  assert.match(html, /Оплата товарів, замовлення 12345/)
  assert.doesNotMatch(html, /\{orderNumber\}/)
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

test("product cards render lazy direct images without fabricated ratings", () => {
  const load = sourceLoader({ overrides: {
    "@/components/cart/CartContext": { useCart: () => ({ addItem() {}, items: [] }) },
  } })
  const Card = load("@/components/catalog/ProductCard").ProductCard
  const html = renderStorefront(load, Card, { product: product(1) })
  assert.match(html, /loading="lazy"/)
  assert.match(html, /src="https:\/\/demo\.supabase\.co\/storage\/v1\/object\/public\/products\/tree\.webp"/)
  assert.doesNotMatch(html, /\/_next\/image/)
  assert.match(html, /aspect-\[2\/3\]/)
  assert.doesNotMatch(html, /відгук|lucide-star|4\.8|4\.9/)
})

test("product details omit artificial reviews and eagerly load the main gallery image", () => {
  const load = sourceLoader({ overrides: {
    "@/components/cart/CartContext": { useCart: () => ({ addItem() {}, items: [] }) },
  } })
  const Details = load("@/components/product/ProductDetails").ProductDetails
  const html = renderStorefront(load, Details, { product: product(1) })
  assert.match(html, /loading="eager"/)
  assert.match(html, /src="https:\/\/demo\.supabase\.co\/storage\/v1\/object\/public\/products\/tree\.webp"/)
  assert.doesNotMatch(html, /\/_next\/image/)
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

test("bounded product lookup fetches exactly one 24-product page per request", async () => {
  const api = pagedApi(Array.from({ length: 441 }, (_, i) => product(i)), { size: 24 })
  const { getCatalogProductsPage } = sourceLoader(api)("@/lib/api/products")
  for (const pageNumber of [1, 2, 19]) {
    const result = await getCatalogProductsPage({ pageNumber })
    assert.equal(api.calls.length, pageNumber === 19 ? 3 : pageNumber)
    const request = api.calls.at(-1)
    assert.equal(request.query.get("PageNumber"), String(pageNumber))
    assert.equal(request.query.get("PageSize"), "24")
    assert.equal(request.query.get("Summary"), "true")
    assert.equal(request.init.next.revalidate, 300)
    assert.equal(result.totalCount, 441)
    assert.equal(result.totalPages, 19)
    assert.equal(result.items[0].id, `p-${(pageNumber - 1) * 24}`)
    assert.equal(result.items.length, pageNumber === 19 ? 9 : 24)
  }
})

test("paged requests retain search and category filters with stable cache URLs", async () => {
  const api = pagedApi([], { size: 24 })
  const { getCatalogProductsPage } = sourceLoader(api)("@/lib/api/products")
  await getCatalogProductsPage({ pageNumber: 2, categoryIds: ["child", "root", "child"], search: "  ялинка  " })
  assert.deepEqual(api.calls[0].query.getAll("CategoryIds"), ["child", "root"])
  assert.equal(api.calls[0].query.get("Search"), "ялинка")
  assert.equal(api.calls[0].query.get("PageNumber"), "2")
  await assert.rejects(getCatalogProductsPage({ pageNumber: -1 }), /Invalid catalog page/)
  assert.equal(api.calls.length, 1)
})

test("catalog page URLs preserve search, encode values and normalize invalid pages", () => {
  const { getCatalogPageNumber, getCatalogHref } = sourceLoader()("@/features/catalog/navigation")
  for (const input of [undefined, "", "0", "-2", "abc", "1.5", "Infinity", "2147483648", "999999999999999999999"]) {
    assert.equal(getCatalogPageNumber(input), 1)
  }
  assert.equal(getCatalogPageNumber("2"), 2)
  assert.equal(getCatalogPageNumber(["3", "4"]), 3)
  const url = new URL(getCatalogHref({ categorySlug: "category", searchQuery: "сніг & декор", pageNumber: 4 }), origin)
  assert.equal(url.pathname, "/catalog/category")
  assert.equal(url.searchParams.get("page"), "4")
  assert.equal(url.searchParams.get("query"), "сніг & декор")
  assert.equal(url.hash, "#catalog")
})

function category(id, parentId = null) {
  return { id, name: id, slug: id, parentId, parentName: parentId, sortOrder: 0, isActive: true }
}

function storefrontApi(categories, items) {
  const productCalls = []
  const categoryCalls = []
  return {
    productCalls,
    categoryCalls,
    fetch: async (url) => {
      const query = new URL(url).searchParams
      if (url.includes("/seo/")) return Response.json({})
      if (url.includes("/categories?")) {
        categoryCalls.push(url)
        return Response.json(categories)
      }
      productCalls.push(query)
      const ids = query.getAll("CategoryIds")
      if (query.has("CategoryId")) ids.push(query.get("CategoryId"))
      const filtered = ids.length ? items.filter(item => ids.includes(item.categoryId)) : items
      const page = Number(query.get("PageNumber"))
      const size = Number(query.get("PageSize"))
      return Response.json({ items: filtered.slice((page - 1) * size, page * size), totalCount: filtered.length, totalPages: Math.ceil(filtered.length / size), pageNumber: page, pageSize: size })
    },
  }
}

test("home includes all products regardless of homepage flags and categories count grouped models", async () => {
  const categories = [category("root"), category("child", "root"), category("grandchild", "child"), category("deep", "grandchild"), category("other")]
  const items = Array.from({ length: 100 }, (_, i) => product(i, { categoryId: i % 2 ? "deep" : "other", showOnHomepage: i < 11 }))
  for (const slug of [undefined, "root", "deep"]) {
    const api = storefrontApi(categories, items)
    const load = sourceLoader(api)
    const tree = await load("@/features/catalog/StorefrontCatalog").StorefrontCatalog({ pageNumber: slug ? 2 : 1, searchQuery: "", categorySlug: slug })
    assert.equal(api.productCalls.length, 1)
    assert.equal(api.productCalls[0].get("PageNumber"), "1")
    assert.equal(api.productCalls[0].get("PageSize"), "100")
    assert.equal(tree.props.productPage.items.length, 24)
    assert.equal(tree.props.productPage.totalCount, slug ? 50 : 100)
    if (slug === "root") assert.deepEqual(api.productCalls[0].getAll("CategoryIds"), ["child", "deep", "grandchild", "root"])
    if (slug === "deep") assert.equal(api.productCalls[0].get("CategoryId"), "deep")
    if (slug) assert.ok(tree.props.productPage.items.every(item => item.categoryId === "deep"))
  }
})

test("home promotes flagged SKUs from later API pages before grouping and pagination", async () => {
  const items = Array.from({ length: 220 }, (_, i) => product(i, { showOnHomepage: i >= 209 }))
  items[0] = product(0, { name: "Гірлянда USB 5 метрів біла", categoryId: "lights", isFeatured: true })
  items[219] = product(219, { name: "Гірлянда USB 10 метрів біла", categoryId: "lights", showOnHomepage: true })
  const api = storefrontApi([], items)
  const Catalog = sourceLoader(api)("@/features/catalog/StorefrontCatalog").StorefrontCatalog
  const first = (await Catalog({ pageNumber: 1, searchQuery: "" })).props.productPage
  assert.equal(api.productCalls.length, 3)
  assert.ok(api.productCalls.every(query => query.get("Summary") === "false"))
  assert.equal(first.totalCount, 219)
  assert.equal(first.totalSkuCount, 220)
  assert.equal(first.totalPages, 10)
  assert.equal(first.items.filter(item => item.showOnHomepage === true).length, 11)
  assert.ok(first.items.slice(0, 11).every(item => item.showOnHomepage === true))
  assert.equal(first.items[0].id, "p-219", "flagged variant represents the model instead of its earlier featured sibling")
  const displayed = [...first.items]
  for (let pageNumber = 2; pageNumber <= first.totalPages; pageNumber++) {
    const page = (await Catalog({ pageNumber, searchQuery: "" })).props.productPage
    assert.ok(page.items.every(item => item.showOnHomepage !== true))
    displayed.push(...page.items)
  }
  assert.equal(displayed.length, 219)
  assert.equal(new Set(displayed.map(item => item.id)).size, 219)
  assert.deepEqual(displayed.slice(11).map(item => item.id), items.slice(1, 209).map(item => item.id))
})

test("unknown categories do not fall back to unrelated catalog products", async () => {
  const api = storefrontApi([category("existing")], [product(1, { categoryId: "existing" })])
  const load = sourceLoader({ ...api, overrides: { "next/navigation": { notFound() { throw new Error("NOT_FOUND") } } } })
  await assert.rejects(load("@/features/catalog/StorefrontCatalog").StorefrontCatalog({ categorySlug: "missing", searchQuery: "", pageNumber: 1 }), /NOT_FOUND/)
  assert.equal(api.productCalls.length, 0)
})

test("out-of-range pages redirect to the last page while preserving search and category", async () => {
  const api = storefrontApi([category("decor")], Array.from({ length: 25 }, (_, i) => product(i, { categoryId: "decor" })))
  const load = sourceLoader({ ...api, overrides: { "next/navigation": { redirect(url) { throw new Error(`REDIRECT:${url}`) } } } })
  await assert.rejects(load("@/features/catalog/StorefrontCatalog").StorefrontCatalog({ categorySlug: "decor", searchQuery: "свято", pageNumber: 99 }), error => {
    const url = new URL(error.message.replace("REDIRECT:", ""), origin)
    assert.equal(url.pathname, "/catalog/decor")
    assert.equal(url.searchParams.get("page"), "2")
    assert.equal(url.searchParams.get("query"), "свято")
    return true
  })
  assert.equal(api.productCalls.length, 1)
})

test("pagination shows real totals, current page and links that preserve active filters", () => {
  const load = sourceLoader({ overrides: { "@/components/cart/CartContext": { useCart: () => ({ addItem() {}, items: [] }) } } })
  const Section = load("@/components/catalog/CatalogSection").CatalogSection
  const html = renderStorefront(load, Section, {
    title: "Decor", eyebrow: "Каталог", description: "", activeCategorySlug: "decor", searchQuery: "сніг & декор", categories: [category("decor", null)].map(item => ({ ...item, children: [] })),
    productPage: { items: Array.from({ length: 24 }, (_, i) => product(i)), totalCount: 441, pageNumber: 2, pageSize: 24, totalPages: 19 },
  })
  assert.match(html, /Товарів: 441/)
  assert.match(html, /Сторінка 2 із 19/)
  assert.equal((html.match(/<article/g) || []).length, 24)
  assert.doesNotMatch(html, /Показати ще/)
  const links = [...html.matchAll(/href="([^"]+)"/g)].map(match => new URL(match[1].replaceAll("&amp;", "&"), origin))
  assert.ok(links.some(url => url.pathname === "/catalog/decor" && url.searchParams.get("page") === "3" && url.searchParams.get("query") === "сніг & декор"))
  assert.ok(links.some(url => url.pathname === "/catalog/decor" && url.searchParams.get("page") === "1" && url.searchParams.get("query") === "сніг & декор"))
  assert.ok(links.some(url => url.pathname === "/" && url.searchParams.get("page") === "1" && url.searchParams.get("query") === "сніг & декор"))
})

test("an empty filtered page keeps its empty state and hides unnecessary pagination", async () => {
  const load = sourceLoader({ ...storefrontApi([category("empty")], []), overrides: { "@/components/cart/CartContext": { useCart: () => ({ items: [], addItem() {} }) } } })
  const tree = await load("@/features/catalog/StorefrontCatalog").StorefrontCatalog({ categorySlug: "empty", pageNumber: 1, searchQuery: "" })
  const html = renderStorefront(load, tree.type, tree.props)
  assert.match(html, /Наразі товарів немає/)
  assert.match(html, /Моделей: 0 · Варіантів товарів: 0/)
  assert.doesNotMatch(html, /Сторінки каталогу/)
})

test("referral attribution survives navigation and reaches the order within the API length limit", async () => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window")
  const storage = new Map()
  const bodies = []
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    sessionStorage: { setItem() {} },
  } })
  try {
    const load = sourceLoader({ fetch: async (_url, request) => {
      bodies.push(JSON.parse(request.body))
      return Response.json({ publicId: "test-order", orderNumber: 1, totalPrice: 200, createdAt: "2026-11-22T00:00:00Z" }, { status: 201 })
    } })
    const { saveReferralCode } = load("@/lib/referral/storage")
    const { createOrder } = load("@/lib/api/orders")
    const order = {
      customerFirstName: "Тест", customerLastName: "Покупець", customerPhone: "+380000000000",
      deliveryType: "Warehouse", deliveryCityRef: "city", deliveryCityName: "Місто",
      deliveryWarehouseRef: "warehouse", deliveryWarehouseName: "Відділення №1", paymentMethod: "CashOnDelivery",
      items: [{ productId: "11111111-1111-4111-8111-111111111111", quantity: 1 }],
    }
    saveReferralCode("  PARTNER  ")
    saveReferralCode(null)
    saveReferralCode("x".repeat(33))
    await createOrder(order, { analyticsItems: [] })
    assert.equal(bodies[0].referralCode, "PARTNER")
    storage.clear()
    saveReferralCode("x".repeat(33))
    await createOrder(order, { analyticsItems: [] })
    assert.equal(Object.hasOwn(bodies[1], "referralCode"), false)
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow)
    else delete globalThis.window
  }
})

function elementNodes(element) {
  if (!element || typeof element !== "object") return []
  const children = element.props?.children
  return [element, ...(Array.isArray(children) ? children.flat(Infinity) : [children]).flatMap(elementNodes)]
}

// Drive the actual component's event handlers without a browser or a new test package.
function hookState() {
  const slots = []
  let cursor = 0
  return {
    react: {
      ...React,
      useEffect() {},
      useState(initial) {
        const index = cursor++
        if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial
        return [slots[index], value => { slots[index] = typeof value === "function" ? value(slots[index]) : value }]
      },
      useRef(initial) {
        const index = cursor++
        if (!(index in slots)) slots[index] = { current: initial }
        return slots[index]
      },
    },
    render(Component, props) { cursor = 0; return Component(props) },
  }
}

test("catalog renders heights immediately and keeps the card's SKU selected", () => {
  const base = product(10, { name: "Ялинка Мрія 2.1 м", categoryId: "trees", sku: "TALL", price: 500 })
  const sold = product(11, { name: "Ялинка Мрія 1.5 м", categoryId: "trees", sku: "SOLD", stock: 0, price: 200 })
  const shortestAvailable = product(12, { name: "Ялинка Мрія 1.8 м", categoryId: "trees", sku: "SHORT", stock: 3, price: 300 })
  const hooks = hookState()
  const added = []
  const routes = []
  const load = sourceLoader({
    overrides: {
      react: hooks.react,
      "next/navigation": { useRouter: () => ({ push: route => routes.push(route) }) },
      "@/components/cart/CartContext": { useCart: () => ({ items: [], addItem: item => added.push(item) }) },
    },
  })
  const Card = load("@/components/catalog/ProductCard").ProductCard
  const variants = load("@/features/product/height-variants").selectHeightVariants(base, [sold, shortestAvailable])
  const render = () => elementNodes(hooks.render(Card, { product: base, heightVariants: variants }))
  const nodes = render()
  assert.equal(nodes.some(node => String(node.props?.children).startsWith("Обрати висоту")), false)
  assert.equal(nodes.find(node => node.props?.["aria-label"] === "Висота 2.1 м").props["aria-pressed"], true)
  assert.ok(nodes.some(node => node.props?.href === "/product/product-10"))
  nodes.find(node => node.props?.children === "Купити зараз").props.onClick()
  assert.equal(added[0].id, base.id)
  assert.equal(added[0].sku, "TALL")
  assert.equal(added[0].price, 500)
  assert.deepEqual(routes, ["/checkout"])
})

test("catalog height selection updates the chosen SKU's price, stock, link and image without a request", () => {
  const base = product(1, { name: "Штучна ялинка Мрія зелена 1.8 м", categoryId: "trees", sku: "BASE", stock: 50, price: 200, oldPrice: 300 })
  const tall = product(2, { name: "Штучна ялинка Мрія зелена 2.1 м", categoryId: "trees", sku: "TALL", stock: 1, price: 450, oldPrice: null, mainImageUrl: "https://demo.supabase.co/tall.webp" })
  const unavailable = product(3, { name: "Штучна ялинка Мрія зелена 2.5 м", categoryId: "trees", sku: "SOLD-OUT", stock: 0, price: 800 })
  const hooks = hookState()
  const added = []
  let cart = []
  const load = sourceLoader({
    overrides: {
      react: hooks.react,
      "@/components/cart/CartContext": { useCart: () => ({ items: cart, addItem(item) { added.push(item); cart = [{ product: item, quantity: 1 }] } }) },
    },
  })
  const Card = load("@/components/catalog/ProductCard").ProductCard
  const variants = load("@/features/product/height-variants").selectHeightVariants(base, [tall, unavailable])
  const render = () => elementNodes(hooks.render(Card, { product: base, heightVariants: variants }))
  let nodes = render()
  assert.equal(nodes.some(node => String(node.props?.children).startsWith("Обрати висоту")), false)
  assert.equal(nodes.find(node => node.props?.["aria-label"] === "Висота 1.8 м").props["aria-pressed"], true)
  assert.ok(nodes.some(node => node.props?.className?.includes("line-through")))
  nodes.find(node => node.props?.["aria-label"] === "Висота 2.1 м").props.onClick()
  nodes = render()
  assert.equal(nodes.some(node => node.props?.className?.includes("line-through")), false)
  assert.equal(nodes.find(node => node.props?.fill).props.src, tall.mainImageUrl)
  assert.ok(nodes.some(node => node.props?.href === "/product/product-2"))
  assert.equal(nodes.find(node => node.props?.["aria-label"] === "Висота 2.1 м").props["aria-pressed"], true)
  const buy = nodes.find(node => node.props?.children === "До кошика")
  assert.equal(buy.props.disabled, false)
  buy.props.onClick()
  assert.deepEqual(Object.fromEntries(["id", "name", "slug", "price", "oldPrice", "stock", "sku", "mainImageUrl"].map(key => [key, added[0][key]])),
    Object.fromEntries(["id", "name", "slug", "price", "oldPrice", "stock", "sku", "mainImageUrl"].map(key => [key, tall[key]])))
  nodes = render()
  assert.equal(nodes.find(node => node.props?.children === "Максимум у кошику").props.disabled, true)
  nodes.find(node => node.props?.["aria-label"]?.startsWith("Висота 2.5 м")).props.onClick()
  nodes = render()
  assert.equal(nodes.find(node => node.props?.children === "Немає в наявності" && typeof node.props.onClick === "function").props.disabled, true)
  assert.equal(added.length, 1)
})

test("catalog preloads one Summary search per model and falls back to its visible heights", async () => {
  const base = product(1, { name: "Ялинка Мрія 1.8 м", categoryId: "trees" })
  const tall = product(2, { name: "Ялинка Мрія 2.1 м", categoryId: "trees" })
  const other = product(3, { name: "Сосна Казка 1.5 м", categoryId: "trees" })
  const calls = []
  const load = sourceLoader({ fetch: async url => {
    const query = new URL(url).searchParams
    calls.push(query)
    if (query.get("Search") === "Сосна Казка") throw new Error("API unavailable")
    return Response.json({ items: [base, tall], totalCount: 2, totalPages: 1, pageSize: 24 })
  } })
  const variants = await load("@/lib/api/product-height-variants").getCatalogHeightVariants([base, tall, other])
  assert.equal(calls.length, 2)
  assert.ok(calls.every(query => query.get("Summary") === "true" && query.get("PageSize") === "24"))
  assert.deepEqual(variants[base.id].map(item => item.height), ["1.8 м", "2.1 м"])
  assert.deepEqual(variants[other.id].map(item => item.height), ["1.5 м"])
})

test("PDP loads one targeted Summary page and keeps the linked SKU authoritative", async () => {
  const base = product(1, { name: "Штучна ялинка Мрія зелена 1,8 м", categoryId: "trees", sku: "BASE", price: 200, oldPrice: 300 })
  const tall = product(2, { name: "Штучна ялинка Мрія зелена 210 см", categoryId: "trees", sku: "TALL", price: 450, stock: 1 })
  const calls = []
  const load = sourceLoader({ fetch: async (url, init) => {
    calls.push({ url, init })
    if (url.includes("by-slug")) return Response.json(base)
    if (url.includes("/categories?")) return Response.json([])
    return Response.json({
      items: [tall, product(3, { name: "Штучна ялинка Мрія зелена 2.5 м", categoryId: "trees", isActive: false }),
        product(4, { name: "Штучна ялинка Мрія засніжена 2.5 м", categoryId: "trees" }),
        product(5, { name: "Штучна ялинка Мрія зелена 2.5 м", categoryId: "other" })],
      totalCount: 441, totalPages: 19, pageSize: 24,
    })
  } })
  const page = load("@/app/product/[slug]/page")
  const tree = await page.default({ params: Promise.resolve({ slug: base.slug }) })
  const metadata = await page.generateMetadata({ params: Promise.resolve({ slug: base.slug }) })
  const lists = calls.filter(call => call.url.includes("/products?"))
  const targeted = lists.filter(call => new URL(call.url).searchParams.has("Search"))
  assert.equal(targeted.length, 1, "PDP variant lookup stays bounded")
  const query = new URL(targeted[0].url).searchParams
  assert.equal(query.get("Search"), "Штучна ялинка Мрія зелена")
  assert.equal(query.get("Summary"), "true")
  assert.equal(query.get("PageSize"), "24")
  assert.equal(query.get("PageNumber"), "1")
  assert.equal(query.get("CategoryId"), "trees")
  assert.equal(targeted[0].init.next.revalidate, 300)
  const nodes = elementNodes(tree)
  const details = nodes.find(node => node.type === load("@/components/product/ProductDetails").ProductDetails)
  assert.equal(details.key, base.id)
  assert.equal(details.props.product.id, base.id)
  assert.deepEqual(details.props.heightVariants.map(variant => variant.id), [base.id, tall.id])
  assert.equal(metadata.alternates.canonical, `${origin}/product/${base.slug}`)
  const jsonLd = JSON.parse(nodes.find(node => node.type === "script").props.dangerouslySetInnerHTML.__html)["@graph"].find(node => node["@type"] === "Product")
  assert.equal(jsonLd.offers.price, base.price)
  assert.equal(jsonLd.offers.availability, "https://schema.org/InStock")
  assert.equal(jsonLd.offers.url, metadata.alternates.canonical)
  assert.equal(jsonLd.brand.name, "Jingle Decor")
  const feed = load("@/features/catalog/google-feed").generateGoogleFeed([base], origin)
  assert.match(feed, new RegExp(`<g:link>${metadata.alternates.canonical}</g:link>`))
  assert.match(feed, new RegExp(`<g:sale_price>${jsonLd.offers.price.toFixed(2)} UAH</g:sale_price>`))
  assert.equal(jsonLd.sku, base.sku)
  const html = renderToStaticMarkup(React.createElement(load("@/features/product/ProductHeightLinks").ProductHeightLinks,
    { productId: base.id, variants: details.props.heightVariants }))
  assert.match(html, /href="\/product\/product-2"/)
  assert.match(html, /aria-current="page"/)
  assert.match(html, /1.8 м/)
  assert.match(html, /2.1 м/)
})

test("height matching excludes ornaments, other series and duplicate heights", () => {
  const { getTreeHeightModel, selectHeightVariants } = sourceLoader()("@/features/product/height-variants")
  for (const name of ["Набір ялинкових куль 8 см", "Гірлянда хвойна 2 м", "Ялинка 1 м x 2 м"]) assert.equal(getTreeHeightModel(name), null)
  const base = product(1, { name: "Ялинка Мрія 1.8 м", categoryId: "trees" })
  const variants = selectHeightVariants(base, [
    product(2, { name: "Ялина Мрія 180 см", categoryId: "trees" }),
    product(3, { name: "Ялинка Мрія 2.5 м", categoryId: "trees", stock: 0 }),
    product(4, { name: "Ялинка Мрія засніжена 2.1 м", categoryId: "trees" }),
  ])
  assert.deepEqual(variants.map(variant => variant.id), [base.id, "p-3"])
})

test("garland options keep the chosen length across colors and vice versa", () => {
  const { getProductOptionModel, getOptionTarget, selectProductOptions, getOptionColorBackground } = sourceLoader()("@/features/product/variant-options")
  const variants = [
    product(1, { name: "Гірлянда Роса 3 м теплий білий", categoryId: "lights", sku: "W3" }),
    product(2, { name: "Гірлянда Роса 5 м теплий білий", categoryId: "lights", sku: "W5" }),
    product(3, { name: "Гірлянда Роса 3 м синій", categoryId: "lights", sku: "B3" }),
    product(4, { name: "Гірлянда Роса 5 м синій", categoryId: "lights", sku: "B5" }),
  ]
  const options = selectProductOptions(variants[0], [...variants.slice(1), product(5, { name: "Гірлянда Інша 5 м синій", categoryId: "lights" })])
  assert.deepEqual(options.map(item => item.id), [variants[2].id, variants[0].id, variants[3].id, variants[1].id])
  assert.equal(getOptionTarget(options, variants[0], "dimension", "5 м").id, variants[1].id)
  assert.equal(getOptionTarget(options, variants[1], "color", "Синій").id, variants[3].id)
  assert.equal(getOptionTarget(options.filter(item => item.id !== variants[3].id), variants[1], "color", "Синій").id, variants[2].id)
  assert.equal(getProductOptionModel(product(6, { name: "Гірлянда Завіса 3×2 м мультиколор" })).dimension, "3×2 м")
  assert.match(getOptionColorBackground(product(7, { name: "Гірлянда Завіса 3 м мультиколор" })), /conic-gradient/)
  assert.equal(getOptionColorBackground(product(8, { name: "Гірлянда Роса 3 м синій", attributes: '{"ColorHex":"#123ABC"}' })), "#123ABC")
})

test("catalog preloads garland variants from one bounded Summary lookup", async () => {
  const base = product(1, { name: "Гірлянда Роса 3 м теплий білий", categoryId: "lights" })
  const sibling = product(2, { name: "Гірлянда Роса 5 м синій", categoryId: "lights" })
  const calls = []
  const load = sourceLoader({ fetch: async url => {
    calls.push(new URL(url).searchParams)
    return Response.json({ items: [base, sibling], totalCount: 2, pageSize: 100, totalPages: 1 })
  } })
  const map = await load("@/lib/api/product-options").getCatalogProductOptions([base])
  assert.deepEqual(map[base.id].map(item => item.id), [base.id, sibling.id])
  assert.equal(calls.length, 1)
  assert.equal(calls[0].get("Summary"), "true")
  assert.equal(calls[0].get("PageSize"), "100")
  assert.equal(calls[0].get("CategoryId"), "lights")
})

test("garland options fall back to visible products when the lookup fails", async () => {
  const base = product(1, { name: "Гірлянда Роса 3 м теплий білий", categoryId: "lights" })
  const sibling = product(2, { name: "Гірлянда Роса 5 м синій", categoryId: "lights" })
  const load = sourceLoader({ fetch: async () => { throw new Error("unavailable") } })
  const map = await load("@/lib/api/product-options").getCatalogProductOptions([base, sibling])
  assert.deepEqual(map[base.id].map(item => item.id), [base.id, sibling.id])
})

test("garland card switches price, SKU, image and link from preloaded options", () => {
  const base = product(1, { name: "Гірлянда Роса 3 м теплий білий", categoryId: "lights", sku: "W3", oldPrice: 300 })
  const blue = product(2, { name: "Гірлянда Роса 3 м синій", categoryId: "lights", sku: "B3", price: 250, oldPrice: null, showOnHomepage: true,
    mainImageUrl: "https://demo.supabase.co/storage/v1/object/public/products/blue.webp" })
  const hooks = hookState()
  const added = []
  const load = sourceLoader({ overrides: {
    react: hooks.react,
    "@/components/cart/CartContext": { useCart: () => ({ items: [], addItem: item => added.push(item) }) },
  } })
  const Card = load("@/components/catalog/ProductCard").ProductCard
  const Controls = load("@/features/product/ProductOptionControls").ProductOptionControls
  const options = load("@/features/product/variant-options").selectProductOptions(base, [blue])
  const render = () => elementNodes(hooks.render(Card, { product: base, productOptions: options }))
  let nodes = render()
  const control = nodes.find(node => node.type === Controls)
  assert.ok(control)
  const swatches = elementNodes(Controls(control.props))
  swatches.find(node => node.props?.["aria-label"] === "Колір Синій").props.onClick()
  nodes = render()
  assert.ok(nodes.some(node => node.props?.href === "/product/product-2"))
  assert.equal(nodes.find(node => node.props?.fill).props.src, blue.mainImageUrl)
  assert.equal(nodes.some(node => node.props?.className?.includes("line-through")), false)
  assert.ok(nodes.some(node => node.props?.children === "Хіт продажу"))
  assert.ok(nodes.some(node => Array.isArray(node.props?.children) && node.props.children.join("") === "Артикул: B3"))
  nodes.find(node => node.props?.children === "До кошика").props.onClick()
  assert.equal(added[0].id, blue.id)
  assert.equal(added[0].price, blue.price)
})

test("variant endpoint reports lookup failures without breaking the catalog", async () => {
  for (const status of [404, 503]) {
    const load = sourceLoader({ fetch: async () => new Response("Unavailable", { status }) })
    const response = await load("@/app/api/products/[slug]/height-variants/route").GET(new Request(origin), { params: Promise.resolve({ slug: "missing" }) })
    assert.equal(response.status, status)
  }
})

test("groups garland lengths, colors, tree heights, dew and fringe before pagination", () => {
  const { groupProducts, paginateGroups, getGroupVariantMaps } = sourceLoader()("@/features/catalog/group-products")
  const lines = [
    ["Гірлянда на USB 5 метрів біла", "Гірлянда на USB 10 метрів біла", "Гірлянда usb 10 метрів тепло-біла"],
    ["Гірлянда на батарейках 2 м теплий білий", "Гірлянда на батарейках 5 м теплий білий"],
    ["Гірлянда Роса 30 м,300 Led,8 режимів, тепло-біла", "Гірлянда Роса 50 м,500 Led,8 режимів, Біла"],
    ["Гірлянда бахрома 3 метра синє світіння", "Гірлянда бахрома 3 метра тепле-біле світіння"],
    ["Сосна Казка зелена 1,8 м", "Сосна Казка зелена 210 см"],
  ]
  const products = lines.flatMap((line, lineIndex) => line.map((name, variantIndex) => product(`${lineIndex}-${variantIndex}`, {
    name, categoryId: `category-${lineIndex}`, sku: `JD-${lineIndex}-${variantIndex}`,
  })))
  const groups = groupProducts(products)
  assert.equal(groups.length, lines.length)
  assert.deepEqual(groups.map(group => group.variants.length), [3, 2, 2, 2, 2])
  const page = paginateGroups(groups, 1, 2)
  assert.equal(page.totalCount, 5)
  assert.equal(page.totalPages, 3)
  assert.equal(page.items.length, 2)
  const maps = getGroupVariantMaps(groups, products)
  assert.equal(maps.productOptionsByProductId[groups[0].product.id].length, 3)
  assert.equal(maps.heightVariantsByProductId[groups[4].product.id].length, 2)
})

test("trees keep foliage colors in separate cards with height controls only", () => {
  const load = sourceLoader({ overrides: {
    "@/components/cart/CartContext": { useCart: () => ({ addItem() {}, items: [] }) },
  } })
  const { groupProducts, getGroupVariantMaps } = load("@/features/catalog/group-products")
  const products = [
    product(1, { name: "Лита ялинка Royal зелена 1.8 м", categoryId: "trees" }),
    product(2, { name: "Лита ялинка Royal зелена 2.1 м", categoryId: "trees" }),
    product(3, { name: "Лита ялинка Royal блакитна 1.8 м", categoryId: "trees" }),
    product(4, { name: "Лита ялинка Royal блакитна 2.1 м", categoryId: "trees" }),
  ]
  const groups = groupProducts(products)
  assert.equal(groups.length, 2)
  const maps = getGroupVariantMaps(groups, products)
  for (const group of groups) {
    const heights = maps.heightVariantsByProductId[group.product.id]
    assert.equal(heights.length, 2)
    assert.equal(maps.productOptionsByProductId[group.product.id], undefined)
    const html = renderStorefront(load, load("@/components/catalog/ProductCard").ProductCard, {
      product: group.product, heightVariants: heights,
    })
    assert.match(html, /Вибір висоти/)
    assert.doesNotMatch(html, /Вибір кольору|Колір Синій/)
  }
})

test("model pagination remains correct when sibling SKUs cross an API page boundary", async () => {
  const unique = Array.from({ length: 23 }, (_, index) => product(index, { categoryId: "lights" }))
  const items = [...unique,
    product(23, { name: "Гірлянда USB 5 метрів біла", categoryId: "lights" }),
    product(24, { name: "Гірлянда USB 10 метрів біла", categoryId: "lights" }),
  ]
  const api = pagedApi(items, { size: 24 })
  const load = sourceLoader(api)
  const products = await load("@/lib/api/products").getProducts()
  const { groupProducts, paginateGroups } = load("@/features/catalog/group-products")
  const groups = groupProducts(products)
  const page = paginateGroups(groups, 1)
  assert.equal(api.calls.length, 2)
  assert.equal(page.totalCount, 24)
  assert.equal(page.totalPages, 1)
  assert.equal(page.items.length, 24)
})

test("real garland series keep LED density and power source in their model keys", () => {
  const { getProductGroupKey } = sourceLoader()("@/features/catalog/group-products")
  const key = name => getProductGroupKey(product(name, { name, categoryId: "lights" }))
  assert.equal(key('Гірлянда "Роса" 30 м,300 Led,8 режимів, від мережі з Пультом, тепло-біла'),
    key('Гірлянда "Роса" 50 м,500 Led,8 режимів, від мережі з Пультом, Біла'))
  assert.notEqual(key('Гірлянда "Роса" 30 м,300 Led,8 режимів, від мережі з Пультом, тепло-біла'),
    key('Гірлянда "Роса BIG LED" 30 м,300 Led,8 режимів, від мережі з Пультом, тепло-біла'))
  assert.notEqual(key("Гірлянда USB 5 метрів біла"), key("Гірлянда на батарейках 5 метрів біла"))
  assert.notEqual(key("Гірлянда Роса 30 м,300 Led,8 режимів"), key("Гірлянда Роса 30 м,600 Led,8 режимів"))
})

test("homepage and recommendations honor flags and collapse flagged sibling SKUs", () => {
  const { homepageGroups, recommendedGroups } = sourceLoader()("@/features/catalog/group-products")
  const base = product(1, { name: "Гірлянда USB 5 метрів біла", categoryId: "lights", showOnHomepage: true, isRecommended: true })
  const sibling = product(2, { name: "Гірлянда USB 10 метрів біла", categoryId: "lights", showOnHomepage: true, isRecommended: true })
  const other = product(3, { name: "Вінок різдвяний", categoryId: "decor", showOnHomepage: false, isRecommended: true })
  const inactive = product(4, { name: "Декор", categoryId: "decor", isActive: false, showOnHomepage: true, isRecommended: true })
  assert.equal(homepageGroups([base, sibling, other, inactive]).length, 2)
  assert.equal(homepageGroups([product(5), product(6)]).length, 2, "older DTOs keep the catalog visible")
  assert.equal(homepageGroups(Array.from({ length: 30 }, (_, index) => product(index + 10))).length, 30)
  assert.deepEqual(recommendedGroups([base, sibling, other, inactive], base).map(group => group.product.id), [other.id])
  assert.equal(recommendedGroups([other], base, 0).length, 0)
})

test("recommendations require the flag, exclude unavailable and current models, and enforce the model limit", () => {
  const { recommendedGroups } = sourceLoader()("@/features/catalog/group-products")
  const current = product(1, { name: "Гірлянда USB 5 метрів біла", categoryId: "usb" })
  const sibling = product(2, { name: "Гірлянда USB 10 метрів біла", categoryId: "usb", isRecommended: true })
  const unflagged = product(3, { categoryId: "usb" })
  const disabled = product(4, { isRecommended: false })
  const inactive = product(5, { isRecommended: true, isActive: false })
  const unavailable = product(6, { isRecommended: true, stock: 0 })
  const eligible = Array.from({ length: 20 }, (_, i) => product(i + 10, { isRecommended: true }))
  const result = recommendedGroups([sibling, unflagged, disabled, inactive, unavailable, ...eligible], current)
  assert.deepEqual(result.map(group => group.product.id), eligible.slice(0, 12).map(item => item.id))
  assert.equal(recommendedGroups([unflagged, disabled], current).length, 0)
})

test("public product adapter reads merchandising flags from the API", async () => {
  const api = pagedApi([product(1, { showOnHomepage: true, isRecommended: true, isFeatured: true })], { size: 24 })
  const page = await sourceLoader(api)("@/lib/api/products").getCatalogProductsPage()
  assert.equal(page.items[0].showOnHomepage, true)
  assert.equal(page.items[0].isRecommended, true)
  assert.equal(page.items[0].isFeatured, true)
  const oldApi = pagedApi([product(2)], { size: 24 })
  const oldPage = await sourceLoader(oldApi)("@/lib/api/products").getCatalogProductsPage()
  assert.equal(oldPage.items[0].showOnHomepage, undefined)
  const snakeApi = pagedApi([product(3, { show_on_homepage: true, is_recommended: true, is_featured: true })], { size: 24 })
  const snakePage = await sourceLoader(snakeApi)("@/lib/api/products").getCatalogProductsPage()
  assert.equal(snakePage.items[0].showOnHomepage, true)
  assert.equal(snakePage.items[0].isRecommended, true)
  assert.equal(snakePage.items[0].isFeatured, true)
})

test("homepage, featured and sale badges follow the selected card SKU", () => {
  const load = sourceLoader({ overrides: { "@/components/cart/CartContext": { useCart: () => ({ addItem() {}, items: [] }) } } })
  const Card = load("@/components/catalog/ProductCard").ProductCard
  const featured = product(1, { isFeatured: true, price: 170, oldPrice: 200 })
  const html = renderStorefront(load, Card, { product: featured, prominent: true })
  assert.match(html, /Хіт продажу/)
  assert.match(html, /−15%/)
  assert.match(html, /line-through/)
  assert.match(html, /ring-1 ring-\[#D4AF37\]/)
  for (const flags of [{ showOnHomepage: true }, { showOnHomepage: true, isFeatured: true, badge: "hit" }]) {
    const priority = renderStorefront(load, Card, { product: product(3, flags), prominent: true })
    assert.equal((priority.match(/Хіт продажу/g) ?? []).length, 1)
    assert.doesNotMatch(priority, /Хіт сезону/)
    assert.match(priority, /ring-1 ring-\[#D4AF37\]/)
  }
  const regular = renderStorefront(load, Card, { product: product(2) })
  assert.doesNotMatch(regular, /Хіт продажу|−15%/)
})

test("product description no longer claims tree-only benefits", () => {
  const load = sourceLoader({ overrides: { "@/components/cart/CartContext": { useCart: () => ({ addItem() {}, items: [] }) } } })
  const html = renderStorefront(load, load("@/components/product/ProductDetails").ProductDetails, { product: product(1, { description: "Гірлянда USB" }) })
  assert.doesNotMatch(html, /100% Лита|Без запаху|Зручне складання|Фірмова коробка/)
})

test("recommended slider renders grouped cards and accessible navigation", () => {
  const load = sourceLoader({ overrides: { "@/components/cart/CartContext": { useCart: () => ({ addItem() {}, items: [] }) } } })
  const Slider = load("@/components/product/RecommendedProducts").RecommendedProducts
  const html = renderStorefront(load, Slider, {
    products: [product(1), product(2)], heightVariantsByProductId: {}, productOptionsByProductId: {},
  })
  assert.match(html, /Рекомендовані товари/)
  assert.match(html, /Попередні рекомендовані товари/)
  assert.match(html, /Наступні рекомендовані товари/)
  assert.equal((html.match(/data-recommended-card/g) ?? []).length, 2)
  assert.equal(renderStorefront(load, Slider, { products: [], heightVariantsByProductId: {}, productOptionsByProductId: {} }), "")
})

test("SEO text routes proxy backend text, normalize deployment domains and cache", async () => {
  const calls = []
  const load = sourceLoader({ fetch: async (url, init) => {
    calls.push({ url, init })
    return new Response('# Jingle Decor\nhttps://back-web-production-e661.up.railway.app/product/tree\nhttps://yalinka-dashboard.vercel.app/catalog/trees\nhttps://jingledecor.com.ua/contacts')
  } })
  for (const route of ['llms.txt', 'llms-full.txt']) {
    const response = await load(`@/app/${route}/route`).GET()
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('content-type'), 'text/plain; charset=utf-8')
    assert.match(response.headers.get('cache-control'), /s-maxage=300/)
    const body = await response.text()
    assert.doesNotMatch(body, /railway|vercel|localhost/)
    assert.match(body, /https:\/\/www.jingledecor.com.ua\/product\/tree/)
    assert.ok(calls.at(-1).url.endsWith(`/api/seo/${route}`))
    assert.equal(calls.at(-1).init.next.revalidate, 300)
  }
})

test("llms fallback is readable and has no invented price or availability", async () => {
  for (const fetch of [async () => { throw new Error('offline') }, async () => new Response('<html>Error</html>'), async () => new Response('', { status: 503 })]) {
    const load = sourceLoader({ fetch })
    const response = await load('@/app/llms-full.txt/route').GET()
    const body = await response.text()
    assert.match(body, /# Jingle Decor/)
    assert.match(body, /\/delivery-and-payment/)
    assert.doesNotMatch(body, /localhost|Railway|<html>|1999|InStock/)
  }
})

test("canonical and robots metadata preserve pagination and exclude search and filter duplicates", () => {
  const load = sourceLoader({ env: { NEXT_PUBLIC_SITE_URL: 'https://preview.vercel.app' } })
  assert.equal(load('@/lib/config/site').getSiteOrigin(), origin)
  const { catalogMetadata, pageMetadata } = load('@/lib/seo/metadata')
  const first = catalogMetadata('/catalog/trees', 'Ялинки', 'Опис', { page: '1', utm_source: 'ads' })
  assert.equal(first.alternates.canonical, `${origin}/catalog/trees`)
  assert.equal(first.robots.index, true)
  const second = catalogMetadata('/catalog/trees', 'Ялинки', 'Опис', { page: '2' })
  assert.equal(second.alternates.canonical, `${origin}/catalog/trees?page=2`)
  assert.match(second.title, /сторінка 2/)
  for (const params of [{ query: 'tree' }, { search: 'tree' }, { minPrice: '20' }, { sort: 'price_asc' }]) {
    const metadata = catalogMetadata('/catalog/trees', 'Ялинки', 'Опис', params)
    assert.equal(metadata.robots.index, false)
    assert.equal(metadata.robots.follow, true)
    assert.equal(metadata.alternates.canonical, `${origin}/catalog/trees`)
  }
  const clean = pageMetadata('/contacts', '<b>Контакти</b>', '<p>Телефон &amp; адреса</p>')
  assert.equal(clean.title, 'Контакти')
  assert.equal(clean.description, 'Телефон & адреса')
  assert.deepEqual(clean.openGraph.images, [`${origin}/og`])
})

test("Product JSON-LD replaces backend duplicates, fake reviews and stale offers with storefront values", () => {
  const load = sourceLoader()
  const { productGraph, serializeJsonLd } = load('@/lib/seo/structured-data')
  const backend = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Product', name: 'wrong', aggregateRating: { ratingValue: 5, reviewCount: 0 }, offers: { price: 1, priceCurrency: 'USD' } },
    { '@type': ['Product', 'Thing'], name: 'duplicate', review: [{ reviewBody: 'fake' }] },
    { '@type': 'Review', reviewBody: 'fake standalone review' },
    { '@type': 'AggregateRating', ratingValue: 5, reviewCount: 999 },
    { '@type': 'WebPage', url: 'https://preview.vercel.app/product/tree', mainEntity: { '@type': 'Product', name: 'nested duplicate' } },
  ] }
  const current = product(1, { price: 179.99, oldPrice: 250, stock: 0, name: 'Ялинка </script><script>alert(1)</script>', description: '<b>Опис</b>' })
  const result = productGraph(backend, current)
  const products = result['@graph'].filter(node => node['@type'] === 'Product')
  assert.equal(products.length, 1)
  assert.equal(products[0].offers.price, current.price)
  assert.equal(products[0].offers.priceCurrency, 'UAH')
  assert.equal(products[0].offers.availability, 'https://schema.org/OutOfStock')
  assert.equal(products[0].offers.url, `${origin}/product/${current.slug}`)
  const json = serializeJsonLd(result)
  assert.doesNotMatch(json, /aggregateRating|reviewBody|<script|<\/script|vercel.app/)
  const available = productGraph(backend, { ...current, stock: 5 })['@graph'].find(node => node['@type'] === 'Product')
  const feed = load('@/features/catalog/google-feed').generateGoogleFeed([{ ...current, stock: 5 }], origin)
  assert.match(feed, /<g:sale_price>179.99 UAH<\/g:sale_price>/)
  assert.equal(available.offers.price, 179.99)
  assert.equal(available.offers.availability, 'https://schema.org/InStock')
})

test("category JSON-LD describes only displayed models and keeps backend breadcrumbs", () => {
  const { categoryGraph } = sourceLoader()('@/lib/seo/structured-data')
  const current = category('trees')
  const result = categoryGraph({ '@graph': [
    { '@type': 'BreadcrumbList', itemListElement: [{ item: 'https://preview.vercel.app/' }] },
    { '@type': 'CollectionPage', mainEntity: { numberOfItems: 999 } },
  ] }, current, [product(1)], 2)
  const page = result['@graph'].find(node => node['@type'] === 'CollectionPage')
  assert.equal(page.url, `${origin}/catalog/trees?page=2`)
  assert.equal(page.mainEntity.numberOfItems, 1)
  assert.equal(page.mainEntity.itemListElement[0].position, 25)
  assert.equal(result['@graph'][0].itemListElement[0].item, `${origin}/`)
})

test("home graph omits backend medical claims and shares its FAQ with visible content", () => {
  const { homeGraph, shopFaq } = sourceLoader()('@/lib/seo/home')
  const result = homeGraph({ '@graph': [
    { '@type': 'FAQPage', mainEntity: [{ name: 'Hypoallergenic claim' }] },
    { '@type': 'OnlineStore', paymentAccepted: 'Invented' },
  ] })
  assert.equal(result['@graph'].filter(node => node['@type'] === 'FAQPage').length, 1)
  const faq = result['@graph'].find(node => node['@type'] === 'FAQPage')
  assert.equal(faq.mainEntity.length, shopFaq.length)
  assert.deepEqual(faq.mainEntity.map(node => node.acceptedAnswer.text), shopFaq.map(node => node.answer))
  assert.doesNotMatch(JSON.stringify(result), /Hypoallergenic|Invented/)
})

test("robots allows search and AI crawlers while private routes return noindex headers", async () => {
  const load = sourceLoader()
  const robots = load('@/app/robots').default()
  assert.equal(robots.sitemap, `${origin}/sitemap.xml`)
  for (const agent of ['Googlebot', 'Bingbot', 'OAI-SearchBot', 'GPTBot', 'ChatGPT-User', 'PerplexityBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended']) {
    assert.ok(robots.rules[0].userAgent.includes(agent))
  }
  for (const path of ['/api', '/admin', '/cart', '/checkout', '/payment-result']) assert.ok(robots.rules[0].disallow.includes(path))
  const headers = await load('@next-config').default.headers()
  assert.ok(headers.every(rule => rule.headers[0].value === 'noindex, nofollow'))
  assert.equal(headers.some(rule => rule.source === '/'), false)
})

test("sitemap contains all active SKU URLs with valid lastmod and survives API failure", async () => {
  const items = Array.from({ length: 105 }, (_, i) => product(i, { updatedAt: i === 0 ? 'invalid' : '2026-01-01T00:00:00Z' }))
  const api = storefrontApi([category('trees')], [...items, product(999, { isActive: false })])
  const load = sourceLoader(api)
  const result = await load('@/app/sitemap').default()
  const products = result.filter(node => node.url.includes('/product/'))
  assert.equal(products.length, 105)
  assert.equal(products[0].lastModified, undefined)
  assert.equal(products[1].lastModified, '2026-01-01T00:00:00.000Z')
  assert.ok(result.every(node => node.url.startsWith(origin)))
  const offline = sourceLoader({ fetch: async () => { throw new Error('offline') } })
  const fallback = await offline('@/app/sitemap').default()
  assert.equal(fallback.length, 6)
})

test("product attributes and delivery content exist in server-rendered HTML before tab clicks", () => {
  const load = sourceLoader({ overrides: { '@/components/cart/CartContext': { useCart: () => ({ addItem() {}, items: [] }) } } })
  const html = renderStorefront(load, load('@/components/product/ProductDetails').ProductDetails, {
    product: product(1, { attributes: '{"Довжина":"200 м"}', description: 'Опис товару' }),
  })
  assert.match(html, /200 м/)
  assert.match(html, /Доставка Новою Поштою/)
  assert.match(html, /Опис товару/)
  assert.doesNotMatch(html, /гіпоалергенна|Пожежобезпечність|Служба 10\+/)
})

test("duplicate product SEO fields remain unique through the SKU suffix within length limits", () => {
  const { productMetadataText } = sourceLoader()('@/lib/seo/metadata')
  const template = { metaTitle: '<b>Ялинка &amp; декор</b> '.repeat(60), metaDescription: '<p>Спільний &quot;опис&quot;</p> '.repeat(80) }
  const a = productMetadataText(product(1, { ...template, sku: 'JD-0001' }))
  const b = productMetadataText(product(2, { ...template, sku: 'JD-0002' }))
  assert.doesNotMatch(a.title + a.description, /<[^>]*>|&(?:amp|quot);/)
  assert.notEqual(a.title, b.title)
  assert.notEqual(a.description, b.description)
  assert.ok(Array.from(a.title).length <= 150)
  assert.ok(Array.from(a.description).length <= 160)
  assert.match(a.title, /JD-0001 — Jingle Decor$/)
  assert.match(a.description, /Артикул: JD-0001\.$/)
  const { absoluteImage } = sourceLoader()('@/lib/seo/structured-data')
  assert.equal(absoluteImage('http://localhost:5000/uploads/image.jpg'), '')
  assert.equal(absoluteImage('javascript:alert(1)'), '')
})

test("legacy category URLs redirect before SSR with a permanent status and preserved filters", async () => {
  const load = sourceLoader({ overrides: {
    'next/server': { NextResponse: { next: () => ({ status: 200 }), redirect: (url, status = 307) => ({ status, location: String(url) }) } },
    '@/lib/api/categories': { getCategories: async () => [category('trees')] },
  } })
  const url = new URL(`${origin}/?category=trees&page=2&minPrice=100`)
  url.clone = () => new URL(url)
  const result = await load('@/proxy').proxy({ nextUrl: url })
  assert.equal(result.status, 308)
  const target = new URL(result.location)
  assert.equal(target.pathname, '/catalog/trees')
  assert.equal(target.searchParams.has('category'), false)
  assert.equal(target.searchParams.get('page'), '2')
  assert.equal(target.searchParams.get('minPrice'), '100')
})

const reviewProductId = "11111111-1111-4111-8111-111111111111"
function review(index, extra = {}) {
  return { id: `review-${index}`, productId: reviewProductId, authorName: `Автор ${index}`, rating: 5,
    comment: `Реальний відгук ${index}`, status: "Approved", createdAt: "2026-11-26T10:00:00Z", ...extra }
}

test("public review adapter exposes only approved reviews for the current SKU and strips internal comments", async () => {
  const calls = []
  const load = sourceLoader({ fetch: async (url, init) => {
    calls.push({ url, init })
    return Response.json({ productId: reviewProductId, totalReviews: 2, averageRating: 4.5, ratingDistribution: { 4: 1, 5: 1 }, reviews: [
      review(1, { rating: 4, adminComment: "Внутрішня інформація" }), review(2),
      review(3, { status: "Pending" }), review(4, { status: "Rejected" }), review(5, { productId: "other" }),
      review(6, { rating: 10 }), review(7, { createdAt: "invalid" }),
    ] })
  } })
  const summary = await load("@/lib/api/reviews").getProductReviews(reviewProductId)
  assert.equal(calls[0].url, `https://api.test/api/reviews/product/${reviewProductId}`)
  assert.equal(calls[0].init.cache, "no-store")
  assert.equal(summary.totalReviews, 2)
  assert.equal(summary.averageRating, 4.5)
  assert.deepEqual(summary.reviews.map(item => item.id), ["review-1", "review-2"])
  assert.doesNotMatch(JSON.stringify(summary), /adminComment|Внутрішня/)
  assert.equal(summary.ratingDistribution[4], 1)
})

test("empty approved reviews override stale product statistics; fallback validates real product fields", () => {
  const { approvedReviewSummary, fallbackReviewSummary } = sourceLoader()("@/features/reviews/review-utils")
  assert.equal(approvedReviewSummary({ productId: reviewProductId, totalReviews: 8, averageRating: 5, reviews: [] }, reviewProductId).totalReviews, 0)
  for (const extra of [{}, { reviewCount: 0, averageRating: 5 }, { reviewCount: 2, averageRating: null }, { reviewCount: 2, averageRating: 6 }]) {
    assert.equal(fallbackReviewSummary(product(1, extra)).totalReviews, 0)
  }
  const summary = fallbackReviewSummary(product(1, { reviewCount: 2, averageRating: 4.5 }))
  assert.equal(summary.totalReviews, 2)
  assert.equal(summary.averageRating, 4.5)
})

test("product adapter retains backend review totals for API outage fallback", async () => {
  const load = sourceLoader(pagedApi([product(1, { reviewCount: 3, averageRating: 4.3 })]))
  const [current] = await load("@/lib/api/products").getProducts()
  assert.equal(current.reviewCount, 3)
  assert.equal(current.averageRating, 4.3)
})

test("reviews SSR and JSON-LD share the same approved ratings without fake or pending content", () => {
  const load = sourceLoader()
  const { approvedReviewSummary } = load("@/features/reviews/review-utils")
  const summary = approvedReviewSummary({ productId: reviewProductId, totalReviews: 2, averageRating: 4.5, reviews: [review(1, { rating: 4, comment: "Гарна якість </script>" }), review(2)] }, reviewProductId)
  const current = product(1, { id: reviewProductId })
  const { productGraph, serializeJsonLd } = load("@/lib/seo/structured-data")
  const graph = productGraph({ "@type": "Product", aggregateRating: { reviewCount: 999, ratingValue: 5 } }, current, undefined, summary)
  const nodes = graph["@graph"].filter(node => node["@type"] === "Product")
  assert.equal(nodes.length, 1)
  assert.equal(nodes[0].aggregateRating.reviewCount, 2)
  assert.equal(nodes[0].aggregateRating.ratingValue, 4.5)
  assert.equal(nodes[0].review.length, 2)
  assert.equal(nodes[0].review[0].reviewRating.ratingValue, 4)
  assert.doesNotMatch(serializeJsonLd(graph), /<\/script>/)
  const html = renderToStaticMarkup(React.createElement(load("@/components/product/ProductReviews").ProductReviews, { summary }))
  assert.match(html, /Відгуки покупців|4.5 \/ 5/)
  assert.match(html, /Автор 1/)
  assert.match(html, /Гарна якість/)
  assert.match(html, /<time dateTime="2026-11-26T10:00:00Z"/)
  assert.doesNotMatch(html, /98%|Перевірений покупець|Внутрішній коментар/)
  const empty = { productId: reviewProductId, reviews: [], totalReviews: 0, averageRating: 0 }
  assert.equal(productGraph(null, current, undefined, empty)["@graph"].find(node => node["@type"] === "Product").aggregateRating, undefined)
  const emptyHtml = renderToStaticMarkup(React.createElement(load("@/components/product/ProductReviews").ProductReviews, { summary: empty }))
  assert.match(emptyHtml, /Відгуків поки немає/)
  assert.doesNotMatch(emptyHtml, /0.0 \/ 5|4.8/)
})

test("public review submission validates the .NET DTO and preserves moderation and rate-limit responses", async () => {
  const sent = []
  let httpStatus = 201
  const load = sourceLoader({ fetch: async (_url, init) => {
    sent.push(JSON.parse(init.body))
    return httpStatus === 201 ? Response.json(review(1, { status: "Pending" }), { status: 201 }) : Response.json({ detail: "Забагато запитів" }, { status: httpStatus })
  } })
  const { POST } = load("@/app/api/reviews/route")
  const request = body => new Request(`${origin}/api/reviews`, { method: "POST", body: JSON.stringify(body) })
  const valid = { productId: reviewProductId, authorName: " Олена ", rating: 4, comment: " Хороший товар ", honeypot: "" }
  for (const invalid of [{ ...valid, rating: 0 }, { ...valid, rating: 6 }, { ...valid, rating: 2.5 }, { ...valid, authorName: "Я" }, { ...valid, comment: "x".repeat(501) }, { ...valid, productId: "invalid" }, { ...valid, pros: "x".repeat(251) }]) {
    assert.equal((await POST(request(invalid))).status, 400)
  }
  assert.equal(sent.length, 0)
  const response = await POST(request(valid))
  assert.equal(response.status, 201)
  assert.equal((await response.json()).status, "Pending")
  assert.equal(sent[0].authorName, "Олена")
  assert.equal(sent[0].comment, "Хороший товар")
  httpStatus = 429
  assert.equal((await POST(request(valid))).status, 429)
})

test("review form confirms moderation without publishing the pending review", async () => {
  const hooks = hookState()
  const submissions = []
  const load = sourceLoader({ overrides: { react: hooks.react, "@/lib/api/reviews-client": { submitReview: async input => { submissions.push(input); return review(1, { status: "Pending" }) } } } })
  const Form = load("@/features/reviews/ReviewForm").ReviewForm
  const render = () => elementNodes(hooks.render(Form, { productId: reviewProductId }))
  let nodes = render()
  nodes.find(node => node.props?.children === "Залишити відгук").props.onClick()
  nodes = render()
  const previousFormData = globalThis.FormData
  globalThis.FormData = class { get(name) { return { authorName: "Олена", rating: "4", comment: "Чудово", honeypot: "" }[name] ?? "" } }
  try { await nodes.find(node => node.type === "form").props.onSubmit({ preventDefault() {}, currentTarget: {} }) }
  finally { globalThis.FormData = previousFormData }
  assert.equal(submissions.length, 1)
  assert.equal(submissions[0].productId, reviewProductId)
  assert.equal(submissions[0].rating, 4)
  nodes = render()
  assert.ok(nodes.some(node => node.props?.role === "status" && node.props.children.includes("після перевірки модератором")))
  assert.equal(nodes.some(node => node.type === "form"), false)
})

test("admin reviews walk all API pages even when the server caps page size and join SKU links", async () => {
  const items = Array.from({ length: 105 }, (_, i) => review(i))
  const calls = []
  const load = sourceLoader({ overrides: {
    "@/lib/api/admin/auth": { adminApiFetch: async path => {
      const url = new URL(path, "https://api.test/")
      calls.push(url)
      const page = Number(url.searchParams.get("page"))
      return items.slice((page - 1) * 50, page * 50)
    } },
    "@/lib/api/admin/products": { getAdminProduct: async id => ({ id, name: "Гірлянда", sku: "JD-0457", slug: "usb-5m" }) },
  } })
  const api = load("@/lib/api/admin/reviews-server")
  assert.equal((await api.getAdminReviews("Pending")).length, 105)
  assert.equal(calls.length, 4)
  assert.ok(calls.every(url => url.searchParams.get("status") === "Pending" && url.searchParams.get("pageSize") === "100"))
  const joined = await api.getAdminReviewsWithProducts()
  assert.equal(joined[0].productSlug, "usb-5m")
  assert.equal(joined[0].productSku, "JD-0457")
  const { filterAdminReviews } = load("@/features/reviews/review-utils")
  assert.equal(filterAdminReviews(joined, "Approved", " jd-0457 ").length, 105)
  assert.equal(filterAdminReviews(joined, "Pending", "").length, 0)
  assert.equal(filterAdminReviews(joined, "all", "автор 104").length, 1)
})

test("moderation routes enforce authentication, validate statuses and invalidate public pages", async () => {
  const mutations = [], paths = []
  let unauthorized = true
  const load = sourceLoader({ overrides: {
    "@/lib/api/admin/auth": { requireAdminApiAccess: async () => unauthorized ? Response.json({}, { status: 401 }) : null },
    "@/lib/api/admin/reviews-server": {
      setAdminReviewStatus: async (id, input) => { mutations.push({ id, input }); return { ...review(1), id, status: input.status } },
      deleteAdminReview: async id => mutations.push({ delete: id }),
      getAdminReview: async id => review(id),
    },
    "next/cache": { revalidatePath: (...args) => paths.push(args) },
  } })
  const { PATCH } = load("@/app/api/admin/reviews/[id]/status/route")
  const { DELETE, GET } = load("@/app/api/admin/reviews/[id]/route")
  const context = { params: Promise.resolve({ id: "review-1" }) }
  const request = status => new Request(`${origin}/api/admin/reviews/review-1/status`, { method: "PATCH", body: JSON.stringify({ status }) })
  assert.equal((await PATCH(request("Approved"), context)).status, 401)
  assert.equal((await DELETE(request("Approved"), context)).status, 401)
  assert.equal(mutations.length, 0)
  unauthorized = false
  assert.equal((await PATCH(request("invalid"), context)).status, 400)
  for (const status of ["Approved", "Rejected"]) assert.equal((await PATCH(request(status), context)).status, 200)
  assert.deepEqual(mutations.map(item => item.input.status), ["Approved", "Rejected"])
  assert.equal((await GET(request("Approved"), context)).status, 200)
  assert.equal((await DELETE(request("Approved"), context)).status, 204)
  assert.ok(paths.some(([path, type]) => path === "/product/[slug]" && type === "page"))
  assert.ok(paths.some(([path, type]) => path === "/admin" && type === "layout"))
})

test("admin review actions update status immediately, preserve SKU details and confirm deletion", async () => {
  const hooks = hookState(), deleted = []
  let confirmed = false, refreshes = 0
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window")
  Object.defineProperty(globalThis, "window", { configurable: true, value: { confirm: () => confirmed } })
  try {
    const load = sourceLoader({ overrides: {
      react: hooks.react, "next/navigation": { useRouter: () => ({ refresh: () => refreshes++ }) },
      "@/lib/api/admin/reviews": { updateReviewStatus: async (id, status) => ({ ...review(1), id, status }), removeReview: async id => deleted.push(id) },
    } })
    const Admin = load("@/components/admin/reviews/ReviewsAdmin").ReviewsAdmin
    const props = { initialReviews: [review(1, { status: "Pending", productSku: "JD-0457", productSlug: "usb-5m" })] }
    const render = () => elementNodes(hooks.render(Admin, props))
    let nodes = render()
    await nodes.find(node => node.props?.children === "Одобрити").props.onClick()
    nodes = render()
    assert.equal(nodes.find(node => node.props?.children === "Одобрити").props.disabled, true)
    assert.ok(nodes.some(node => node.props?.href === "/product/usb-5m"))
    assert.ok(nodes.some(node => node.props?.role === "status"))
    await nodes.find(node => node.props?.children === "Видалити").props.onClick()
    assert.equal(deleted.length, 0)
    confirmed = true
    await nodes.find(node => node.props?.children === "Видалити").props.onClick()
    assert.equal(deleted.length, 1)
    assert.equal(refreshes, 2)
    assert.equal(render().some(node => node.type === "table"), false)
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow)
    else delete globalThis.window
  }
})

test("admin navigation includes the reviews link and exact pending badge", () => {
  const load = sourceLoader()
  const Navigation = load("@/components/admin/AdminNavigation").AdminNavigation
  const html = renderToStaticMarkup(React.createElement(Navigation, { name: "Admin", pendingReviews: 105 }))
  assert.match(html, /href="\/admin\/reviews"/)
  assert.match(html, /105 на модерації/)
  const empty = renderToStaticMarkup(React.createElement(Navigation, { name: "Admin", pendingReviews: 0 }))
  assert.doesNotMatch(empty, /0 на модерації/)
})

test("review averages preserve .NET rounding and reject inconsistent nonempty summaries", () => {
  const { approvedReviewSummary } = sourceLoader()("@/features/reviews/review-utils")
  const reviews = [4, 4, 4, 5].map((rating, index) => review(index, { rating }))
  // .NET's midpoint rounding differs from JavaScript's Math.round for 4.25.
  assert.equal(approvedReviewSummary({ productId: reviewProductId, totalReviews: 4, averageRating: 4.2, reviews }, reviewProductId).averageRating, 4.2)
  assert.throws(() => approvedReviewSummary({ productId: reviewProductId, totalReviews: 99, averageRating: 5, reviews }, reviewProductId), /Invalid reviews statistics/)
})

test("single-size products hide redundant option controls without leaving an empty wrapper", () => {
  const load = sourceLoader({ overrides: { "@/components/cart/CartContext": { useCart: () => ({ addItem() {}, items: [] }) } } })
  const Controls = load("@/features/product/ProductOptionControls").ProductOptionControls
  const wreath = product(1, { name: "Литий засніжений вінок 40 см у золотому дизайні", categoryId: "wreaths" })
  for (const compact of [false, true]) {
    assert.equal(renderToStaticMarkup(React.createElement(Controls, { product: wreath, options: [wreath], compact })), "")
  }
  const Card = load("@/components/catalog/ProductCard").ProductCard
  const html = renderStorefront(load, Card, { product: wreath, productOptions: [wreath] })
  assert.doesNotMatch(html, /aria-label="Розмір 40 см"|aria-label="Вибір:/)
  assert.match(html, /До кошика/)
  assert.match(html, /Купити зараз/)
  const tree = product(2, { name: "Лита ялинка Мрія зелена 1.8 м", categoryId: "trees" })
  const treeHtml = renderStorefront(load, Card, { product: tree })
  assert.doesNotMatch(treeHtml, /aria-label="Вибір висоти"/)
})

test("option controls show only dimensions or colors that have an actual choice", () => {
  const load = sourceLoader()
  const Controls = load("@/features/product/ProductOptionControls").ProductOptionControls
  const base = product(1, { name: "Гірлянда USB 5 метрів біла", categoryId: "lights" })
  const blue = product(2, { name: "Гірлянда USB 5 метрів синя", categoryId: "lights" })
  const long = product(3, { name: "Гірлянда USB 10 метрів біла", categoryId: "lights" })
  const colors = renderToStaticMarkup(React.createElement(Controls, { product: base, options: [base, blue], compact: true }))
  assert.match(colors, /aria-label="Вибір кольору"/)
  assert.doesNotMatch(colors, /aria-label="Вибір: довжина"/)
  const lengths = renderToStaticMarkup(React.createElement(Controls, { product: base, options: [base, long], compact: true }))
  assert.match(lengths, /aria-label="Довжина 5 м"/)
  assert.match(lengths, /aria-label="Довжина 10 м"/)
  assert.doesNotMatch(lengths, /aria-label="Вибір кольору"/)
})
