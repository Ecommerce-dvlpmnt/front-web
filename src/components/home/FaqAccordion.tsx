"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

interface FaqItem {
  question: string
  answer: string
}

export function FaqAccordion({ items }: { items: readonly FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="space-y-3 sm:space-y-3.5">
      {items.map((faq, index) => {
        const isOpen = openIndex === index
        const answerId = `faq-answer-${index}`

        return (
          <div
            key={faq.question}
            className={cn(
              "rounded-2xl border bg-gradient-to-br from-card to-muted/25 dark:from-[#121D18] dark:to-[#16241E]/80 px-4 py-3.5 sm:px-5 sm:py-4 transition-all duration-300",
              isOpen
                ? "border-[#D4AF37]/55 shadow-luxury"
                : "border-border/85 shadow-2xs hover:border-[#D4AF37]/40"
            )}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={answerId}
              onClick={() => setOpenIndex((prev) => (prev === index ? null : index))}
              className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg py-0.5 text-left text-sm sm:text-base font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60"
            >
              <span>{faq.question}</span>
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#8C5E14] dark:text-[#F3D078] transition-transform duration-300 ease-out",
                  isOpen && "rotate-180 bg-[#D4AF37]/20"
                )}
                aria-hidden="true"
              >
                <ChevronDown className="size-4" />
              </span>
            </button>

            <div
              id={answerId}
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <p className="mt-3 border-t border-border/50 pt-3 text-xs sm:text-sm leading-relaxed sm:leading-7 text-muted-foreground">
                  {faq.answer}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
