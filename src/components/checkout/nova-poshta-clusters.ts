import { isPostomatWarehouse, type NovaPoshtaWarehouse } from "@/lib/api/novaposhta"

// Точка с уже разобранными координатами.
export interface WarehousePoint {
  warehouse: NovaPoshtaWarehouse
  lat: number
  lng: number
  isPostomat: boolean
}

// Кластер: группа близких точек с точными счётчиками по типам.
export interface WarehouseCluster {
  kind: "cluster"
  key: string
  lat: number
  lng: number
  count: number
  warehouseCount: number
  postomatCount: number
  // [[юг, запад], [север, восток]] — рамка, в которой лежат все точки кластера.
  bounds: [[number, number], [number, number]]
}

export interface SingleWarehouseItem {
  kind: "point"
  key: string
  point: WarehousePoint
}

export type WarehouseMapItem = WarehouseCluster | SingleWarehouseItem

// Превращает ответ API в точки: отбрасывает записи без координат и дубликаты Ref.
export function toWarehousePoints(warehouses: NovaPoshtaWarehouse[]): WarehousePoint[] {
  const seenRefs = new Set<string>()
  const points: WarehousePoint[] = []

  for (const warehouse of warehouses) {
    if (seenRefs.has(warehouse.Ref)) continue
    const lat = Number(warehouse.Latitude)
    const lng = Number(warehouse.Longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) continue

    seenRefs.add(warehouse.Ref)
    points.push({ warehouse, lat, lng, isPostomat: isPostomatWarehouse(warehouse) })
  }
  return points
}

export function toSingleItems(points: WarehousePoint[]): SingleWarehouseItem[] {
  return points.map(point => ({ kind: "point", key: point.warehouse.Ref, point }))
}

// Сеточная кластеризация: экран делится на квадраты cellSizePx × cellSizePx
// (в пикселях текущего zoom), все точки одного квадрата — один кластер.
// Каждая точка попадает ровно в одну ячейку, поэтому сумма всех кластеров
// всегда равна числу точек — счётчики точные, а не приблизительные.
export function clusterPoints(
  points: WarehousePoint[],
  project: (lat: number, lng: number) => { x: number; y: number },
  cellSizePx: number,
): WarehouseMapItem[] {
  const cells = new Map<string, WarehousePoint[]>()

  for (const point of points) {
    const { x, y } = project(point.lat, point.lng)
    const cellKey = `${Math.floor(x / cellSizePx)}:${Math.floor(y / cellSizePx)}`
    const members = cells.get(cellKey)
    if (members) members.push(point)
    else cells.set(cellKey, [point])
  }

  const items: WarehouseMapItem[] = []

  for (const [cellKey, members] of cells) {
    // Одна точка в ячейке — показываем её как обычный маркер.
    if (members.length === 1) {
      items.push({ kind: "point", key: members[0].warehouse.Ref, point: members[0] })
      continue
    }

    let latSum = 0
    let lngSum = 0
    let postomatCount = 0
    let south = Infinity
    let west = Infinity
    let north = -Infinity
    let east = -Infinity

    for (const member of members) {
      latSum += member.lat
      lngSum += member.lng
      if (member.isPostomat) postomatCount += 1
      south = Math.min(south, member.lat)
      north = Math.max(north, member.lat)
      west = Math.min(west, member.lng)
      east = Math.max(east, member.lng)
    }

    items.push({
      kind: "cluster",
      // Счётчики в key: при их изменении React пересоздаст маркер
      // с актуальным title и подписью.
      key: `cluster:${cellKey}:${members.length}:${postomatCount}`,
      lat: latSum / members.length,
      lng: lngSum / members.length,
      count: members.length,
      warehouseCount: members.length - postomatCount,
      postomatCount,
      bounds: [
        [south, west],
        [north, east],
      ],
    })
  }

  return items
}
