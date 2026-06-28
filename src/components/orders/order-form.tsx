import { useState, type FormEvent } from "react"
import { useAuthStore } from "@/stores/auth"
import type { Bank, Ceremony, PaymentMethod } from "@/types"
import type { OrderItemData } from "./product-row"
import { ProductSection } from "./product-section"
import { BankPicker } from "./bank-picker"
import { CeremonySection } from "./ceremony-section"
import {
  formatThaiCurrency,
  normalizePhone,
} from "@/lib/helpers"
import { Save } from "lucide-react"

export function OrderForm() {
  const { passcode } = useAuthStore()

  // Form state
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [customerBirthday, setCustomerBirthday] = useState("")
  const [note, setNote] = useState("")
  const [shippingFee, setShippingFee] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("โอน")

  // Bank
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null)

  // Ceremony
  const [ceremonyEnabled, setCeremonyEnabled] = useState(false)
  const [selectedCeremony, setSelectedCeremony] = useState<Ceremony | null>(null)
  const [participantName, setParticipantName] = useState("")
  const [participantBirthday, setParticipantBirthday] = useState("")
  const [participantName2, setParticipantName2] = useState("")
  const [participantBirthday2, setParticipantBirthday2] = useState("")
  const [participantSlots, setParticipantSlots] = useState(1)

  // Items (managed by ProductSection)
  const [items, setItems] = useState<OrderItemData[]>([
    { id: crypto.randomUUID(), name: "", unitPrice: 0, quantity: 1, discount: 0 },
  ])

  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setSaveError("")

    if (!customerName.trim()) {
      setSaveError("กรุณากรอกชื่อลูกค้า")
      return
    }
    if (items.every((item) => !item.name.trim())) {
      setSaveError("กรุณาเลือกสินค้าอย่างน้อย 1 รายการ")
      return
    }
    if (paymentMethod === "โอน" && !selectedBank) {
      setSaveError("กรุณาเลือกบัญชีธนาคาร")
      return
    }

    setIsSaving(true)
    try {
      // TODO Phase 2b: Save to Firestore
      await new Promise((r) => setTimeout(r, 800))
      alert("บันทึกออร์เดอร์เรียบร้อย ✅\n(Phase 2b — Firestore save coming soon)")
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "บันทึกล้มเหลว")
    }
    setIsSaving(false)
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* Customer */}
      <div className="glass-panel p-5">
        <h3 className="text-sm font-bold text-gold-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-gold-500 shadow-sm shadow-gold-500/50" /> ข้อมูลลูกค้า
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gold-100/50 mb-1.5">ชื่อลูกค้า *</label>
            <input className="themed-input font-heading" placeholder="ชื่อ-นามสกุล" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gold-100/50 mb-1.5">เบอร์โทรศัพท์</label>
            <input className="themed-input" placeholder="08x-xxx-xxxx" value={customerPhone} onChange={(e) => setCustomerPhone(normalizePhone(e.target.value))} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gold-100/50 mb-1.5">ที่อยู่</label>
            <input className="themed-input" placeholder="ที่อยู่สำหรับจัดส่ง" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Products */}
      <ProductSection items={items} onItemsChange={setItems} />

      {/* Payment */}
      <div className="glass-panel p-5">
        <h3 className="text-sm font-bold text-gold-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-gold-300 shadow-sm shadow-gold-500/50" /> การชำระเงิน
        </h3>
        <div className="flex gap-2 mb-4">
          {(["โอน", "COD"] as PaymentMethod[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setPaymentMethod(m)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-heading font-medium transition-all ${
                paymentMethod === m
                  ? "bg-gradient-to-r from-gold-500 to-gold-600 text-black shadow-gold"
                  : "bg-black/20 border border-gold-500/20 text-gold-100/60 hover:border-gold-500/40"
              }`}
            >
              {m === "โอน" ? "💳 โอนเงิน" : "📦 เก็บปลายทาง"}
            </button>
          ))}
        </div>
        {paymentMethod === "โอน" && (
          <BankPicker selectedBank={selectedBank} onSelect={setSelectedBank} />
        )}
      </div>

      {/* Ceremony */}
      <CeremonySection
        enabled={ceremonyEnabled}
        onToggle={setCeremonyEnabled}
        selectedCeremony={selectedCeremony}
        onCeremonySelect={setSelectedCeremony}
        participantName={participantName}
        onParticipantNameChange={setParticipantName}
        participantBirthday={participantBirthday}
        onParticipantBirthdayChange={setParticipantBirthday}
        participantName2={participantName2}
        onParticipantName2Change={setParticipantName2}
        participantBirthday2={participantBirthday2}
        onParticipantBirthday2Change={setParticipantBirthday2}
        participantSlots={participantSlots}
        onSlotsChange={setParticipantSlots}
      />

      {/* Note & Shipping */}
      <div className="glass-panel p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gold-100/50 mb-1.5">หมายเหตุ</label>
            <input className="themed-input" placeholder="หมายเหตุเพิ่มเติม" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gold-100/50 mb-1.5">ค่าจัดส่ง (บาท)</label>
            <input type="number" className="themed-input" placeholder="0" value={shippingFee || ""} onChange={(e) => setShippingFee(Number(e.target.value) || 0)} />
          </div>
        </div>
      </div>

      {/* Error */}
      {saveError && (
        <div className="glass-panel !border-rose-500/30 !bg-rose-500/5 p-3 text-center text-sm text-rose-400 font-heading">{saveError}</div>
      )}

      {/* Sticky save bar */}
      <div className="sticky bottom-0 -mx-4 px-4 py-3 bg-gradient-to-t from-[#0A0005] via-[#1D1A39]/95 to-transparent border-t border-gold-500/10 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gold-100/30 uppercase tracking-wider">ยอดรวมทั้งสิ้น</p>
            <p className="text-2xl font-bold text-gold-500 font-heading">
              {formatThaiCurrency(items.reduce((sum, i) => sum + ((i.unitPrice - i.discount) * i.quantity), 0) + shippingFee)}
            </p>
          </div>
          <button type="submit" disabled={isSaving} className="btn-gold">
            {isSaving ? "⏳ กำลังบันทึก..." : <><Save className="h-4 w-4" /> บันทึกออร์เดอร์</>}
          </button>
        </div>
      </div>
    </form>
  )
}