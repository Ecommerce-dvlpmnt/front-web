import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { Script } from "node:vm"
import test from "node:test"
import ts from "typescript"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const nativeRequire = createRequire(import.meta.url)

function loadSource(fetch) {
  const cache = new Map()
  function load(name) {
    if (!name.startsWith("@/")) return nativeRequire(name)
    if (cache.has(name)) return cache.get(name).exports
    const filename = path.join(root, "src", `${name.slice(2)}.ts`)
    const code = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
    }).outputText
    const loadedModule = { exports: {} }
    cache.set(name, loadedModule)
    const run = new Script(`(function(require,module,exports,process,fetch){${code}\n})`, { filename }).runInThisContext()
    run(load, loadedModule, loadedModule.exports, { env: { API_URL: "https://backend.example/api" } }, fetch)
    return loadedModule.exports
  }
  return load
}

test("Monobank proxies use the server API base and do not cache payment data", async () => {
  const calls = []
  const load = loadSource(async (url, init) => {
    calls.push({ url, init })
    return new Response(JSON.stringify({ pageUrl: "https://pay.monobank.ua/invoice" }), { headers: { "Content-Type": "application/json" } })
  })
  const route = load("@/app/api/payments/monobank/create/[publicId]/route")
  const response = await route.POST(new Request("https://shop.example"), { params: Promise.resolve({ publicId: "a/b" }) })
  assert.equal(response.status, 200)
  assert.equal(calls[0].url, "https://backend.example/api/payments/monobank/create/a%2Fb")
  assert.equal(calls[0].init.method, "POST")
  assert.equal(calls[0].init.cache, "no-store")
})

test("Monobank status and receipt routes keep no-store and serve a PDF attachment", async () => {
  const calls = []
  const load = loadSource(async (url, init) => {
    calls.push({ url, init })
    return new Response(url.endsWith("/pdf") ? "%PDF-test" : JSON.stringify({ paymentStatus: "Paid" }), {
      headers: { "Content-Type": url.endsWith("/pdf") ? "application/pdf" : "application/json" },
    })
  })
  const statusRoute = load("@/app/api/payments/monobank/order-status/[publicId]/route")
  const receiptRoute = load("@/app/api/payments/monobank/fiscal-checks/[invoiceId]/pdf/route")
  const status = await statusRoute.GET(new Request("https://shop.example"), { params: Promise.resolve({ publicId: "order-1" }) })
  const receipt = await receiptRoute.GET(new Request("https://shop.example"), { params: Promise.resolve({ invoiceId: "invoice-1" }) })
  assert.equal((await status.json()).paymentStatus, "Paid")
  assert.equal(receipt.headers.get("Content-Disposition"), "attachment; filename=receipt.pdf")
  assert.equal(receipt.headers.get("Content-Type"), "application/pdf")
  assert.equal(calls[0].url, "https://backend.example/api/payments/monobank/order-status/order-1")
  assert.equal(calls[1].url, "https://backend.example/api/payments/monobank/fiscal-checks/invoice-1/pdf")
  assert.ok(calls.every(call => call.init.cache === "no-store"))
})

test("invoice client accepts HTTPS links and rejects unsafe or missing page URLs", async () => {
  const ok = loadSource(async () => Response.json({ pageUrl: "https://pay.monobank.ua/invoice" }))("@/lib/api/monobank")
  assert.equal(await ok.createMonobankInvoice("public-id"), "https://pay.monobank.ua/invoice")
  const unsafe = loadSource(async () => Response.json({ pageUrl: "javascript:alert(1)" }))("@/lib/api/monobank")
  await assert.rejects(unsafe.createMonobankInvoice("public-id"), /некоректне посилання/)
})

test("card choice creates an Online order using the backend enum", async () => {
  let sentPaymentMethod
  const orders = loadSource(async (_url, init) => {
    sentPaymentMethod = JSON.parse(init.body).paymentMethod
    return Response.json({ publicId: "order-public-id", orderNumber: 105, totalPrice: 3450, createdAt: "2026-11-25T12:00:00Z" }, { status: 201 })
  })("@/lib/api/orders")
  await orders.createOrder({
    customerFirstName: "Іван", customerLastName: "Петренко", customerPhone: "+380501234567",
    customerEmail: "", customerComment: "", deliveryType: "Warehouse",
    deliveryCityRef: "city", deliveryCityName: "Київ", deliveryWarehouseRef: "branch",
    deliveryWarehouseName: "Відділення 1", paymentMethod: "Monobank",
    items: [{ productId: "e7d1219b-703d-4f4c-896a-bd22db28f5ad", quantity: 1 }],
  }, { analyticsItems: [] })
  assert.equal(sentPaymentMethod, "Online")
})
