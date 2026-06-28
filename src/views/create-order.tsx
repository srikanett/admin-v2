import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { doc, getDoc } from "firebase/firestore"
import { getDbInstance, isInitialized } from "@/lib/firebase"
import { COLLECTIONS } from "@/lib/constants"
import { readField_ } from "@/lib/helpers"
import { OrderForm } from "@/components/orders/order-form"
import { Loader2, Edit3 } from "lucide-react"

interface EditOrderData {
  orderDocId: string
  orderId: string
  customerName: string
  customerPhone: string
  customerAddress: string
  customerBirthday: string
  note: string
  shippingFee: number
  paymentMethod: "โอน" | "COD"
  isCeremony: boolean
  ceremonyName?: string
  ceremonyDate?: string
  participantName?: string
  participantBirthday?: string
  participantName2?: string
  participantBirthday2?: string
  participantSlots?: number
}

export function createOrderView() {
  const [searchParams] = useSearchParams()
  const editOrderId = searchParams.get("edit")
  const [editData, setEditData] = useState<EditOrderData | null>(null)
  const [loading, setLoading] = useState(!!editOrderId)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!editOrderId || !isInitialized()) {
      setLoading(false)
      return
    }

    const fetchOrder = async () => {
      try {
        const db = getDbInstance()

        // Try both collections
        for (const colName of [COLLECTIONS.ORDERS, COLLECTIONS.CEREMONY_ORDERS]) {
          const q = doc(db, colName, editOrderId)
          // Search by OrderID field
          // For now, try direct doc ID or search
          try {
            // Try looking up by OrderID field using collection query
            const { collection, query, where, getDocs } = await import("firebase/firestore")
            const colRef = collection(db, colName)
            const q2 = query(colRef, where("OrderID", "==", editOrderId))
            const snap = await getDocs(q2)

            if (!snap.empty) {
              const orderDoc = snap.docs[0]
              const data: EditOrderData = {
                orderDocId: orderDoc.id,
                orderId: readField_(orderDoc, ["OrderID"], "")!,
                customerName: readField_(orderDoc, ["CustomerName"], "")!,
                customerPhone: readField_(orderDoc, ["CustomerPhone"], "")!,
                customerAddress: readField_(orderDoc, ["CustomerAddress"], "")!,
                customerBirthday: readField_(orderDoc, ["CustomerBirthday"], "")!,
                note: readField_(orderDoc, ["Note"], "")!,
                shippingFee: readField_(orderDoc, ["ShippingFee"], 0)!,
                paymentMethod: (readField_(orderDoc, ["PaymentMethod"], "โอน") as "โอน" | "COD") || "โอน",
                isCeremony: colName === COLLECTIONS.CEREMONY_ORDERS,
                ceremonyName: readField_(orderDoc, ["CeremonyName"], ""),
                ceremonyDate: readField_(orderDoc, ["CeremonyDate"], ""),
                participantName: readField_(orderDoc, ["ParticipantName"], ""),
                participantBirthday: readField_(orderDoc, ["ParticipantBirthday"], ""),
                participantName2: readField_(orderDoc, ["ParticipantName2"], ""),
                participantBirthday2: readField_(orderDoc, ["ParticipantBirthday2"], ""),
                participantSlots: readField_(orderDoc, ["ParticipantSlots"], 1),
              }
              setEditData(data)
              setLoading(false)
              return
            }
          } catch {
            continue
          }
        }
        setError("ไม่พบออร์เดอร์นี้")
      } catch (err) {
        setError(err instanceof Error ? err.message : "โหลดข้อมูลล้มเหลว")
      }
      setLoading(false)
    }

    fetchOrder()
  }, [editOrderId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 size={32} className="animate-spin text-gold-500" />
        <p className="text-gold-100/50 font-heading text-sm">กำลังโหลดออร์เดอร์...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-rose-400 font-heading">{error}</p>
        <button onClick={() => window.location.hash = "#/create-order"} className="btn-purple text-sm">
          สร้างออร์เดอร์ใหม่
        </button>
      </div>
    )
  }

  if (editData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Edit3 size={18} className="text-gold-500" />
          <span className="text-gold-500 font-heading text-sm">กำลังแก้ไข: </span>
          <code className="text-gold-300 font-mono text-sm">{editData.orderId}</code>
        </div>
        <OrderForm
          editData={{
            customerName: editData.customerName,
            customerPhone: editData.customerPhone,
            customerAddress: editData.customerAddress,
            customerBirthday: editData.customerBirthday,
            note: editData.note,
            shippingFee: editData.shippingFee,
            paymentMethod: editData.paymentMethod,
            isCeremony: editData.isCeremony,
            ceremonyName: editData.ceremonyName,
            ceremonyDate: editData.ceremonyDate,
            participantName: editData.participantName,
            participantBirthday: editData.participantBirthday,
            participantName2: editData.participantName2,
            participantBirthday2: editData.participantBirthday2,
            participantSlots: editData.participantSlots,
          }}
          editOrderDocId={editData.orderDocId}
          editIsCeremony={editData.isCeremony}
        />
      </div>
    )
  }

  return <OrderForm />
}