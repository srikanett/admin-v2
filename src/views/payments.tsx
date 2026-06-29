import { GlassPanel } from "@/components/ui/glass-panel"
import { Banknote } from "lucide-react"

export function paymentsView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/15"><Banknote size={22} className="text-gold-500" /></div><h1 className="text-xl md:text-2xl font-heading text-gold-500">การชำระเงิน</h1></div>
      <GlassPanel><div className="flex flex-col items-center py-20 text-gold-100/55"><Banknote size={48} className="mb-3" /><p className="font-heading">ฟีเจอร์อยู่ระหว่างพัฒนา</p><p className="text-sm mt-1">ระบบติดตามการชำระเงิน</p></div></GlassPanel>
    </div>
  )
}