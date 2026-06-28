// ═══════════════════════════════════════════════
// Firestore Data Hooks
// ═══════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react"
import {
  collection,
  query,
  getDocs,
  onSnapshot,
  orderBy,
  limit,
  type QueryConstraint,
  type DocumentSnapshot,
  type DocumentData,
} from "firebase/firestore"
import { getDbInstance, isInitialized } from "@/lib/firebase"
import { COLLECTIONS } from "@/lib/constants"
import { readField_ } from "@/lib/helpers"
import type { Customer, Product, Bank, Ceremony } from "@/types"

// ── Generic Firestore hook ──

export function useCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  transform: (doc: DocumentSnapshot<DocumentData>) => T
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!isInitialized()) {
      setLoading(false)
      return
    }

    try {
      const db = getDbInstance()
      const colRef = collection(db, collectionName)
      const q = query(colRef, ...constraints)

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          setData(snapshot.docs.map(transform))
          setLoading(false)
          setError(null)
        },
        (err) => {
          setError(err)
          setLoading(false)
        }
      )
      return () => unsub()
    } catch (err) {
      setError(err as Error)
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName])

  return { data, loading, error }
}

// ── Products ──

export function useProducts() {
  return useCollection<Product>(
    COLLECTIONS.PRODUCTS,
    [orderBy("name"), limit(200)],
    (doc) => ({
      id: doc.id,
      name: readField_(doc, ["name", "Name", "productName"], "")!,
      price: readField_(doc, ["price", "unitPrice", "UnitPrice"], 0)!,
      cost: readField_(doc, ["cost", "Cost"], undefined),
      category: readField_(doc, ["category", "Category"], "สินค้าบูชา"),
      unit: readField_(doc, ["unit", "Unit"], "องค์"),
      stock: readField_(doc, ["stock", "Stock"], undefined),
      stockAlert: readField_(doc, ["stockAlert", "StockAlert"], undefined),
      active: readField_(doc, ["active", "Active"], true),
    })
  )
}

// ── Customers ──

export function useCustomers() {
  return useCollection<Customer>(
    COLLECTIONS.CUSTOMERS,
    [orderBy("name"), limit(500)],
    (doc) => ({
      id: doc.id,
      name: readField_(doc, ["name", "Name", "customerName"], "")!,
      phone: readField_(doc, ["phone", "Phone", "customerPhone"], "")!,
      address: readField_(doc, ["address", "Address", "customerAddress"], ""),
      birthday: readField_(
        doc,
        ["birthday", "Birthday", "customerBirthday"],
        ""
      ),
      lineUserId: readField_(
        doc,
        ["lineUserId", "LineUserID", "lineUserID"],
        ""
      ),
    })
  )
}

// ── Banks ──

export function useBanks() {
  return useCollection<Bank>(
    COLLECTIONS.BANKS,
    [limit(20)],
    (doc) => ({
      id: doc.id,
      bankName: readField_(
        doc,
        ["bankName", "Bank_Name", "bank_name"],
        ""
      )!,
      accountNumber: readField_(
        doc,
        ["accountNumber", "Bank_Account", "bank_account"],
        ""
      )!,
      accountHolder: readField_(
        doc,
        ["accountHolder", "Bank_Holder", "bank_holder"],
        ""
      )!,
      promptPayId: readField_(doc, ["promptPayId", "PromptPay_Id"], ""),
      promptPayType: readField_(doc, ["promptPayType", "PromptPay_Type"], ""),
    })
  )
}

// ── Ceremonies ──

export function useCeremonies() {
  return useCollection<Ceremony>(
    COLLECTIONS.CEREMONIES,
    [limit(20)],
    (doc) => ({
      id: doc.id,
      name: readField_(doc, ["name", "Name", "ceremonyName"], "")!,
      basePrice: readField_(doc, ["basePrice", "BasePrice", "price"], 0)!,
      souvenirCost: readField_(
        doc,
        ["souvenirCost", "SouvenirCost"],
        undefined
      ),
      maxParticipants: readField_(
        doc,
        ["maxParticipants", "MaxParticipants"],
        undefined
      ),
    })
  )
}

// ── Search customers (for autocomplete) ──

export function useSearchCustomers(searchTerm: string) {
  const [results, setResults] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (term: string) => {
    if (!term || term.length < 2 || !isInitialized()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const db = getDbInstance()
      const colRef = collection(db, COLLECTIONS.CUSTOMERS)
      const q = query(colRef, limit(20))

      const snapshot = await getDocs(q)
      const customers = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: readField_(doc, ["name", "Name", "customerName"], "")!,
        phone: readField_(doc, ["phone", "Phone", "customerPhone"], "")!,
        address: readField_(
          doc,
          ["address", "Address", "customerAddress"],
          ""
        ),
        birthday: readField_(
          doc,
          ["birthday", "Birthday", "customerBirthday"],
          ""
        ),
        lineUserId: readField_(
          doc,
          ["lineUserId", "LineUserID", "lineUserID"],
          ""
        ),
      }))

      const termLower = term.toLowerCase()
      const filtered = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(termLower) ||
          c.phone.includes(term) ||
          (c.address && c.address.toLowerCase().includes(termLower))
      )

      setResults(filtered.slice(0, 10))
    } catch (err) {
      console.error("Customer search error:", err)
      setResults([])
    }
    setLoading(false)
  }, [])

  return { results, loading, search }
}