import { useState, useEffect } from "react"
import { useAuthStore } from "@/stores/auth"
import { createBeamCharge } from "@/lib/api"
import { Copy, ExternalLink, QrCode, Loader2, RefreshCw } from "lucide-react"

interface BeamQrProps {
  orderId: string
  totalPrice: number
  onClose: () => void
}

interface BeamChargeResult {
  qrImage?: string
  paymentLink?: string
  chargeId?: string
}

export function BeamQrModal({ orderId, totalPrice, onClose }: BeamQrProps) {
  const { passcode } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [result, setResult] = useState<BeamChargeResult | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchQr = async () => {
    setLoading(true)
    setError("")
    try {
      const res = (await createBeamCharge(orderId, totalPrice, passcode ?? undefined)) as BeamChargeResult
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : "สร้าง QR ล้มเหลว")
      // Fallback: show manual payment info
      setResult({ paymentLink: `https://order.srikanett.com/order/${orderId}` })
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchQr()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCopyLink = () => {
    if (result?.paymentLink) {
      navigator.clipboard.writeText(result.paymentLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-panel-strong w-full max-w-sm animate-in zoom-in-95">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading text-gold-500 flex items-center gap-2">
            <QrCode size={20} /> QR พร้อมเพย์
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gold-100/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 size={40} className="animate-spin text-gold-500" />
            <p className="text-sm text-gold-100/75">กำลังสร้าง QR...</p>
          </div>
        )}

        {error && !loading && (
          <div className="glass-panel !border-rose-500/30 !bg-rose-500/5 p-3 text-center text-sm text-rose-400 mb-3">
            {error}
          </div>
        )}

        {result && !loading && (
          <div className="space-y-4">
            {/* QR Image */}
            {result.qrImage ? (
              <div className="flex justify-center">
                <img
                  src={result.qrImage}
                  alt="QR PromptPay"
                  className="rounded-xl bg-white p-3 w-48 h-48 object-contain"
                />
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="rounded-xl border border-gold-500/20 bg-black/40 p-8 text-center">
                  <QrCode size={80} className="text-gold-500/65 mx-auto mb-2" />
                  <p className="text-xs text-gold-100/65">QR ไม่พร้อมใช้งาน</p>
                </div>
              </div>
            )}

            {/* Order Info */}
            <div className="text-center space-y-1">
              <p className="text-xs text-gold-100/65">Order ID</p>
              <p className="text-gold-500 font-mono font-bold">{orderId}</p>
              <p className="text-2xl font-heading font-bold text-white">
                ฿{totalPrice.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Payment Link */}
            {result.paymentLink && (
              <div className="flex gap-2">
                <input
                  readOnly
                  value={result.paymentLink}
                  className="themed-input flex-1 text-xs"
                />
                <button
                  onClick={handleCopyLink}
                  className="btn-gold text-xs !py-2 !px-3 flex items-center gap-1"
                >
                  {copied ? (
                    <>✓ คัดลอก</>
                  ) : (
                    <>
                      <Copy size={14} /> คัดลอก
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {result.paymentLink && (
                <a
                  href={result.paymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-purple text-xs flex-1 flex items-center justify-center gap-1"
                >
                  <ExternalLink size={14} /> เปิดลิงก์
                </a>
              )}
              <button
                onClick={fetchQr}
                className="btn-purple text-xs flex-1 flex items-center justify-center gap-1"
              >
                <RefreshCw size={14} /> สร้างใหม่
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}