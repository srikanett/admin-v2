import { GlassPanel } from "@/components/ui/glass-panel"
import { useCeremonies } from "@/hooks/use-firestore"
import type { Ceremony } from "@/types"

interface CeremonySectionProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  selectedCeremony: Ceremony | null
  onCeremonySelect: (c: Ceremony | null) => void
  participantName: string
  onParticipantNameChange: (v: string) => void
  participantBirthday: string
  onParticipantBirthdayChange: (v: string) => void
  participantName2: string
  onParticipantName2Change: (v: string) => void
  participantBirthday2: string
  onParticipantBirthday2Change: (v: string) => void
  participantSlots: number
  onSlotsChange: (v: number) => void
}

export function CeremonySection({
  enabled,
  onToggle,
  selectedCeremony,
  onCeremonySelect,
  participantName,
  onParticipantNameChange,
  participantBirthday,
  onParticipantBirthdayChange,
  participantName2,
  onParticipantName2Change,
  participantBirthday2,
  onParticipantBirthday2Change,
  participantSlots,
  onSlotsChange,
}: CeremonySectionProps) {
  const { data: ceremonies } = useCeremonies()

  return (
    <GlassPanel variant="ceremony" className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="aurora-heading-purple text-lg">งานพิธี</h3>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-black/40 border border-gold-500/20 peer-checked:bg-purple-800 peer-checked:border-gold-500/50 transition-all after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-gold-100/40 after:transition-all peer-checked:after:translate-x-full peer-checked:after:bg-gold-500" />
        </label>
      </div>

      {enabled && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
          {/* Ceremony picker */}
          <div>
            <label className="mb-1 block text-xs text-gold-100/80">
              เลือกพิธี
            </label>
            <select
              value={selectedCeremony?.id || ""}
              onChange={(e) => {
                const c = ceremonies.find((x) => x.id === e.target.value)
                onCeremonySelect(c || null)
              }}
              className="themed-input"
            >
              <option value="">-- เลือกพิธี --</option>
              {ceremonies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.basePrice.toLocaleString()} บาท
                </option>
              ))}
            </select>
          </div>

          {/* Participant count */}
          <div>
            <label className="mb-1 block text-xs text-gold-100/80">
              จำนวนผู้ร่วมพิธี
            </label>
            <div className="flex gap-2">
              {[1, 2].map((n) => (
                <button
                  key={n}
                  onClick={() => onSlotsChange(n)}
                  className={`flex-1 rounded-xl border py-2 text-sm font-heading transition-all ${
                    participantSlots === n
                      ? "border-gold-500 bg-gold-500/10 text-gold-500"
                      : "border-gold-500/10 bg-black/20 text-gold-100/80"
                  }`}
                >
                  {n} คน
                </button>
              ))}
            </div>
          </div>

          {/* Participant 1 */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-gold-100/80">
                ชื่อ-นามสกุล
              </label>
              <input
                value={participantName}
                onChange={(e) => onParticipantNameChange(e.target.value)}
                placeholder="ชื่อผู้ร่วมพิธี"
                className="themed-input"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gold-100/80">
                วันเกิด (ว/ด/ป)
              </label>
              <input
                value={participantBirthday}
                onChange={(e) => onParticipantBirthdayChange(e.target.value)}
                placeholder="25/12/2530"
                className="themed-input"
              />
            </div>
          </div>

          {/* Participant 2 (if slots=2) */}
          {participantSlots >= 2 && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-gold-100/80">
                  ชื่อ-นามสกุล (คนที่ 2)
                </label>
                <input
                  value={participantName2}
                  onChange={(e) => onParticipantName2Change(e.target.value)}
                  placeholder="ชื่อผู้ร่วมพิธีคนที่ 2"
                  className="themed-input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gold-100/80">
                  วันเกิด (ว/ด/ป)
                </label>
                <input
                  value={participantBirthday2}
                  onChange={(e) => onParticipantBirthday2Change(e.target.value)}
                  placeholder="25/12/2530"
                  className="themed-input"
                />
              </div>
            </div>
          )}

          {/* Ceremony Note */}
          <div>
            <label className="mb-1 block text-xs text-gold-100/80">
              หมายเหตุ
            </label>
            <textarea
              rows={2}
              className="themed-input resize-none"
              placeholder="ข้อความเพิ่มเติมเกี่ยวกับพิธี..."
            />
          </div>
        </div>
      )}
    </GlassPanel>
  )
}