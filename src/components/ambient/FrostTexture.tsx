/**
 * Деликатная текстура морозного инея и тактильного микро-зерна.
 * Создает эффект взгляда сквозь легкую зимнюю морозную дымку.
 */
export function FrostTexture() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-20 overflow-hidden"
      aria-hidden="true"
    >
      {/* Мягкая морозная виньетка по краям экрана */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_65%,rgba(212,175,55,0.035)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(11,21,18,0.6)_100%)]" />

      {/* Тактильное микро-зерно дорогой бумаги / инея */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}
