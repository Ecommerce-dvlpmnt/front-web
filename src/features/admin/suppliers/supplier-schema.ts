import { z } from "zod"

export const supplierSchema = z.object({
  name: z.string().trim().min(2, "Вкажіть щонайменше 2 символи"),
  contact: z.string().trim().min(2, "Вкажіть контакт постачальника"),
  city: z.string().trim().min(2, "Вкажіть місто відправлення"),
  notes: z
    .string()
    .trim()
    .max(2000, "Нотатки не можуть бути довші за 2000 символів")
    .optional(),
  isActive: z.boolean(),
})

export type SupplierFormValues = z.infer<typeof supplierSchema>

export function toSupplierInput(values: SupplierFormValues) {
  return {
    ...values,
    notes: values.notes?.trim() || undefined,
  }
}
