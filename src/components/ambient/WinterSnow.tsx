"use client"

import { useEffect, useRef } from "react"

interface Snowflake {
  id: number
  left: number
  fallDuration: number
  swayDuration: number
  delay: number
  opacity: number
  drift: number
  size: number
  color: string
}

function generateSnowLayer(count: number, layerSeed: number, depth: "bg" | "mid" | "fg"): Snowflake[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = ((index + layerSeed * 17) * 9301 + 49297) % 233280
    const rand = seed / 233280

    const isWarm = index % 3 === 1
    const color = isWarm ? "#FDEFC8" : "#FFFFFF"

    let size = 2
    let fallDuration = 18
    let opacity = 0.2

    if (depth === "bg") {
      size = index % 3 === 0 ? 2 : 1.5
      fallDuration = 22 + (index % 5) * 2
      opacity = 0.16 + (index % 3) * 0.04
    } else if (depth === "mid") {
      size = index % 3 === 0 ? 3.5 : 2.5
      fallDuration = 16 + (index % 5) * 2
      opacity = 0.22 + (index % 4) * 0.04
    } else {
      size = index % 2 === 0 ? 5 : 4
      fallDuration = 13 + (index % 4) * 2
      opacity = 0.28 + (index % 3) * 0.04
    }

    return {
      id: index + layerSeed * 100,
      left: Math.round(((index * 6.5 + rand * 5) % 98) * 10) / 10,
      fallDuration,
      swayDuration: 4 + (index % 4) * 0.8,
      delay: -((index * 2.2 + layerSeed * 3) % 24),
      opacity,
      drift: (index % 2 === 0 ? 1 : -1) * (16 + (index % 3) * 8),
      size,
      color,
    }
  })
}

const BG_SNOW = generateSnowLayer(14, 1, "bg")
const MID_SNOW = generateSnowLayer(16, 2, "mid")
const FG_SNOW = generateSnowLayer(10, 3, "fg")

export function WinterSnow() {
  const bgRef = useRef<HTMLDivElement>(null)
  const midRef = useRef<HTMLDivElement>(null)
  const fgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let ticking = false

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY
          // Деликатный сдвиг слоев снега вместе с нативным скроллом страницы
          if (bgRef.current) {
            bgRef.current.style.transform = `translate3d(0, ${scrollY * -0.05}px, 0)`
          }
          if (midRef.current) {
            midRef.current.style.transform = `translate3d(0, ${scrollY * -0.14}px, 0)`
          }
          if (fgRef.current) {
            fgRef.current.style.transform = `translate3d(0, ${scrollY * -0.28}px, 0)`
          }
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  function renderLayer(snowflakes: Snowflake[], ref: React.RefObject<HTMLDivElement | null>) {
    return (
      <div ref={ref} className="pointer-events-none absolute inset-0 will-change-transform">
        {snowflakes.map((s) => (
          <span
            key={s.id}
            className="snow-fall-wrapper absolute top-0 block pointer-events-none"
            style={
              {
                left: `${s.left}%`,
                animationName: "snowFall",
                animationDuration: `${s.fallDuration}s`,
                animationTimingFunction: "linear",
                animationIterationCount: "infinite",
                animationDelay: `${s.delay}s`,
                "--snow-opacity": s.opacity,
              } as React.CSSProperties
            }
          >
            <span
              className="snow-sway-particle block"
              style={
                {
                  animationName: "snowSway",
                  animationDuration: `${s.swayDuration}s`,
                  animationTimingFunction: "ease-in-out",
                  animationIterationCount: "infinite",
                  "--snow-drift": `${s.drift}px`,
                } as React.CSSProperties
              }
            >
              <span
                className="block rounded-full"
                style={{
                  width: `${s.size}px`,
                  height: `${s.size}px`,
                  backgroundColor: s.color,
                  boxShadow:
                    s.color === "#FDEFC8"
                      ? "0 0 6px 1px rgba(243, 208, 120, 0.4)"
                      : "0 0 5px 1px rgba(255, 255, 255, 0.5)",
                }}
              />
            </span>
          </span>
        ))}
      </div>
    )
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
      aria-hidden="true"
    >
      {renderLayer(BG_SNOW, bgRef)}
      {renderLayer(MID_SNOW, midRef)}
      {renderLayer(FG_SNOW, fgRef)}
    </div>
  )
}
