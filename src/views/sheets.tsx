import { GlassPanel } from "@/components/ui/glass-panel"
import { FileSpreadsheet, Database } from "lucide-react"

export function sheetsView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/15"><FileSpreadsheet size={22} className="text-gold-500" /></div><h1 className="text-xl md:text-2xl font-heading text-gold-500">Batch Sheets</h1></div>
      <GlassPanel><div className="flex flex-col items-center py-20 text-gold-100/55"><Database size={48} className="mb-3" /><p className="font-heading">ฟีเจอร์อยู่ระหว่างพัฒนา</p><p className="text-sm mt-1">ใช้สำหรับจัดการ batch sheets ของพิธี</p></div></GlassPanel>
    </div>
  )
}