import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { shopConfig } from "@/lib/config/shop"

export function HeroBanner() {
  return (
    <section className="relative isolate min-h-[540px] overflow-hidden rounded-[2rem] bg-neutral-900 text-white shadow-sm sm:min-h-[600px]">
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1512389142860-9c449e58a543?auto=format&fit=crop&w=2200&q=85)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/45 to-black/20"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-t from-black/45 via-transparent to-black/10"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute top-8 right-8 -z-10 text-white/60 sm:top-12 sm:right-12">
        <span className="absolute -top-2 -right-6 text-2xl">✦</span>
        <span className="text-5xl">❄</span>
      </div>
      <div className="pointer-events-none absolute bottom-14 right-8 -z-10 text-3xl text-white/50 sm:right-16">
        ✦
      </div>

      <div className="flex min-h-[540px] max-w-2xl flex-col justify-end p-6 sm:min-h-[600px] sm:p-12 lg:p-16">
        <Badge className="w-fit border border-white/25 bg-white/15 px-3 py-1 text-white backdrop-blur-sm">
          {shopConfig.seasonal.badge}
        </Badge>
        <h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          {shopConfig.seasonal.title}
        </h1>
        <p className="mt-5 max-w-md text-base leading-7 text-white/80 sm:text-lg">
          {shopConfig.seasonal.description}
        </p>
        <div className="mt-8">
          <Button
            asChild
            size="lg"
            className="h-11 rounded-full bg-white px-5 text-neutral-900 hover:bg-white/90"
          >
            <Link href="#catalog">
              Переглянути колекцію
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
