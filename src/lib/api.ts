// ═══════════════════════════════════════════════
// Cloud Function API Wrapper
// ═══════════════════════════════════════════════

import { getFunctions, httpsCallable } from "firebase/functions"
import { isInitialized } from "@/lib/firebase"
import { CF_BASE_URL } from "@/lib/constants"

/** Make an authenticated POST to a CF HTTP endpoint */
async function cfPost<T = unknown>(
  endpoint: string,
  body: Record<string, unknown>,
  passcode?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (passcode) {
    headers["Authorization"] = `Bearer ${passcode}`
  }

  const res = await fetch(`${CF_BASE_URL}/${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })

  const json = await res.json()

  if (!res.ok || json.status === "error") {
    throw new Error(
      json.data?.message || json.message || `CF call failed: ${endpoint}`
    )
  }

  return json as T
}

/** Call a Firebase callable function */
async function callFunction(name: string, data: Record<string, unknown> = {}) {
  if (!isInitialized()) {
    throw new Error("Firebase not initialized")
  }
  const functions = getFunctions()
  const callable = httpsCallable(functions, name)
  const result = await callable(data)
  return result.data
}

// ── Auth ──

export async function adminFastLogin(password: string) {
  const res = await fetch(`${CF_BASE_URL}/adminFastLogin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  })
  return res.json()
}

// ── Order Status ──

export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  passcode?: string
) {
  return cfPost("updateOrderStatus", { orderId, newStatus }, passcode)
}

// ── LINE Notify ──

export async function deliverLineNotify(orderId: string, passcode?: string) {
  return cfPost("deliverLineNotify", { orderId }, passcode)
}

export async function sendOrderToCustomer(data: {
  orderId: string
  planName: string
  lineUserId?: string
  botId?: string
}) {
  return callFunction("sendOrderToCustomer", data)
}

// ── Beam Payment ──

export async function createBeamCharge(
  orderId: string,
  amount: number,
  passcode?: string
) {
  return cfPost(
    "createBeamCharge",
    { orderId, amount },
    passcode
  )
}

// ── Gemini AI ──

export async function parseCustomerData(text: string) {
  return callFunction("parseCustomerData", { text })
}

export async function scanSlip(imageBase64: string, mimeType = "image/jpeg") {
  return callFunction("scanSlip", { imageBase64, mimeType })
}

// ── Notification ──

export async function notifyOrderSubmitted(orderId: string, passcode?: string) {
  return cfPost("notifyOrderSubmitted", { orderId }, passcode)
}