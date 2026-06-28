import { Link, useLocation } from "react-router-dom"
import { Plus, Camera, BarChart3, Clock, AlertTriangle, Truck, CheckCircle2 } from "lucide-react"
import { useOrderStats } from "@/hooks/use-orders"

interface QuickActionsBarProps {
  showOnAllPages?: boolean
}

const quickActions = [
  {
    to: "/create-order",
    icon: <Plus size={16} />,
    label: "สร้างออร์เดอร์ใหม่",
    className: "btn-gold text-xs !py-2 !px-4",
  },
  {
    to: "/scanner",
    icon: <Camera size={16} />,
    label: "สแกนสลิป",
    className: "btn-purple text-xs !py-2 !px-4",
  },
  {
    to: "/reports",
    icon: <BarChart3 size={16} />,
    label: "รายงาน",
    className: "btn-purple text-xs !py-2 !px-4",
  },
]

export function QuickActionsBar({ showOnAllPages }: QuickActionsBarProps) {
  const location = useLocation()
  const { stats, loading } = useOrderStats()

  const showOnPaths = ["/create-order", "/manage-orders", "/quick-order", "/scanner"]
  if (!showOnAllPages && !showOnPaths.includes(location.pathname)) return null

  const statItems = [
    {
      label: "ออร์เดอร์วันนี้",
      value: loading ? "…" : String(stats.todayOrders),
      icon: <Clock size={14} />,
      color: "text-gold-500",
    },
    {
      label: "รอตรวจสอบ",
      value: loading ? "…" : String(stats.pendingReview),
      icon: <AlertTriangle size={14} />,
      color: "text-[#EAB308]",
    },
    {
      label: "รอจัดส่ง",
      value: loading ? "…" : String(stats.pendingShipping),
      icon: <Truck size={14} />,
      color: "text-[#F97316]",
    },
    {
      label: "สำเร็จวันนี้",
      value: loading ? "…" : String(stats.completedToday),
      icon: <CheckCircle2 size={14} />,
      color: "text-[#22C55E]",
    },
  ]

  return (
    <div className="glass-panel-strong mb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Stats */}
        <div className="flex flex-wrap gap-3">
          {statItems.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-2 rounded-xl bg-black/30 px-3 py-1.5 border border-gold-500/10"
            >
              <span className={stat.color}>{stat.icon}</span>
              <span className="text-[10px] text-gold-100/50 font-heading uppercase tracking-wider">
                {stat.label}
              </span>
              <span className={`text-sm font-heading font-bold ${stat.color}`}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 flex-shrink-0">
          {quickActions.map((action) => (
            <Link key={action.to} to={action.to} className={action.className}>
              {action.icon}
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}