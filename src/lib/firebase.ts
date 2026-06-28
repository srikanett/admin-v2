import { initializeApp } from "firebase/app"
import { getAuth, connectAuthEmulator } from "firebase/auth"
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore"
import { getFunctions, connectFunctionsEmulator } from "firebase/functions"
import { getStorage, connectStorageEmulator } from "firebase/storage"

// Firebase config — for project srikanett-order
const firebaseConfig = {
  apiKey: "AIzaSyCqG-eo_OyIgWCq00VcbA51ce61WB2np-o",
  authDomain: "srikanett-order.firebaseapp.com",
  projectId: "srikanett-order",
  storageBucket: "srikanett-order.firebasestorage.app",
  messagingSenderId: "375735561853",
  appId: "1:375735561853:web:65ca73251feb9757ac4b14",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const functions = getFunctions(app, "asia-southeast1")
export const storage = getStorage(app)

// Base URL for Cloud Functions HTTP triggers
export const CF_BASE_URL =
  "https://asia-southeast1-srikanett-order.cloudfunctions.net"

// Admin interface URLs
export const ADMIN_WEB_URL = "https://admin.srikanett.com"
export const ORDERCUS_WEB_URL = "https://order.srikanett.com"

// Emulator support (for local dev)
const isDev = import.meta.env.DEV
if (isDev && import.meta.env.VITE_USE_EMULATORS === "true") {
  connectAuthEmulator(auth, "http://localhost:9099")
  connectFirestoreEmulator(db, "localhost", 8080)
  connectFunctionsEmulator(functions, "localhost", 5001)
  connectStorageEmulator(storage, "localhost", 9199)
}

export default app