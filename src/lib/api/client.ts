const API_URL = process.env.API_URL

export async function apiFetch<T>(path: string): Promise<T> {
  if (!API_URL) throw new Error("API_URL is not set")

  const res = await fetch(`${API_URL}${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  })

  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json() as Promise<T>
}