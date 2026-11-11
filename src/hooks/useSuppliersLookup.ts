"use client"

import { useEffect, useState } from "react"

import type { SupplierLookup } from "@/types/supplier"

export function useSuppliersLookup(): SupplierLookup[] {
  const [suppliers, setSuppliers] = useState<SupplierLookup[]>([])

  useEffect(() => {
    let isActive = true

    async function loadSuppliers() {
      try {
        const response = await fetch("/api/admin/suppliers?onlyActive=true")
        if (!response.ok) return

        const payload = (await response.json()) as unknown
        if (!Array.isArray(payload) || !isActive) return

        setSuppliers(
          payload
            .filter(isSupplierLookup)
            .map(({ id, name }) => ({ id, name }))
        )
      } catch {
        // The product form can still render without an optional lookup.
      }
    }

    void loadSuppliers()

    return () => {
      isActive = false
    }
  }, [])

  return suppliers
}

function isSupplierLookup(value: unknown): value is SupplierLookup {
  if (!value || typeof value !== "object") return false

  const supplier = value as Partial<SupplierLookup>

  return typeof supplier.id === "string" && typeof supplier.name === "string"
}
