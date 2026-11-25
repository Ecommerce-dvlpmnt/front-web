import { HeroBanner } from "@/components/home/HeroBanner"
import { getHeroSlides } from "@/lib/api/hero"

export async function HeroSection() {
  const slides = await getHeroSlides()
  return <HeroBanner slides={slides} />
}
