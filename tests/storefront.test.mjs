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
  const item = product(1, { supplierId: "supplier-1", categoryId: "category-1", sku: "TREE-1", dropPrice: 100 })
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
  assert.match(entries[0], /Ялинка &amp; &lt;декор&gt; &quot;Свято&quot;/)
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

test("storefront fetches exactly one 24-product page per request", async () => {
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

test("home and category pages load only 24 matching items, including all descendant levels", async () => {
  const categories = [category("root"), category("child", "root"), category("grandchild", "child"), category("deep", "grandchild"), category("other")]
  const items = Array.from({ length: 100 }, (_, i) => product(i, { categoryId: i % 2 ? "deep" : "other" }))
  for (const slug of [undefined, "root", "deep"]) {
    const api = storefrontApi(categories, items)
    const load = sourceLoader(api)
    const tree = await load("@/features/catalog/StorefrontCatalog").StorefrontCatalog({ pageNumber: 2, searchQuery: "", categorySlug: slug })
    assert.equal(api.productCalls.length, 1)
    assert.equal(api.productCalls[0].get("PageNumber"), "2")
    assert.equal(api.productCalls[0].get("PageSize"), "24")
    assert.equal(tree.props.productPage.items.length, 24)
    assert.equal(tree.props.productPage.totalCount, slug ? 50 : 100)
    if (slug === "root") assert.deepEqual(api.productCalls[0].getAll("CategoryIds"), ["child", "deep", "grandchild", "root"])
    if (slug === "deep") assert.equal(api.productCalls[0].get("CategoryId"), "deep")
    if (slug) assert.ok(tree.props.productPage.items.every(item => item.categoryId === "deep"))
  }
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
  assert.match(html, /Товарів: 0/)
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
  const base = product(1, { name: "Штучна ялинка Мрія зелена 1,8 м", categoryId: "trees", sku: "BASE", price: 200 })
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
  assert.equal(lists.length, 1, "PDP and metadata must not walk catalog pages")
  const query = new URL(lists[0].url).searchParams
  assert.equal(query.get("Search"), "Штучна ялинка Мрія зелена")
  assert.equal(query.get("Summary"), "true")
  assert.equal(query.get("PageSize"), "24")
  assert.equal(query.get("PageNumber"), "1")
  assert.equal(query.get("CategoryId"), "trees")
  assert.equal(lists[0].init.next.revalidate, 300)
  const nodes = elementNodes(tree)
  const details = nodes.find(node => node.type === load("@/components/product/ProductDetails").ProductDetails)
  assert.equal(details.key, base.id)
  assert.equal(details.props.product.id, base.id)
  assert.deepEqual(details.props.heightVariants.map(variant => variant.id), [base.id, tall.id])
  assert.equal(metadata.alternates.canonical, `${origin}/product/${base.slug}`)
  const jsonLd = JSON.parse(nodes.find(node => node.type === "script").props.dangerouslySetInnerHTML.__html)
  assert.equal(jsonLd.offers.price, base.price)
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
  const blue = product(2, { name: "Гірлянда Роса 3 м синій", categoryId: "lights", sku: "B3", price: 250, oldPrice: null,
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
