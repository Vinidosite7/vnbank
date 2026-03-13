import { useState, useRef, useEffect } from 'react'
import { useFinanceStore } from '@/store/finance-store'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Target, Zap, Trophy, Check, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

function SpotlightCard({ children, className = '', glowColor = 'rgba(255,255,255,0.05)', style }: {
  children: React.ReactNode; className?: string; glowColor?: string; style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [hover, setHover] = useState(false)
  return (
    <div ref={ref}
      onMouseMove={e => { const r = ref.current?.getBoundingClientRect(); if (r) setPos({ x: e.clientX - r.left, y: e.clientY - r.top }) }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      className={`relative overflow-hidden rounded-xl ${className}`}
      style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)', ...style }}
    >
      <div className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{ opacity: hover ? 1 : 0, background: `radial-gradient(260px circle at ${pos.x}px ${pos.y}px, ${glowColor}, transparent 70%)` }} />
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />
      {children}
    </div>
  )
}

function BeamProgress({ value, color = '#4ade80', glow = 'rgba(74,222,128,0.4)', delay = 100 }: {
  value: number; color?: string; glow?: string; delay?: number
}) {
  const [w, setW] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setW(Math.min(value, 100)), delay)
    return () => clearTimeout(t)
  }, [value, delay])

  return (
    <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
      <div className="absolute top-0 left-0 h-full rounded-full"
        style={{ width: `${w}%`, background: color, boxShadow: `0 0 10px ${glow}`, transition: 'width 1s cubic-bezier(0.16,1,0.3,1)' }} />
      {w > 5 && (
        <div className="absolute top-0 h-full w-8 rounded-full"
          style={{ left: `${Math.max(w - 5, 0)}%`, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', animation: 'beamPulse 2s ease-in-out infinite' }} />
      )}
    </div>
  )
}

function StyledInput({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props}
      className="w-full bg-transparent text-white text-sm placeholder-zinc-700 focus:outline-none py-2.5 px-0 tracking-wide"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
      onFocus={e => (e.target.style.borderBottomColor = 'rgba(255,255,255,0.3)')}
      onBlur={e => (e.target.style.borderBottomColor = 'rgba(255,255,255,0.1)')}
    />
  )
}

export default function MetasPage() {
  const { settings, updateSettings, getCurrentMonthProfit } = useFinanceStore()
  const [meta, setMeta] = useState(settings.meta?.toString() || '')
  const [superMeta, setSuperMeta] = useState(settings.superMeta?.toString() || '')
  const [saved, setSaved] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setTimeout(() => setMounted(true), 50) }, [])

  const lucroAtual = getCurrentMonthProfit()
  const metaVal = parseFloat(meta) || 0
  const superMetaVal = parseFloat(superMeta) || 0
  const metaPct = metaVal > 0 ? Math.min((lucroAtual / metaVal) * 100, 100) : 0
  const superPct = superMetaVal > 0 ? Math.min((lucroAtual / superMetaVal) * 100, 100) : 0
  const metaBatida = lucroAtual >= metaVal && metaVal > 0
  const superBatida = lucroAtual >= superMetaVal && superMetaVal > 0

  const handleSave = () => {
    updateSettings({ meta: parseFloat(meta) || 0, superMeta: parseFloat(superMeta) || 0 })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <PageWrapper title="">
      <div className="space-y-5 pb-6">

        {/* Header */}
        <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.6s ease' }}>
          <p className="text-[10px] tracking-[0.35em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Performance</p>
          <h1 className="text-2xl font-black text-white tracking-tight">Metas</h1>
          <div className="h-px mt-4" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.08), transparent)' }} />
        </div>

        {/* Lucro atual — hero */}
        <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease 0.08s' }}>
          <SpotlightCard glowColor={lucroAtual >= 0 ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)'} className="p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-[10px] tracking-[0.35em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>Resultado atual</p>
                <p className={`text-4xl font-black tracking-tight ${lucroAtual >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(lucroAtual)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: lucroAtual >= 0 ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)' }}>
                <TrendingUp className={`w-5 h-5 ${lucroAtual >= 0 ? 'text-green-400' : 'text-red-400'}`} />
              </div>
            </div>
            <p className="text-[11px] mt-3" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {metaBatida ? '🚀 Meta do mês atingida!' : superBatida ? '🏆 Super Meta conquistada!' : 'Lucro acumulado no mês corrente'}
            </p>
          </SpotlightCard>
        </div>

        {/* Meta normal */}
        {metaVal > 0 && (
          <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease 0.12s' }}>
            <SpotlightCard glowColor={metaBatida ? 'rgba(74,222,128,0.18)' : 'rgba(74,222,128,0.06)'} className="p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(74,222,128,0.1)' }}>
                    <Target className="w-3.5 h-3.5 text-green-400" />
                  </div>
                  <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-500">Meta mensal</span>
                </div>
                {metaBatida && (
                  <span className="flex items-center gap-1 text-[9px] tracking-widest text-green-400 px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)' }}>
                    <Check className="w-2.5 h-2.5" /> BATIDA
                  </span>
                )}
              </div>

              <div className="flex items-end justify-between mb-3">
                <div>
                  <span className={`text-2xl font-black ${metaBatida ? 'text-green-400' : 'text-white'}`}>{formatCurrency(lucroAtual)}</span>
                  <span className="text-sm ml-2" style={{ color: 'rgba(255,255,255,0.2)' }}>/ {formatCurrency(metaVal)}</span>
                </div>
                <span className="text-sm font-black" style={{ color: metaBatida ? '#4ade80' : 'rgba(255,255,255,0.4)' }}>{metaPct.toFixed(0)}%</span>
              </div>

              <BeamProgress value={metaPct} color={metaBatida ? '#4ade80' : metaPct >= 80 ? '#facc15' : '#4ade80'}
                glow={metaBatida ? 'rgba(74,222,128,0.6)' : 'rgba(74,222,128,0.3)'} delay={200} />

              <p className="text-[10px] mt-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
                {metaBatida ? 'Meta atingida! Continue assim 💪' : `Faltam ${formatCurrency(Math.max(metaVal - lucroAtual, 0))}`}
              </p>
            </SpotlightCard>
          </div>
        )}

        {/* Super meta */}
        {superMetaVal > 0 && (
          <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease 0.16s' }}>
            <SpotlightCard glowColor={superBatida ? 'rgba(251,146,60,0.2)' : 'rgba(251,146,60,0.06)'} className="p-5"
              style={{ border: superBatida ? '1px solid rgba(251,146,60,0.2)' : '1px solid rgba(255,255,255,0.06)' } as React.CSSProperties}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(251,146,60,0.1)' }}>
                    <Zap className="w-3.5 h-3.5 text-orange-400" />
                  </div>
                  <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-500">Super Meta 🔥</span>
                </div>
                {superBatida && (
                  <span className="flex items-center gap-1 text-[9px] tracking-widest text-orange-400 px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.2)' }}>
                    <Trophy className="w-2.5 h-2.5" /> CONQUISTADA
                  </span>
                )}
              </div>

              <div className="flex items-end justify-between mb-3">
                <div>
                  <span className={`text-2xl font-black ${superBatida ? 'text-orange-400' : 'text-white'}`}>{formatCurrency(lucroAtual)}</span>
                  <span className="text-sm ml-2" style={{ color: 'rgba(255,255,255,0.2)' }}>/ {formatCurrency(superMetaVal)}</span>
                </div>
                <span className="text-sm font-black" style={{ color: superBatida ? '#fb923c' : 'rgba(255,255,255,0.4)' }}>{superPct.toFixed(0)}%</span>
              </div>

              <BeamProgress value={superPct} color={superBatida ? '#fb923c' : '#f97316'}
                glow={superBatida ? 'rgba(251,146,60,0.6)' : 'rgba(249,115,22,0.4)'} delay={300} />

              <p className="text-[10px] mt-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
                {superBatida ? '🏆 Modo Super Empresário ativado!' : `Faltam ${formatCurrency(Math.max(superMetaVal - lucroAtual, 0))}`}
              </p>
            </SpotlightCard>
          </div>
        )}

        {/* Sem metas definidas */}
        {metaVal === 0 && superMetaVal === 0 && (
          <SpotlightCard className="p-10 text-center" glowColor="rgba(255,255,255,0.03)">
            <Target className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.08)' }} />
            <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Nenhuma meta definida</p>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.15)' }}>Configure suas metas abaixo</p>
          </SpotlightCard>
        )}

        {/* Configurar metas */}
        <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease 0.2s' }}>
          <SpotlightCard glowColor="rgba(96,165,250,0.08)" className="overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="text-[10px] tracking-[0.3em] uppercase font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>Definir metas</span>
            </div>
            <div className="p-4 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-[9px] tracking-[0.3em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    <Target className="w-3 h-3 text-green-400/50" /> Meta
                  </label>
                  <StyledInput type="number" step="0.01" placeholder="Ex: 10000" value={meta}
                    onChange={e => setMeta(e.target.value)} />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-[9px] tracking-[0.3em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    <Zap className="w-3 h-3 text-orange-400/50" /> Super Meta
                  </label>
                  <StyledInput type="number" step="0.01" placeholder="Ex: 20000" value={superMeta}
                    onChange={e => setSuperMeta(e.target.value)} />
                </div>
              </div>
              <button onClick={handleSave}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-black tracking-widest transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: saved ? 'rgba(74,222,128,0.15)' : 'white',
                  color: saved ? '#4ade80' : 'black',
                  border: saved ? '1px solid rgba(74,222,128,0.3)' : 'none',
                }}>
                {saved ? <><Check className="w-3.5 h-3.5" /> SALVO</> : 'SALVAR METAS'}
              </button>
            </div>
          </SpotlightCard>
        </div>

      </div>

      <style>{`
        @keyframes beamPulse {
          0%, 100% { opacity: 0.2; transform: scaleX(0.8); }
          50% { opacity: 0.5; transform: scaleX(1.2); }
        }
      `}</style>
    </PageWrapper>
  )
}
