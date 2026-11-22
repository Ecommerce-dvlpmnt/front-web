"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect } from "react"

import { pushAnalyticsEvent } from "@/lib/analytics/data-layer"

let lastTrackedUrl: string | null = null

export function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()

  useEffect(() => {
    const track = () => {
      const url = window.location.href
      if (lastTrackedUrl === url) return

      const sent = pushAnalyticsEvent("page_view", {
        page_location: url,
        page_path: `${pathname}${search ? `?${search}` : ""}`,
        page_title: document.title,
      })
      if (sent) lastTrackedUrl = url
    }

    if (window.__jingleGa4Configured) {
      track()
    } else {
      window.addEventListener("google-tag-ready", track, { once: true })
    }

    return () => window.removeEventListener("google-tag-ready", track)
  }, [pathname, search])

  return null
}
