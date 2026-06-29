import { useState, useEffect, useCallback } from "react"
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  type DocumentSnapshot,
  type DocumentData,
} from "firebase/firestore"
import { getDbInstance, isInitialized } from "@/lib/firebase"
import { COLLECTIONS } from "@/lib/constants"
import { sendOrderToCustomer } from "@/lib/api"
import { readField_ } from "@/lib/helpers"
import { GlassPanel } from "@/components/ui/glass-panel"
import { GoldButton } from "@/components/ui/gold-button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Send,
  History,
  Plus,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Users,
  Tag,
  UserRound,
  Megaphone,
  ChevronRight,
} from "lucide-react"

// ═══════════════════════════════════════
// Types
// ═══════════════════════════════════════

type TargetType = "all" | "specific" | "tags"

interface MessageBlock {
  id: string
  text: string
  imageUrl: string
}

type FlexTemplate =
  | "customerPendingReview"
  | "customerShippingConfirmed"
  | "cfOrderFlex"
  | "adminSubmitFlex"

type SendMode = "now" | "schedule"

interface BroadcastDraft {
  id: string
  targetType: TargetType
  targets: string[]
  message: MessageBlock[]
  template: FlexTemplate
  sendMode: SendMode
  scheduledAt?: string
  status: "draft" | "sending" | "sent" | "failed"
  createdAt: string
  sentAt?: string
  error?: string
}

// ═══════════════════════════════════════
// Constants
// ═══════════════════════════════════════

const FLEX_TEMPLATES: { value: FlexTemplate; label: string }[] = [
  {
    value: "customerPendingReview",
    label: "customerPendingReview — แจ้งเตือนรอตรวจสอบ",
  },
  {
    value: "customerShippingConfirmed",
    label: "customerShippingConfirmed — ยืนยันการจัดส่ง",
  },
  { value: "cfOrderFlex", label: "cfOrderFlex — Flex ออเดอร์" },
  {
    value: "adminSubmitFlex",
    label: "adminSubmitFlex — แจ้งเตือนแอดมิน",
  },
]

const TARGET_LABELS: Record<TargetType, string> = {
  all: "ส่งทั้งหมด",
  specific: "ระบุลูกค้า",
  tags: "ตามแท็ก",
}

const STATUS_ICON: Record<BroadcastDraft["status"], React.ReactNode> = {
  draft: <Clock className="h-4 w-4 text-gold-500" />,
  sending: <Loader2 className="h-4 w-4 animate-spin text-info" />,
  sent: <CheckCircle className="h-4 w-4 text-success" />,
  failed: <XCircle className="h-4 w-4 text-danger" />,
}

const STATUS_LABEL: Record<BroadcastDraft["status"], string> = {
  draft: "ฉบับร่าง",
  sending: "กำลังส่ง",
  sent: "ส่งสำเร็จ",
  failed: "ส่งไม่สำเร็จ",
}

// ═══════════════════════════════════════
// Helpers
// ═══════════════════════════════════════

function generateBlockId(): string {
  return `block_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function formatDateTime(dateStr: string | undefined): string {
  if (!dateStr) return "—"
  try {
    const d = new Date(dateStr)
    return d.toLocaleString("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dateStr
  }
}

function transformDraft(doc: DocumentSnapshot<DocumentData>): BroadcastDraft {
  return {
    id: doc.id,
    targetType: readField_(doc, ["targetType"], "all")!,
    targets: (readField_(doc, ["targets"], [])! as string[]) || [],
    message: (readField_(doc, ["message"], [])! as MessageBlock[]) || [],
    template: readField_(doc, ["template"], "cfOrderFlex")!,
    sendMode: readField_(doc, ["sendMode"], "now")!,
    scheduledAt: readField_(doc, ["scheduledAt"], ""),
    status: readField_(doc, ["status"], "draft")!,
    createdAt: readField_(doc, ["createdAt"], "")!,
    sentAt: readField_(doc, ["sentAt"], ""),
    error: readField_(doc, ["error"], ""),
  }
}

// ═══════════════════════════════════════
// Broadcast View
// ═══════════════════════════════════════

export function broadcastView() {
  // ── Compose state ──
  const [targetType, setTargetType] = useState<TargetType>("all")
  const [specificUsers, setSpecificUsers] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [blocks, setBlocks] = useState<MessageBlock[]>([
    { id: generateBlockId(), text: "", imageUrl: "" },
  ])
  const [template, setTemplate] = useState<FlexTemplate>("cfOrderFlex")
  const [sendMode, setSendMode] = useState<SendMode>("now")
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("")

  // ── Send state ──
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{
    total: number
    success: number
    fail: number
    errors: string[]
  } | null>(null)

  // ── UI state ──
  const [previewOpen, setPreviewOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [resultOpen, setResultOpen] = useState(false)

  // ── History state ──
  const [drafts, setDrafts] = useState<BroadcastDraft[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  // ── Load history ──
  useEffect(() => {
    if (!isInitialized()) {
      setHistoryLoading(false)
      return
    }
    const db = getDbInstance()
    const q = query(
      collection(db, COLLECTIONS.BROADCAST_DRAFTS),
      orderBy("createdAt", "desc"),
      limit(50)
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        setDrafts(snap.docs.map(transformDraft))
        setHistoryLoading(false)
      },
      () => setHistoryLoading(false)
    )
    return () => unsub()
  }, [])

  // ── Derived ──
  const parsedTags = useCallback((): string[] => {
    return tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
  }, [tagInput])

  const parsedUsers = useCallback((): string[] => {
    return specificUsers
      .split(/[\n,]/)
      .map((u) => u.trim())
      .filter(Boolean)
  }, [specificUsers])

  // ── Block ops ──
  const addBlock = () => {
    setBlocks((prev) => [
      ...prev,
      { id: generateBlockId(), text: "", imageUrl: "" },
    ])
  }

  const removeBlock = (id: string) => {
    setBlocks((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((b) => b.id !== id)
    })
  }

  const updateBlock = (id: string, field: keyof MessageBlock, value: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    )
  }

  // ── Validation ──
  const isValid = (): boolean => {
    // At least one block with text
    const hasText = blocks.some((b) => b.text.trim().length > 0)
    if (!hasText) return false

    // Target validation
    if (targetType === "specific" && parsedUsers().length === 0) return false
    if (targetType === "tags" && parsedTags().length === 0) return false

    // Schedule validation
    if (sendMode === "schedule" && (!scheduleDate || !scheduleTime)) return false

    return true
  }

  // ── Save draft to Firestore ──
  const saveDraft = async (status: BroadcastDraft["status"] = "draft") => {
    const db = getDbInstance()
    let targets: string[] = []
    if (targetType === "specific") targets = parsedUsers()
    else if (targetType === "tags") targets = parsedTags()

    const now = new Date().toISOString()
    const scheduledAt =
      sendMode === "schedule" && scheduleDate && scheduleTime
        ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
        : undefined

    await addDoc(collection(db, COLLECTIONS.BROADCAST_DRAFTS), {
      targetType,
      targets,
      message: blocks,
      template,
      sendMode,
      scheduledAt: scheduledAt || null,
      status,
      createdAt: now,
      sentAt: status === "sent" ? now : null,
    })
  }

  // ── Send ──
  const handleSend = async () => {
    if (!isInitialized()) {
      alert("Firebase ยังไม่ได้เชื่อมต่อ กรุณาลองใหม่อีกครั้ง")
      return
    }

    let targets: string[] = []
    if (targetType === "all") {
      targets = ["ALL_USERS"]
    } else if (targetType === "specific") {
      targets = parsedUsers()
    } else if (targetType === "tags") {
      targets = parsedTags()
    }

    if (targets.length === 0) {
      alert("กรุณาระบุเป้าหมายอย่างน้อย 1 รายการ")
      return
    }

    setSending(true)
    setSendResult(null)

    const results = { total: targets.length, success: 0, fail: 0, errors: [] as string[] }

    // Save draft first
    try {
      await saveDraft("sending")
    } catch {
      // Continue even if draft save fails
    }

    // Send to each target
    for (const target of targets) {
      try {
        await sendOrderToCustomer({
          orderId: `broadcast_${Date.now()}`,
          planName: template,
          lineUserId: target !== "ALL_USERS" ? target : undefined,
        })
        results.success++
      } catch (e: unknown) {
        results.fail++
        const errMsg =
          e instanceof Error ? e.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ"
        results.errors.push(`${target}: ${errMsg}`)
      }
    }

    setSending(false)
    setSendResult(results)

    // Save final status
    try {
      await saveDraft(results.fail === 0 ? "sent" : "failed")
    } catch {
      // ignore
    }

    // Reset form on full success
    if (results.fail === 0) {
      setSpecificUsers("")
      setTagInput("")
      setBlocks([{ id: generateBlockId(), text: "", imageUrl: "" }])
      setTemplate("cfOrderFlex")
      setSendMode("now")
      setScheduleDate("")
      setScheduleTime("")
    }

    setResultOpen(true)
  }

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-heading font-bold text-gold-500 flex items-center gap-2">
          <Megaphone className="h-6 w-6" />
          ส่งบอร์ดแคสต์ LINE
        </h2>
        <div className="flex gap-2">
          <GoldButton
            variant="purple"
            icon={<History className="h-4 w-4" />}
            onClick={() => setHistoryOpen(true)}
          >
            ประวัติการส่ง
          </GoldButton>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Left Column: Target + Schedule ── */}
        <div className="space-y-4 lg:col-span-1">
          {/* Target Selector */}
          <GlassPanel>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-heading text-gold-300">
              <Users className="h-5 w-5" />
              กลุ่มเป้าหมาย
            </h3>

            <div className="space-y-3">
              {(["all", "specific", "tags"] as TargetType[]).map((t) => (
                <label
                  key={t}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                    targetType === t
                      ? "border-gold-500/60 bg-gold-500/10"
                      : "border-gold-500/15 hover:border-gold-500/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="targetType"
                    value={t}
                    checked={targetType === t}
                    onChange={() => setTargetType(t)}
                    className="accent-gold-500 h-4 w-4"
                  />
                  <span className="text-sm text-white/80">
                    {TARGET_LABELS[t]}
                  </span>
                </label>
              ))}
            </div>

            {/* Specific User Input */}
            {targetType === "specific" && (
              <div className="mt-4 space-y-2">
                <label className="flex items-center gap-2 text-sm text-gold-300/70">
                  <UserRound className="h-4 w-4" />
                  LINE User ID (หนึ่งบรรทัดต่อหนึ่ง ID หรือคั่นด้วยลูกน้ำ)
                </label>
                <textarea
                  value={specificUsers}
                  onChange={(e) => setSpecificUsers(e.target.value)}
                  placeholder={`Uxxxxxxxxxxxxxxxxxxxx\nUyyyyyyyyyyyyyyyyyyyy`}
                  rows={4}
                  className="themed-input resize-none"
                />
              </div>
            )}

            {/* Tag Input */}
            {targetType === "tags" && (
              <div className="mt-4 space-y-2">
                <label className="flex items-center gap-2 text-sm text-gold-300/70">
                  <Tag className="h-4 w-4" />
                  แท็ก (คั่นด้วยลูกน้ำ)
                </label>
                <textarea
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="VIP, ขาจร, พิธีกรรม"
                  rows={3}
                  className="themed-input resize-none"
                />
              </div>
            )}
          </GlassPanel>

          {/* Flex Template Selector */}
          <GlassPanel>
            <h3 className="mb-4 text-lg font-heading text-gold-300">
              แม่แบบ Flex Message
            </h3>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as FlexTemplate)}
              className="themed-select"
            >
              {FLEX_TEMPLATES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </GlassPanel>

          {/* Schedule Toggle */}
          <GlassPanel>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-heading text-gold-300">
              <Clock className="h-5 w-5" />
              กำหนดเวลา
            </h3>

            <div className="mb-4 flex rounded-xl border border-gold-500/20 overflow-hidden">
              <button
                onClick={() => setSendMode("now")}
                className={`flex-1 px-4 py-2.5 text-sm font-heading transition-all ${
                  sendMode === "now"
                    ? "bg-gold-500/20 text-gold-400"
                    : "text-white/60 hover:text-white/80"
                }`}
              >
                ส่งทันที
              </button>
              <button
                onClick={() => setSendMode("schedule")}
                className={`flex-1 px-4 py-2.5 text-sm font-heading transition-all ${
                  sendMode === "schedule"
                    ? "bg-gold-500/20 text-gold-400"
                    : "text-white/60 hover:text-white/80"
                }`}
              >
                ตั้งเวลา
              </button>
            </div>

            {sendMode === "schedule" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gold-300/70 mb-1">
                    วันที่
                  </label>
                  <Input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gold-300/70 mb-1">
                    เวลา
                  </label>
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
              </div>
            )}
          </GlassPanel>
        </div>

        {/* ── Right Column: Message Composer + Preview ── */}
        <div className="space-y-4 lg:col-span-2">
          {/* Message Composer */}
          <GlassPanel variant="customer">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-heading text-gold-300">
                <Megaphone className="h-5 w-5" />
                เขียนข้อความ
              </h3>
              <GoldButton
                variant="purple"
                icon={<Plus className="h-4 w-4" />}
                onClick={addBlock}
              >
                เพิ่มบล็อก
              </GoldButton>
            </div>

            <div className="space-y-4">
              {blocks.map((block, idx) => (
                <div
                  key={block.id}
                  className="rounded-xl border border-gold-500/10 bg-black/20 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-heading text-gold-500/75">
                      บล็อกที่ {idx + 1}
                    </span>
                    {blocks.length > 1 && (
                      <button
                        onClick={() => removeBlock(block.id)}
                        className="text-rose-500 hover:text-rose-400 transition-colors"
                        title="ลบบล็อก"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gold-300/70 mb-1">
                      ข้อความ
                    </label>
                    <textarea
                      value={block.text}
                      onChange={(e) =>
                        updateBlock(block.id, "text", e.target.value)
                      }
                      placeholder="พิมพ์ข้อความที่ต้องการส่ง..."
                      rows={3}
                      className="themed-input resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gold-300/70 mb-1">
                      URL รูปภาพ (ไม่บังคับ)
                    </label>
                    <Input
                      value={block.imageUrl}
                      onChange={(e) =>
                        updateBlock(block.id, "imageUrl", e.target.value)
                      }
                      placeholder="https://..."
                    />
                  </div>

                  {/* Image preview */}
                  {block.imageUrl && (
                    <div className="mt-2 overflow-hidden rounded-lg border border-gold-500/10">
                      <img
                        src={block.imageUrl}
                        alt="ตัวอย่างรูปภาพ"
                        className="max-h-40 w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none"
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </GlassPanel>

          {/* Summary + Actions */}
          <GlassPanel variant="note">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-3 text-sm text-white/70">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-gold-500" />
                  เป้าหมาย:{" "}
                  <span className="text-white">
                    {targetType === "all"
                      ? "ทั้งหมด"
                      : targetType === "specific"
                        ? `${parsedUsers().length || 0} ราย`
                        : `${parsedTags().length || 0} แท็ก`}
                  </span>
                </span>
                <span className="text-white/55">|</span>
                <span className="flex items-center gap-1">
                  <Megaphone className="h-3.5 w-3.5 text-gold-500" />
                  บล็อก:{" "}
                  <span className="text-white">{blocks.length} บล็อก</span>
                </span>
                <span className="text-white/55">|</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-gold-500" />
                  {sendMode === "now" ? "ส่งทันที" : "ตั้งเวลาส่ง"}
                </span>
              </div>

              <div className="flex gap-2">
                <GoldButton
                  variant="ghost"
                  icon={<Eye className="h-4 w-4" />}
                  onClick={() => setPreviewOpen(true)}
                  disabled={!isValid()}
                >
                  ดูตัวอย่าง
                </GoldButton>
                <GoldButton
                  icon={
                    sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )
                  }
                  onClick={handleSend}
                  disabled={!isValid() || sending}
                  isLoading={sending}
                >
                  {sendMode === "now" ? "ส่งทันที" : "บันทึกตารางส่ง"}
                </GoldButton>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* ── Preview Dialog ── */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-gold-400 font-heading">
              ตัวอย่างข้อความ
            </DialogTitle>
            <DialogDescription className="text-white/60">
              ตรวจสอบก่อนส่งจริง
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto py-2">
            <div className="rounded-lg border border-gold-500/10 bg-black/30 p-4">
              <div className="flex items-center gap-2 mb-3 text-xs text-gold-500/75">
                <Megaphone className="h-3 w-3" />
                แม่แบบ: {template}
              </div>

              <div className="space-y-3">
                {blocks.map((block, idx) => (
                  <div key={block.id}>
                    {block.text && (
                      <div className="rounded-lg bg-black/40 p-3 text-sm text-white/85 whitespace-pre-wrap">
                        {block.text}
                      </div>
                    )}
                    {block.imageUrl && (
                      <div className="mt-2 overflow-hidden rounded-lg border border-gold-500/10">
                        <img
                          src={block.imageUrl}
                          alt="ภาพประกอบ"
                          className="max-h-48 w-full object-cover"
                        />
                      </div>
                    )}
                    {idx < blocks.length - 1 &&
                      blocks[idx + 1]?.text && (
                        <div className="my-2 border-t border-gold-500/8" />
                      )}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs text-white/70 space-y-1">
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3" />
                <span>
                  เป้าหมาย:{" "}
                  {targetType === "all"
                    ? "ลูกค้าทั้งหมด"
                    : targetType === "specific"
                      ? `${parsedUsers().length} ราย`
                      : `แท็ก: ${parsedTags().join(", ") || "—"}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>
                  {sendMode === "now"
                    ? "ส่งทันที"
                    : `ตั้งเวลาส่ง: ${scheduleDate || "—"} ${scheduleTime || "—"}`}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <GoldButton
              variant="purple"
              onClick={() => setPreviewOpen(false)}
            >
              ปิด
            </GoldButton>
            <GoldButton
              icon={
                sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )
              }
              onClick={() => {
                setPreviewOpen(false)
                handleSend()
              }}
              disabled={sending}
              isLoading={sending}
            >
              ส่งเลย
            </GoldButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Send Result Dialog ── */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {sendResult?.fail === 0 ? (
                <span className="text-success flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  ส่งสำเร็จ
                </span>
              ) : (
                <span className="text-rose-500 flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  ส่งบางส่วนไม่สำเร็จ
                </span>
              )}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              {sendResult && (
                <>
                  ส่งทั้งหมด {sendResult.total} รายการ — สำเร็จ{" "}
                  {sendResult.success}, ไม่สำเร็จ {sendResult.fail}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {sendResult && sendResult.errors.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-1 py-2">
              {sendResult.errors.map((err, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2 text-xs text-rose-400"
                >
                  {err}
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <GoldButton
              variant="gold"
              onClick={() => setResultOpen(false)}
            >
              ตกลง
            </GoldButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── History Dialog ── */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gold-400 font-heading flex items-center gap-2">
              <History className="h-5 w-5" />
              ประวัติการส่งบอร์ดแคสต์
            </DialogTitle>
            <DialogDescription className="text-white/60">
              รายการส่งล่าสุด {drafts.length} รายการ
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[55vh] overflow-y-auto">
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gold-500" />
              </div>
            ) : drafts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-white/70 gap-2">
                <History className="h-10 w-10" />
                <p>ยังไม่มีประวัติการส่ง</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30px]">สถานะ</TableHead>
                    <TableHead>แม่แบบ</TableHead>
                    <TableHead>เป้าหมาย</TableHead>
                    <TableHead>ข้อความ</TableHead>
                    <TableHead className="text-right">วันที่</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drafts.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <span title={STATUS_LABEL[d.status]}>
                          {STATUS_ICON[d.status]}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {d.template}
                      </TableCell>
                      <TableCell className="text-xs">
                        {d.targetType === "all"
                          ? "ทั้งหมด"
                          : d.targets.slice(0, 2).join(", ") +
                            (d.targets.length > 2
                              ? ` +${d.targets.length - 2}`
                              : "")}
                      </TableCell>
                      <TableCell className="text-xs max-w-[180px] truncate">
                        {d.message[0]?.text?.slice(0, 40) || "—"}
                        {d.message.length > 1 ? ` +${d.message.length - 1}` : ""}
                      </TableCell>
                      <TableCell className="text-xs text-right whitespace-nowrap">
                        {formatDateTime(d.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <DialogFooter>
            <GoldButton
              variant="purple"
              onClick={() => setHistoryOpen(false)}
            >
              ปิด
            </GoldButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}