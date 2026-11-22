"use client"

import dynamic from "next/dynamic"
import { useMemo, useState, useSyncExternalStore } from "react"
import { X } from "lucide-react"
import type { NovaPoshtaWarehouse } from "./NovaPoshtaMap"

const NovaPoshtaMap = dynamic(() => import("./NovaPoshtaMap"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full min-h-64 place-items-center bg-muted text-sm text-muted-foreground">
      Завантаження мапи…
    </div>
  ),
})

// Совпадает с брейкпоинтом md в Tailwind (48rem = 768px).
const DESKTOP_MEDIA_QUERY = "(min-width: 48rem)"
const INITIAL_BATCH_SIZE = 40
const BATCH_INCREMENT = 40

function subscribeToDesktopQuery(onChange: () => void) {
  const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY)
  mediaQuery.addEventListener("change", onChange)
  return () => mediaQuery.removeEventListener("change", onChange)
}

// true — ширина экрана как у md и больше (список и карта видны одновременно).
// Значение обновляется при повороте устройства или изменении окна.
function useIsDesktop() {
  return useSyncExternalStore(
    subscribeToDesktopQuery,
    () => window.matchMedia(DESKTOP_MEDIA_QUERY).matches,
    () => false,
  )
}

export function NovaPoshtaPickerModal({
  warehouses,
  type,
  selectedRef,
  onSelect,
  onClose,
}: {
  warehouses: NovaPoshtaWarehouse[]
  type: "Warehouse" | "Postomat"
  selectedRef: string
  onSelect: (warehouse: NovaPoshtaWarehouse) => void
  onClose: () => void
}) {
  const isDesktop = useIsDesktop()
  const [query, setQuery] = useState("")
  const [focusedRef, setFocusedRef] = useState(selectedRef)
  const [mobileMap, setMobileMap] = useState(false)
  const [paginationState, setPaginationState] = useState({
    key: `${type}:`,
    count: INITIAL_BATCH_SIZE,
  })

  // Карту монтируем только когда она впервые становится видимой:
  // Leaflet должен измерить настоящий размер контейнера, а не 0×0.
  // После первого показа карта остаётся смонтированной, чтобы не терять zoom.
  const [hasShownMobileMap, setHasShownMobileMap] = useState(false)
  const shouldRenderMap = isDesktop || hasShownMobileMap

  const showMobileMap = () => {
    setMobileMap(true)
    setHasShownMobileMap(true)
  }

  // Надшвидка фільтрація по типу та пошуковому запиту без зайвих алокацій
  const filtered = useMemo(() => {
    const isTargetPostomat = type === "Postomat"
    const trimmed = query.trim().toLowerCase()

    if (!trimmed) {
      return warehouses.filter(item => {
        const isPostomat =
          item.CategoryOfWarehouse?.toLowerCase().includes("postomat") ||
          item.Description.toLowerCase().includes("поштомат")
        return isTargetPostomat ? isPostomat : !isPostomat
      })
    }

    return warehouses.filter(item => {
      const isPostomat =
        item.CategoryOfWarehouse?.toLowerCase().includes("postomat") ||
        item.Description.toLowerCase().includes("поштомат")
      if (isTargetPostomat ? !isPostomat : isPostomat) return false

      if (item.Number && item.Number.includes(trimmed)) return true
      if (item.Description.toLowerCase().includes(trimmed)) return true
      if (item.ShortAddress && item.ShortAddress.toLowerCase().includes(trimmed)) return true
      return false
    })
  }, [warehouses, type, query])

  // Ключ для автоматичного сброса пагинации при смене типа или поисковой строки
  const filterKey = `${type}:${query.trim()}`
  const visibleCount = paginationState.key === filterKey ? paginationState.count : INITIAL_BATCH_SIZE

  // Знаходимо об'єкт вибраного/клікнутого на мапі пункту для миттєвої закріпленої плашки
  const focusedItem = useMemo(
    () => (focusedRef ? warehouses.find(item => item.Ref === focusedRef) ?? null : null),
    [warehouses, focusedRef],
  )

  // Список завжди рендерить тільки легку порцію (30-40 шт), усуваючи зависання та прокрутку через 4000 DOM-вузлів
  const visibleItems = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  )

  const loadMore = (amount: number) => {
    setPaginationState(prev => {
      const current = prev.key === filterKey ? prev.count : INITIAL_BATCH_SIZE
      return {
        key: filterKey,
        count: Math.min(current + amount, filtered.length),
      }
    })
  }

  // Подгрузка следующей порции элементов при прокрутке списка (infinite scroll)
  const handleListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollTop + clientHeight >= scrollHeight - 300) {
      if (visibleCount < filtered.length) {
        loadMore(BATCH_INCREMENT)
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-0 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="np-modal-title"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="flex h-full w-full min-w-0 max-w-full flex-col overflow-hidden border border-border bg-card text-card-foreground shadow-2xl sm:h-[min(88vh,850px)] sm:max-w-6xl sm:rounded-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Нова Пошта · {type === "Postomat" ? "Поштомати" : "Відділення"}
            </p>
            <h2 id="np-modal-title" className="mt-1 text-lg font-semibold">
              Оберіть пункт на мапі
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-muted-foreground hover:bg-muted"
            aria-label="Закрити"
          >
            <X className="size-5" />
          </button>
        </header>

        {/* grid-cols-1 = minmax(0, 1fr): колонка может сжиматься до ширины экрана */}
        <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)] md:grid-cols-[minmax(19rem,0.8fr)_minmax(0,1.5fr)]">
          <div
            className={`min-h-0 min-w-0 flex-col border-border md:border-r ${mobileMap ? "hidden md:flex" : "flex"}`}
          >
            <div className="border-b border-border p-4">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-medium" htmlFor="np-map-search">
                  Пошук пункту
                </label>
                <span className="text-xs text-muted-foreground">
                  {filtered.length > 0
                    ? `Знайдено: ${filtered.length}`
                    : warehouses.length > 0
                      ? "Не знайдено"
                      : ""}
                </span>
              </div>
              <div className="relative mt-2">
                <input
                  id="np-map-search"
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="Номер або адреса (напр. 15)"
                  className="h-10 w-full min-w-0 rounded-xl border border-input bg-background pl-3 pr-8 text-base outline-none focus:ring-2 focus:ring-ring md:text-sm"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Очистити пошук"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
              <button
                type="button"
                className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-sm md:hidden"
                onClick={showMobileMap}
              >
                Показати мапу
              </button>
            </div>

            {/* Закріплена картка вибраного на мапі пункту: миттєва поява 0мс без зависання */}
            {focusedItem && (
              <div className="border-b border-[#D4AF37]/50 bg-gradient-to-r from-[#D4AF37]/15 to-[#D4AF37]/5 p-4 shadow-xs shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8C5E14] dark:text-[#F3D078]">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    Вибрано на мапі:
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    {type === "Postomat" ? "Поштомат" : "Відділення"} №{focusedItem.Number || "—"}
                  </span>
                </div>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {focusedItem.ShortAddress || focusedItem.Description}
                </p>
                {focusedItem.ShortAddress && focusedItem.ShortAddress !== focusedItem.Description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {focusedItem.Description}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => onSelect(focusedItem)}
                  className={`mt-3 w-full rounded-full py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-2 ${
                    type === "Postomat" ? "bg-[#1B4332] hover:bg-[#245942]" : "bg-[#181512] hover:bg-[#2A231D]"
                  }`}
                >
                  ✓ Обрати цей {type === "Postomat" ? "поштомат" : "пункт"}
                </button>
              </div>
            )}

            <div
              onScroll={handleListScroll}
              className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
            >
              {visibleItems.length ? (
                <>
                  {visibleItems.map(item => (
                    <button
                      key={item.Ref}
                      id={`np-modal-item-${item.Ref}`}
                      type="button"
                      onClick={() => setFocusedRef(item.Ref)}
                      className={`block w-full min-w-0 border-b border-border p-4 text-left transition-colors hover:bg-muted/80 ${
                        focusedRef === item.Ref ? "bg-muted/90 border-l-4 border-l-[#D4AF37]" : ""
                      }`}
                    >
                      <span className={`text-xs font-semibold uppercase tracking-wide ${
                        type === "Postomat" ? "text-emerald-700 dark:text-emerald-400" : "text-[#8C5E14] dark:text-[#F3D078]"
                      }`}>
                        {type === "Postomat" ? "Поштомат" : "Відділення"}
                        {item.Number ? ` №${item.Number}` : ""}
                      </span>
                      <span className="mt-1 block break-words text-sm font-medium">
                        {item.ShortAddress || item.Description}
                      </span>
                      <span className="mt-1 block break-words text-xs text-muted-foreground">
                        {item.Description}
                      </span>
                      <span
                        className={`mt-3 inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-all active:scale-95 cursor-pointer ${
                          type === "Postomat"
                            ? "bg-[#1B4332] hover:bg-[#245942]"
                            : "bg-[#181512] hover:bg-[#2A231D]"
                        }`}
                        onClick={event => {
                          event.stopPropagation()
                          onSelect(item)
                        }}
                      >
                        Обрати
                      </span>
                    </button>
                  ))}
                  {visibleCount < filtered.length && (
                    <button
                      type="button"
                      onClick={() => loadMore(BATCH_INCREMENT * 2)}
                      className="w-full py-3 text-center text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                    >
                      Показати ще ({filtered.length - visibleCount} залишилось)…
                    </button>
                  )}
                </>
              ) : (
                <p className="p-5 text-sm text-muted-foreground">
                  {warehouses.length ? "За цим запитом нічого не знайдено." : "Точки не знайдено."}
                </p>
              )}
            </div>

            <div className="border-t border-border p-3 md:hidden">
              <button
                type="button"
                className="w-full rounded-xl border border-border px-4 py-2 text-sm"
                onClick={onClose}
              >
                Закрити
              </button>
            </div>
          </div>

          {/* Ячейка карты растягивается на всю высоту строки grid. */}
          <div className={`${mobileMap ? "block" : "hidden"} relative min-w-0 md:block`}>
            {/* absolute inset-0 даёт карте точный размер ячейки;
                z-0 создаёт отдельный слой, чтобы элементы Leaflet (z-index до 1000)
                не перекрывали кнопку «До списку». */}
            {shouldRenderMap && (
              <div className="absolute inset-0 z-0">
                <NovaPoshtaMap
                  warehouses={filtered}
                  type={type}
                  selectedRef={focusedRef}
                  onFocus={wh => setFocusedRef(wh.Ref)}
                  onSelect={onSelect}
                />
              </div>
            )}
            {/* Мобільна плаваюча картка вибраної точки прямо поверх мапи */}
            {focusedItem && mobileMap && (
              <div className="absolute bottom-16 left-3 right-3 z-20 rounded-2xl border border-border/80 bg-card/95 p-3.5 shadow-2xl backdrop-blur-md md:hidden animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${
                    type === "Postomat" ? "text-emerald-700 dark:text-emerald-400" : "text-[#8C5E14] dark:text-[#F3D078]"
                  }`}>
                    {type === "Postomat" ? "Поштомат" : "Відділення"} №{focusedItem.Number || "—"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFocusedRef("")}
                    className="p-1 text-muted-foreground hover:text-foreground"
                    aria-label="Закрити вибір"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
                <p className="mt-1 text-xs font-bold text-foreground truncate">
                  {focusedItem.ShortAddress || focusedItem.Description}
                </p>
                <button
                  type="button"
                  onClick={() => onSelect(focusedItem)}
                  className={`mt-2.5 w-full rounded-full py-2 text-xs font-bold uppercase tracking-wider text-white shadow-xs active:scale-98 cursor-pointer ${
                    type === "Postomat" ? "bg-[#1B4332] hover:bg-[#245942]" : "bg-[#181512] hover:bg-[#2A231D]"
                  }`}
                >
                  ✓ Обрати цей {type === "Postomat" ? "поштомат" : "пункт"}
                </button>
              </div>
            )}

            <button
              type="button"
              className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-border bg-card/90 px-5 py-2 text-xs font-semibold shadow-md backdrop-blur-sm md:hidden"
              onClick={() => setMobileMap(false)}
            >
              ← До списку ({filtered.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
