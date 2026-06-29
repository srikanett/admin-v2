import { useState, useEffect, type FormEvent } from "react"
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
import { createOrder, updateOrder, type CreateOrderResult } from "@/hooks/use-orders"
import { Save, CheckCircle2, Copy, ExternalLink, QrCode, Send } from "lucide-react"
import { BeamQrModal } from "./beam-qr"
import { ShareModal } from "./share-modal"

export interface OrderFormEditData {
  customerName: string
  customerPhone: string
  customerAddress: string
  customerBirthday: string
  note: string
  shippingFee: number
  paymentMethod: PaymentMethod
  isCeremony: boolean
  ceremonyName?: string
  ceremonyDate?: string
  participantName?: string
  participantBirthday?: string
  participantName2?: string
  participantBirthday2?: string
  participantSlots?: number
}

interface OrderFormProps {
  editData?: OrderFormEditData
  editOrderDocId?: string
  editIsCeremony?: boolean
}

export function OrderForm({ editData, editOrderDocId, editIsCeremony }: OrderFormProps) {
  const { passcode } = useAuthStore()
  const isEditing = !!editData && !!editOrderDocId

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
  const [saveSuccess, setSaveSuccess] = useState<CreateOrderResult | null>(null)
  const [showBeamQr, setShowBeamQr] = useState(false)
  const [showShare, setShowShare] = useState(false)

  // Prefill from edit data
  useEffect(() => {
    if (!editData) return
    setCustomerName(editData.customerName)
    setCustomerPhone(editData.customerPhone)
    setCustomerAddress(editData.customerAddress)
    setCustomerBirthday(editData.customerBirthday)
    setNote(editData.note)
    setShippingFee(editData.shippingFee)
    setPaymentMethod(editData.paymentMethod)
    setCeremonyEnabled(editData.isCeremony)
    setParticipantName(editData.participantName ?? "")
    setParticipantBirthday(editData.participantBirthday ?? "")
    setParticipantName2(editData.participantName2 ?? "")
    setParticipantBirthday2(editData.participantBirthday2 ?? "")
    setParticipantSlots(editData.participantSlots ?? 1)
  }, [editData])

  /** Reset form to defaults */
  const resetForm = () => {
    setCustomerName("")
    setCustomerPhone("")
    setCustomerAddress("")
    setCustomerBirthday("")
    setNote("")
    setShippingFee(0)
    setPaymentMethod("โอน")
    setSelectedBank(null)
    setCeremonyEnabled(false)
    setSelectedCeremony(null)
    setParticipantName("")
    setParticipantBirthday("")
    setParticipantName2("")
    setParticipantBirthday2("")
    setParticipantSlots(1)
    setItems([
      { id: crypto.randomUUID(), name: "", unitPrice: 0, quantity: 1, discount: 0 },
    ])
    setSaveError("")
    setSaveSuccess(null)
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setSaveError("")
    setSaveSuccess(null)

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
      if (isEditing) {
        // Update existing order
        await updateOrder(editOrderDocId!, {
          CustomerName: customerName.trim(),
          CustomerPhone: customerPhone.trim(),
          CustomerAddress: customerAddress.trim(),
          CustomerBirthday: customerBirthday.trim(),
          Note: note.trim(),
          ShippingFee: shippingFee,
          PaymentMethod: paymentMethod,
          // Note: items and bank not updated in this simple version
        } as Partial<import("@/types").OrderFields>, editIsCeremony)

        setSaveSuccess({
          orderId: editData!.ceremonyName ? `CO-${editData!.customerName}` : editData!.customerName,
          docId: editOrderDocId!,
          shareUrl: `https://order.srikanett.com/order/${editData!.customerName}`,
        })
      } else {
        const result = await createOrder({
        type: ceremonyEnabled && selectedCeremony ? "ceremony" : "product",
        customerName,
        customerPhone,
        customerAddress,
        customerBirthday,
        note,
        shippingFee,
        paymentMethod,
        bank: selectedBank
          ? {
              bankName: selectedBank.bankName,
              accountNumber: selectedBank.accountNumber,
              accountHolder: selectedBank.accountHolder,
              promptPayId: selectedBank.promptPayId,
              promptPayType: selectedBank.promptPayType,
            }
          : null,
        items: items.filter((item) => item.name.trim() !== ""),
        ceremony:
          ceremonyEnabled && selectedCeremony
            ? {
                ceremonyName: selectedCeremony.name,
                ceremonyDate: selectedCeremony.date,
                participantName,
                participantBirthday,
                participantName2,
                participantBirthday2,
                participantSlots,
                ceremonyNote: note,
              }
            : null,
        passcode,
      })

      void result; // type guard

      setSaveSuccess(result)
      } // end else
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "บันทึกล้มเหลว")
    }
    setIsSaving(false)
  }

  return (
    <>
    <form onSubmit={handleSave} className="space-y-5">
      {/* Customer */}
      <div className="glass-panel p-5">
        <h3 className="text-sm font-bold text-gold-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-gold-500 shadow-sm shadow-gold-500/50" /> ข้อมูลลูกค้า
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gold-100/80 mb-1.5">ชื่อลูกค้า *</label>
            <input className="themed-input font-heading" placeholder="ชื่อ-นามสกุล" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gold-100/80 mb-1.5">เบอร์โทรศัพท์</label>
            <input className="themed-input" placeholder="08x-xxx-xxxx" value={customerPhone} onChange={(e) => setCustomerPhone(normalizePhone(e.target.value))} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gold-100/80 mb-1.5">ที่อยู่</label>
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
                  : "bg-black/20 border border-gold-500/20 text-gold-100/75 hover:border-gold-500/40"
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
            <label className="block text-xs font-medium text-gold-100/80 mb-1.5">หมายเหตุ</label>
            <input className="themed-input" placeholder="หมายเหตุเพิ่มเติม" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gold-100/80 mb-1.5">ค่าจัดส่ง (บาท)</label>
            <input type="number" className="themed-input" placeholder="0" value={shippingFee || ""} onChange={(e) => setShippingFee(Number(e.target.value) || 0)} />
          </div>
        </div>
      </div>

      {/* Error */}
      {saveError && (
        <div className="glass-panel !border-rose-500/30 !bg-rose-500/5 p-3 text-center text-sm text-rose-400 font-heading">{saveError}</div>
      )}

      {/* Success */}
      {saveSuccess && (
        <div className="glass-panel !border-emerald-500/30 !bg-emerald-500/5 p-5 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-heading font-bold text-base">บันทึกออร์เดอร์เรียบร้อย ✅</span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gold-100/55">Order ID</span>
              <div className="flex items-center gap-2 mt-1">
                <code className="rounded-lg bg-black/30 px-3 py-1.5 text-gold-500 font-mono text-sm font-bold">
                  {saveSuccess.orderId}
                </code>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(saveSuccess.orderId)}
                  className="rounded-lg p-1.5 text-gold-100/80 hover:text-gold-500 hover:bg-gold-500/10 transition-colors"
                  title="คัดลอก OrderID"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-wider text-gold-100/55">ลิงก์แชร์ LINE</span>
              <div className="flex items-center gap-2 mt-1">
                <a
                  href={saveSuccess.shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-gold-500/10 px-3 py-1.5 text-gold-400 font-mono text-sm underline truncate max-w-[260px] block hover:text-gold-300 transition-colors"
                >
                  {saveSuccess.shareUrl}
                </a>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(saveSuccess.shareUrl)}
                  className="rounded-lg p-1.5 text-gold-100/80 hover:text-gold-500 hover:bg-gold-500/10 transition-colors"
                  title="คัดลอกลิงก์"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-5 py-2.5 text-sm font-heading font-bold text-black shadow-gold hover:brightness-110 transition-all"
            >
              + สร้างออร์เดอร์ใหม่
            </button>
            <button
              type="button"
              onClick={() => setShowBeamQr(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-gold-500/30 bg-black/20 px-5 py-2.5 text-sm font-heading text-gold-500 hover:bg-gold-500/10 transition-all"
            >
              <QrCode className="h-4 w-4" />
              QR พร้อมเพย์
            </button>
            <button
              type="button"
              onClick={() => setShowShare(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-gold-500/30 bg-black/20 px-5 py-2.5 text-sm font-heading text-gold-500 hover:bg-gold-500/10 transition-all"
            >
              <Send className="h-4 w-4" />
              แชร์ LINE
            </button>
          </div>
        </div>
      )}

      {/* Sticky save bar */}
      {!saveSuccess && (
      <div className="sticky bottom-0 -mx-4 px-4 py-3 bg-gradient-to-t from-[#0A0005] via-[#1D1A39]/95 to-transparent border-t border-gold-500/10 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gold-100/55 uppercase tracking-wider">ยอดรวมทั้งสิ้น</p>
            <p className="text-2xl font-bold text-gold-500 font-heading">
              {formatThaiCurrency(items.reduce((sum, i) => sum + ((i.unitPrice - i.discount) * i.quantity), 0) + shippingFee)}
            </p>
          </div>
          <button type="submit" disabled={isSaving} className="btn-gold">
            {isSaving ? "⏳ กำลังบันทึก..." : <><Save className="h-4 w-4" /> บันทึกออร์เดอร์</>}
          </button>
        </div>
      </div>
      )}
    </form>

    {/* Beam QR Modal */}
    {showBeamQr && saveSuccess && (
      <BeamQrModal
        orderId={saveSuccess.orderId}
        totalPrice={items.reduce((sum, i) => sum + ((i.unitPrice - i.discount) * i.quantity), 0) + shippingFee}
        onClose={() => setShowBeamQr(false)}
      />
    )}

    {/* Share Modal */}
    {showShare && saveSuccess && (
      <ShareModal
        orderId={saveSuccess.orderId}
        onClose={() => setShowShare(false)}
      />
    )}
  </>
  )
}