"use client"

interface Snowflake {
  id: number
  left: number
  fallDuration: number
  swayDuration: number
  delay: number
  opacity: number
  drift: number
  size: number
  isWarm: boolean
  shape: "dot" | "bokeh" | "snowflake" | "sparkle"
  visibilityClass: string
}

function generateSnowLayer(count: number, layerSeed: number, depth: "bg" | "mid" | "fg"): Snowflake[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = ((index + layerSeed * 23) * 9301 + 49297) % 233280
    const rand = seed / 233280

    const isWarm = index % 4 === 1
    let shape: Snowflake["shape"] = "dot"
    let size = 3.2
    let fallDuration = 14
    let opacity = 0.55
    let visibilityClass = "hidden lg:block"

    if (depth === "bg") {
      size = 2.6 + (index % 3) * 0.7
      fallDuration = 14.5 + (index % 6) * 1.6
      opacity = 0.46 + (index % 4) * 0.07
      // На мобільних — ~10 легких фонових сніжинок, на планшетах та ПК — усі 76
      visibilityClass = index % 8 === 0 ? "block" : index % 2 === 0 ? "hidden md:block" : "hidden lg:block"
    } else if (depth === "mid") {
      if (index % 7 === 2) {
        shape = "snowflake"
        size = 10 + (index % 3) * 1.5
      } else if (index % 9 === 4) {
        shape = "sparkle"
        size = 8.5 + (index % 2) * 1.5
      } else {
        shape = "dot"
        size = 4.0 + (index % 3) * 0.9
      }
      fallDuration = 11 + (index % 5) * 1.5
      opacity = 0.6 + (index % 4) * 0.07
      // На мобільних — ~12 середніх сніжинок, на ПК — усі 72
      visibilityClass = shape === "dot" && index % 6 === 0 ? "block" : index % 2 === 0 ? "hidden md:block" : "hidden lg:block"
    } else {
      if (index % 5 === 1) {
        shape = "snowflake"
        size = 13 + (index % 3) * 2
      } else if (index % 6 === 3) {
        shape = "sparkle"
        size = 10 + (index % 2) * 2
      } else if (index % 3 === 0) {
        shape = "bokeh"
        size = 7.5 + (index % 3) * 1.5
      } else {
        shape = "dot"
        size = 5.5 + (index % 3) * 1.1
      }
      fallDuration = 8.8 + (index % 5) * 1.4
      opacity = 0.68 + (index % 3) * 0.09
      // На мобільних — ~5 великих сніжинок, на ПК — усі 48
      visibilityClass = shape === "dot" && index % 9 === 0 ? "block" : index % 3 === 0 ? "hidden md:block" : "hidden lg:block"
    }

    return {
      id: index + layerSeed * 1000,
      left: Math.round(((index * (99.2 / count) + rand * 3.4) % 99.2) * 10) / 10,
      fallDuration,
      swayDuration: 3.4 + (index % 5) * 0.65,
      delay: -((index * 1.15 + layerSeed * 2.3 + rand * 7) % fallDuration),
      opacity,
      drift: (index % 2 === 0 ? 1 : -1) * (18 + (index % 5) * 8),
      size,
      isWarm,
      shape,
      visibilityClass,
    }
  })
}

// ~98 сніжинок на ПК (3 шари глибини) та ~14 легких сніжинок на смартфонах
const BG_SNOW = generateSnowLayer(38, 1, "bg")
const MID_SNOW = generateSnowLayer(36, 2, "mid")
const FG_SNOW = generateSnowLayer(24, 3, "fg")

function SnowflakeShape({ flake }: { flake: Snowflake }) {
  if (flake.shape === "snowflake") {
    return (
      <svg
        width={flake.size}
        height={flake.size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className={
          flake.isWarm
            ? "text-[#C99B3B] drop-shadow-[0_0_4px_rgba(212,175,55,0.35)] dark:text-[#F6DC92]"
            : "text-[#9AA3AE] drop-shadow-[0_0_4px_rgba(255,255,255,0.45)] dark:text-white"
        }
      >
        <path
          d="M12 2v20M3.34 7l17.32 10M20.66 7L3.34 17M12 5l-2-2m2 2l2-2M12 19l-2 2m2-2l2 2M5.93 8.5L3.2 7.8m2.73.7l-.7-2.73M18.07 15.5l2.73.7m-2.73-.7l.7 2.73M18.07 8.5l.7-2.73m-.7 2.73l2.73-.7M5.93 15.5l-2.73.7m2.73-.7l-.7 2.73"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (flake.shape === "sparkle") {
    return (
      <svg
        width={flake.size}
        height={flake.size}
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className={flake.isWarm ? "text-[#C99B3B] dark:text-[#F3D078]" : "text-[#9EA6B0] dark:text-white"}
      >
        <path
          d="M8 0C8 5.8 9.2 8 16 8C9.2 8 8 10.2 8 16C8 10.2 6.8 8 0 8C6.8 8 8 5.8 8 0Z"
          fill="currentColor"
        />
      </svg>
    )
  }

  if (flake.shape === "bokeh") {
    return (
      <span
        className={`block rounded-full blur-[0.8px] ${flake.isWarm ? "snow-particle-warm" : "snow-particle-cool"}`}
        style={{
          width: `${flake.size}px`,
          height: `${flake.size}px`,
        }}
      />
    )
  }

  return (
    <span
      className={`block rounded-full ${flake.isWarm ? "snow-particle-warm" : "snow-particle-cool"}`}
      style={{
        width: `${flake.size}px`,
        height: `${flake.size}px`,
      }}
    />
  )
}

function SnowLayer({ snowflakes }: { snowflakes: Snowflake[] }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {snowflakes.map((s) => (
        <span
          key={s.id}
          className={`snow-fall-wrapper pointer-events-none absolute top-0 ${s.visibilityClass}`}
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
            <SnowflakeShape flake={s} />
          </span>
        </span>
      ))}
    </div>
  )
}

export function WinterSnow() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
      aria-hidden="true"
    >
      <SnowLayer snowflakes={BG_SNOW} />
      <SnowLayer snowflakes={MID_SNOW} />
      <SnowLayer snowflakes={FG_SNOW} />
    </div>
  )
}
