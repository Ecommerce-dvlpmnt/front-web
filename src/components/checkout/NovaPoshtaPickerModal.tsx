"use client"

import dynamic from "next/dynamic"
import { useMemo, useState } from "react"
import { X } from "lucide-react"
import type { NovaPoshtaWarehouse } from "./NovaPoshtaMap"

const NovaPoshtaMap = dynamic(() => import("./NovaPoshtaMap"), { ssr: false, loading: () => <div className="grid h-full min-h-64 place-items-center bg-muted text-sm text-muted-foreground">Завантаження мапи…</div> })

export function NovaPoshtaPickerModal({ warehouses, type, selectedRef, onSelect, onClose }: {
  warehouses: NovaPoshtaWarehouse[]; type: "Warehouse" | "Postomat"; selectedRef: string; onSelect: (warehouse: NovaPoshtaWarehouse) => void; onClose: () => void
}) {
  const [query, setQuery] = useState("")
  const [focusedRef, setFocusedRef] = useState(selectedRef)
  const [mobileMap, setMobileMap] = useState(false)
  const filtered = useMemo(() => warehouses.filter(item => {
    const postomat = item.CategoryOfWarehouse?.toLowerCase().includes("postomat") || item.Description.toLowerCase().includes("поштомат")
    const text = `${item.Description} ${item.Number ?? ""} ${item.ShortAddress ?? ""}`.toLocaleLowerCase("uk")
    return (type === "Postomat" ? postomat : !postomat) && text.includes(query.trim().toLocaleLowerCase("uk"))
  }), [warehouses, type, query])
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-0 backdrop-blur-sm sm:p-5" role="dialog" aria-modal="true" aria-labelledby="np-modal-title" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <div className="flex h-full w-full flex-col overflow-hidden border border-border bg-card text-card-foreground shadow-2xl sm:h-[min(88vh,850px)] sm:max-w-6xl sm:rounded-2xl">
      <header className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Нова Пошта · {type === "Postomat" ? "Поштомати" : "Відділення"}</p><h2 id="np-modal-title" className="mt-1 text-lg font-semibold">Оберіть пункт на мапі</h2></div><button type="button" onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-muted" aria-label="Закрити"><X className="size-5" /></button></header>
      <div className="grid min-h-0 flex-1 md:grid-cols-[minmax(19rem,0.8fr)_minmax(0,1.5fr)]">
        <div className={`min-h-0 flex-col border-r border-border ${mobileMap ? "hidden md:flex" : "flex"}`}><div className="border-b border-border p-4"><label className="text-sm font-medium" htmlFor="np-map-search">Пошук пункту</label><input id="np-map-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Номер або адреса" className="mt-2 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /><button type="button" className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-sm md:hidden" onClick={() => setMobileMap(true)}>Показати мапу</button></div>
          <div className="min-h-0 flex-1 overflow-auto">{filtered.length ? filtered.map(item => <button key={item.Ref} type="button" onClick={() => setFocusedRef(item.Ref)} className={`block w-full border-b border-border p-4 text-left hover:bg-muted ${focusedRef === item.Ref ? "bg-muted" : ""}`}><span className="text-xs font-semibold uppercase tracking-wide text-primary">{type === "Postomat" ? "Поштомат" : "Відділення"}{item.Number ? ` №${item.Number}` : ""}</span><span className="mt-1 block text-sm">{item.ShortAddress || item.Description}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{item.Description}</span><span className="mt-3 inline-flex rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground" onClick={event => { event.stopPropagation(); onSelect(item) }}>Обрати</span></button>) : <p className="p-5 text-sm text-muted-foreground">{warehouses.length ? "За цим запитом нічого не знайдено." : "Точки не знайдено."}</p>}</div>
          <div className="border-t border-border p-3 md:hidden"><button type="button" className="w-full rounded-xl border border-border px-4 py-2 text-sm" onClick={onClose}>Закрити</button></div>
        </div><div className={`${mobileMap ? "block" : "hidden"} relative h-[65vh] min-h-64 md:block md:h-auto`}><NovaPoshtaMap warehouses={filtered} selectedRef={focusedRef} onSelect={onSelect} /><button type="button" className="absolute bottom-4 left-1/2 z-[500] -translate-x-1/2 rounded-lg border border-border bg-card px-4 py-2 text-sm shadow md:hidden" onClick={() => setMobileMap(false)}>До списку</button></div>
      </div>
    </div>
  </div>
}
