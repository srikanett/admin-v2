// ═══════════════════════════════════════════════
// SRIKANETT DHEVALAI — Constants
// ═══════════════════════════════════════════════

// Firestore Collections
export const COLLECTIONS = {
  ORDERS: "orders",
  CEREMONY_ORDERS: "ceremonyOrders",
  PRODUCTS: "products",
  CEREMONIES: "ceremonies",
  CUSTOMERS: "customers",
  BANKS: "banks",
  PARTICIPANTS: "participants",
  LINE_CUSTOMERS: "lineCustomers",
  LINE_CONTACTS: "line_contacts",
  FACEBOOK_CONTACTS: "facebook_contacts",
  LINE_CHANNELS: "lineChannels",
  REPLY_RULES: "reply_rules",
  CF_SESSIONS: "cfSessions",
  ADMIN_INTEGRATIONS: "adminIntegrations",
  PUBLIC_INTEGRATIONS: "publicIntegrations",
  QUICK_ORDERS: "quickOrders",
  BILLS: "bills",
  BROADCAST_DRAFTS: "broadcastDrafts",
  _SYSTEM: "_system",
  _EVENT_LOGS: "_eventLogs",
} as const

// Cloud Functions Base URL
export const CF_BASE_URL =
  "https://asia-southeast1-srikanett-order.cloudfunctions.net"

// Admin URLs
export const ADMIN_WEB_URL = "https://admin.srikanett.com"
export const ORDERCUS_WEB_URL = "https://order.srikanett.com"

// LINE LIFF Base URLs
export const BOT1_LIFF_BASE = "https://liff.line.me/2008655508-r8W209qQ"
export const BOT2_LIFF_BASE = "https://liff.line.me/2009352737-Kp9DAzYW"

// Session TTL
export const SESSION_TTL_MS = 72 * 60 * 60 * 1000 // 72 hours

// Default admin passcode (for dev)
export const DEFAULT_PASSCODE = "882882"

// Firebase Storage folders
export const STORAGE_FOLDERS = {
  SLIPS: "slips",
  PRODUCTS: "products",
  CEREMONY: "ceremony",
  NOTIFY: "notify",
  BANKS: "banks",
  GALLERY: "gallery",
  CEREMONY_CARDS: "ceremony-cards",
} as const

// Max image upload size (bytes)
export const MAX_IMAGE_BYTES = 1_258_291 // ~1.2 MB

// Notification feature flags
export const NOTIFY_CUTOVER = 0 // 0 = shadow mode (log only), 1 = live
export const AUTO_ORDER_ENABLED = false