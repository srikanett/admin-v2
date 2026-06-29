import { useState, useEffect, useMemo } from "react"
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  limit,
  type DocumentSnapshot,
  type DocumentData,
} from "firebase/firestore"
import { getDbInstance, isInitialized } from "@/lib/firebase"
import { COLLECTIONS } from "@/lib/constants"
import { readField_, formatThaiCurrency } from "@/lib/helpers"
import { ORDER_STATUS } from "@/types"
import { GlassPanel } from "@/components/ui/glass-panel"
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Truck,
} from "lucide-react"

interface OrderSnap {
  Status: string
  TotalPrice: number
  Date: string
}

function transformOrder(doc: DocumentSnapshot<DocumentData>): OrderSnap {
  return {
    Status: readField_(doc, ["Status", "status"], ORDER_STATUS.CREATED)!,
    TotalPrice: readField_(doc, ["TotalPrice", "totalPrice"], 0)!,
    Date: readField_(doc, ["Date", "date"], "")!,
  }
}

export function reportsView() {
  const [orders, setOrders] = useState<OrderSnap[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isInitialized()) {
      setLoading(false)
      return
    }

    try {
      const db = getDbInstance()

      // Fetch orders
      const qOrders = query(collection(db, COLLECTIONS.ORDERS), orderBy("Date", "desc"), limit(1000))
      const qCeremony = query(collection(db, COLLECTIONS.CEREMONY_ORDERS), orderBy("Date", "desc"), limit(500))

      let allOrders: OrderSnap[] = []

      const unsub1 = onSnapshot(qOrders, (snap) => {
        allOrders = snap.docs.map(transformOrder)
        setOrders([...allOrders])
        setLoading(false)
      })

      const unsub2 = onSnapshot(qCeremony, (snap) => {
        const ceremonyOrders = snap.docs.map(transformOrder)
        allOrders = [...allOrders, ...ceremonyOrders]
        setOrders([...allOrders])
        setLoading(false)
      })

      return () => {
        unsub1()
        unsub2()
      }
    } catch {
      setLoading(false)
    }
  }, [])

  // ── Compute stats ──
  const stats = useMemo(() => {
    const now = new Date()
    const todayStr = now.toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).replace(/\//g, "/")

    const thisMonth = `${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear() + 543}`

    let todayOrders = 0
    let todayRevenue = 0
    let monthOrders = 0
    let monthRevenue = 0
    let totalOrders = orders.length
    let totalRevenue = 0
    const statusCount: Record<string, number> = {}
    let completedToday = 0

    for (const o of orders) {
      totalRevenue += o.TotalPrice

      // Status count
      statusCount[o.Status] = (statusCount[o.Status] ?? 0) + 1

      // Today
      if (o.Date.startsWith(todayStr)) {
        todayOrders++
        todayRevenue += o.TotalPrice
        if (o.Status === "สำเร็จ") completedToday++
      }

      // This month
      if (o.Date.includes(`/${thisMonth}`)) {
        monthOrders++
        monthRevenue += o.TotalPrice
      }
    }

    return {
      todayOrders,
      todayRevenue,
      monthOrders,
      monthRevenue,
      totalOrders,
      totalRevenue,
      statusCount,
      completedToday,
    }
  }, [orders])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
      </div>
    )
  }

  const statCards = [
    {
      label: "ออร์เดอร์วันนี้",
      value: stats.todayOrders,
      sub: formatThaiCurrency(stats.todayRevenue),
      icon: <ShoppingCart size={24} />,
      color: "from-gold-500/20 to-gold-500/5",
      border: "border-gold-500/20",
      textColor: "text-gold-500",
    },
    {
      label: "รายได้วันนี้",
      value: formatThaiCurrency(stats.todayRevenue),
      sub: `${stats.completedToday} สำเร็จ`,
      icon: <DollarSign size={24} />,
      color: "from-emerald-500/20 to-emerald-500/5",
      border: "border-emerald-500/20",
      textColor: "text-emerald-400",
    },
    {
      label: "เดือนนี้",
      value: stats.monthOrders,
      sub: formatThaiCurrency(stats.monthRevenue),
      icon: <TrendingUp size={24} />,
      color: "from-blue-500/20 to-blue-500/5",
      border: "border-blue-500/20",
      textColor: "text-blue-400",
    },
    {
      label: "ทั้งหมด",
      value: stats.totalOrders,
      sub: formatThaiCurrency(stats.totalRevenue),
      icon: <Package size={24} />,
      color: "from-purple-500/20 to-purple-500/5",
      border: "border-purple-500/20",
      textColor: "text-purple-400",
    },
  ]

  const statusCards = [
    {
      label: "รอตรวจสอบ",
      count: (stats.statusCount["รอตรวจสอบ"] ?? 0) + (stats.statusCount["ชำระเงินสำเร็จ"] ?? 0),
      icon: <AlertTriangle size={20} />,
      color: "text-[#EAB308]",
      bg: "bg-[#EAB308]/10",
      border: "border-[#EAB308]/20",
    },
    {
      label: "รอจัดส่ง",
      count: stats.statusCount["รอจัดส่ง"] ?? 0,
      icon: <Truck size={20} />,
      color: "text-[#F97316]",
      bg: "bg-[#F97316]/10",
      border: "border-[#F97316]/20",
    },
    {
      label: "สำเร็จ",
      count: stats.statusCount["สำเร็จ"] ?? 0,
      icon: <CheckCircle2 size={20} />,
      color: "text-[#22C55E]",
      bg: "bg-[#22C55E]/10",
      border: "border-[#22C55E]/20",
    },
    {
      label: "สร้างใหม่",
      count: stats.statusCount["สร้างออร์เดอร์"] ?? 0,
      icon: <Clock size={20} />,
      color: "text-gold-100/75",
      bg: "bg-gold-100/5",
      border: "border-gold-100/10",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/15">
          <BarChart3 size={22} className="text-gold-500" />
        </div>
        <h1 className="text-xl md:text-2xl font-heading text-gold-500">รายงาน</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <GlassPanel key={card.label} className="!p-5">
            <div className="flex items-start justify-between mb-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} ${card.border} border`}
              >
                <span className={card.textColor}>{card.icon}</span>
              </div>
            </div>
            <p className="text-xs text-gold-100/65 uppercase tracking-wider mb-1">
              {card.label}
            </p>
            <p className="text-2xl font-heading font-bold text-white">{card.value}</p>
            <p className="text-xs text-gold-100/80 mt-1">{card.sub}</p>
          </GlassPanel>
        ))}
      </div>

      {/* Status breakdown */}
      <GlassPanel>
        <h3 className="text-sm font-heading text-gold-300 mb-4 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
          สรุปตามสถานะ
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statusCards.map((card) => (
            <div
              key={card.label}
              className={`flex items-center gap-3 rounded-xl ${card.bg} ${card.border} border p-4`}
            >
              <span className={card.color}>{card.icon}</span>
              <div>
                <p className="text-xs text-gold-100/65">{card.label}</p>
                <p className={`text-xl font-heading font-bold ${card.color}`}>
                  {card.count}
                </p>
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>

      {/* Revenue summary */}
      <GlassPanel>
        <h3 className="text-sm font-heading text-gold-300 mb-4 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
          สรุปรายได้
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-black/30 p-5 border border-gold-500/10">
            <p className="text-xs text-gold-100/65 uppercase tracking-wider mb-2">
              วันนี้
            </p>
            <p className="text-3xl font-heading font-bold text-gold-500">
              {formatThaiCurrency(stats.todayRevenue)}
            </p>
            <p className="text-sm text-gold-100/80 mt-1">
              จาก {stats.todayOrders} ออร์เดอร์
            </p>
          </div>
          <div className="rounded-xl bg-black/30 p-5 border border-gold-500/10">
            <p className="text-xs text-gold-100/65 uppercase tracking-wider mb-2">
              เดือนนี้
            </p>
            <p className="text-3xl font-heading font-bold text-gold-500">
              {formatThaiCurrency(stats.monthRevenue)}
            </p>
            <p className="text-sm text-gold-100/80 mt-1">
              จาก {stats.monthOrders} ออร์เดอร์
            </p>
          </div>
        </div>
      </GlassPanel>
    </div>
  )
}