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
import { readField_, formatThaiCurrency } from "@/lib/helpers"
import type { Ceremony } from "@/types"
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
  ScrollText,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  Users,
  Coins,
  Gift,
} from "lucide-react"

// ── Transform Firestore doc → Ceremony ──
function transformCeremony(doc: DocumentSnapshot<DocumentData>): Ceremony {
  return {
    id: doc.id,
    name: readField_(doc, ["name", "Name", "ceremonyName"], "")!,
    basePrice: readField_(doc, ["basePrice", "BasePrice", "price"], 0)!,
    souvenirCost: readField_(doc, ["souvenirCost", "SouvenirCost"], undefined),
    maxParticipants: readField_(doc, ["maxParticipants", "MaxParticipants"], undefined),
    date: readField_(doc, ["date", "Date"], ""),
    description: readField_(doc, ["description", "Description"], ""),
  }
}

const EMPTY_CEREMONY: Ceremony = {
  id: "",
  name: "",
  basePrice: 0,
  souvenirCost: undefined,
  maxParticipants: undefined,
  date: "",
  description: "",
}

export function manageCeremonyView() {
  const [ceremonies, setCeremonies] = useState<Ceremony[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Ceremony>(EMPTY_CEREMONY)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Ceremony | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Realtime Firestore ──
  useEffect(() => {
    if (!isInitialized()) {
      setLoading(false)
      return
    }
    const db = getDbInstance()
    const q = query(collection(db, COLLECTIONS.CEREMONIES), orderBy("name"), limit(50))
    const unsub = onSnapshot(q, (snap) => {
      setCeremonies(snap.docs.map(transformCeremony))
      setLoading(false)
    })
    return unsub
  }, [])

  const openAdd = () => {
    setEditing(EMPTY_CEREMONY)
    setModalOpen(true)
  }

  const openEdit = (c: Ceremony) => {
    setEditing(c)
    setModalOpen(true)
  }

  // ── Save ──
  const handleSave = useCallback(async () => {
    if (!editing.name.trim() || editing.basePrice <= 0) return
    setSaving(true)
    try {
      const db = getDbInstance()
      const data: Record<string, unknown> = {
        name: editing.name.trim(),
        basePrice: editing.basePrice,
        souvenirCost: editing.souvenirCost ?? null,
        maxParticipants: editing.maxParticipants ?? null,
        date: editing.date?.trim() ?? "",
        description: editing.description?.trim() ?? "",
      }
      if (editing.id) {
        await updateDoc(doc(db, COLLECTIONS.CEREMONIES, editing.id), data)
      } else {
        await addDoc(collection(db, COLLECTIONS.CEREMONIES), data)
      }
      setModalOpen(false)
      setEditing(EMPTY_CEREMONY)
    } catch (err) {
      console.error("Save ceremony error:", err)
    }
    setSaving(false)
  }, [editing])

  // ── Delete ──
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const db = getDbInstance()
      await deleteDoc(doc(db, COLLECTIONS.CEREMONIES, deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      console.error("Delete ceremony error:", err)
    }
    setDeleting(false)
  }, [deleteTarget])

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/15">
            <ScrollText size={22} className="text-gold-500" />
          </div>
          <h1 className="aurora-heading text-xl md:text-2xl">จัดการพิธี</h1>
        </div>
        <GoldButton icon={<Plus size={16} />} onClick={openAdd}>
          เพิ่มพิธี
        </GoldButton>
      </div>

      {/* ── Table ── */}
      <GlassPanel className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
          </div>
        ) : ceremonies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ScrollText size={48} className="text-gold-100/35 mb-3" />
            <p className="text-gold-100/55 text-sm">ยังไม่มีพิธี</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อพิธี</TableHead>
                  <TableHead className="w-[120px]">ราคาฐาน</TableHead>
                  <TableHead className="w-[120px]">ค่าของชำร่วย</TableHead>
                  <TableHead className="w-[120px]">ผู้ร่วมพิธีสูงสุด</TableHead>
                  <TableHead className="w-[120px]">วันที่</TableHead>
                  <TableHead className="w-[100px] text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ceremonies.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-gold-100/90">
                      <div>
                        <span>{c.name}</span>
                        {c.description && (
                          <p className="text-xs text-gold-100/55 mt-0.5 line-clamp-1">
                            {c.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gold-400 font-heading">
                      ฿{formatThaiCurrency(c.basePrice)}
                    </TableCell>
                    <TableCell className="text-gold-100/80">
                      {c.souvenirCost != null ? `฿${formatThaiCurrency(c.souvenirCost)}` : "-"}
                    </TableCell>
                    <TableCell className="text-gold-100/80">
                      {c.maxParticipants != null ? (
                        <span className="flex items-center gap-1">
                          <Users size={12} /> {c.maxParticipants}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-gold-100/65 text-xs">
                      {c.date || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(c)}
                          className="p-2 rounded-lg hover:bg-gold-500/10 text-gold-100/65 hover:text-gold-400 transition-colors"
                          title="แก้ไข"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-gold-100/65 hover:text-red-400 transition-colors"
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
        <div className="px-4 py-3 border-t border-gold-500/10 text-xs text-gold-100/55">
          ทั้งหมด {ceremonies.length} รายการ
        </div>
      </GlassPanel>

      {/* ═══ Add/Edit Modal ═══ */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gold-100 aurora-heading text-lg">
              {editing.id ? "แก้ไขพิธี" : "เพิ่มพิธีใหม่"}
            </DialogTitle>
            <DialogDescription className="text-gold-100/65 text-sm">
              กำหนดชื่อ ราคาฐาน และรายละเอียดพิธี
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gold-100/80 mb-1 font-medium">ชื่อพิธี *</label>
              <Input
                className="themed-input"
                placeholder="ชื่อพิธี เช่น บูชาพระพิฆเนศ"
                value={editing.name}
                onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gold-100/80 mb-1 font-medium">
                  <Coins size={12} className="inline mr-1" />
                  ราคาฐาน *
                </label>
                <Input
                  className="themed-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={editing.basePrice || ""}
                  onChange={(e) =>
                    setEditing((p) => ({ ...p, basePrice: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
              <div>
                <label className="block text-xs text-gold-100/80 mb-1 font-medium">
                  <Gift size={12} className="inline mr-1" />
                  ค่าของชำร่วย
                </label>
                <Input
                  className="themed-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={editing.souvenirCost ?? ""}
                  onChange={(e) => {
                    const v = e.target.value
                    setEditing((p) => ({
                      ...p,
                      souvenirCost: v === "" ? undefined : parseFloat(v) || 0,
                    }))
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-gold-100/80 mb-1 font-medium">
                  <Users size={12} className="inline mr-1" />
                  ผู้ร่วมพิธีสูงสุด
                </label>
                <Input
                  className="themed-input"
                  type="number"
                  min="1"
                  placeholder="ไม่จำกัด"
                  value={editing.maxParticipants ?? ""}
                  onChange={(e) => {
                    const v = e.target.value
                    setEditing((p) => ({
                      ...p,
                      maxParticipants: v === "" ? undefined : parseInt(v) || 0,
                    }))
                  }}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gold-100/80 mb-1 font-medium">วันที่จัดพิธี</label>
              <Input
                className="themed-input"
                type="date"
                value={editing.date || ""}
                onChange={(e) => setEditing((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-gold-100/80 mb-1 font-medium">คำอธิบาย</label>
              <textarea
                className="themed-input min-h-[80px] resize-none"
                placeholder="รายละเอียดเพิ่มเติม..."
                value={editing.description || ""}
                onChange={(e) => setEditing((p) => ({ ...p, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <GoldButton variant="ghost" onClick={() => setModalOpen(false)}>
              ยกเลิก
            </GoldButton>
            <GoldButton
              isLoading={saving}
              disabled={!editing.name.trim() || editing.basePrice <= 0}
              onClick={handleSave}
            >
              {editing.id ? "บันทึก" : "เพิ่มพิธี"}
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
              ยืนยันการลบพิธี
            </DialogTitle>
            <DialogDescription className="text-gold-100/80">
              คุณต้องการลบพิธี <span className="text-gold-200 font-semibold">"{deleteTarget?.name}"</span> ใช่หรือไม่?
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
              ลบพิธี
            </GoldButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}