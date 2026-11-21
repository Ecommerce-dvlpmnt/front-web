"use client"

import { useEffect, useMemo, useState } from "react"
import L from "leaflet"
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet"

import type { NovaPoshtaWarehouse } from "@/lib/api/novaposhta"
import {
  clusterPoints,
  toSingleItems,
  toWarehousePoints,
  type WarehouseCluster,
  type WarehouseMapItem,
  type WarehousePoint,
} from "./nova-poshta-clusters"

// Реэкспорт, чтобы существующие импорты типа из "./NovaPoshtaMap"
// (CheckoutForm, NovaPoshtaPickerModal) продолжили работать без изменений.
export type { NovaPoshtaWarehouse } from "@/lib/api/novaposhta"

const DEFAULT_CENTER: L.LatLngTuple = [50.4501, 30.5234]
// Размер ячейки кластеризации в пикселях.
const CLUSTER_CELL_SIZE_PX = 64
// Начиная с этого zoom кластеры отключаются — видны все отдельные пункты.
const INDIVIDUAL_MARKERS_ZOOM = 16
// Рисуем маркеры с запасом 25% вокруг видимой области, чтобы при
// небольшом сдвиге карты они не «появлялись» с задержкой.
const VIEWPORT_PADDING = 0.25

const WAREHOUSE_COLOR = "#DA291C"
const POSTOMAT_COLOR = "#2563EB"

// Склонение для украинского языка: 1 пункт, 2 пункти, 5 пунктів.
function pluralUk(count: number, one: string, few: string, many: string) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

function describeCluster(cluster: WarehouseCluster) {
  const parts: string[] = []
  if (cluster.warehouseCount) {
    parts.push(
      `${cluster.warehouseCount} ${pluralUk(cluster.warehouseCount, "відділення", "відділення", "відділень")}`,
    )
  }
  if (cluster.postomatCount) {
    parts.push(
      `${cluster.postomatCount} ${pluralUk(cluster.postomatCount, "поштомат", "поштомати", "поштоматів")}`,
    )
  }
  return `${cluster.count} ${pluralUk(cluster.count, "пункт", "пункти", "пунктів")} Нової Пошти: ${parts.join(", ")}. Натисніть, щоб наблизити`
}

// Кэш иконок: одинаковые кластеры используют один объект DivIcon,
// иначе Leaflet пересоздавал бы DOM-элемент на каждой перерисовке.
const clusterIconCache = new Map<string, L.DivIcon>()

function getClusterIcon(cluster: WarehouseCluster) {
  const cacheKey = `${cluster.warehouseCount}:${cluster.postomatCount}`
  const cached = clusterIconCache.get(cacheKey)
  if (cached) return cached

  const size = cluster.count < 10 ? 34 : cluster.count < 100 ? 40 : cluster.count < 1000 ? 46 : 54
  const postomatShare = Math.round((cluster.postomatCount / cluster.count) * 100)
  // Если в кластере оба типа — показываем их доли цветным кольцом.
  const background =
    cluster.postomatCount === 0
      ? WAREHOUSE_COLOR
      : cluster.warehouseCount === 0
        ? POSTOMAT_COLOR
        : `conic-gradient(${POSTOMAT_COLOR} 0 ${postomatShare}%, ${WAREHOUSE_COLOR} ${postomatShare}% 100%)`

  const icon = L.divIcon({
    // Пустой класс leaflet-div-icon убирает стандартный белый квадрат.
    className:
      "rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    iconSize: [size, size],
    html: `<span aria-hidden="true" class="flex size-full items-center justify-center rounded-full border-2 border-white font-sans text-[13px] font-semibold text-white shadow-md" style="background:${background}">${cluster.count}</span><span class="sr-only">${describeCluster(cluster)}</span>`,
  })

  clusterIconCache.set(cacheKey, icon)
  return icon
}

// Приближает карту к кластеру так, чтобы он распался.
function zoomIntoCluster(map: L.Map, cluster: WarehouseCluster) {
  const bounds = L.latLngBounds(cluster.bounds)
  const fitZoom = map.getBoundsZoom(bounds, false, L.point(96, 96))
  // Минимум +1 уровень, максимум — уровень отдельных маркеров.
  const targetZoom = Math.min(Math.max(fitZoom, map.getZoom() + 1), INDIVIDUAL_MARKERS_ZOOM)
  map.setView(bounds.getCenter(), targetZoom)
}

// Leaflet измеряет контейнер только при создании карты и при resize окна.
// ResizeObserver следит за самим контейнером: показ после display:none,
// поворот телефона, изменение раскладки модалки.
function SizeWatcher() {
  const map = useMap()

  useEffect(() => {
    const container = map.getContainer()
    let frame = 0

    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      // Контейнер скрыт (0×0) — пересчитывать нечего. Если вызвать
      // invalidateSize сейчас, Leaflet сдвинет центр карты.
      if (width === 0 || height === 0) return

      // Откладываем на следующий кадр, когда раскладка уже окончательная.
      // Несколько изменений подряд схлопываются в один вызов.
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => map.invalidateSize())
    })

    observer.observe(container)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [map])

  return null
}

// Выставляет вид карты: на выбранный пункт или на все пункты города.
// Зависимости — примитивы и мемоизированный bounds, поэтому вид не
// сбрасывается при каждой перерисовке.
function ViewController({
  bounds,
  selectedLat,
  selectedLng,
}: {
  bounds: L.LatLngBounds | null
  selectedLat: number | null
  selectedLng: number | null
}) {
  const map = useMap()

  useEffect(() => {
    const applyView = () => {
      if (selectedLat !== null && selectedLng !== null) {
        map.setView([selectedLat, selectedLng], Math.max(map.getZoom(), INDIVIDUAL_MARKERS_ZOOM))
      } else if (bounds) {
        map.fitBounds(bounds, { padding: [32, 32], maxZoom: INDIVIDUAL_MARKERS_ZOOM })
      }
    }

    const size = map.getSize()
    if (size.x > 0 && size.y > 0) {
      applyView()
      return
    }
    // Карта пока скрыта — применим вид, когда у неё появится размер.
    map.once("resize", applyView)
    return () => {
      map.off("resize", applyView)
    }
  }, [map, bounds, selectedLat, selectedLng])

  return null
}

function WarehouseMarker({
  point,
  isSelected,
  onSelect,
}: {
  point: WarehousePoint
  isSelected: boolean
  onSelect: (warehouse: NovaPoshtaWarehouse) => void
}) {
  const { warehouse, lat, lng, isPostomat } = point

  return (
    <CircleMarker
      center={[lat, lng]}
      radius={isSelected ? 11 : isPostomat ? 7.5 : 8}
      pathOptions={{
        color: isSelected ? "#0F172A" : "#FFFFFF",
        weight: isSelected ? 3 : 2,
        fillColor: isSelected ? WAREHOUSE_COLOR : isPostomat ? POSTOMAT_COLOR : WAREHOUSE_COLOR,
        fillOpacity: 1,
      }}
      eventHandlers={{
        click: () => onSelect(warehouse),
      }}
    >
      <Popup>
        <div className="max-w-64 p-1 font-sans text-sm">
          <div className="mb-1 flex items-center gap-1.5">
            <span
              className={`inline-block size-2 rounded-full ${
                isPostomat ? "bg-blue-600" : "bg-red-600"
              }`}
            />
            <span className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
              {isPostomat ? "Поштомат" : "Відділення Нової Пошти"}
              {warehouse.Number ? ` №${warehouse.Number}` : ""}
            </span>
          </div>
          <p className="font-semibold leading-snug text-gray-900">{warehouse.Description}</p>
          {warehouse.ShortAddress && (
            <p className="mt-1 text-xs text-gray-600">{warehouse.ShortAddress}</p>
          )}
          <button
            type="button"
            className="mt-3 w-full rounded-lg bg-[#DA291C] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#b91c1c]"
            onClick={() => onSelect(warehouse)}
          >
            Обрати цей пункт
          </button>
        </div>
      </Popup>
    </CircleMarker>
  )
}

function ClusterLayer({
  points,
  selectedRef,
  onSelect,
}: {
  points: WarehousePoint[]
  selectedRef: string
  onSelect: (warehouse: NovaPoshtaWarehouse) => void
}) {
  const map = useMap()
  const [view, setView] = useState(() => ({ zoom: map.getZoom(), bounds: map.getBounds() }))

  // moveend срабатывает один раз в конце перетаскивания или zoom,
  // а не на каждом кадре, поэтому лишних пересчётов нет.
  useMapEvents({
    moveend: () => setView({ zoom: map.getZoom(), bounds: map.getBounds() }),
    resize: () => setView({ zoom: map.getZoom(), bounds: map.getBounds() }),
  })

  // Кластеры зависят только от zoom и набора точек, а не от сдвига карты.
  // Считаем по ВСЕМ точкам города, поэтому числа в кластерах точные.
  const items = useMemo<WarehouseMapItem[]>(() => {
    if (view.zoom >= INDIVIDUAL_MARKERS_ZOOM) return toSingleItems(points)
    return clusterPoints(
      points,
      (lat, lng) => map.project([lat, lng], view.zoom),
      CLUSTER_CELL_SIZE_PX,
    )
  }, [map, points, view.zoom])

  // Рисуем только то, что попадает в видимую область (с запасом).
  const visibleItems = useMemo(() => {
    const area = view.bounds.pad(VIEWPORT_PADDING)
    return items.filter(item =>
      item.kind === "point"
        ? area.contains([item.point.lat, item.point.lng])
        : area.intersects(item.bounds),
    )
  }, [items, view.bounds])

  return (
    <>
      {visibleItems.map(item =>
        item.kind === "cluster" ? (
          <Marker
            key={item.key}
            position={[item.lat, item.lng]}
            icon={getClusterIcon(item)}
            title={describeCluster(item)}
            keyboard
            eventHandlers={{
              click: () => zoomIntoCluster(map, item),
              // Leaflet делает маркер фокусируемым (tabindex + role="button"),
              // но Enter и пробел сам не обрабатывает — добавляем вручную.
              keydown: (event: L.LeafletKeyboardEvent) => {
                const key = event.originalEvent.key
                if (key === "Enter" || key === " ") {
                  event.originalEvent.preventDefault()
                  zoomIntoCluster(map, item)
                }
              },
            }}
          />
        ) : (
          <WarehouseMarker
            key={item.key}
            point={item.point}
            isSelected={item.point.warehouse.Ref === selectedRef}
            onSelect={onSelect}
          />
        ),
      )}
    </>
  )
}

export default function NovaPoshtaMap({
  warehouses,
  selectedRef,
  onSelect,
}: {
  warehouses: NovaPoshtaWarehouse[]
  selectedRef: string
  onSelect: (warehouse: NovaPoshtaWarehouse) => void
}) {
  const points = useMemo(() => toWarehousePoints(warehouses), [warehouses])
  const allBounds = useMemo(
    () => (points.length ? L.latLngBounds(points.map(p => [p.lat, p.lng] as L.LatLngTuple)) : null),
    [points],
  )
  const uniqueCount = useMemo(() => new Set(warehouses.map(w => w.Ref)).size, [warehouses])
  const missingCoordinates = uniqueCount - points.length

  const selectedPoint = points.find(p => p.warehouse.Ref === selectedRef)
  // Используется только при первом монтировании; дальше видом управляет ViewController.
  const initialCenter: L.LatLngTuple = selectedPoint
    ? [selectedPoint.lat, selectedPoint.lng]
    : allBounds
      ? [allBounds.getCenter().lat, allBounds.getCenter().lng]
      : DEFAULT_CENTER

  return (
    <div className="relative h-full min-h-64 w-full">
      <MapContainer
        center={initialCenter}
        zoom={13}
        scrollWheelZoom
        className="h-full min-h-64 w-full"
      >
        <SizeWatcher />
        <ViewController
          bounds={allBounds}
          selectedLat={selectedPoint?.lat ?? null}
          selectedLng={selectedPoint?.lng ?? null}
        />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {selectedPoint && (
          <CircleMarker
            center={[selectedPoint.lat, selectedPoint.lng]}
            radius={22}
            pathOptions={{
              color: WAREHOUSE_COLOR,
              weight: 2,
              fillColor: WAREHOUSE_COLOR,
              fillOpacity: 0.22,
            }}
          />
        )}
        <ClusterLayer points={points} selectedRef={selectedRef} onSelect={onSelect} />
      </MapContainer>

      {/* left-14: плашка начинается правее кнопок zoom (+/−) и не закрывает их. */}
      {points.length === 0 && (
        <p className="pointer-events-none absolute left-14 right-3 top-3 z-[500] rounded-lg border border-border bg-card/95 px-3 py-2 text-center text-sm text-muted-foreground shadow">
          {uniqueCount ? "Для знайдених пунктів немає координат." : "Точки не знайдено."}
        </p>
      )}
      {points.length > 0 && missingCoordinates > 0 && (
        <p className="pointer-events-none absolute left-14 right-3 top-3 z-[500] rounded-lg border border-border bg-card/95 px-3 py-2 text-center text-xs text-muted-foreground shadow">
          Без координат (не показані на мапі): {missingCoordinates}. Їх можна обрати у списку.
        </p>
      )}
    </div>
  )
}
