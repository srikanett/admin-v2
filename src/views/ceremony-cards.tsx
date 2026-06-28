import { useState, useEffect } from "react"
import { collection, query, onSnapshot, orderBy, limit, type DocumentSnapshot, type DocumentData } from "firebase/firestore"
import { getDbInstance, isInitialized } from "@/lib/firebase"
import { COLLECTIONS } from "@/lib/constants"
import { readField_ } from "@/lib/helpers"
import { GlassPanel } from "@/components/ui/glass-panel"
import { Sparkles, Users, Calendar } from "lucide-react"

interface CeremonyRecord {
  id: string
  name: string
  date: string
  participants: number
  price: number
}

function transformCeremony(doc: DocumentSnapshot<DocumentData>): CeremonyRecord {
  return {
    id: doc.id,
    name: readField_(doc, ["CeremonyName", "name", "Name"], "")!,
    date: readField_(doc, ["CeremonyDate", "Date", "date"], "")!,
    participants: readField_(doc, ["ParticipantSlots", "participantSlots"], 0)!,
    price: readField_(doc, ["TotalPrice", "BasePrice", "price"], 0)!,
  }
}

export function ceremonyCardsView() {
  const [ceremonies, setCeremonies] = useState<CeremonyRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isInitialized()) { setLoading(false); return }
    try {
      const db = getDbInstance()
      const q = query(collection(db, COLLECTIONS.CEREMONY_ORDERS), orderBy("Date", "desc"), limit(200))
      return onSnapshot(q, (snap) => {
        setCeremonies(snap.docs.map(transformCeremony))
        setLoading(false)
      })
    } catch { setLoading(false) }
  }, [])

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/15"><Sparkles size={22} className="text-gold-500" /></div>
        <h1 className="text-xl md:text-2xl font-heading text-gold-500">การ์ดคำทำนาย</h1>
      </div>
      <GlassPanel>
        {ceremonies.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gold-100/30"><Sparkles size={48} className="mb-3" /><p className="font-heading">ยังไม่มีพิธี</p></div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ceremonies.map((c) => (
              <div key={c.id} className="rounded-xl border border-gold-500/10 bg-black/30 p-5 hover:border-gold-500/30 transition-all">
                <h3 className="font-heading text-gold-500 text-lg mb-3">{c.name}</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gold-100/60 text-sm"><Calendar size={14} />{c.date || "ไม่ระบุ"}</div>
                  <div className="flex items-center gap-2 text-gold-100/60 text-sm"><Users size={14} />{c.participants} ผู้ร่วมพิธี</div>
                </div>
                <p className="text-xl font-heading font-bold text-gold-500 mt-3">฿{c.price.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>
    </div>
  )
}