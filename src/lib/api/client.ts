type ApiRequestInit = RequestInit & {
  next?: {
    revalidate?: number
    tags?: string[]
  }
}

export interface ApiProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  errors?: Record<string, string[] | string>
  [key: string]: unknown
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: ApiProblemDetails
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export async function apiFetch<T>(
  path: string,
  init?: ApiRequestInit
): Promise<T> {
  const apiUrl = process.env.API_URL?.replace(/\/+$/, "")

  if (!apiUrl) {
    throw new Error("API_URL is not configured")
  }

  const headers = new Headers(init?.headers)

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json")
  }

  const response = await fetch(
    `${apiUrl}/${path.replace(/^\/+/, "")}`,
    {
      ...init,
      headers,
    }
  )

  if (!response.ok) {
    let message = `API request failed with status ${response.status}`
    let details: ApiProblemDetails | undefined

    try {
      const problem = (await response.json()) as ApiProblemDetails
      details = problem

      const validationMessage = problem.errors
        ? Object.values(problem.errors)
            .flatMap((value) => (Array.isArray(value) ? value : [value]))
            .join(" ")
        : undefined

      message =
        problem.detail ??
        validationMessage ??
        problem.title ??
        message
    } catch {
      // Keep the status-based message when the backend response is not JSON.
    }

    throw new ApiError(message, response.status, details)
  }

  if (response.status === 204) return undefined as T

  return (await response.json()) as T
}
