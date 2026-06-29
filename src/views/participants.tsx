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
  Cake,
  Search,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  User,
  Calendar,
  Users,
} from "lucide-react"

// ── Participant ──
interface Participant {
  id: string
  name: string
  birthday: string // DD/MM/YYYY
  phone?: string
  ceremonyName?: string
  notes?: string
}

// ── Transform Firestore doc ──
function transformParticipant(doc: DocumentSnapshot<DocumentData>): Participant {
  return {
    id: doc.id,
    name: readField_(doc, ["name", "Name", "participantName"], "")!,
    birthday: readField_(doc, ["birthday", "Birthday", "participantBirthday"], "")!,
    phone: readField_(doc, ["phone", "Phone"], ""),
    ceremonyName: readField_(doc, ["ceremonyName", "CeremonyName"], ""),
    notes: readField_(doc, ["notes", "Notes"], ""),
  }
}

const EMPTY_PARTICIPANT: Participant = {
  id: "",
  name: "",
  birthday: "",
  phone: "",
  ceremonyName: "",
  notes: "",
}

// ── Helpers ──
function getDaysUntilBirthday(birthdayStr: string): number | null {
  if (!birthdayStr) return null
  const parts = birthdayStr.split("/")
  if (parts.length !== 3) return null
  const day = parseInt(parts[0])
  const month = parseInt(parts[1])
  if (isNaN(day) || isNaN(month)) return null

  const today = new Date()
  const currentYear = today.getFullYear()
  let nextBirthday = new Date(currentYear, month - 1, day)

  if (nextBirthday < today) {
    nextBirthday = new Date(currentYear + 1, month - 1, day)
  }

  const diffMs = nextBirthday.getTime() - today.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

function getAge(birthdayStr: string): number | null {
  if (!birthdayStr) return null
  const parts = birthdayStr.split("/")
  if (parts.length !== 3) return null
  const day = parseInt(parts[0])
  const month = parseInt(parts[1])
  const year = parseInt(parts[2])

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null

  // Handle Thai Buddhist year (พ.ศ.) — subtract 543
  const birthYear = year > 2500 ? year - 543 : year

  const today = new Date()
  let age = today.getFullYear() - birthYear
  const birthThisYear = new Date(today.getFullYear(), month - 1, day)
  if (today < birthThisYear) age--
  return age
}

// ── Today's birthdays ──
function isToday(birthdayStr: string): boolean {
  if (!birthdayStr) return false
  const parts = birthdayStr.split("/")
  if (parts.length !== 3) return false
  const day = parseInt(parts[0])
  const month = parseInt(parts[1])
  const today = new Date()
  return today.getDate() === day && today.getMonth() + 1 === month
}

export function manageParticipantBirthdayView() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "today" | "thisMonth" | "thisWeek">("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Participant>(EMPTY_PARTICIPANT)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Participant | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Realtime Firestore ──
  useEffect(() => {
    if (!isInitialized()) {
      setLoading(false)
      return
    }
    const db = getDbInstance()
    const q = query(collection(db, COLLECTIONS.PARTICIPANTS), orderBy("name"), limit(500))
    const unsub = onSnapshot(q, (snap) => {
      setParticipants(snap.docs.map(transformParticipant))
      setLoading(false)
    })
    return unsub
  }, [])

  // ── Filtered ──
  const filtered = useMemo(() => {
    let list = participants
    const today = new Date()
    const todayMonth = today.getMonth() + 1
    const todayDay = today.getDate()

    if (filter === "today") {
      list = list.filter((p) => {
        const parts = p.birthday?.split("/")
        if (parts?.length !== 3) return false
        return parseInt(parts[0]) === todayDay && parseInt(parts[1]) === todayMonth
      })
    } else if (filter === "thisWeek") {
      const endOfWeek = new Date(today)
      endOfWeek.setDate(today.getDate() + 7 - today.getDay())
      list = list.filter((p) => {
        const days = getDaysUntilBirthday(p.birthday)
        return days !== null && days >= 0 && days <= 7
      })
    } else if (filter === "thisMonth") {
      list = list.filter((p) => {
        const parts = p.birthday?.split("/")
        if (parts?.length !== 3) return false
        return parseInt(parts[1]) === todayMonth
      })
    }

    if (search.trim()) {
      const s = search.toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          (p.phone && p.phone.includes(s)) ||
          (p.ceremonyName && p.ceremonyName.toLowerCase().includes(s))
      )
    }
    return list
  }, [participants, search, filter])

  const openAdd = () => {
    setEditing(EMPTY_PARTICIPANT)
    setModalOpen(true)
  }

  const openEdit = (p: Participant) => {
    setEditing(p)
    setModalOpen(true)
  }

  // ── Save ──
  const handleSave = useCallback(async () => {
    if (!editing.name.trim() || !editing.birthday.trim()) return
    setSaving(true)
    try {
      const db = getDbInstance()
      const data: Record<string, unknown> = {
        name: editing.name.trim(),
        birthday: editing.birthday.trim(),
        phone: editing.phone?.trim() ?? "",
        ceremonyName: editing.ceremonyName?.trim() ?? "",
        notes: editing.notes?.trim() ?? "",
      }
      if (editing.id) {
        await updateDoc(doc(db, COLLECTIONS.PARTICIPANTS, editing.id), data)
      } else {
        await addDoc(collection(db, COLLECTIONS.PARTICIPANTS), data)
      }
      setModalOpen(false)
      setEditing(EMPTY_PARTICIPANT)
    } catch (err) {
      console.error("Save participant error:", err)
    }
    setSaving(false)
  }, [editing])

  // ── Delete ──
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const db = getDbInstance()
      await deleteDoc(doc(db, COLLECTIONS.PARTICIPANTS, deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      console.error("Delete participant error:", err)
    }
    setDeleting(false)
  }, [deleteTarget])

  // ── Stats ──
  const todayCount = useMemo(
    () => participants.filter((p) => isToday(p.birthday)).length,
    [participants]
  )

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/15">
            <Cake size={22} className="text-gold-500" />
          </div>
          <div>
            <h1 className="aurora-heading text-xl md:text-2xl">จัดการวันเกิดผู้ร่วมพิธี</h1>
            {todayCount > 0 && (
              <p className="text-xs text-pink-400 mt-0.5">
                🎂 วันนี้มีวันเกิด {todayCount} คน
              </p>
            )}
          </div>
        </div>
        <GoldButton icon={<Plus size={16} />} onClick={openAdd}>
          เพิ่มผู้ร่วมพิธี
        </GoldButton>
      </div>

      {/* ── Search + Filter Tabs ── */}
      <div className="space-y-3">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-100/55 pointer-events-none"
          />
          <input
            className="themed-input pl-10"
            placeholder="ค้นหาชื่อ, เบอร์โทร, พิธี..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: "all", label: "ทั้งหมด" },
              { key: "today", label: "🎂 วันนี้" },
              { key: "thisWeek", label: "📅 สัปดาห์นี้" },
              { key: "thisMonth", label: "🗓️ เดือนนี้" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === key
                  ? "bg-gold-500 text-black font-semibold shadow-gold"
                  : "glass-panel border-gold-500/10 text-gold-100/80 hover:text-gold-200 hover:border-gold-500/30"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <GlassPanel className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Cake size={48} className="text-gold-100/35 mb-3" />
            <p className="text-gold-100/55 text-sm">
              {filter !== "all" ? "ไม่มีวันเกิดในช่วงนี้" : "ยังไม่มีข้อมูลผู้ร่วมพิธี"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead className="w-[120px]">วันเกิด</TableHead>
                  <TableHead className="w-[80px]">อายุ</TableHead>
                  <TableHead className="w-[100px]">อีกกี่วัน</TableHead>
                  <TableHead className="w-[130px]">เบอร์โทร</TableHead>
                  <TableHead>พิธี</TableHead>
                  <TableHead className="w-[100px] text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const days = getDaysUntilBirthday(p.birthday)
                  const age = getAge(p.birthday)
                  const today = isToday(p.birthday)
                  return (
                    <TableRow key={p.id} className={today ? "bg-pink-500/5" : ""}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {today && <span className="text-lg">🎂</span>}
                          <span className="text-gold-100/90">{p.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gold-100/75 font-mono text-xs">
                        {p.birthday}
                      </TableCell>
                      <TableCell className="text-gold-100/80">
                        {age != null ? `${age} ปี` : "-"}
                      </TableCell>
                      <TableCell>
                        {days === 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-500/20 text-pink-300 border border-pink-500/30">
                            วันนี้! 🎉
                          </span>
                        ) : days != null && days <= 30 ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              days <= 3
                                ? "bg-pink-500/10 text-pink-300 border border-pink-500/20"
                                : days <= 7
                                  ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                                  : "bg-gold-500/5 text-gold-100/65 border border-gold-500/10"
                            }`}
                          >
                            {days} วัน
                          </span>
                        ) : (
                          <span className="text-gold-100/55 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gold-100/80 text-xs">
                        {p.phone || "-"}
                      </TableCell>
                      <TableCell className="text-gold-100/65 text-xs max-w-[150px] truncate">
                        {p.ceremonyName || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-2 rounded-lg hover:bg-gold-500/10 text-gold-100/65 hover:text-gold-400 transition-colors"
                            title="แก้ไข"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(p)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-gold-100/65 hover:text-red-400 transition-colors"
                            title="ลบ"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
        <div className="px-4 py-3 border-t border-gold-500/10 text-xs text-gold-100/55">
          แสดง {filtered.length} จาก {participants.length} รายการ
        </div>
      </GlassPanel>

      {/* ═══ Add/Edit Modal ═══ */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gold-100 aurora-heading text-lg">
              {editing.id ? "แก้ไขข้อมูลผู้ร่วมพิธี" : "เพิ่มผู้ร่วมพิธีใหม่"}
            </DialogTitle>
            <DialogDescription className="text-gold-100/65 text-sm">
              กรอกชื่อและวันเกิดของผู้ร่วมพิธี
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gold-100/80 mb-1 font-medium">
                <User size={12} className="inline mr-1" />
                ชื่อ-นามสกุล *
              </label>
              <Input
                className="themed-input"
                placeholder="ชื่อผู้ร่วมพิธี"
                value={editing.name}
                onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gold-100/80 mb-1 font-medium">
                  <Calendar size={12} className="inline mr-1" />
                  วันเกิด (DD/MM/YYYY) *
                </label>
                <Input
                  className="themed-input"
                  placeholder="01/01/2540"
                  value={editing.birthday}
                  onChange={(e) => setEditing((p) => ({ ...p, birthday: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-gold-100/80 mb-1 font-medium">เบอร์โทร</label>
                <Input
                  className="themed-input"
                  placeholder="08xxxxxxxx"
                  value={editing.phone || ""}
                  onChange={(e) => setEditing((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gold-100/80 mb-1 font-medium">
                <Users size={12} className="inline mr-1" />
                พิธีที่เข้าร่วม
              </label>
              <Input
                className="themed-input"
                placeholder="ชื่อพิธี"
                value={editing.ceremonyName || ""}
                onChange={(e) => setEditing((p) => ({ ...p, ceremonyName: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-gold-100/80 mb-1 font-medium">หมายเหตุ</label>
              <textarea
                className="themed-input min-h-[60px] resize-none"
                placeholder="บันทึกเพิ่มเติม"
                value={editing.notes || ""}
                onChange={(e) => setEditing((p) => ({ ...p, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <GoldButton variant="ghost" onClick={() => setModalOpen(false)}>
              ยกเลิก
            </GoldButton>
            <GoldButton
              isLoading={saving}
              disabled={!editing.name.trim() || !editing.birthday.trim()}
              onClick={handleSave}
            >
              {editing.id ? "บันทึก" : "เพิ่มผู้ร่วมพิธี"}
            </GoldButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Delete Confirm ═══ */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gold-100">
              <AlertTriangle size={20} className="text-red-400" />
              ยืนยันการลบ
            </DialogTitle>
            <DialogDescription className="text-gold-100/80">
              คุณต้องการลบ <span className="text-gold-200 font-semibold">"{deleteTarget?.name}"</span> ใช่หรือไม่?
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
              ลบผู้ร่วมพิธี
            </GoldButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}