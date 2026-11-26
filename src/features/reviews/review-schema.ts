import { z } from "zod"
import { reviewStatuses } from "@/types/review"

export const createReviewSchema = z.object({
  productId: z.string().uuid(),
  authorName: z.string().trim().min(2).max(80),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(3).max(500),
  pros: z.string().trim().max(250).optional(),
  cons: z.string().trim().max(250).optional(),
  honeypot: z.string().max(500).optional(),
})

export const reviewStatusSchema = z.object({
  status: z.enum(reviewStatuses),
  adminComment: z.string().trim().max(1000).nullable().optional(),
})
