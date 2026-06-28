import { useState, useEffect, useMemo } from "react"
import { collection, query, onSnapshot, orderBy, limit, type DocumentSnapshot, type DocumentData } from "firebase/firestore"
import { getDbInstance, isInitialized } from "@/lib/firebase"
import { COLLECTIONS } from "@/lib/constants"
import { readField_ } from "@/lib/helpers"
import { GlassPanel } from "@/components/ui/glass-panel"
import { StatusBadge } from "@/components/ui/status-badge"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Truck, Package, Search } from "lucide-react"

interface ShipOrder { id: string; orderId: string; name: string; phone: string; address: string; status: string; total: number }

function transform(doc: DocumentSnapshot<DocumentData>): ShipOrder {
  return {
    id: doc.id, orderId: readField_(doc, ["OrderID"], "")!,
    name: readField_(doc, ["CustomerName"], "")!, phone: readField_(doc, ["CustomerPhone"], "")!,
    address: readField_(doc, ["CustomerAddress"], "")!,
    status: readField_(doc, ["Status"], "")!, total: readField_(doc, ["TotalPrice"], 0)!,
  }
}

export function shippingView() {
  const [orders, setOrders] = useState<ShipOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!isInitialized()) { setLoading(false); return }
    try {
      const db = getDbInstance()
      return onSnapshot(query(collection(db, COLLECTIONS.ORDERS), orderBy("Date", "desc"), limit(500)), (snap) => {
        setOrders(snap.docs.map(transform).filter(o => o.status === "รอจัดส่ง"))
        setLoading(false)
      })
    } catch { setLoading(false) }
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return orders
    const q = search.toLowerCase()
    return orders.filter(o => o.orderId.toLowerCase().includes(q) || o.name.toLowerCase().includes(q) || o.address.toLowerCase().includes(q))
  }, [orders, search])

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/15"><Truck size={22} className="text-gold-500" /></div><h1 className="text-xl md:text-2xl font-heading text-gold-500">จัดส่ง</h1></div>
      <GlassPanel><div className="relative mb-4"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-100/40" /><input className="themed-input pl-10" placeholder="ค้นหา..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        {filtered.length === 0 ? <div className="flex flex-col items-center py-20 text-gold-100/30"><Truck size={48} className="mb-3" /><p className="font-heading">ไม่มีออร์เดอร์รอจัดส่ง</p></div> : (
          <Table><TableHeader><TableRow><TableHead>OrderID</TableHead><TableHead>ลูกค้า</TableHead><TableHead>ที่อยู่</TableHead><TableHead>ยอด</TableHead><TableHead>สถานะ</TableHead></TableRow></TableHeader>
            <TableBody>{filtered.map(o => (
              <TableRow key={o.id}><TableCell className="font-mono text-gold-300 text-xs">{o.orderId}</TableCell><TableCell><span className="text-white/90 text-sm">{o.name}</span><br /><span className="text-xs text-gold-100/40">{o.phone}</span></TableCell><TableCell className="text-sm text-gold-100/60 max-w-[200px] truncate">{o.address}</TableCell><TableCell className="text-white/90">฿{o.total.toLocaleString()}</TableCell><TableCell><StatusBadge status={o.status as any} /></TableCell></TableRow>
            ))}</TableBody></Table>
        )}
      </GlassPanel>
    </div>
  )
}