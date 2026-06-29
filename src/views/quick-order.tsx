import { useState, useCallback, useEffect } from "react"
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  orderBy,
  limit,
  type DocumentSnapshot,
  type DocumentData,
} from "firebase/firestore"
import { getDbInstance, isInitialized } from "@/lib/firebase"
import { COLLECTIONS } from "@/lib/constants"
import { readField_, formatThaiCurrency, generateOrderId, formatThaiDateTime } from "@/lib/helpers"
import { ORDER_STATUS } from "@/types"
import type { Product } from "@/types"
import { GlassPanel } from "@/components/ui/glass-panel"
import { GoldButton } from "@/components/ui/gold-button"
import { Input } from "@/components/ui/input"
import {
  Zap,
  User,
  Phone,
  Plus,
  Minus,
  ShoppingCart,
  Trash2,
  CheckCircle,
  Package,
} from "lucide-react"

// ── Transform product ──
function transformProduct(doc: DocumentSnapshot<DocumentData>): Product {
  return {
    id: doc.id,
    name: readField_(doc, ["name", "Name", "productName"], "")!,
    price: readField_(doc, ["price", "unitPrice", "UnitPrice"], 0)!,
    category: readField_(doc, ["category", "Category"], "สินค้าบูชา"),
    unit: readField_(doc, ["unit", "Unit"], "องค์"),
    stock: readField_(doc, ["stock", "Stock"], undefined),
    active: readField_(doc, ["active", "Active"], true),
  }
}

interface QuickItem {
  productId: string
  name: string
  unitPrice: number
  quantity: number
  price: number
}

export function quickAddOrderView() {
  const [products, setProducts] = useState<Product[]>([])
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [note, setNote] = useState("")
  const [items, setItems] = useState<QuickItem[]>([])
  const [productSearch, setProductSearch] = useState("")
  const [showProductPicker, setShowProductPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  // ── Load products ──
  useEffect(() => {
    if (!isInitialized()) return
    const db = getDbInstance()
    const q = query(collection(db, COLLECTIONS.PRODUCTS), orderBy("name"), limit(200))
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map(transformProduct).filter((p) => p.active !== false))
    })
    return unsub
  }, [])

  // ── Filtered product search ──
  const filteredProducts = productSearch.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    : products

  // ── Items management ──
  const addItem = (product: Product) => {
    if (items.length >= 5) return
    const existing = items.find((i) => i.productId === product.id)
    if (existing) {
      setItems(
        items.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1, price: (i.quantity + 1) * i.unitPrice }
            : i
        )
      )
    } else {
      setItems([
        ...items,
        {
          productId: product.id,
          name: product.name,
          unitPrice: product.price,
          quantity: 1,
          price: product.price,
        },
      ])
    }
    setProductSearch("")
    setShowProductPicker(false)
  }

  const updateQty = (index: number, delta: number) => {
    setItems(
      items
        .map((item, i) => {
          if (i !== index) return item
          const newQty = Math.max(1, item.quantity + delta)
          return { ...item, quantity: newQty, price: newQty * item.unitPrice }
        })
    )
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const totalPrice = items.reduce((sum, i) => sum + i.price, 0)

  // ── Save Quick Order ──
  const handleSave = useCallback(async () => {
    if (!customerName.trim() || !customerPhone.trim() || items.length === 0) return
    setSaving(true)
    try {
      const db = getDbInstance()
      const orderId = await generateOrderId("product", db)

      const itemFields: Record<string, string | number> = {}
      items.forEach((item, i) => {
        const n = i + 1
        itemFields[`Item${n}Name`] = item.name
        itemFields[`Item${n}Price`] = item.price
        itemFields[`Item${n}Qty`] = item.quantity
        itemFields[`Item${n}UnitPrice`] = item.unitPrice
        itemFields[`Item${n}Discount`] = 0
      })

      const orderData: Record<string, unknown> = {
        OrderID: orderId,
        Date: formatThaiDateTime(new Date()),
        CustomerName: customerName.trim(),
        CustomerPhone: customerPhone.trim(),
        CustomerAddress: customerAddress.trim() || "",
        Status: ORDER_STATUS.CREATED,
        TotalPrice: totalPrice,
        ShippingFee: 0,
        PaymentMethod: "โอน",
        Bank_Name: "ธนาคารไทยพาณิชย์",
        Bank_Account: "4030656715",
        Bank_Holder: "น.ส.จันทร์ทิพย์ วงศ์ษา",
        Note: note.trim() || "",
        isArchived: false,
        ...itemFields,
      }

      await addDoc(collection(db, COLLECTIONS.QUICK_ORDERS), orderData)

      setSuccess(orderId)
      // Reset form
      setCustomerName("")
      setCustomerPhone("")
      setCustomerAddress("")
      setNote("")
      setItems([])
    } catch (err) {
      console.error("Quick order error:", err)
      alert("เกิดข้อผิดพลาดในการบันทึก")
    }
    setSaving(false)
  }, [customerName, customerPhone, customerAddress, note, items, totalPrice])

  if (success) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/15">
            <Zap size={22} className="text-gold-500" />
          </div>
          <h1 className="aurora-heading text-xl md:text-2xl">สั่งซื้อด่วน</h1>
        </div>
        <GlassPanel className="text-center py-16">
          <CheckCircle size={56} className="mx-auto text-green-400 mb-4" />
          <h2 className="text-lg text-gold-100 font-heading mb-2">บันทึกสำเร็จ!</h2>
          <p className="text-gold-100/65 text-sm mb-4">
            Order ID: <span className="text-gold-400 font-mono">{success}</span>
          </p>
          <GoldButton onClick={() => setSuccess(null)} icon={<Plus size={16} />}>
            สร้างออเดอร์ใหม่
          </GoldButton>
        </GlassPanel>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/15">
          <Zap size={22} className="text-gold-500" />
        </div>
        <h1 className="aurora-heading text-xl md:text-2xl">สั่งซื้อด่วน</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left: Customer Info ── */}
        <GlassPanel className="space-y-4">
          <h2 className="text-sm font-heading text-gold-200/80 flex items-center gap-2">
            <User size={16} />
            ข้อมูลลูกค้า
          </h2>

          <div>
            <label className="block text-xs text-gold-100/80 mb-1 font-medium">ชื่อ-นามสกุล *</label>
            <Input
              className="themed-input"
              placeholder="ชื่อลูกค้า"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gold-100/80 mb-1 font-medium">
              <Phone size={12} className="inline mr-1" />
              เบอร์โทร *
            </label>
            <Input
              className="themed-input"
              placeholder="08xxxxxxxx"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gold-100/80 mb-1 font-medium">ที่อยู่</label>
            <Input
              className="themed-input"
              placeholder="ที่อยู่จัดส่ง"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gold-100/80 mb-1 font-medium">หมายเหตุ</label>
            <Input
              className="themed-input"
              placeholder="หมายเหตุเพิ่มเติม"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </GlassPanel>

        {/* ── Right: Products ── */}
        <GlassPanel className="space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-heading text-gold-200/80 flex items-center gap-2">
              <ShoppingCart size={16} />
              รายการสินค้า {items.length > 0 && `(${items.length}/5)`}
            </h2>
            {items.length < 5 && (
              <button
                onClick={() => setShowProductPicker(!showProductPicker)}
                className="text-xs text-gold-400 hover:text-gold-300 transition-colors flex items-center gap-1"
              >
                <Plus size={14} /> เพิ่มสินค้า
              </button>
            )}
          </div>

          {/* Product Picker Dropdown */}
          {showProductPicker && (
            <div className="space-y-2">
              <input
                className="themed-input text-sm"
                placeholder="ค้นหาสินค้า..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                autoFocus
              />
              <div className="max-h-[200px] overflow-y-auto space-y-1">
                {filteredProducts.slice(0, 20).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addItem(p)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gold-500/10 transition-colors flex items-center justify-between"
                  >
                    <span className="text-sm text-gold-100/80 truncate flex-1 mr-2">{p.name}</span>
                    <span className="text-xs text-gold-400 font-heading flex-shrink-0">
                      ฿{formatThaiCurrency(p.price)}
                    </span>
                  </button>
                ))}
                {filteredProducts.length === 0 && (
                  <p className="text-xs text-gold-100/55 text-center py-4">ไม่พบสินค้า</p>
                )}
              </div>
            </div>
          )}

          {/* Items List */}
          {items.length > 0 ? (
            <div className="flex-1 space-y-2">
              {items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-black/20 border border-gold-500/5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gold-100/80 truncate">{item.name}</p>
                    <p className="text-xs text-gold-100/65">
                      ฿{formatThaiCurrency(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQty(i, -1)}
                      className="p-1 rounded hover:bg-gold-500/10 text-gold-100/80"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm text-gold-200 w-6 text-center font-heading">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(i, 1)}
                      className="p-1 rounded hover:bg-gold-500/10 text-gold-100/80"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="text-sm text-gold-400 font-heading w-[80px] text-right">
                    ฿{formatThaiCurrency(item.price)}
                  </div>
                  <button
                    onClick={() => removeItem(i)}
                    className="p-1 rounded hover:bg-red-500/10 text-gold-100/65 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <Package size={36} className="text-gold-100/10 mb-2" />
              <p className="text-gold-100/65 text-sm">ยังไม่มีสินค้า</p>
              <p className="text-gold-100/35 text-xs mt-1">คลิก "+ เพิ่มสินค้า" เพื่อเริ่ม</p>
            </div>
          )}

          {/* Total + Save */}
          {items.length > 0 && (
            <div className="border-t border-gold-500/10 pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gold-100/75">รวม</span>
                <span className="text-lg font-heading text-gold-400">
                  ฿{formatThaiCurrency(totalPrice)}
                </span>
              </div>
              <GoldButton
                className="w-full"
                isLoading={saving}
                disabled={!customerName.trim() || !customerPhone.trim() || items.length === 0}
                onClick={handleSave}
              >
                บันทึกออเดอร์ด่วน
              </GoldButton>
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  )
}