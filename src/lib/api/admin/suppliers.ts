import { adminApiFetch } from "@/lib/api/admin/auth"
import { ApiError } from "@/lib/api/client"
import type { Supplier, SupplierInput } from "@/types/supplier"

export interface GetSuppliersOptions {
  onlyActive?: boolean
}

function isSupplier(value: unknown): value is Supplier {
  if (!value || typeof value !== "object") return false

  const supplier = value as Record<string, unknown>

  return (
    typeof supplier.id === "string" &&
    typeof supplier.name === "string" &&
    (supplier.contact == null || typeof supplier.contact === "string") &&
    (supplier.city == null || typeof supplier.city === "string") &&
    (supplier.notes == null || typeof supplier.notes === "string") &&
    typeof supplier.isActive === "boolean"
  )
}

function parseSupplier(value: unknown): Supplier {
  if (!isSupplier(value)) {
    throw new Error("Backend returned an invalid supplier response")
  }

  return {
    ...value,
    contact: value.contact ?? "",
    city: value.city ?? "",
    notes: value.notes ?? "",
  }
}

export async function getSuppliers(
  { onlyActive = false }: GetSuppliersOptions = {}
): Promise<Supplier[]> {
  const query = new URLSearchParams({ onlyActive: String(onlyActive) })
  const payload = await adminApiFetch<unknown>(
    `admin/suppliers?${query.toString()}`
  )

  if (!Array.isArray(payload) || !payload.every(isSupplier)) {
    throw new Error("Backend returned an invalid suppliers response")
  }

  return payload.map(parseSupplier)
}

export async function getSupplier(id: string): Promise<Supplier | null> {
  try {
    return parseSupplier(
      await adminApiFetch<unknown>(
        `admin/suppliers/${encodeURIComponent(id)}`
      )
    )
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export async function createSupplier(
  input: SupplierInput
): Promise<Supplier> {
  return parseSupplier(
    await adminApiFetch<unknown>("admin/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  )
}
