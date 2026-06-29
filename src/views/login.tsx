import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/stores/auth"
import { Loader2, Sparkles } from "lucide-react"

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
      setError(err instanceof Error ? err.message : "รหัสผ่านไม่ถูกต้อง")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-purple-800/20 blur-[120px]" />
        <div className="absolute top-1/3 right-0 h-[300px] w-[300px] translate-x-1/2 rounded-full bg-rose-500/10 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-[250px] w-[250px] -translate-x-1/2 rounded-full bg-gold-500/10 blur-[80px]" />
      </div>

      <div className="relative w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="glass-panel-strong relative flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gold-500/20 to-transparent" />
            <span className="relative text-4xl" role="img" aria-label="sacred">
              🕉️
            </span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-wider text-gold-500">
              ศรีคเนศ เทวาลัย
            </h1>
            <p className="mt-1 text-xs tracking-[0.15em] text-gold-100/65 uppercase">
              Srikanett Dhevalai
            </p>
          </div>
        </div>

        {/* Login card */}
        <form onSubmit={handleSubmit} className="glass-panel-strong space-y-5 p-6">
          <div className="space-y-2">
            <label className="block text-center text-xs font-medium tracking-wider text-gold-100/80 uppercase">
              รหัสผ่านผู้ดูแลระบบ
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={10}
              placeholder="••••••"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ""))}
              className="themed-input text-center text-2xl tracking-[0.4em] font-heading"
              autoFocus
              disabled={isLoading}
            />
            {error && (
              <p className="text-center text-xs text-rose-400/90 font-heading animate-in fade-in">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || passcode.length === 0}
            className="btn-gold w-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            เข้าสู่ระบบ
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />
            <p className="text-[10px] text-gold-100/40">SECURE • ENCRYPTED</p>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />
          </div>
        </form>

        <p className="text-center text-[11px] text-gold-100/35 tracking-wider">
          © {new Date().getFullYear()} SRIKANETT DHEVALAI
        </p>
      </div>
    </div>
  )
}