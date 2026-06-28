// ═══════════════════════════════════════════════
// Helper Utilities
// ═══════════════════════════════════════════════

import type { DocumentSnapshot, DocumentData } from "firebase/firestore"

/**
 * Read a field from Firestore doc, trying multiple key variants.
 *
 * Thai field names use multiple variants (Thai, PascalCase, camelCase) —
 * this helper tries them all and returns the first match.
 *
 * @example
 *   readField_(doc, ["CustomerName", "customerName", "customer_name"])
 *   readField_(doc, ["TotalPrice", "totalPrice"], 0)
 */
export function readField_<T = string>(
  doc: DocumentSnapshot<DocumentData>,
  keys: string[],
  fallback?: T
): T | undefined {
  const data = doc.data()
  if (!data) return fallback

  for (const key of keys) {
    if (key in data && data[key] !== null && data[key] !== undefined) {
      return data[key] as T
    }
  }
  return fallback
}

/**
 * Calculate item price
 *
 * Can be called with:
 *   calcItemPrice(unitPrice, discount, quantity) — positional
 *   calcItemPrice({ unitPrice, discount, quantity }) — object (OrderItemData)
 */
export function calcItemPrice(
  unitPriceOrItem: number | { unitPrice: number; discount: number; quantity: number },
  discount?: number,
  quantity?: number
): number {
  if (typeof unitPriceOrItem === "object") {
    const { unitPrice, discount: d, quantity: q } = unitPriceOrItem
    return Math.max(0, (unitPrice - d) * q)
  }
  return Math.max(0, (unitPriceOrItem - (discount ?? 0)) * (quantity ?? 1))
}

/**
 * Format number as Thai locale currency (2 decimal)
 */
export function formatThaiCurrency(amount: number): string {
  return amount.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Format date to DD/MM/YYYY
 */
export function formatThaiDate(date: Date): string {
  return date.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

/**
 * Format date-time to "DD/MM/YYYY : HH:mm" (Thai format used in DB)
 */
export function formatThaiDateTime(date: Date): string {
  const d = date.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
  const t = date.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
  return `${d} : ${t}`
}

/**
 * Normalize phone number: remove dashes, spaces, parentheses
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)\.]/g, "")
}

/**
 * Remove Thai honorific prefixes (คุณ, นาย, นาง, นางสาว)
 */
export function stripTitle(name: string): string {
  return name.replace(/^(คุณ|นาย|นาง|นางสาว)\s*/i, "").trim()
}

/**
 * Format OrderID: DDMMYY-NNN
 * Sequence is typically managed via Firestore orderIdLedger
 */
export function formatOrderId(date: Date, sequence: number): string {
  const dd = String(date.getDate()).padStart(2, "0")
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const yy = String(date.getFullYear()).slice(-2)
  const seq = String(sequence).padStart(3, "0")
  return `${dd}${mm}${yy}-${seq}`
}

/**
 * Format Ceremony Order ID: CO-DDMMYY-NNN
 */
export function formatCeremonyOrderId(date: Date, sequence: number): string {
  return `CO-${formatOrderId(date, sequence)}`
}