// ═══════════════════════════════════════════════
// Order Mutations (Firestore writes)
// ═══════════════════════════════════════════════

import { collection, addDoc, doc, updateDoc, query, where, onSnapshot } from "firebase/firestore"
import { getDbInstance, isInitialized } from "@/lib/firebase"
import { COLLECTIONS, ORDERCUS_WEB_URL } from "@/lib/constants"
import { generateOrderId, formatThaiDateTime, calcItemPrice, readField_ } from "@/lib/helpers"
import { createBeamCharge, deliverLineNotify } from "@/lib/api"
import { ORDER_STATUS } from "@/types"
import type { OrderFields, PaymentMethod, Bank } from "@/types"

// ── Types ──

export interface CreateOrderInput {
  type?: "product" | "ceremony"
  customerName: string
  customerPhone: string
  customerAddress?: string
  customerBirthday?: string
  note?: string
  shippingFee: number
  paymentMethod: PaymentMethod
  bank?: Pick<Bank, "bankName" | "accountNumber" | "accountHolder" | "promptPayId" | "promptPayType"> | null
  items: Array<{
    name: string
    unitPrice: number
    quantity: number
    discount: number
  }>
  // Ceremony fields
  ceremony?: {
    ceremonyName: string
    ceremonyDate?: string
    participantName?: string
    participantBirthday?: string
    participantName2?: string
    participantBirthday2?: string
    participantSlots?: number
    ceremonyNote?: string
  } | null
  passcode?: string
}

export interface CreateOrderResult {
  orderId: string
  docId: string
  shareUrl: string
}

// ── Helpers ──

/** Map up to 20 items into Firestore flat ItemN fields */
function mapItemsToFields(
  items: CreateOrderInput["items"],
): Record<string, string | number> {
  const fields: Record<string, string | number> = {}
  for (let i = 0; i < Math.min(items.length, 20); i++) {
    const n = i + 1
    const item = items[i]
    if (!item.name.trim()) continue
    const price = calcItemPrice(item.unitPrice, item.discount, item.quantity)
    fields[`Item${n}Name`] = item.name
    fields[`Item${n}Price`] = price
    fields[`Item${n}Qty`] = item.quantity
    fields[`Item${n}UnitPrice`] = item.unitPrice
    fields[`Item${n}Discount`] = item.discount
  }
  return fields
}

// ── Mutations ──

/**
 * Create a new order in Firestore.
 *
 * 1. Generates a real OrderID via orderIdLedger
 * 2. Writes the order doc to orders (or ceremonyOrders)
 * 3. Triggers Beam QR generation
 * 4. Sends LINE notification to customer
 *
 * Returns the OrderID, Firestore doc ID, and share URL.
 */
export async function createOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const db = getDbInstance()
  const isCeremony = input.type === "ceremony" && !!input.ceremony
  const orderType = isCeremony ? "ceremony" : "product"

  // 1. Generate OrderID
  const orderId = await generateOrderId(orderType as "product" | "ceremony", db)

  // 2. Compute totals
  const itemsTotal = input.items.reduce(
    (sum, item) => sum + calcItemPrice(item.unitPrice, item.discount, item.quantity),
    0,
  )
  const totalPrice = itemsTotal + input.shippingFee

  // 3. Build doc data
  const itemFields = mapItemsToFields(input.items)

  const orderData: Record<string, unknown> = {
    OrderID: orderId,
    Date: formatThaiDateTime(new Date()),
    CustomerName: input.customerName.trim(),
    CustomerPhone: input.customerPhone.trim(),
    CustomerAddress: input.customerAddress?.trim() ?? "",
    CustomerBirthday: input.customerBirthday?.trim() ?? "",
    Status: ORDER_STATUS.CREATED,
    TotalPrice: totalPrice,
    ShippingFee: input.shippingFee,
    PaymentMethod: input.paymentMethod,
    Note: input.note?.trim() ?? "",
    isArchived: false,
    ...itemFields,
  }

  // Bank
  if (input.bank) {
    orderData.Bank_Name = input.bank.bankName
    orderData.Bank_Account = input.bank.accountNumber
    orderData.Bank_Holder = input.bank.accountHolder
    if (input.bank.promptPayId) {
      orderData.PromptPay_Id = input.bank.promptPayId
      orderData.PromptPay_Type = input.bank.promptPayType ?? ""
    }
  }

  // Ceremony
  if (isCeremony && input.ceremony) {
    orderData.CeremonyOrderID = orderId
    orderData.OrderType = "ceremony"
    orderData.CeremonyName = input.ceremony.ceremonyName
    orderData.CeremonyDate = input.ceremony.ceremonyDate?.trim() ?? ""
    orderData.ParticipantName = input.ceremony.participantName?.trim() ?? ""
    orderData.ParticipantBirthday = input.ceremony.participantBirthday?.trim() ?? ""
    orderData.ParticipantName2 = input.ceremony.participantName2?.trim() ?? ""
    orderData.ParticipantBirthday2 = input.ceremony.participantBirthday2?.trim() ?? ""
    orderData.ParticipantSlots = input.ceremony.participantSlots ?? 1
    orderData.CeremonyNote = input.ceremony.ceremonyNote?.trim() ?? ""
  }

  // 4. Write to Firestore
  const colName = isCeremony ? COLLECTIONS.CEREMONY_ORDERS : COLLECTIONS.ORDERS
  const colRef = collection(db, colName)
  const docRef = await addDoc(colRef, orderData)

  // 5. Build share URL
  const shareUrl = `${ORDERCUS_WEB_URL}/order/${orderId}`

  // 6. Trigger Beam QR + LINE notify (fire-and-forget — don't block save)
  const passcode = input.passcode
  if (passcode) {
    try {
      createBeamCharge(orderId, totalPrice, passcode)
    } catch {
      // Beam QR is non-blocking
    }
    try {
      deliverLineNotify(orderId, passcode)
    } catch {
      // LINE notify is non-blocking
    }
  }

  return { orderId, docId: docRef.id, shareUrl }
}

/** 
 * Update an existing order's fields.
 */
export async function updateOrder(
  orderDocId: string,
  updates: Partial<OrderFields>,
  isCeremony = false,
): Promise<void> {
  const db = getDbInstance()
  const colName = isCeremony ? COLLECTIONS.CEREMONY_ORDERS : COLLECTIONS.ORDERS
  const docRef = doc(db, colName, orderDocId)
  await updateDoc(docRef, updates as Record<string, unknown>)
}

// ── Order Stats Hook (for QuickActionsBar) ──

import { useState, useEffect } from "react"

export interface OrderStats {
  todayOrders: number
  pendingReview: number
  pendingShipping: number
  completedToday: number
}

export function useOrderStats(): { stats: OrderStats; loading: boolean } {
  const [stats, setStats] = useState<OrderStats>({
    todayOrders: 0,
    pendingReview: 0,
    pendingShipping: 0,
    completedToday: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isInitialized()) {
      setLoading(false)
      return
    }

    try {
      const db = getDbInstance()

      // Query: pending review orders
      const qPendingReview = query(
        collection(db, COLLECTIONS.ORDERS),
        where("Status", "in", ["รอตรวจสอบ", "ชำระเงินสำเร็จ"]),
      )
      const qPendingReviewC = query(
        collection(db, COLLECTIONS.CEREMONY_ORDERS),
        where("Status", "in", ["รอตรวจสอบ", "ชำระเงินสำเร็จ"]),
      )

      // Query: pending shipping
      const qPendingShip = query(
        collection(db, COLLECTIONS.ORDERS),
        where("Status", "==", "รอจัดส่ง"),
      )
      const qPendingShipC = query(
        collection(db, COLLECTIONS.CEREMONY_ORDERS),
        where("Status", "==", "รอจัดส่ง"),
      )

      // Combined listener
      let pendingReview = 0
      let pendingShipping = 0

      const unsubs = [
        onSnapshot(qPendingReview, (snap) => {
          pendingReview = snap.size
        }),
        onSnapshot(qPendingReviewC, (snap) => {
          pendingReview += snap.size
        }),
        onSnapshot(qPendingShip, (snap) => {
          pendingShipping = snap.size
        }),
        onSnapshot(qPendingShipC, (snap) => {
          pendingShipping += snap.size
        }),
      ]

      // Calculate today's stats from a broader query
      // We combine both collections and filter client-side for performance
      const qAll = query(collection(db, COLLECTIONS.ORDERS))
      const qAllC = query(collection(db, COLLECTIONS.CEREMONY_ORDERS))

      let todayCount = 0
      let doneTodayCount = 0
      const todayStr = new Date().toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).replace(/\//g, "/")

      const calcToday = () => {
        setStats({
          todayOrders: todayCount,
          pendingReview,
          pendingShipping,
          completedToday: doneTodayCount,
        })
        setLoading(false)
      }

      unsubs.push(
        onSnapshot(qAll, (snap) => {
          todayCount = 0
          doneTodayCount = 0
          snap.forEach((doc) => {
            const date = readField_<string>(doc, ["Date", "date"], "")
            const status = readField_<string>(doc, ["Status", "status"], "")
            if (date?.startsWith(todayStr)) {
              todayCount++
              if (status === "สำเร็จ") doneTodayCount++
            }
          })
          calcToday()
        }),
      )

      unsubs.push(
        onSnapshot(qAllC, (snap) => {
          snap.forEach((doc) => {
            const date = readField_<string>(doc, ["Date", "date"], "")
            const status = readField_<string>(doc, ["Status", "status"], "")
            if (date?.startsWith(todayStr)) {
              todayCount++
              if (status === "สำเร็จ") doneTodayCount++
            }
          })
          calcToday()
        }),
      )

      return () => unsubs.forEach((u) => u())
    } catch (err) {
      console.error("useOrderStats error:", err)
      setLoading(false)
    }
  }, [])

  return { stats, loading }
}