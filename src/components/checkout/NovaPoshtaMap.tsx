"use client"

import { useEffect, useMemo, useRef } from "react"
import L from "leaflet"
import "leaflet.markercluster"
import { MapContainer, TileLayer, useMap } from "react-leaflet"

import { isPostomatWarehouse, type NovaPoshtaWarehouse } from "@/lib/api/novaposhta"

export type { NovaPoshtaWarehouse } from "@/lib/api/novaposhta"

const DEFAULT_CENTER: L.LatLngTuple = [50.4501, 30.5234]

// Фірмові кольори бренду Jingle Decor:
// Відділення: тепле святкове бурштинове золото (#C87A14) — яскраве, благородне, помітне на карті
// Поштомати: соковитий хвойний смарагд (#0D8253) — живий, чистий зелений колір
// Акценти: тепле золото (#D4AF37 / #F3D078)
const WAREHOUSE_COLOR = "#C87A14"
const POSTOMAT_COLOR = "#0D8253"
const DOT_COLOR = "#FFFFFF"

// Кэш иконок пинов
const pinIconCache = new Map<string, L.DivIcon>()

function getPinIcon(isPostomat: boolean, isHighlighted: boolean) {
  const key = `${isPostomat ? "p" : "w"}:${isHighlighted ? "1" : "0"}`
  const cached = pinIconCache.get(key)
  if (cached) return cached

  const color = isPostomat ? POSTOMAT_COLOR : WAREHOUSE_COLOR
  const size = isHighlighted ? 34 : 26
  const dotSize = isHighlighted ? 10 : 7
  const shadow = isHighlighted
    ? `0 6px 18px rgba(0, 0, 0, 0.45), 0 0 0 4px rgba(212, 175, 55, 0.85)`
    : "0 2px 8px rgba(0, 0, 0, 0.25), 0 0 0 1.5px rgba(255, 255, 255, 0.6)"

  const icon = L.divIcon({
    className: "custom-np-pin",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 2px solid #ffffff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: ${shadow};
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      ">
        <div style="
          width: ${dotSize}px;
          height: ${dotSize}px;
          background-color: ${DOT_COLOR};
          border-radius: 50%;
          transform: rotate(45deg);
          box-shadow: 0 0 2px rgba(0,0,0,0.3);
        "></div>
      </div>
    `,
  })

  pinIconCache.set(key, icon)
  return icon
}

function SizeWatcher() {
  const map = useMap()

  useEffect(() => {
    const container = map.getContainer()
    let frame = 0

    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      if (width === 0 || height === 0) return

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

interface ParsedWarehouse {
  warehouse: NovaPoshtaWarehouse
  lat: number
  lng: number
  isPostomat: boolean
}

// Фильтруем и чистим координаты
function parseWarehouses(warehouses: NovaPoshtaWarehouse[]): ParsedWarehouse[] {
  const result: ParsedWarehouse[] = []
  const seen = new Set<string>()

  for (const wh of warehouses) {
    if (seen.has(wh.Ref)) continue
    let lat = Number(wh.Latitude)
    let lng = Number(wh.Longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) continue

    // Исправление перепутанных lat/lng
    if (lat >= 22 && lat <= 40.5 && lng >= 44 && lng <= 52.6) {
      const tmp = lat
      lat = lng
      lng = tmp
    }

    // Отсекаем координаты вне территории Украины
    if (lat < 44.0 || lat > 52.6 || lng < 22.0 || lng > 40.5) continue

    seen.add(wh.Ref)
    result.push({
      warehouse: wh,
      lat,
      lng,
      isPostomat: isPostomatWarehouse(wh),
    })
  }

  return result
}

function MarkerClusterLayer({
  parsedList,
  type,
  selectedRef,
  onFocus,
  onSelect,
}: {
  parsedList: ParsedWarehouse[]
  type?: "Warehouse" | "Postomat"
  selectedRef: string
  onFocus?: (w: NovaPoshtaWarehouse) => void
  onSelect: (w: NovaPoshtaWarehouse) => void
}) {
  const map = useMap()
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null)
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map())
  const prevSelectedRef = useRef<string>("")
  const onFocusRef = useRef(onFocus)
  const onSelectRef = useRef(onSelect)

  useEffect(() => {
    onFocusRef.current = onFocus
    onSelectRef.current = onSelect
  })

  // Инициализация и наполнение группы кластеров
  useEffect(() => {
    if (!map) return

    // Стилізована під бутік-дизайн кластеризація:
    // Динамічний радіус залежно від зуму: на загальному плані міста (zoom <= 12) кружки комфортно
    // об'єднуються у райони (65px), а при наближенні (13-14) розпадаються на затишні групи (48px) та окремі вулиці (38px).
    const clusterGroup = (L as unknown as {
      markerClusterGroup: (options?: unknown) => L.MarkerClusterGroup
    }).markerClusterGroup({
      maxClusterRadius: (zoom: number) => (zoom <= 12 ? 65 : zoom <= 14 ? 48 : 38),
      showCoverageOnHover: false,
      zoomToBoundsOnClick: false,
      spiderfyOnMaxZoom: true,
      animate: true,
      animateAddingMarkers: false,
      disableClusteringAtZoom: 19,
      chunkedLoading: true,
      chunkInterval: 80,
      chunkDelay: 8,
      iconCreateFunction: (cluster: { getChildCount: () => number; getAllChildMarkers: () => L.Marker[] }) => {
        const count = cluster.getChildCount()
        const childMarkers = cluster.getAllChildMarkers()
        let postomatCount = 0
        for (const m of childMarkers) {
          // @ts-expect-error custom tag
          if (m._isPostomat) postomatCount++
        }
        const isPostomatCluster =
          type === "Postomat"
            ? true
            : type === "Warehouse"
              ? false
              : postomatCount >= childMarkers.length / 2

        const baseColor = isPostomatCluster ? POSTOMAT_COLOR : WAREHOUSE_COLOR
        const haloColor = isPostomatCluster
          ? "rgba(13, 130, 83, 0.35)"
          : "rgba(200, 122, 20, 0.35)"
        const goldRing = "rgba(212, 175, 55, 0.6)"

        let size = 34
        let fontSize = "11px"
        if (count >= 100) {
          size = 46
          fontSize = "13px"
        } else if (count >= 20) {
          size = 40
          fontSize = "12px"
        }

        return L.divIcon({
          html: `
            <div style="
              width: ${size}px;
              height: ${size}px;
              background-color: ${baseColor};
              border: 2px solid #ffffff;
              box-shadow: 0 4px 14px ${haloColor}, 0 0 0 3px ${goldRing};
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: var(--font-sans), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-weight: 800;
              font-size: ${fontSize};
              color: #ffffff;
              letter-spacing: -0.02em;
              transition: transform 0.22s cubic-bezier(0.2, 1, 0.3, 1), box-shadow 0.22s ease;
            " onmouseover="this.style.transform='scale(1.12)';this.style.boxShadow='0 6px 18px ${haloColor}, 0 0 0 5px ${goldRing}'" onmouseout="this.style.transform='scale(1)';this.style.boxShadow='0 4px 14px ${haloColor}, 0 0 0 3px ${goldRing}'">
              ${count}
            </div>
          `,
          className: "custom-np-cluster",
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        })
      },
    })

    // Плавне наближення польотом при кліку на кластер (як на офіційній карті Нової Пошти)
    clusterGroup.on("clusterclick", (event: { layer: L.MarkerCluster }) => {
      const bounds = event.layer.getBounds()
      map.flyToBounds(bounds, {
        padding: [45, 45],
        maxZoom: 16,
        duration: 0.55,
        easeLinearity: 0.25,
      })
    })

    clusterGroupRef.current = clusterGroup
    markersMapRef.current.clear()

    const markers: L.Marker[] = []

    for (const item of parsedList) {
      const marker = L.marker([item.lat, item.lng], {
        icon: getPinIcon(item.isPostomat, false),
      })
      // @ts-expect-error custom tag for cluster color determination
      marker._isPostomat = item.isPostomat

      // Popup
      const popupDiv = document.createElement("div")
      popupDiv.className = "np-custom-popup min-w-[220px] max-w-[260px] p-1 font-sans text-sm"
      popupDiv.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
          <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: ${
            item.isPostomat ? POSTOMAT_COLOR : WAREHOUSE_COLOR
          };">
            <span>№${item.warehouse.Number || "—"}</span>
            <span style="color: #cbd5e1; margin: 0 3px;">•</span>
            <span>${item.isPostomat ? "Поштомат" : "Відділення"}</span>
          </span>
          <span style="font-size: 10px; font-weight: 600; color: #059669;">● Відчинено</span>
        </div>
        <p style="font-weight: 700; font-size: 13px; line-height: 1.35; color: #0f172a; margin: 0 0 4px 0;">
          ${item.warehouse.Description}
        </p>
        ${
          item.warehouse.ShortAddress && item.warehouse.ShortAddress !== item.warehouse.Description
            ? `<p style="font-size: 12px; color: #64748b; margin: 0 0 6px 0;">${item.warehouse.ShortAddress}</p>`
            : ""
        }
        ${
          Number(item.warehouse.TotalMaxWeightAllowed) > 0
            ? `<p style="font-size: 11px; color: #64748b; margin: 0 0 10px 0;">📦 До ${item.warehouse.TotalMaxWeightAllowed} кг</p>`
            : ""
        }
        <button
          type="button"
          id="btn-np-select-${item.warehouse.Ref}"
          style="
            width: 100%;
            background-color: ${item.isPostomat ? POSTOMAT_COLOR : WAREHOUSE_COLOR};
            color: #ffffff;
            font-weight: 700;
            padding: 9px 14px;
            border-radius: 9999px;
            font-size: 12px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.18);
            transition: opacity 0.15s, transform 0.1s;
          "
          onmouseover="this.style.opacity='0.9'"
          onmouseout="this.style.opacity='1'"
        >
          ✓ Обрати ${item.isPostomat ? "цей поштомат" : "це відділення"}
        </button>
      `

      const btn = popupDiv.querySelector(`#btn-np-select-${item.warehouse.Ref}`)
      if (btn) {
        btn.addEventListener("click", () => {
          onSelectRef.current?.(item.warehouse)
        })
      }

      marker.bindPopup(popupDiv, { closeButton: false })

      marker.on("click", () => {
        onFocusRef.current?.(item.warehouse)
      })

      markersMapRef.current.set(item.warehouse.Ref, marker)
      markers.push(marker)
    }

    clusterGroup.addLayers(markers)
    map.addLayer(clusterGroup)

    return () => {
      map.removeLayer(clusterGroup)
    }
  }, [map, parsedList, type])

  // Плавный перелет к маркеру при клике в левой колонке (zoomToShowLayer)
  useEffect(() => {
    if (!selectedRef || !map || !clusterGroupRef.current) return
    if (prevSelectedRef.current === selectedRef) return

    if (prevSelectedRef.current) {
      const prevMarker = markersMapRef.current.get(prevSelectedRef.current)
      if (prevMarker) {
        // @ts-expect-error custom tag
        prevMarker.setIcon(getPinIcon(Boolean(prevMarker._isPostomat), false))
      }
    }

    prevSelectedRef.current = selectedRef

    const marker = markersMapRef.current.get(selectedRef)
    if (marker) {
      // @ts-expect-error custom tag
      marker.setIcon(getPinIcon(Boolean(marker._isPostomat), true))
      clusterGroupRef.current.zoomToShowLayer(marker, () => {
        marker.openPopup()
      })
    }
  }, [selectedRef, map])

  return null
}

function ViewBoundsController({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap()
  const prevBoundsRef = useRef<string>("")

  useEffect(() => {
    if (!bounds || !bounds.isValid()) return

    const key = `${bounds.getSouthWest().toString()}:${bounds.getNorthEast().toString()}`
    if (prevBoundsRef.current === key) return

    const isFirstLoad = prevBoundsRef.current === ""
    prevBoundsRef.current = key

    const apply = () => {
      if (isFirstLoad) {
        map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 })
      } else {
        map.flyToBounds(bounds, {
          padding: [40, 40],
          maxZoom: 14,
          duration: 0.9,
          easeLinearity: 0.25,
        })
      }
    }

    const size = map.getSize()
    if (size.x > 0 && size.y > 0) {
      apply()
      return
    }

    map.once("resize", apply)
    return () => {
      map.off("resize", apply)
    }
  }, [map, bounds])

  return null
}

export default function NovaPoshtaMap({
  warehouses,
  type,
  selectedRef,
  onFocus,
  onSelect,
}: {
  warehouses: NovaPoshtaWarehouse[]
  type?: "Warehouse" | "Postomat"
  selectedRef: string
  onFocus?: (warehouse: NovaPoshtaWarehouse) => void
  onSelect: (warehouse: NovaPoshtaWarehouse) => void
}) {
  const parsedList = useMemo(() => parseWarehouses(warehouses), [warehouses])

  const bounds = useMemo(() => {
    if (!parsedList.length) return null
    return L.latLngBounds(parsedList.map(p => [p.lat, p.lng] as L.LatLngTuple))
  }, [parsedList])

  const initialCenter: L.LatLngTuple = useMemo(() => {
    if (selectedRef) {
      const found = parsedList.find(p => p.warehouse.Ref === selectedRef)
      if (found) return [found.lat, found.lng]
    }
    if (bounds && bounds.isValid()) {
      const c = bounds.getCenter()
      return [c.lat, c.lng]
    }
    return DEFAULT_CENTER
  }, [selectedRef, parsedList, bounds])

  return (
    <div className="relative h-full min-h-64 w-full">
      <MapContainer
        center={initialCenter}
        zoom={13}
        scrollWheelZoom
        className="h-full w-full"
      >
        <SizeWatcher />
        <ViewBoundsController bounds={bounds} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MarkerClusterLayer
          parsedList={parsedList}
          type={type}
          selectedRef={selectedRef}
          onFocus={onFocus}
          onSelect={onSelect}
        />
      </MapContainer>
    </div>
  )
}
