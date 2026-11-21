import Script from "next/script"

export function GoogleTag({ id }: { id?: string }) {
  const tagId = id?.trim()

  if (!tagId || !/^[A-Z0-9-]+$/i.test(tagId)) return null

  return (
    <>
      <Script
        id="google-tag-init"
        strategy="afterInteractive"
      >
        {`window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
window.gtag('js', new Date());`}
      </Script>
      <Script
        id="google-tag-script"
        src={`https://www.googletagmanager.com/gtag/js?id=${tagId}`}
        strategy="afterInteractive"
      />
    </>
  )
}
