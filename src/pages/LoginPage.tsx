import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import CinematicTransition from "@/components/CinematicTransition"

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showTransition, setShowTransition] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(
        error.message.includes("Invalid login")
          ? "Email ou senha incorretos."
          : "Erro ao entrar. Tente novamente."
      )
      setLoading(false)
      return
    }

    setShowTransition(true)
    setLoading(false)
  }

  if (showTransition) {
    return <CinematicTransition onFinish={() => navigate("/", { replace: true })} />
  }

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-6 overflow-hidden relative">

      {/* Grid de fundo sutil */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      {/* Glow verde esquerda */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(74,222,128,0.07) 0%, transparent 70%)",
          top: "50%",
          left: "-5%",
          transform: "translateY(-50%)",
          filter: "blur(40px)",
        }}
      />

      {/* Glow branco central sutil */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 600,
          height: 200,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(255,255,255,0.025) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          filter: "blur(60px)",
        }}
      />

      {/* Marca d'água */}
      <div
        className="absolute select-none pointer-events-none font-black text-white/[0.018]"
        style={{
          fontSize: "clamp(100px, 20vw, 220px)",
          letterSpacing: "-0.05em",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          whiteSpace: "nowrap",
        }}
      >
        V$
      </div>

      {/* Container principal */}
      <div
        className="relative w-full max-w-[360px]"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}
      >

        {/* LOGO SECTION */}
        <div className="flex flex-col items-center gap-4 mb-14">
          <div className="relative">
            <img
              src="/vanta-logo-horizontal.svg"
              alt="VANTA"
              className="h-10 w-auto object-contain"
              style={{ filter: "brightness(1)" }}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-px w-10 bg-zinc-800" />
            <p className="text-[9px] tracking-[0.45em] text-zinc-600 uppercase font-medium">
              Private Operating System
            </p>
            <div className="h-px w-10 bg-zinc-800" />
          </div>
        </div>

        {/* FORM SECTION */}
        <form onSubmit={handleSubmit} className="space-y-10">

          <div className="space-y-7">

            {/* Campo email */}
            <div className="relative group">
              <label className="block text-[9px] tracking-[0.3em] text-zinc-600 mb-3 uppercase">
                Email
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError("") }}
                required
                autoComplete="email"
                className="w-full bg-transparent border-b border-zinc-800 text-white text-sm placeholder-zinc-700 focus:outline-none pb-3 transition-all duration-300 tracking-wide"
                style={{
                  borderBottomColor: email ? "rgba(255,255,255,0.3)" : undefined,
                }}
              />
              {/* linha de foco animada */}
              <div
                className="absolute bottom-0 left-0 h-px bg-white transition-all duration-500"
                style={{
                  width: email ? "100%" : "0%",
                  opacity: email ? 0.4 : 0,
                }}
              />
            </div>

            {/* Campo senha */}
            <div className="relative group">
              <label className="block text-[9px] tracking-[0.3em] text-zinc-600 mb-3 uppercase">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError("") }}
                  required
                  autoComplete="current-password"
                  className="w-full bg-transparent border-b border-zinc-800 text-white text-sm placeholder-zinc-700 focus:outline-none pb-3 transition-all duration-300 tracking-wider pr-8"
                  style={{
                    borderBottomColor: password ? "rgba(255,255,255,0.3)" : undefined,
                  }}
                />
                {/* Toggle mostrar senha */}
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-0 bottom-3 text-zinc-700 hover:text-zinc-400 transition-colors duration-200"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
                {/* linha de foco */}
                <div
                  className="absolute bottom-0 left-0 h-px bg-white transition-all duration-500"
                  style={{
                    width: password ? "100%" : "0%",
                    opacity: password ? 0.4 : 0,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div
              className="flex items-center gap-2 py-3 px-4 border border-red-500/20 bg-red-500/5"
              style={{ animation: "fadeIn 0.3s ease" }}
            >
              <div className="w-1 h-1 rounded-full bg-red-500/70 flex-shrink-0" />
              <p className="text-red-400/80 text-xs tracking-wide">{error}</p>
            </div>
          )}

          {/* Botão entrar */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="relative w-full overflow-hidden group"
              style={{
                background: loading || !email || !password ? "rgba(255,255,255,0.06)" : "white",
                color: loading || !email || !password ? "rgba(255,255,255,0.25)" : "black",
                padding: "14px 0",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.2em",
                transition: "all 0.3s ease",
                cursor: loading || !email || !password ? "not-allowed" : "pointer",
                border: "none",
              }}
            >
              {/* Efeito hover shimmer */}
              <span
                className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent)",
                  pointerEvents: "none",
                }}
              />

              {loading ? (
                <span className="flex items-center justify-center gap-2.5">
                  <span
                    className="rounded-full border-2"
                    style={{
                      width: 14,
                      height: 14,
                      borderColor: "rgba(0,0,0,0.2)",
                      borderTopColor: "black",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  VERIFICANDO
                </span>
              ) : "ENTRAR"}
            </button>

            {/* Linha decorativa abaixo do botão */}
            <div
              className="flex items-center gap-2 mt-4 justify-center"
              style={{ opacity: email && password ? 0.4 : 0.15, transition: "opacity 0.4s ease" }}
            >
              <div className="h-px flex-1 bg-zinc-800" />
              <span className="text-[8px] tracking-[0.3em] text-zinc-600 uppercase">Acesso seguro</span>
              <div className="h-px flex-1 bg-zinc-800" />
            </div>
          </div>

        </form>

        {/* Rodapé */}
        <p className="text-center text-[9px] text-zinc-800 tracking-[0.4em] mt-14 uppercase">
          V$ VANTA © {new Date().getFullYear()}
        </p>

      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
