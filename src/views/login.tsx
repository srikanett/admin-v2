import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/stores/auth"
import { GoldButton } from "@/components/ui/gold-button"
import { LockKeyhole, Loader2 } from "lucide-react"

export function LoginPage() {
  const [passcode, setPasscode] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await login(passcode)
      navigate("/create-order")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500 to-gold-800 shadow-gold">
            <LockKeyhole size={36} className="text-black" />
          </div>
          <h1 className="aurora-heading text-2xl">ศรีคเนศ เทวาลัย</h1>
          <p className="text-gold-100/40 text-sm font-heading">
            SRIKANETT DHEVALAI
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-panel space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-heading text-gold-100/60">
              รหัสผ่าน (PIN 6 หลัก)
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={10}
              placeholder="••••••"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ""))}
              className="themed-input text-center text-2xl tracking-[0.5em] font-heading"
              autoFocus
            />
            {error && (
              <p className="text-xs text-rose-400 font-heading">{error}</p>
            )}
          </div>

          <GoldButton type="submit" className="w-full" isLoading={isLoading}>
            เข้าสู่ระบบ
          </GoldButton>
        </form>

        <p className="text-center text-[11px] text-gold-100/20">
          © {new Date().getFullYear()} Srikanett Dhevalai. All rights reserved.
        </p>
      </div>
    </div>
  )
}