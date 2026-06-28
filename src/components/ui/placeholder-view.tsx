import type { LucideIcon } from "lucide-react"
import { GlassPanel } from "@/components/ui/glass-panel"

interface PlaceholderViewProps {
  title: string
  icon: LucideIcon
  description?: string
  children?: React.ReactNode
}

export function PlaceholderView({
  title,
  icon: Icon,
  description,
  children,
}: PlaceholderViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/15">
          <Icon size={22} className="text-gold-500" />
        </div>
        <h1 className="aurora-heading text-xl md:text-2xl">{title}</h1>
      </div>

      {description && (
        <p className="text-gold-100/50 text-sm">{description}</p>
      )}

      {children || (
        <GlassPanel>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-gold-100/40 text-sm">
              หน้านี้อยู่ระหว่างการพัฒนา
            </p>
            <p className="text-gold-100/20 text-xs mt-1">
              รอการ implement ใน Phase ถัดไป
            </p>
          </div>
        </GlassPanel>
      )}
    </div>
  )
}