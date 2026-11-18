"use client"

import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet"
import { useEffect } from "react"

export interface NovaPoshtaWarehouse {
  Ref: string
  Description: string
  Number?: string | null
  Latitude?: string | null
  Longitude?: string | null
  ShortAddress?: string | null
  CategoryOfWarehouse?: string | null
}

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, 13)
  }, [center, map])
  return null
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
  const points = warehouses.flatMap((warehouse) => {
    const lat = Number(warehouse.Latitude)
    const lng = Number(warehouse.Longitude)
    return Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0
      ? [{ warehouse, lat, lng }]
      : []
  })

  const selectedPoint = points.find((p) => p.warehouse.Ref === selectedRef)
  const center: [number, number] = selectedPoint
    ? [selectedPoint.lat, selectedPoint.lng]
    : points.length
      ? [points[0].lat, points[0].lng]
      : [50.4501, 30.5234]

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom
      className="h-full min-h-64 w-full"
    >
      <Recenter center={center} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {selectedPoint && (
        <CircleMarker
          center={[selectedPoint.lat, selectedPoint.lng]}
          radius={22}
          pathOptions={{
            color: "#DA291C",
            weight: 2,
            fillColor: "#DA291C",
            fillOpacity: 0.22,
          }}
        />
      )}
      {points.map(({ warehouse, lat, lng }) => {
        const isSelected = warehouse.Ref === selectedRef
        const isPostomat =
          warehouse.CategoryOfWarehouse?.toLowerCase().includes("postomat") ||
          warehouse.Description.toLowerCase().includes("поштомат")

        return (
          <CircleMarker
            key={warehouse.Ref}
            center={[lat, lng]}
            radius={isSelected ? 11 : isPostomat ? 7.5 : 8}
            pathOptions={{
              color: isSelected ? "#0F172A" : "#FFFFFF",
              weight: isSelected ? 3 : 2,
              fillColor: isSelected
                ? "#DA291C"
                : isPostomat
                  ? "#2563EB"
                  : "#DA291C",
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
                <p className="font-semibold leading-snug text-gray-900">
                  {warehouse.Description}
                </p>
                {warehouse.ShortAddress && (
                  <p className="mt-1 text-xs text-gray-600">
                    {warehouse.ShortAddress}
                  </p>
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
      })}
    </MapContainer>
  )
}
