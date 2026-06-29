import { useState, useEffect, useCallback } from "react"
import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  onSnapshot,
  limit,
  type DocumentSnapshot,
  type DocumentData,
} from "firebase/firestore"
import { getDbInstance, isInitialized } from "@/lib/firebase"
import { COLLECTIONS } from "@/lib/constants"
import { readField_ } from "@/lib/helpers"
import { GlassPanel } from "@/components/ui/glass-panel"
import { GoldButton } from "@/components/ui/gold-button"
import {
  MessageCircle,
  Bot,
  Settings,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react"

interface BotConfig {
  autoReplyEnabled: boolean
  autoOrderEnabled: boolean
  welcomeMessage: string
  noMatchMessage: string
  adminLineInteractive: boolean
  notifyCutover: boolean
}

const DEFAULT_CONFIG: BotConfig = {
  autoReplyEnabled: false,
  autoOrderEnabled: false,
  welcomeMessage: "สวัสดีครับ 🙏 ยินดีต้อนรับสู่ศรีคเนศ เทวาลัย\nสอบถามหรือสั่งของได้เลยนะครับ",
  noMatchMessage: "ขออภัยครับ ระบบยังไม่เข้าใจคำถามนี้\nกรุณาพิมพ์ใหม่ หรือติดต่อแอดมินโดยตรง",
  adminLineInteractive: false,
  notifyCutover: false,
}

function transformBotConfig(doc: DocumentSnapshot<DocumentData>): BotConfig {
  return {
    autoReplyEnabled: readField_(doc, ["autoReplyEnabled", "AutoReplyEnabled"], DEFAULT_CONFIG.autoReplyEnabled)!,
    autoOrderEnabled: readField_(doc, ["autoOrderEnabled", "AutoOrderEnabled"], DEFAULT_CONFIG.autoOrderEnabled)!,
    welcomeMessage: readField_(doc, ["welcomeMessage", "WelcomeMessage"], DEFAULT_CONFIG.welcomeMessage)!,
    noMatchMessage: readField_(doc, ["noMatchMessage", "NoMatchMessage"], DEFAULT_CONFIG.noMatchMessage)!,
    adminLineInteractive: readField_(doc, ["adminLineInteractive", "AdminLineInteractive"], DEFAULT_CONFIG.adminLineInteractive)!,
    notifyCutover: readField_(doc, ["notifyCutover", "NotifyCutover"], DEFAULT_CONFIG.notifyCutover)!,
  }
}

export function lineBotView() {
  const [config, setConfig] = useState<BotConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load config from Firestore _system/botConfig
  useEffect(() => {
    if (!isInitialized()) {
      setLoading(false)
      return
    }

    try {
      const db = getDbInstance()
      const configRef = doc(db, COLLECTIONS._SYSTEM, "botConfig")

      getDoc(configRef).then((snap) => {
        if (snap.exists()) {
          setConfig(transformBotConfig(snap))
        }
        setLoading(false)
      }).catch(() => setLoading(false))
    } catch {
      setLoading(false)
    }
  }, [])

  const handleSave = async () => {
    if (!isInitialized()) return
    setSaving(true)
    try {
      const db = getDbInstance()
      const configRef = doc(db, COLLECTIONS._SYSTEM, "botConfig")
      await setDoc(configRef, config, { merge: true })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error("Save bot config failed:", err)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/15">
          <Bot size={22} className="text-gold-500" />
        </div>
        <h1 className="text-xl md:text-2xl font-heading text-gold-500">ตั้งค่า LINE Bot</h1>
      </div>

      {/* Feature Toggles */}
      <GlassPanel>
        <h3 className="text-sm font-heading text-gold-300 mb-4 flex items-center gap-2">
          <Settings size={16} />
          Feature Flags
        </h3>
        <div className="space-y-4">
          <ToggleRow
            label="ตอบกลับอัตโนมัติ (Auto Reply)"
            desc="เปิดให้ Bot ตอบกลับลูกค้าอัตโนมัติตาม reply rules"
            enabled={config.autoReplyEnabled}
            onChange={(v) => setConfig((c) => ({ ...c, autoReplyEnabled: v }))}
          />
          <ToggleRow
            label="สร้างออร์เดอร์อัตโนมัติ (Auto Order)"
            desc="สร้างออร์เดอร์จาก keyword ในแชทอัตโนมัติ"
            enabled={config.autoOrderEnabled}
            onChange={(v) => setConfig((c) => ({ ...c, autoOrderEnabled: v }))}
          />
          <ToggleRow
            label="ปุ่ม Interactive ใน LINE"
            desc="แสดงปุ่ม Quick Reply ในข้อความ LINE"
            enabled={config.adminLineInteractive}
            onChange={(v) => setConfig((c) => ({ ...c, adminLineInteractive: v }))}
          />
          <ToggleRow
            label="NOTIFY_CUTOVER"
            desc="⚠️ เปิดส่ง LINE แจ้งเตือนจริง (ปิด = shadow mode — log เท่านั้น)"
            enabled={config.notifyCutover}
            onChange={(v) => setConfig((c) => ({ ...c, notifyCutover: v }))}
            warning={!config.notifyCutover}
          />
        </div>
      </GlassPanel>

      {/* Messages */}
      <GlassPanel>
        <h3 className="text-sm font-heading text-gold-300 mb-4 flex items-center gap-2">
          <MessageCircle size={16} />
          ข้อความอัตโนมัติ
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gold-100/80 mb-1.5">
              ข้อความต้อนรับ
            </label>
            <textarea
              className="themed-input min-h-[80px]"
              value={config.welcomeMessage}
              onChange={(e) =>
                setConfig((c) => ({ ...c, welcomeMessage: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-xs text-gold-100/80 mb-1.5">
              ข้อความเมื่อไม่เข้าใจ
            </label>
            <textarea
              className="themed-input min-h-[60px]"
              value={config.noMatchMessage}
              onChange={(e) =>
                setConfig((c) => ({ ...c, noMatchMessage: e.target.value }))
              }
            />
          </div>
        </div>
      </GlassPanel>

      {/* Channel Info */}
      <GlassPanel>
        <h3 className="text-sm font-heading text-gold-300 mb-4 flex items-center gap-2">
          <Bot size={16} />
          LINE Channels
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl bg-black/30 p-4 border border-gold-500/10">
            <p className="text-xs text-gold-100/65 uppercase tracking-wider mb-1">
              Bot 1
            </p>
            <p className="font-heading text-gold-500">Sriganett99</p>
            <p className="text-xs text-gold-100/55 mt-1">LIFF: 2008655508-r8W209qQ</p>
          </div>
          <div className="rounded-xl bg-black/30 p-4 border border-gold-500/10">
            <p className="text-xs text-gold-100/65 uppercase tracking-wider mb-1">
              Bot 2
            </p>
            <p className="font-heading text-gold-500">ศรีคเนศ เทวาลัย</p>
            <p className="text-xs text-gold-100/55 mt-1">LIFF: 2009352737-Kp9DAzYW</p>
          </div>
        </div>
      </GlassPanel>

      {/* Save */}
      <div className="flex items-center gap-3">
        <GoldButton
          onClick={handleSave}
          isLoading={saving}
          icon={saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
          className={saved ? "!bg-emerald-600" : ""}
        >
          {saved ? "บันทึกแล้ว ✓" : "บันทึกการตั้งค่า"}
        </GoldButton>
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  desc,
  enabled,
  onChange,
  warning,
}: {
  label: string
  desc: string
  enabled: boolean
  onChange: (v: boolean) => void
  warning?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="flex-1">
        <p className="text-sm text-white/90 font-heading">{label}</p>
        <p className="text-xs text-gold-100/65 mt-0.5">
          {warning && <AlertTriangle size={12} className="inline mr-1 text-[#EAB308]" />}
          {desc}
        </p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`flex-shrink-0 mt-0.5 transition-colors ${
          enabled ? "text-emerald-400 hover:text-emerald-300" : "text-gold-100/55 hover:text-gold-100/80"
        }`}
      >
        {enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
      </button>
    </div>
  )
}