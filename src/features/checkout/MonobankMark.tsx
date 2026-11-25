import Image from "next/image"

export function MonobankMark() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-lg bg-white p-2.5 dark:bg-[#101010]" aria-label="plata by mono">
      <Image src="/images/payments/plata-by-mono-light.svg" alt="plata by mono" width={124} height={26} className="h-auto w-[124px] dark:hidden" />
      <Image src="/images/payments/plata-by-mono-dark.svg" alt="" width={124} height={26} className="hidden h-auto w-[124px] dark:block" aria-hidden="true" />
    </span>
  )
}
