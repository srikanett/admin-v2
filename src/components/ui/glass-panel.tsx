import { cn } from "@/lib/utils"
import type { HTMLAttributes } from "react"

type GlassPanelVariant = "default" | "customer" | "order" | "product" | "ceremony" | "note"

const variantBorders: Record<GlassPanelVariant, string> = {
  default: "border-gold-500/20",
  customer: "border-gold-500/50",
  order: "border-[#E63946]/50",
  product: "border-rose-500/50",
  ceremony: "border-purple-800/80",
  note: "border-[#0ea5e9]/50",
}

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: GlassPanelVariant
  noHover?: boolean
}

export function GlassPanel({
  className,
  variant = "default",
  noHover = false,
  children,
  ...props
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        "glass-panel",
        noHover || "glass-panel-hover",
        variantBorders[variant],
        "p-4 md:p-5 lg:p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}