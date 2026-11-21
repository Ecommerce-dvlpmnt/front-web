import Script from "next/script"
import { Suspense } from "react"

import { PageViewTracker } from "@/components/analytics/PageViewTracker"

export function GoogleTag({ id, ga4Id }: { id?: string; ga4Id?: string }) {
  const tagId = id?.trim()
  const measurementId = ga4Id?.trim()

  if (!tagId || !/^[A-Z0-9-]+$/i.test(tagId)) return null

  return (
    <>
      <Script
        id="google-tag-init"
        strategy="afterInteractive"
      >
        {`window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
window.gtag('js', new Date());
${measurementId && /^G-[A-Z0-9]+$/i.test(measurementId) ? `window.gtag('config', '${measurementId}', { send_page_view: false });
window.__jingleGa4Configured = true;` : ""}
window.dispatchEvent(new Event('google-tag-ready'));`}
      </Script>
      <Script
        id="google-tag-script"
        src={`https://www.googletagmanager.com/gtag/js?id=${tagId}`}
        strategy="afterInteractive"
      />
      {measurementId && /^G-[A-Z0-9]+$/i.test(measurementId) && (
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
      )}
    </>
  )
}
