export interface Supplier {
  id: string
  name: string
  contact: string
  city: string
  notes?: string
  isActive: boolean
}

export type SupplierInput = Omit<Supplier, "id">

export interface SupplierLookup {
  id: string
  name: string
}
