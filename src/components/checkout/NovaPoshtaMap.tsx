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
  useEffect(() => { map.setView(center, 12) }, [center, map])
  return null
}

export default function NovaPoshtaMap({ warehouses, selectedRef, onSelect }: {
  warehouses: NovaPoshtaWarehouse[]
  selectedRef: string
  onSelect: (warehouse: NovaPoshtaWarehouse) => void
}) {
  const points = warehouses.flatMap(warehouse => {
    const lat = Number(warehouse.Latitude)
    const lng = Number(warehouse.Longitude)
    return Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0 ? [{ warehouse, lat, lng }] : []
  })
  const center: [number, number] = points.length ? [points[0].lat, points[0].lng] : [50.4501, 30.5234]
  return <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full min-h-64 w-full">
    <Recenter center={center} />
    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    {points.map(({ warehouse, lat, lng }) => <CircleMarker key={warehouse.Ref} center={[lat, lng]} radius={warehouse.Ref === selectedRef ? 9 : 7} pathOptions={{ color: "#c6a76b", fillColor: "#c6a76b", fillOpacity: 0.9 }}>
      <Popup><div className="max-w-56 text-sm"><p className="font-semibold">{warehouse.Description}</p><p className="mt-1 text-xs text-gray-600">{warehouse.ShortAddress}</p><button type="button" className="mt-2 rounded-md bg-[#191919] px-3 py-1.5 text-white" onClick={() => onSelect(warehouse)}>Обрати цей пункт</button></div></Popup>
    </CircleMarker>)}
  </MapContainer>
}
