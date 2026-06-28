import { create } from "zustand"
import { auth, db } from "@/lib/firebase"
import {
  signInWithCustomToken,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { COLLECTIONS, CF_BASE_URL } from "@/lib/constants"

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  passcode: string

  // Actions
  init: () => () => void // returns unsubscribe
  login: (passcode: string) => Promise<void>
  logout: () => Promise<void>
  setPasscode: (code: string) => void
  clearPasscode: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  passcode: "",

  init: () => {
    const unsub = onAuthStateChanged(auth, (user) => {
      set({
        user,
        isLoading: false,
        isAuthenticated: !!user,
      })
    })
    return unsub
  },

  login: async (passcode: string) => {
    try {
      // Call adminFastLogin Cloud Function
      const res = await fetch(`${CF_BASE_URL}/adminFastLogin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passcode }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "รหัสผ่านไม่ถูกต้อง")
      }

      const { customToken } = await res.json()

      if (!customToken) {
        throw new Error("ไม่สามารถสร้าง token ได้")
      }

      // Sign in with custom token
      await signInWithCustomToken(auth, customToken)

      // Store passcode in memory (for Cloud Function calls)
      set({ passcode })

      // Create/renew session in Firestore
      const user = auth.currentUser
      if (user) {
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
    } catch (error) {
      set({ passcode: "" })
      throw error
    }
  },

  logout: async () => {
    set({ passcode: "" })
    await signOut(auth)
  },

  setPasscode: (code: string) => set({ passcode: code }),
  clearPasscode: () => set({ passcode: "" }),
}))