import { useState } from "react"
import { useAuthStore } from "@/stores/auth"
import { sendOrderToCustomer } from "@/lib/api"
import { Send, Loader2, CheckCircle2, Copy, Bot, FileText } from "lucide-react"

interface ShareModalProps {
  orderId: string
  onClose: () => void
}

const BOTS = [
  { id: "Bot 1 Sriganett99", label: "Bot 1 — Sriganett99" },
  { id: "Bot 2 ศรีคเนศ เทวาลัย", label: "Bot 2 — ศรีคเนศ เทวาลัย" },
]

const PLANS = [
  { id: "customerPendingReview", label: "แจ้งลูกค้าตรวจสอบ", desc: "ส่งการ์ดยืนยัน + ขอสลิป" },
  { id: "customerShippingConfirmed", label: "ยืนยันจัดส่ง", desc: "ส่งเลขพัสดุ + ติดตาม" },
  { id: "cfOrderFlex", label: "CF Order Flex", desc: "การ์ดออร์เดอร์จาก CF" },
  { id: "adminSubmitFlex", label: "Admin Submit", desc: "แจ้ง admin ออร์เดอร์ใหม่" },
]

export function ShareModal({ orderId, onClose }: ShareModalProps) {
  const { passcode } = useAuthStore()
  const [selectedBot, setSelectedBot] = useState(BOTS[0].id)
  const [selectedPlan, setSelectedPlan] = useState(PLANS[0].id)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  const shareUrl = `https://order.srikanett.com/order/${orderId}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSend = async () => {
    setSending(true)
    setError("")
    try {
      await sendOrderToCustomer({
        orderId,
        planName: selectedPlan,
        botId: selectedBot,
      })
      setSent(true)
      setTimeout(onClose, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "ส่งล้มเหลว")
    }
    setSending(false)
  }

  if (sent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="glass-panel-strong w-full max-w-sm text-center py-8 animate-in zoom-in-95">
          <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-heading text-white mb-1">ส่งเรียบร้อย ✅</h3>
          <p className="text-sm text-gold-100/80">ลูกค้าจะได้รับข้อความทาง LINE</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-panel-strong w-full max-w-sm animate-in zoom-in-95">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-heading text-gold-500 flex items-center gap-2">
            <Send size={18} /> แชร์ให้ลูกค้า
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gold-100/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Order ID */}
          <div className="flex items-center justify-between rounded-lg bg-black/30 px-3 py-2 border border-gold-500/10">
            <span className="text-xs text-gold-100/65">Order ID</span>
            <code className="text-sm text-gold-500 font-mono font-bold">{orderId}</code>
          </div>

          {/* Share Link */}
          <div>
            <label className="text-xs text-gold-100/65 block mb-1.5">ลิงก์แชร์</label>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl}
                className="themed-input flex-1 text-xs"
              />
              <button
                onClick={handleCopyLink}
                className="rounded-lg border border-gold-500/20 bg-black/30 p-2 text-gold-100/80 hover:text-gold-500 hover:border-gold-500/40 transition-colors"
              >
                {copied ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Bot Selector */}
          <div>
            <label className="text-xs text-gold-100/65 mb-1.5 flex items-center gap-1.5">
              <Bot size={12} /> LINE Bot
            </label>
            <div className="grid grid-cols-2 gap-2">
              {BOTS.map((bot) => (
                <button
                  key={bot.id}
                  onClick={() => setSelectedBot(bot.id)}
                  className={`rounded-lg border p-2 text-xs text-left transition-all ${
                    selectedBot === bot.id
                      ? "border-gold-500 bg-gold-500/10 text-gold-500"
                      : "border-gold-500/10 bg-black/20 text-gold-100/75 hover:border-gold-500/30"
                  }`}
                >
                  {bot.label}
                </button>
              ))}
            </div>
          </div>

          {/* Plan Selector */}
          <div>
            <label className="text-xs text-gold-100/65 mb-1.5 flex items-center gap-1.5">
              <FileText size={12} /> รูปแบบข้อความ
            </label>
            <div className="space-y-2">
              {PLANS.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full rounded-lg border p-2.5 text-left transition-all ${
                    selectedPlan === plan.id
                      ? "border-gold-500 bg-gold-500/10"
                      : "border-gold-500/10 bg-black/20 hover:border-gold-500/30"
                  }`}
                >
                  <p className={`text-xs font-heading ${selectedPlan === plan.id ? "text-gold-500" : "text-gold-100/80"}`}>
                    {plan.label}
                  </p>
                  <p className="text-[10px] text-gold-100/65 mt-0.5">{plan.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="glass-panel !border-rose-500/30 !bg-rose-500/5 p-3 text-center text-sm text-rose-400">
              {error}
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={sending}
            className="btn-gold w-full text-sm flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <Loader2 size={16} className="animate-spin" /> กำลังส่ง...
              </>
            ) : (
              <>
                <Send size={16} /> ส่งให้ลูกค้าทาง LINE
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}