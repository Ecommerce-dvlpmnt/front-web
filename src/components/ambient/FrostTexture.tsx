/**
 * Мягкая бархатная световая виньетка по краям экрана (без зернистого шума поверх карточек и фото).
 * Добавляет глубину хвойному и алебастровому фону, сохраняя кристальную четкость фотографий.
 */
export function FrostTexture() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_62%,rgba(212,175,55,0.04)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_58%,rgba(6,12,10,0.55)_100%)]" />
    </div>
  )
}
