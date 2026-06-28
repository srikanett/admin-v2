import { cn } from "@/lib/utils"
import { STATUS_CONFIG, type OrderStatus } from "@/types"

interface StatusBadgeProps {
  status: OrderStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  if (!config) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          className
        )}
        style={{
          backgroundColor: "rgba(154,154,154,0.2)",
          color: "#9A9A9A",
        }}
      >
        {status}
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium font-heading",
        className
      )}
      style={{
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.color}33`,
      }}
    >
      {config.label}
    </span>
  )
}