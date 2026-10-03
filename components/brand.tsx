import iconUrl from "url:~assets/icon.svg"

import { cn } from "~lib/utils"

export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      alt=""
      aria-hidden
      className={cn("size-7 shrink-0 rounded-md", className)}
      src={iconUrl}
    />
  )
}

export function Brand({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <BrandMark />
      <span className="font-heading font-semibold text-[15px] tracking-tight whitespace-nowrap">
        .MD this page
      </span>
    </div>
  )
}
