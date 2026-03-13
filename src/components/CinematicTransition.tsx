import { useEffect, useState } from "react"

interface Props {
  onFinish: () => void
}

export default function CinematicTransition({ onFinish }: Props) {
  const [phase, setPhase] = useState<"enter" | "text" | "exit">("enter")

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("text"), 800)
    const t2 = setTimeout(() => setPhase("exit"), 2200)
    const t3 = setTimeout(() => onFinish(), 2900)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onFinish])

  return (
    <div className={`fixed inset-0 z-[999] bg-black flex items-center justify-center overflow-hidden transition-opacity duration-700 ${phase === "exit" ? "opacity-0" : "opacity-100"}`}>

      {/* Glow verde central */}
      <div className={`absolute w-[600px] h-[600px] bg-green-500/8 blur-[160px] rounded-full transition-all duration-1000 ${phase === "enter" ? "scale-75 opacity-0" : "scale-100 opacity-100"}`} />

      {/* Marca d'água */}
      <div className="absolute text-[200px] font-black text-white/[0.03] tracking-widest select-none pointer-events-none">
        V$
      </div>

      {/* Linha horizontal — efeito scan */}
      <div className={`absolute h-px bg-gradient-to-r from-transparent via-green-500/40 to-transparent w-full transition-all duration-700 ${phase === "enter" ? "opacity-0" : "opacity-100"}`} />

      {/* Conteúdo central */}
      <div className="relative flex flex-col items-center gap-8">

        {/* Logo */}
        <img
          src="/vanta-logo-horizontal.svg"
          alt="VANTA"
          className={`h-14 w-auto object-contain transition-all duration-700 ${phase === "enter" ? "opacity-0 scale-95 translate-y-2" : "opacity-100 scale-100 translate-y-0"}`}
        />

        {/* Status */}
        <div className={`flex flex-col items-center gap-3 transition-all duration-700 ${phase === "text" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>

          {/* Barra de loading */}
          <div className="w-40 h-px bg-zinc-800 rounded-full overflow-hidden">
            <div className={`h-full bg-green-500 rounded-full transition-all duration-[1400ms] ease-out ${phase === "text" ? "w-full" : "w-0"}`} />
          </div>

          <p className="text-[10px] tracking-[0.5em] text-green-500/70 uppercase">
            System Ready
          </p>
        </div>

      </div>
    </div>
  )
}
