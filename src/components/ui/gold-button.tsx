import { cn } from "@/lib/utils"
import type { ButtonHTMLAttributes } from "react"
import { Loader2 } from "lucide-react"

type GoldButtonVariant = "gold" | "purple" | "ghost"

interface GoldButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GoldButtonVariant
  isLoading?: boolean
  icon?: React.ReactNode
}

export function GoldButton({
  className,
  variant = "gold",
  isLoading = false,
  icon,
  children,
  disabled,
  ...props
}: GoldButtonProps) {
  const variantClasses: Record<GoldButtonVariant, string> = {
    gold: "btn-gold",
    purple: "btn-purple",
    ghost: "btn-ghost",
  }

  return (
    <button
      className={cn(variantClasses[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  )
}