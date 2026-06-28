import { initializeApp, type FirebaseApp } from "firebase/app"
import {
  getAuth,
  connectAuthEmulator,
  type Auth,
} from "firebase/auth"
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from "firebase/firestore"
import {
  getFunctions,
  connectFunctionsEmulator,
  type Functions,
} from "firebase/functions"
import {
  getStorage,
  connectStorageEmulator,
  type FirebaseStorage,
} from "firebase/storage"

// ── Lazy-initialized Firebase instances ──
let _app: FirebaseApp | null = null
let _auth: Auth | null = null
let _db: Firestore | null = null
let _functions: Functions | null = null
let _storage: FirebaseStorage | null = null

// Base URLs
export const CF_BASE_URL =
  "https://asia-southeast1-srikanett-order.cloudfunctions.net"
export const ADMIN_WEB_URL = "https://admin.srikanett.com"
export const ORDERCUS_WEB_URL = "https://order.srikanett.com"

// ── Config cache ──
const CONFIG_KEY = "firebase_client_config_v2"

interface FirebaseConfig {
  apiKey: string
  projectId: string
  authDomain: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  vapidKey: string
}

// Fallback config (ใช้ apiKey เดียวกับระบบเดิม)
const FALLBACK_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSy...fLc4",
  projectId: "srikanett-order",
  authDomain: "srikanett-order.firebaseapp.com",
  storageBucket: "srikanett-order.firebasestorage.app",
  messagingSenderId: "375735561853",
  appId: "1:375735561853:web:65ca73251feb9757ac4b14",
  vapidKey: "",
}

/**
 * Fetch Firebase client config from Cloud Function.
 * Returns cached config if available, otherwise fetches from CF.
 */
async function fetchConfig(): Promise<FirebaseConfig> {
  // Check localStorage cache
  try {
    const cached = localStorage.getItem(CONFIG_KEY)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (parsed.apiKey && parsed.projectId) {
        return parsed as FirebaseConfig
      }
    }
  } catch {
    // Cache miss — fetch from CF
  }

  try {
    const res = await fetch(`${CF_BASE_URL}/getFirebasePublicConfig`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    const json = await res.json()
    if (json.status === "success" && json.data?.apiKey) {
      const config: FirebaseConfig = {
        apiKey: json.data.apiKey,
        projectId: json.data.projectId || FALLBACK_CONFIG.projectId,
        authDomain: json.data.authDomain || FALLBACK_CONFIG.authDomain,
        storageBucket:
          json.data.storageBucket || FALLBACK_CONFIG.storageBucket,
        messagingSenderId:
          json.data.messagingSenderId || FALLBACK_CONFIG.messagingSenderId,
        appId: json.data.appId || FALLBACK_CONFIG.appId,
        vapidKey: json.data.vapidKey || "",
      }
      // Cache in localStorage
      try {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
      } catch {
        // Ignore storage errors
      }
      return config
    }
  } catch {
    // Network error — use fallback
  }

  return FALLBACK_CONFIG
}

/**
 * Initialize Firebase with the given config.
 * Safe to call multiple times — only initializes once.
 */
export async function initFirebase(config?: FirebaseConfig): Promise<void> {
  if (_app) return // Already initialized

  const cfg = config || (await fetchConfig())

  _app = initializeApp(cfg)
  _auth = getAuth(_app)
  _db = getFirestore(_app)
  _functions = getFunctions(_app, "asia-southeast1")
  _storage = getStorage(_app)

  // Emulator support (local dev)
  if (import.meta.env.VITE_USE_EMULATORS === "true") {
    connectAuthEmulator(_auth!, "http://localhost:9099")
    connectFirestoreEmulator(_db!, "localhost", 8080)
    connectFunctionsEmulator(_functions!, "localhost", 5001)
    connectStorageEmulator(_storage!, "localhost", 9199)
  }
}

/** Get auth instance — must call initFirebase() first */
export function getAuthInstance(): Auth {
  if (!_auth) throw new Error("Firebase not initialized. Call initFirebase() first.")
  return _auth
}

/** Get Firestore instance — must call initFirebase() first */
export function getDbInstance(): Firestore {
  if (!_db) throw new Error("Firebase not initialized. Call initFirebase() first.")
  return _db
}

/** Get Functions instance */
export function getFunctionsInstance(): Functions {
  if (!_functions) throw new Error("Firebase not initialized. Call initFirebase() first.")
  return _functions
}

/** Get Storage instance */
export function getStorageInstance(): FirebaseStorage {
  if (!_storage) throw new Error("Firebase not initialized. Call initFirebase() first.")
  return _storage
}

/** Check if Firebase is initialized */
export function isInitialized(): boolean {
  return !!_app
}