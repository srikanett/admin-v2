import { useState, useEffect, useMemo, useCallback } from "react"
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  onSnapshot,
  orderBy,
  serverTimestamp,
  type DocumentSnapshot,
  type DocumentData,
} from "firebase/firestore"
import { getDbInstance, isInitialized } from "@/lib/firebase"
import { COLLECTIONS } from "@/lib/constants"
import { readField_ } from "@/lib/helpers"
import { GlassPanel } from "@/components/ui/glass-panel"
import { GoldButton } from "@/components/ui/gold-button"
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
import { Input } from "@/components/ui/input"
import {
  MessageSquare,
  Search,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  ImageIcon,
  Type,
  MessageCircle,
  Eye,
  ToggleLeft,
  ToggleRight,
  X,
  GripVertical,
} from "lucide-react"

// ── Types ──
interface MessageBlock {
  type: "text" | "image"
  content: string
}

interface QuickReply {
  label: string
  action: string
}

interface ReplyRule {
  id: string
  name: string
  keywords: string
  messageBlocks: MessageBlock[]
  quickReplies: QuickReply[]
  status: "active" | "inactive"
  createdAt: string
  updatedAt: string
  lastMatchedAt: string
}

// ── Transform Firestore doc → ReplyRule ──
function transformRule(doc: DocumentSnapshot<DocumentData>): ReplyRule {
  const data = doc.data() || {}
  return {
    id: doc.id,
    name: readField_(doc, ["name", "Name"], "")!,
    keywords: readField_(doc, ["keywords", "Keywords"], "")!,
    messageBlocks: (data.messageBlocks as MessageBlock[]) || (data.MessageBlocks as MessageBlock[]) || [],
    quickReplies: (data.quickReplies as QuickReply[]) || (data.QuickReplies as QuickReply[]) || [],
    status: (readField_(doc, ["status", "Status"], "active") as "active" | "inactive") || "active",
    createdAt: readField_(doc, ["createdAt", "CreatedAt"], "")!,
    updatedAt: readField_(doc, ["updatedAt", "UpdatedAt"], "")!,
    lastMatchedAt: readField_(doc, ["lastMatchedAt", "LastMatchedAt"], "")!,
  }
}

const EMPTY_RULE: ReplyRule = {
  id: "",
  name: "",
  keywords: "",
  messageBlocks: [],
  quickReplies: [],
  status: "active",
  createdAt: "",
  updatedAt: "",
  lastMatchedAt: "",
}

// ── Helpers ──
function formatMatchTime(isoOrTs: string): string {
  if (!isoOrTs) return "—"
  try {
    const d = new Date(isoOrTs)
    if (isNaN(d.getTime())) return "—"
    return d.toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) + " " + d.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return "—"
  }
}

export function replyRulesView() {
  const [rules, setRules] = useState<ReplyRule[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ReplyRule>(EMPTY_RULE)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ReplyRule | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Realtime Firestore subscription ──
  useEffect(() => {
    if (!isInitialized()) {
      setLoading(false)
      return
    }
    const db = getDbInstance()
    const q = query(collection(db, COLLECTIONS.REPLY_RULES), orderBy("name"))
    const unsub = onSnapshot(q, (snap) => {
      setRules(snap.docs.map(transformRule))
      setLoading(false)
    })
    return unsub
  }, [])

  // ── Filtered list ──
  const filtered = useMemo(() => {
    if (!search.trim()) return rules
    const s = search.toLowerCase()
    return rules.filter(
      (r) =>
        r.name.toLowerCase().includes(s) ||
        r.keywords.toLowerCase().includes(s)
    )
  }, [rules, search])

  // ── Open modal ──
  const openAdd = () => {
    setEditing(EMPTY_RULE)
    setModalOpen(true)
  }

  const openEdit = (rule: ReplyRule) => {
    setEditing({ ...rule })
    setModalOpen(true)
  }

  // ── Message Block helpers ──
  const addMessageBlock = (type: "text" | "image") => {
    setEditing((p) => ({
      ...p,
      messageBlocks: [...p.messageBlocks, { type, content: "" }],
    }))
  }

  const updateMessageBlock = (idx: number, field: keyof MessageBlock, value: string) => {
    setEditing((p) => {
      const blocks = [...p.messageBlocks]
      blocks[idx] = { ...blocks[idx], [field]: value }
      return { ...p, messageBlocks: blocks }
    })
  }

  const removeMessageBlock = (idx: number) => {
    setEditing((p) => ({
      ...p,
      messageBlocks: p.messageBlocks.filter((_, i) => i !== idx),
    }))
  }

  // ── Quick Reply helpers ──
  const addQuickReply = () => {
    setEditing((p) => ({
      ...p,
      quickReplies: [...p.quickReplies, { label: "", action: "" }],
    }))
  }

  const updateQuickReply = (idx: number, field: keyof QuickReply, value: string) => {
    setEditing((p) => {
      const replies = [...p.quickReplies]
      replies[idx] = { ...replies[idx], [field]: value }
      return { ...p, quickReplies: replies }
    })
  }

  const removeQuickReply = (idx: number) => {
    setEditing((p) => ({
      ...p,
      quickReplies: p.quickReplies.filter((_, i) => i !== idx),
    }))
  }

  // ── Toggle status ──
  const toggleStatus = useCallback(async (rule: ReplyRule) => {
    try {
      const db = getDbInstance()
      const newStatus = rule.status === "active" ? "inactive" : "active"
      await updateDoc(doc(db, COLLECTIONS.REPLY_RULES, rule.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      console.error("Toggle status error:", err)
    }
  }, [])

  // ── Save ──
  const handleSave = useCallback(async () => {
    if (!editing.name.trim()) return
    setSaving(true)
    try {
      const db = getDbInstance()
      const data: Record<string, unknown> = {
        name: editing.name.trim(),
        keywords: editing.keywords.trim(),
        messageBlocks: editing.messageBlocks.filter((b) => b.content.trim()),
        quickReplies: editing.quickReplies.filter((q) => q.label.trim() && q.action.trim()),
        status: editing.status,
        updatedAt: serverTimestamp(),
      }
      if (editing.id) {
        await updateDoc(doc(db, COLLECTIONS.REPLY_RULES, editing.id), data)
      } else {
        await addDoc(collection(db, COLLECTIONS.REPLY_RULES), {
          ...data,
          createdAt: serverTimestamp(),
          lastMatchedAt: "",
        })
      }
      setModalOpen(false)
      setEditing(EMPTY_RULE)
    } catch (err) {
      console.error("Save reply rule error:", err)
    }
    setSaving(false)
  }, [editing])

  // ── Delete ──
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const db = getDbInstance()
      await deleteDoc(doc(db, COLLECTIONS.REPLY_RULES, deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      console.error("Delete reply rule error:", err)
    }
    setDeleting(false)
  }, [deleteTarget])

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/15">
            <MessageSquare size={22} className="text-gold-500" />
          </div>
          <h1 className="aurora-heading text-xl md:text-2xl">จัดการข้อความตอบกลับอัตโนมัติ</h1>
        </div>
        <GoldButton icon={<Plus size={16} />} onClick={openAdd}>
          เพิ่มกฎการตอบกลับ
        </GoldButton>
      </div>

      {/* ── Search Bar ── */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-100/30 pointer-events-none"
        />
        <input
          className="themed-input pl-10"
          placeholder="ค้นหาด้วยชื่อกฎ หรือคำสำคัญ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Table ── */}
      <GlassPanel className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare size={48} className="text-gold-100/15 mb-3" />
            <p className="text-gold-100/30 text-sm">
              {search ? "ไม่พบกฎการตอบกลับที่ค้นหา" : "ยังไม่มีกฎการตอบกลับ"}
            </p>
            {!search && (
              <GoldButton
                className="mt-4"
                variant="purple"
                icon={<Plus size={14} />}
                onClick={openAdd}
              >
                เพิ่มกฎแรก
              </GoldButton>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">ชื่อกฎ</TableHead>
                  <TableHead>คำสำคัญ</TableHead>
                  <TableHead className="w-[90px] text-center">บล็อกข้อความ</TableHead>
                  <TableHead className="w-[90px] text-center">Quick Reply</TableHead>
                  <TableHead className="w-[90px] text-center">สถานะ</TableHead>
                  <TableHead className="w-[140px]">ใช้งานล่าสุด</TableHead>
                  <TableHead className="w-[120px] text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium text-gold-100/90">
                      {rule.name}
                    </TableCell>
                    <TableCell className="text-gold-100/60">
                      <div className="flex flex-wrap gap-1">
                        {rule.keywords
                          .split(",")
                          .filter(Boolean)
                          .map((kw, i) => (
                            <span
                              key={i}
                              className="inline-block px-2 py-0.5 text-xs rounded-full bg-gold-500/10 text-gold-300 border border-gold-500/15"
                            >
                              {kw.trim()}
                            </span>
                          ))}
                        {!rule.keywords.trim() && (
                          <span className="text-gold-100/25 italic">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-gold-100/60">
                      {rule.messageBlocks.length}
                    </TableCell>
                    <TableCell className="text-center text-gold-100/60">
                      {rule.quickReplies.length}
                    </TableCell>
                    <TableCell className="text-center">
                      <button onClick={() => toggleStatus(rule)} title="คลิกเพื่อเปลี่ยนสถานะ">
                        {rule.status === "active" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/25">
                            <ToggleRight size={14} />
                            เปิดใช้งาน
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/25">
                            <ToggleLeft size={14} />
                            ปิดใช้งาน
                          </span>
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-gold-100/40 text-xs">
                      {formatMatchTime(rule.lastMatchedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(rule)}
                          className="p-2 rounded-lg hover:bg-gold-500/10 text-gold-100/40 hover:text-gold-400 transition-colors"
                          title="แก้ไข"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(rule)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-gold-100/40 hover:text-red-400 transition-colors"
                          title="ลบ"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </GlassPanel>

      {/* ═══ Add/Edit Modal ═══ */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gold-100 aurora-heading text-lg">
              {editing.id ? "แก้ไขกฎการตอบกลับ" : "เพิ่มกฎการตอบกลับใหม่"}
            </DialogTitle>
            <DialogDescription className="text-gold-100/40 text-sm">
              กำหนดข้อความตอบกลับอัตโนมัติเมื่อมีคำสำคัญตรงตามที่กำหนด
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* ── Basic Info ── */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gold-100/50 mb-1 font-medium">
                  ชื่อกฎ *
                </label>
                <Input
                  className="themed-input"
                  placeholder="เช่น: ตอบกลับคำถามราคา, ทักทายลูกค้าใหม่"
                  value={editing.name}
                  onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-gold-100/50 mb-1 font-medium">
                  คำสำคัญ (คั่นด้วยเครื่องหมายจุลภาค ,)
                </label>
                <Input
                  className="themed-input"
                  placeholder="เช่น: ราคา, ค่าใช้จ่าย, เท่าไหร่"
                  value={editing.keywords}
                  onChange={(e) => setEditing((p) => ({ ...p, keywords: e.target.value }))}
                />
                {editing.keywords.trim() && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {editing.keywords
                      .split(",")
                      .filter(Boolean)
                      .map((kw, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-gold-500/10 text-gold-300 border border-gold-500/15"
                        >
                          {kw.trim()}
                        </span>
                      ))}
                  </div>
                )}
              </div>

              {/* ── Status Toggle ── */}
              <div>
                <label className="block text-xs text-gold-100/50 mb-1 font-medium">สถานะ</label>
                <button
                  onClick={() =>
                    setEditing((p) => ({
                      ...p,
                      status: p.status === "active" ? "inactive" : "active",
                    }))
                  }
                  className="inline-flex items-center gap-2"
                >
                  {editing.status === "active" ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-green-500/15 text-green-400 border border-green-500/25">
                      <ToggleRight size={16} />
                      เปิดใช้งาน
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-red-500/10 text-red-400 border border-red-500/25">
                      <ToggleLeft size={16} />
                      ปิดใช้งาน
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="border-t border-gold-500/10" />

            {/* ── Message Blocks ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm text-gold-100/60 font-medium flex items-center gap-2">
                  <MessageCircle size={16} className="text-gold-400" />
                  บล็อกข้อความ
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => addMessageBlock("text")}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gold-500/10 text-gold-300 border border-gold-500/20 hover:bg-gold-500/20 transition-colors"
                  >
                    <Type size={12} />
                    เพิ่มข้อความ
                  </button>
                  <button
                    type="button"
                    onClick={() => addMessageBlock("image")}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                  >
                    <ImageIcon size={12} />
                    เพิ่มรูปภาพ
                  </button>
                </div>
              </div>

              {editing.messageBlocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed border-gold-500/10 bg-black/10">
                  <MessageCircle size={32} className="text-gold-100/15 mb-2" />
                  <p className="text-gold-100/25 text-sm">ยังไม่มีบล็อกข้อความ</p>
                  <p className="text-gold-100/15 text-xs mt-1">คลิกปุ่มด้านบนเพื่อเพิ่ม</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {editing.messageBlocks.map((block, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 p-3 rounded-xl border border-gold-500/10 bg-black/20"
                    >
                      <div className="flex-shrink-0 mt-2 text-gold-100/20">
                        <GripVertical size={16} />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              block.type === "text"
                                ? "bg-gold-500/10 text-gold-300 border border-gold-500/20"
                                : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                            }`}
                          >
                            {block.type === "text" ? (
                              <Type size={10} />
                            ) : (
                              <ImageIcon size={10} />
                            )}
                            {block.type === "text" ? "ข้อความ" : "รูปภาพ"}
                          </span>
                          <span className="text-gold-100/20 text-xs">บล็อกที่ {idx + 1}</span>
                        </div>
                        {block.type === "text" ? (
                          <textarea
                            className="themed-input min-h-[80px] resize-y"
                            placeholder="พิมพ์ข้อความตอบกลับ..."
                            value={block.content}
                            onChange={(e) =>
                              updateMessageBlock(idx, "content", e.target.value)
                            }
                            rows={3}
                          />
                        ) : (
                          <Input
                            className="themed-input"
                            placeholder="URL รูปภาพ (https://...)"
                            value={block.content}
                            onChange={(e) =>
                              updateMessageBlock(idx, "content", e.target.value)
                            }
                          />
                        )}
                        {block.type === "image" && block.content && (
                          <div className="mt-2 p-2 rounded-lg border border-gold-500/10 bg-black/20 inline-block">
                            <img
                              src={block.content}
                              alt={`Preview ${idx + 1}`}
                              className="max-h-32 rounded object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none"
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMessageBlock(idx)}
                        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-red-500/10 text-gold-100/30 hover:text-red-400 transition-colors self-start"
                        title="ลบบล็อกนี้"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gold-500/10" />

            {/* ── Quick Replies ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm text-gold-100/60 font-medium flex items-center gap-2">
                  <MessageSquare size={16} className="text-gold-400" />
                  Quick Reply (ปุ่มตอบกลับด่วน)
                </label>
                <button
                  type="button"
                  onClick={addQuickReply}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                >
                  <Plus size={12} />
                  เพิ่ม Quick Reply
                </button>
              </div>

              {editing.quickReplies.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed border-gold-500/10 bg-black/10">
                  <MessageSquare size={32} className="text-gold-100/15 mb-2" />
                  <p className="text-gold-100/25 text-sm">ยังไม่มี Quick Reply</p>
                  <p className="text-gold-100/15 text-xs mt-1">
                    Quick Reply คือปุ่มที่ผู้ใช้สามารถกดตอบกลับได้
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {editing.quickReplies.map((qr, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 p-3 rounded-xl border border-purple-500/10 bg-black/20"
                    >
                      <div className="flex-shrink-0 mt-2 text-gold-100/20">
                        <GripVertical size={16} />
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gold-100/40 mb-1">
                            ป้ายกำกับ (Label)
                          </label>
                          <Input
                            className="themed-input"
                            placeholder="เช่น: ดูราคา, ติดต่อแอดมิน"
                            value={qr.label}
                            onChange={(e) =>
                              updateQuickReply(idx, "label", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gold-100/40 mb-1">
                            คำสั่ง (Action)
                          </label>
                          <Input
                            className="themed-input"
                            placeholder="เช่น: ดูราคา, message=สนใจสอบถาม"
                            value={qr.action}
                            onChange={(e) =>
                              updateQuickReply(idx, "action", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeQuickReply(idx)}
                        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-red-500/10 text-gold-100/30 hover:text-red-400 transition-colors self-start"
                        title="ลบ Quick Reply นี้"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gold-500/10" />

            {/* ── Preview ── */}
            <div>
              <label className="text-sm text-gold-100/60 font-medium flex items-center gap-2 mb-3">
                <Eye size={16} className="text-gold-400" />
                ตัวอย่างข้อความตอบกลับ
              </label>
              <div className="p-5 rounded-xl border border-gold-500/10 bg-black/25 space-y-3">
                {/* Preview header */}
                <div className="flex items-center gap-2 pb-2 border-b border-gold-500/10">
                  <div className="h-6 w-6 rounded-full bg-gold-500/20 flex items-center justify-center">
                    <MessageSquare size={12} className="text-gold-400" />
                  </div>
                  <span className="text-xs text-gold-100/40">
                    {editing.name || "ชื่อกฎการตอบกลับ"}
                  </span>
                  <span
                    className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                      editing.status === "active"
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {editing.status === "active" ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                  </span>
                </div>

                {/* Message blocks preview */}
                {editing.messageBlocks.length === 0 ? (
                  <p className="text-gold-100/20 text-sm italic text-center py-4">
                    ยังไม่มีบล็อกข้อความ
                  </p>
                ) : (
                  <div className="space-y-2">
                    {editing.messageBlocks.map((block, idx) =>
                      block.type === "text" ? (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-gold-500/5 border border-gold-500/10 text-gold-100/80 text-sm whitespace-pre-wrap"
                        >
                          {block.content || (
                            <span className="text-gold-100/20 italic">ข้อความว่างเปล่า</span>
                          )}
                        </div>
                      ) : (
                        <div key={idx} className="p-2 rounded-lg bg-gold-500/5 border border-gold-500/10">
                          {block.content ? (
                            <img
                              src={block.content}
                              alt={`Preview ${idx + 1}`}
                              className="max-h-48 rounded object-cover"
                              onError={(e) => {
                                const el = e.target as HTMLImageElement
                                el.style.display = "none"
                                const parent = el.parentElement
                                if (parent) {
                                  const span = document.createElement("span")
                                  span.className = "text-gold-100/20 italic text-sm"
                                  span.textContent = "ไม่สามารถโหลดรูปภาพได้"
                                  parent.appendChild(span)
                                }
                              }}
                            />
                          ) : (
                            <span className="text-gold-100/20 italic text-sm">
                              URL รูปภาพว่างเปล่า
                            </span>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* Quick replies preview */}
                {editing.quickReplies.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gold-500/10">
                    {editing.quickReplies.map((qr, idx) => (
                      <span
                        key={idx}
                        className="inline-block px-3 py-1.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20"
                      >
                        {qr.label || `Quick Reply ${idx + 1}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <GoldButton variant="ghost" onClick={() => setModalOpen(false)}>
              ยกเลิก
            </GoldButton>
            <GoldButton
              isLoading={saving}
              disabled={!editing.name.trim()}
              onClick={handleSave}
            >
              {editing.id ? "บันทึกการแก้ไข" : "เพิ่มกฎการตอบกลับ"}
            </GoldButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Delete Confirm Modal ═══ */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gold-100">
              <AlertTriangle size={20} className="text-red-400" />
              ยืนยันการลบ
            </DialogTitle>
            <DialogDescription className="text-gold-100/50">
              คุณต้องการลบกฎการตอบกลับ{" "}
              <span className="text-gold-200 font-semibold">
                "{deleteTarget?.name}"
              </span>{" "}
              ใช่หรือไม่?
              <br />
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <GoldButton variant="ghost" onClick={() => setDeleteTarget(null)}>
              ยกเลิก
            </GoldButton>
            <GoldButton
              variant="purple"
              className="!bg-red-500/20 !text-red-300 hover:!bg-red-500/30 !border-red-500/30"
              isLoading={deleting}
              onClick={handleDelete}
            >
              ลบกฎการตอบกลับ
            </GoldButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}