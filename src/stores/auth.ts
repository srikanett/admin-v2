import { create } from "zustand"
import {
  signInWithCustomToken,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { COLLECTIONS, CF_BASE_URL } from "@/lib/constants"
import {
  initFirebase,
  getAuthInstance,
  getDbInstance,
  isInitialized,
} from "@/lib/firebase"

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  passcode: string

  init: () => () => void
  login: (passcode: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  passcode: "",

  init: () => {
    // Start auth listener — will fire once Firebase is initialized
    const setupListener = () => {
      try {
        const auth = getAuthInstance()
        return onAuthStateChanged(auth, (user) => {
          set({
            user,
            isLoading: false,
            isAuthenticated: !!user,
          })
        })
      } catch {
        // Not initialized yet — check again soon
        const timer = setTimeout(setupListener, 100)
        return () => clearTimeout(timer)
      }
    }

    const unsub = setupListener()

    // Auto-initialize Firebase
    initFirebase().catch(console.error)

    return () => {
      if (typeof unsub === "function") unsub()
    }
  },

  login: async (passcode: string) => {
    // Ensure Firebase is initialized with correct config
    await initFirebase()

    // Call adminFastLogin Cloud Function
    const res = await fetch(`${CF_BASE_URL}/adminFastLogin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: passcode }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.data?.message || err.message || "รหัสผ่านไม่ถูกต้อง")
    }

    const json = await res.json()

    if (json.status !== "success" || !json.data?.valid) {
      throw new Error(json.data?.message || "รหัสผ่านไม่ถูกต้อง")
    }

    const { customToken } = json.data

    if (!customToken) {
      throw new Error("ไม่สามารถสร้าง token ได้")
    }

    // Sign in with custom token
    const auth = getAuthInstance()
    await signInWithCustomToken(auth, customToken)

    // Store passcode for Cloud Function calls
    set({ passcode })

    // Create/renew session in Firestore (non-critical — don't block login)
    try {
      const user = auth.currentUser
      if (user) {
        const db = getDbInstance()
        const sessionRef = doc(db, COLLECTIONS.CF_SESSIONS, user.uid)
        await setDoc(
          sessionRef,
          {
            uid: user.uid,
            createdAt: serverTimestamp(),
            lastAccess: serverTimestamp(),
          },
          { merge: true }
        )
      }
    } catch {
      // Session write failed — security rules may block it.
      // Login still works. This is non-critical.
      console.warn("cfSessions write blocked by security rules — login continues")
    }
  },

  logout: async () => {
    set({ passcode: "" })
    try {
      const auth = getAuthInstance()
      await signOut(auth)
    } catch {
      // Already signed out
    }
  },
}))