import { ApiError } from "@/lib/api/client"

export function apiErrorResponse(
  error: unknown,
  fallbackMessage: string
): Response {
  if (error instanceof ApiError) {
    return Response.json(
      error.details ?? {
        title: error.message,
        detail: error.message,
        status: error.status,
      },
      { status: error.status }
    )
  }

  console.error(error)

  return Response.json(
    {
      title: "Internal Server Error",
      detail: fallbackMessage,
      status: 500,
    },
    { status: 500 }
  )
}
