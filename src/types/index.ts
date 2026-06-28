// ═══════════════════════════════════════════════
// SRIKANETT DHEVALAI — TypeScript Types
// Firestore Data Models (ใช้ฟิลด์ตาม DB จริง)
// ═══════════════════════════════════════════════

// ── Order Status ──
export const ORDER_STATUS = {
  CREATED: "สร้างออร์เดอร์",
  PAID_SUCCESS: "ชำระเงินสำเร็จ",
  PENDING_REVIEW: "รอตรวจสอบ",
  SHIPPING: "รอจัดส่ง",
  DONE: "สำเร็จ",
  CANCELLED: "ยกเลิก",
} as const

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

// ── Status Display Config ──
export const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string }
> = {
  [ORDER_STATUS.CREATED]: {
    label: "สร้างออร์เดอร์",
    color: "#9A9A9A",
    bg: "rgba(154,154,154,0.2)",
  },
  [ORDER_STATUS.PAID_SUCCESS]: {
    label: "จ่ายแล้ว รอข้อมูล",
    color: "#22B573",
    bg: "rgba(34,181,115,0.2)",
  },
  [ORDER_STATUS.PENDING_REVIEW]: {
    label: "รอตรวจสอบ",
    color: "#EAB308",
    bg: "rgba(234,179,8,0.2)",
  },
  [ORDER_STATUS.SHIPPING]: {
    label: "รอจัดส่ง",
    color: "#F97316",
    bg: "rgba(249,115,22,0.2)",
  },
  [ORDER_STATUS.DONE]: {
    label: "✓ สำเร็จ",
    color: "#22C55E",
    bg: "rgba(34,197,94,0.2)",
  },
  [ORDER_STATUS.CANCELLED]: {
    label: "✕ ยกเลิก",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.2)",
  },
}

// ── Payment Method ──
export type PaymentMethod = "โอน" | "COD"

// ── Order Item ──
export interface OrderItem {
  name: string
  unitPrice: number
  quantity: number
  discount: number
  price: number // (unitPrice - discount) * quantity
}

// Use explicit type for index signature to avoid Timestamp conflict
export interface OrderFields {
  id: string
  OrderID: string
  Date: string
  CustomerName: string
  CustomerPhone: string
  CustomerAddress?: string
  CustomerBirthday?: string
  Status: OrderStatus
  TotalPrice: number
  ShippingFee: number
  ShippingRateName?: string
  DueDate?: string
  Note?: string
  SlipURL?: string
  PaymentMethod: PaymentMethod
  Bank_Name?: string
  Bank_Account?: string
  Bank_Holder?: string
  PromptPay_Id?: string
  PromptPay_Type?: string
  LineChannelID?: string
  // Items
  Item1Name?: string
  Item1Price?: number
  Item1Qty?: number
  Item1UnitPrice?: number
  Item1Discount?: number
  Item2Name?: string
  Item2Price?: number
  Item2Qty?: number
  Item2UnitPrice?: number
  Item2Discount?: number
  // Archiving
  isArchived?: boolean
  // Notify flags
  SubmitNotifySent?: boolean
  SubmitNotifyAdminSent?: boolean
  SubmitNotifyCustomerSent?: boolean
}

export interface Order extends OrderFields {
  [key: string]: string | number | boolean | undefined
}

// ── Ceremony Order ──
export interface CeremonyOrder extends Order {
  CeremonyOrderID: string
  OrderType: "ceremony"
  CeremonyName: string
  CeremonyDate?: string
  CostSnapshot?: number
  SouvenirCostSnapshot?: number
  TotalCost?: number
  ParticipantName?: string
  ParticipantBirthday?: string
  ParticipantName2?: string
  ParticipantBirthday2?: string
  ParticipantSlots?: number
  CeremonyNote?: string
}

// ── Customer ──
export interface Customer {
  id: string
  name: string
  phone: string
  address?: string
  birthday?: string
  lineUserId?: string
  notes?: string
}

// ── Product ──
export interface Product {
  id: string
  name: string
  price: number
  cost?: number
  category?: string // "สินค้าบูชา" | "พิธี"
  unit?: string // "องค์" | "ชิ้น" | "อัน" | "วง" | "ผืน" | "แผ่น" | "ชุด" | "เส้น" | "กล่อง"
  stock?: number
  stockAlert?: number
  imageUrl?: string
  worshipImage?: string[]
  active?: boolean
}

// ── Ceremony ──
export interface Ceremony {
  id: string
  name: string
  basePrice: number
  souvenirCost?: number
  maxParticipants?: number
  date?: string
  description?: string
}

// ── Bank ──
export interface Bank {
  id: string
  bankName: string
  accountNumber: string
  accountHolder: string
  promptPayId?: string
  promptPayType?: string
}

// ── LINE Bot ──
export type BotId = "Bot 1 Sriganett99" | "Bot 2 ศรีคเนศ เทวาลัย"

// ── Sidebar Menu ──
export interface MenuGroup {
  label: string
  items: MenuItem[]
  collapsed?: boolean
}

export interface MenuItem {
  icon: string
  label: string
  path: string
  badge?: string
}