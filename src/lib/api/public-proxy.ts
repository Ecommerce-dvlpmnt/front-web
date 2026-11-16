const backendBaseUrl = () => process.env.API_URL?.replace(/\/+$/, "")

export async function proxyBackendRequest(path: string, init?: RequestInit) {
  const baseUrl = backendBaseUrl()
  if (!baseUrl) {
    return Response.json({ title: "Server configuration error", detail: "API_URL is not configured", status: 500 }, { status: 500 })
  }

  try {
    const response = await fetch(`${baseUrl}/${path.replace(/^\/+/, "")}`, {
      ...init,
      headers: { Accept: "application/json", ...init?.headers },
      cache: "no-store",
    })
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" },
    })
  } catch {
    return Response.json({ title: "Backend unavailable", detail: "Не вдалося зв’язатися з сервером. Спробуйте ще раз.", status: 502 }, { status: 502 })
  }
}
