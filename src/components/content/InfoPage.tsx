import type { ReactNode } from "react"

interface InfoPageProps {
  eyebrow?: string
  title: string
  description: string
  children: ReactNode
}

export function InfoPage({
  eyebrow = "Lumière",
  title,
  description,
  children,
}: InfoPageProps) {
  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <header className="max-w-2xl">
          <p className="text-sm font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            {description}
          </p>
        </header>
        <div className="mt-10 max-w-none space-y-6 text-muted-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_li]:leading-7 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_p]:leading-7 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
          {children}
        </div>
      </div>
    </div>
  )
}
