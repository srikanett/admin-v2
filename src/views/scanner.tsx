import { useState, useCallback, useRef } from "react"
import { useAuthStore } from "@/stores/auth"
import { scanSlip } from "@/lib/api"
import { MAX_IMAGE_BYTES } from "@/lib/constants"
import { Camera, Upload, Loader2, CheckCircle2, Banknote, Hash, AlertTriangle } from "lucide-react"
import { GlassPanel } from "@/components/ui/glass-panel"
import { GoldButton } from "@/components/ui/gold-button"

interface ScanResult {
  amount?: number
  date?: string
  ref1?: string
  ref2?: string
  senderName?: string
  senderBank?: string
  receiverBank?: string
  rawText?: string
}

export function scannerView() {
  const { passcode } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [image, setImage] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState("")

  const handleFile = useCallback(async (file: File) => {
    if (file.size > MAX_IMAGE_BYTES) {
      setError("ไฟล์ใหญ่เกินไป กรุณาใช้รูปขนาดไม่เกิน 1.2 MB")
      return
    }
    if (!file.type.startsWith("image/")) {
      setError("กรุณาเลือกไฟล์รูปภาพเท่านั้น")
      return
    }

    setError("")
    setResult(null)

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Scan
    setScanning(true)
    try {
      const base64 = await new Promise<string>((resolve) => {
        const r = new FileReader()
        r.onload = () => {
          const dataUrl = r.result as string
          resolve(dataUrl.split(",")[1] ?? "")
        }
        r.readAsDataURL(file)
      })

      const scanResult = await scanSlip(base64, file.type)
      setResult(scanResult as ScanResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : "สแกนสลิปล้มเหลว")
    }
    setScanning(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/15">
          <Camera size={22} className="text-gold-500" />
        </div>
        <h1 className="text-xl md:text-2xl font-heading text-gold-500">สแกนสลิป</h1>
      </div>

      {/* Upload area */}
      <GlassPanel>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
            image
              ? "border-gold-500/30 bg-black/10"
              : "border-gold-500/20 hover:border-gold-500/40 bg-black/5"
          }`}
        >
          {image ? (
            <div className="space-y-4 text-center">
              <img
                src={image}
                alt="สลิป"
                className="max-h-[300px] rounded-xl border border-gold-500/20 shadow-lg"
              />
              <p className="text-sm text-gold-100/50">คลิกเพื่อเปลี่ยนรูป</p>
            </div>
          ) : (
            <>
              <Upload size={48} className="text-gold-500/40 mb-4" />
              <p className="text-lg font-heading text-gold-100/60 mb-1">
                ลากรูปสลิปมาวางที่นี่
              </p>
              <p className="text-sm text-gold-100/30">
                หรือคลิกเพื่อเลือกไฟล์ (สูงสุด 1.2 MB)
              </p>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
      </GlassPanel>

      {/* Scanning */}
      {scanning && (
        <GlassPanel className="!border-gold-500/20">
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 size={40} className="animate-spin text-gold-500" />
            <p className="text-gold-100/60 font-heading">
              กำลังสแกนด้วย AI...
            </p>
            <p className="text-xs text-gold-100/30">Gemini กำลังอ่านข้อมูลจากสลิป</p>
          </div>
        </GlassPanel>
      )}

      {/* Error */}
      {error && (
        <div className="glass-panel !border-rose-500/30 !bg-rose-500/5 p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-rose-400 flex-shrink-0" />
          <p className="text-sm text-rose-400">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && !scanning && (
        <GlassPanel className="!border-emerald-500/20">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={20} className="text-emerald-400" />
            <h3 className="font-heading text-emerald-400">ผลการสแกน</h3>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {result.amount !== undefined && (
              <InfoCard
                icon={<Banknote size={16} />}
                label="จำนวนเงิน"
                value={`฿${result.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`}
                highlight
              />
            )}
            {result.date && (
              <InfoCard icon={<Hash size={16} />} label="วันที่" value={result.date} />
            )}
            {result.ref1 && (
              <InfoCard icon={<Hash size={16} />} label="เลขอ้างอิง 1" value={result.ref1} />
            )}
            {result.ref2 && (
              <InfoCard icon={<Hash size={16} />} label="เลขอ้างอิง 2" value={result.ref2} />
            )}
            {result.senderName && (
              <InfoCard icon={<Hash size={16} />} label="ชื่อผู้โอน" value={result.senderName} />
            )}
            {result.senderBank && (
              <InfoCard icon={<Hash size={16} />} label="ธนาคารต้นทาง" value={result.senderBank} />
            )}
            {result.receiverBank && (
              <InfoCard
                icon={<Hash size={16} />}
                label="ธนาคารปลายทาง"
                value={result.receiverBank}
              />
            )}
          </div>

          {result.rawText && (
            <details className="mt-4">
              <summary className="text-xs text-gold-100/30 cursor-pointer hover:text-gold-100/50">
                ดูข้อความดิบ
              </summary>
              <pre className="mt-2 rounded-lg bg-black/30 p-3 text-xs text-gold-100/50 overflow-auto max-h-32">
                {result.rawText}
              </pre>
            </details>
          )}
        </GlassPanel>
      )}
    </div>
  )
}

function InfoCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-black/30 p-3 border border-gold-500/10">
      <span className="text-gold-500/60">{icon}</span>
      <div>
        <p className="text-[10px] text-gold-100/40 uppercase tracking-wider">{label}</p>
        <p
          className={`text-sm font-heading ${highlight ? "text-gold-500 font-bold text-lg" : "text-white/90"}`}
        >
          {value}
        </p>
      </div>
    </div>
  )
}