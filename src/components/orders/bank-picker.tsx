import { GlassPanel } from "@/components/ui/glass-panel"
import { useBanks } from "@/hooks/use-firestore"
import type { Bank } from "@/types"
import { Building2, Copy } from "lucide-react"

interface BankPickerProps {
  selectedBank: Bank | null
  onSelect: (bank: Bank | null) => void
}

export function BankPicker({ selectedBank, onSelect }: BankPickerProps) {
  const { data: banks, loading } = useBanks()

  if (loading) {
    return (
      <div className="text-sm text-gold-100/40 animate-pulse">
        กำลังโหลดข้อมูลธนาคาร...
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-heading text-gold-500">บัญชีรับโอน</label>

      <div className="grid gap-2 sm:grid-cols-2">
        {banks.map((bank) => {
          const isSelected = selectedBank?.id === bank.id
          return (
            <button
              key={bank.id}
              onClick={() => onSelect(isSelected ? null : bank)}
              className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                isSelected
                  ? "border-gold-500 bg-gold-500/10 shadow-gold"
                  : "border-gold-500/10 bg-black/20 hover:border-gold-500/30"
              }`}
            >
              <Building2
                size={20}
                className={`mt-0.5 flex-shrink-0 ${
                  isSelected ? "text-gold-500" : "text-gold-100/30"
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">
                  {bank.bankName}
                </p>
                <p className="text-xs text-gold-100/50 truncate">
                  {bank.accountNumber}
                </p>
                <p className="text-[11px] text-gold-100/30 truncate">
                  {bank.accountHolder}
                </p>
              </div>
              {isSelected && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-500 text-xs text-black font-bold">
                  ✓
                </div>
              )}
            </button>
          )
        })}
      </div>

      {selectedBank && (
        <div className="flex items-center gap-2">
          <p className="text-xs text-gold-100/50">
            เลือก: {selectedBank.bankName} {selectedBank.accountNumber}
          </p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(selectedBank.accountNumber)
            }}
            className="text-gold-100/30 hover:text-gold-500 transition-colors"
            title="คัดลอกเลขบัญชี"
          >
            <Copy size={14} />
          </button>
        </div>
      )}
    </div>
  )
}