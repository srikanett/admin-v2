import { useState, useEffect } from "react"
import { collection, query, onSnapshot, orderBy, limit, type DocumentSnapshot, type DocumentData } from "firebase/firestore"
import { getDbInstance, isInitialized } from "@/lib/firebase"
import { COLLECTIONS } from "@/lib/constants"
import { readField_, formatThaiCurrency } from "@/lib/helpers"
import { GlassPanel } from "@/components/ui/glass-panel"
import { Image, AlertTriangle, ExternalLink, File } from "lucide-react"

interface SlipRecord {
  id: string
  orderId: string
  customerName: string
  amount: number
  imageUrl: string
  uploadedAt: string
  status: string
}

function transformSlip(doc: DocumentSnapshot<DocumentData>): SlipRecord {
  return {
    id: doc.id,
    orderId: readField_(doc, ["OrderID", "orderId"], "")!,
    customerName: readField_(doc, ["CustomerName", "customerName"], "")!,
    amount: readField_(doc, ["TotalPrice", "amount"], 0)!,
    imageUrl: readField_(doc, ["SlipURL", "slipURL", "imageUrl"], "")!,
    uploadedAt: readField_(doc, ["Date", "uploadedAt"], "")!,
    status: readField_(doc, ["Status", "status"], "")!,
  }
}

export function slipsView() {
  const [slips, setSlips] = useState<SlipRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isInitialized()) { setLoading(false); return }
    try {
      const db = getDbInstance()
      const qOrd = query(collection(db, COLLECTIONS.ORDERS), orderBy("Date", "desc"), limit(500))
      const qCer = query(collection(db, COLLECTIONS.CEREMONY_ORDERS), orderBy("Date", "desc"), limit(200))
      const unsubs = [onSnapshot(qOrd, (s) => {
        const all = s.docs.map(transformSlip).filter(s => s.imageUrl)
        setSlips(all)
        setLoading(false)
      }), onSnapshot(qCer, (s) => {
        setSlips(prev => [...prev, ...s.docs.map(transformSlip).filter(s => s.imageUrl)])
      })]
      return () => unsubs.forEach(u => u())
    } catch { setLoading(false) }
  }, [])

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/15"><Image size={22} className="text-gold-500" /></div>
        <h1 className="text-xl md:text-2xl font-heading text-gold-500">สลิปการชำระเงิน</h1>
      </div>
      <GlassPanel>
        {slips.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gold-100/30"><Image size={48} className="mb-3" /><p className="font-heading">ยังไม่มีสลิป</p></div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {slips.map((slip) => (
              <a key={slip.id} href={slip.imageUrl} target="_blank" rel="noopener noreferrer" className="group block rounded-xl overflow-hidden border border-gold-500/10 bg-black/30 hover:border-gold-500/30 transition-all">
                <div className="aspect-[4/3] bg-black/40 flex items-center justify-center">
                  {slip.imageUrl ? (
                    <img src={slip.imageUrl} alt={slip.orderId} className="w-full h-full object-cover" loading="lazy" />
                  ) : <File size={40} className="text-gold-500/20" />}
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <code className="text-xs text-gold-500 font-mono">{slip.orderId}</code>
                    <ExternalLink size={12} className="text-gold-100/20 group-hover:text-gold-500 transition-colors" />
                  </div>
                  <p className="text-sm text-white/90 font-heading truncate">{slip.customerName}</p>
                  <p className="text-xs text-gold-100/50 mt-0.5">{formatThaiCurrency(slip.amount)} · {slip.uploadedAt}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </GlassPanel>
    </div>
  )
}