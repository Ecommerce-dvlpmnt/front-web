import { ImageResponse } from "next/og"

export const alt = "Jingle Decor — ялинки, гірлянди та святковий декор"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export function renderOpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 90, background: "#0b1714", color: "#faf8f5" }}>
      <div style={{ fontSize: 88, color: "#d4af37" }}>Jingle Decor</div>
      <div style={{ fontSize: 40, marginTop: 30 }}>Ялинки, гірлянди та святковий декор</div>
      <div style={{ fontSize: 26, marginTop: 48 }}>www.jingledecor.com.ua</div>
    </div>, size,
  )
}
