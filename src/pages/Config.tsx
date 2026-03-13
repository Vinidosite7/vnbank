import { useState, useRef } from 'react'
import { useFinanceStore } from '@/store/finance-store'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { User, Download, Upload, Trash2, AlertTriangle, Check, Target, Zap, Bell, BellOff } from 'lucide-react'

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

function SectionHeader({ icon: Icon, label, color = 'rgba(255,255,255,0.3)' }: { icon: typeof User; label: string; color?: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <Icon className="w-3.5 h-3.5" style={{ color }} />
      <span className="text-[10px] tracking-[0.3em] uppercase font-bold" style={{ color }}>{label}</span>
    </div>
  )
}

const DIAS_OPTIONS = [1, 2, 3, 5, 7]

export default function ConfigPage() {
  const { settings, updateSettings, resetAllData, exportData, importData } = useFinanceStore()
  const [name, setName] = useState(settings.name || '')
  const [meta, setMeta] = useState(settings.meta?.toString() || '')
  const [superMeta, setSuperMeta] = useState(settings.superMeta?.toString() || '')
  const [diasAviso, setDiasAviso] = useState(settings.diasAviso ?? 3)
  const [saved, setSaved] = useState(false)
  const [notifStatus, setNotifStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>(
    typeof Notification !== 'undefined' && Notification.permission === 'granted' ? 'granted' : 'idle'
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = () => {
    updateSettings({ name, meta: parseFloat(meta) || 0, superMeta: parseFloat(superMeta) || 0, diasAviso })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleRequestNotification = async () => {
    if (!('Notification' in window)) return
    setNotifStatus('requesting')
    const result = await Notification.requestPermission()
    setNotifStatus(result === 'granted' ? 'granted' : 'denied')
  }

  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vanta-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = event => {
      try {
        importData(event.target?.result as string)
        alert('Dados importados com sucesso!')
        window.location.reload()
      } catch { alert('Erro ao importar. Verifique o arquivo.') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleReset = () => {
    if (confirm('ATENÇÃO: Isso apagará TODOS os dados. Deseja continuar?')) {
      if (confirm('Tem certeza absoluta? Não há como desfazer.')) {
        resetAllData(); alert('Dados apagados.'); window.location.reload()
      }
    }
  }

  return (
    <PageWrapper title="">
      <div className="space-y-4 pb-6">

        <div>
          <p className="text-[10px] tracking-[0.35em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Sistema</p>
          <h1 className="text-2xl font-black text-white tracking-tight">Configurações</h1>
          <div className="h-px mt-4" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.08), transparent)' }} />
        </div>

        {/* Perfil + Metas */}
        <SpotlightCard glowColor="rgba(96,165,250,0.08)" className="overflow-hidden">
          <SectionHeader icon={User} label="Perfil & Metas" color="rgba(96,165,250,0.6)" />
          <div className="p-4 space-y-5">
            <div>
              <label className="block text-[9px] tracking-[0.3em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Seu nome</label>
              <StyledInput placeholder="Ex: Vinicius" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] tracking-[0.3em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Meta mensal</label>
                <div className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 flex-shrink-0 text-green-400/50" />
                  <StyledInput type="number" step="0.01" placeholder="0,00" value={meta} onChange={e => setMeta(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-[9px] tracking-[0.3em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Super meta</label>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 flex-shrink-0 text-orange-400/50" />
                  <StyledInput type="number" step="0.01" placeholder="0,00" value={superMeta} onChange={e => setSuperMeta(e.target.value)} />
                </div>
              </div>
            </div>
            <button onClick={handleSave}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-black tracking-widest transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
              style={{ background: saved ? 'rgba(74,222,128,0.15)' : 'white', color: saved ? '#4ade80' : 'black', border: saved ? '1px solid rgba(74,222,128,0.3)' : 'none' }}>
              {saved ? <><Check className="w-3.5 h-3.5" /> SALVO</> : 'SALVAR CONFIGURAÇÕES'}
            </button>
          </div>
        </SpotlightCard>

        {/* Notificações */}
        <SpotlightCard glowColor="rgba(251,146,60,0.08)" className="overflow-hidden">
          <SectionHeader icon={Bell} label="Notificações de cartão" color="rgba(251,146,60,0.6)" />
          <div className="p-4 space-y-5">

            {/* Status permissão */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Avisos de vencimento</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {notifStatus === 'granted' ? 'Notificações ativas' :
                   notifStatus === 'denied' ? 'Bloqueado — ative nas config do celular' :
                   'Permita para receber avisos'}
                </p>
              </div>
              {notifStatus === 'granted' ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-green-400 tracking-widest">ATIVO</span>
                </div>
              ) : notifStatus === 'denied' ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <BellOff className="w-3 h-3 text-red-400" />
                  <span className="text-[10px] font-bold text-red-400 tracking-widest">BLOQUEADO</span>
                </div>
              ) : (
                <button onClick={handleRequestNotification} disabled={notifStatus === 'requesting'}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all hover:opacity-80 disabled:opacity-50"
                  style={{ background: 'white', color: 'black' }}>
                  <Bell className="w-3 h-3" /> ATIVAR
                </button>
              )}
            </div>

            {/* Dias antes */}
            <div>
              <label className="block text-[9px] tracking-[0.3em] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Avisar quantos dias antes
              </label>
              <div className="flex gap-2">
                {DIAS_OPTIONS.map(d => (
                  <button key={d} onClick={() => setDiasAviso(d)}
                    className="flex-1 py-2 rounded-lg text-xs font-black tracking-widest transition-all duration-200"
                    style={{
                      background: diasAviso === d ? 'white' : 'rgba(255,255,255,0.05)',
                      color: diasAviso === d ? 'black' : 'rgba(255,255,255,0.35)',
                      border: diasAviso === d ? 'none' : '1px solid rgba(255,255,255,0.06)',
                    }}>
                    {d}d
                  </button>
                ))}
              </div>
              <p className="text-[10px] mt-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
                Você também recebe aviso no dia anterior e no dia do vencimento
              </p>
            </div>

            <button onClick={handleSave}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black tracking-widest transition-all hover:opacity-80"
              style={{ background: saved ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)', color: saved ? '#4ade80' : 'rgba(255,255,255,0.5)', border: saved ? '1px solid rgba(74,222,128,0.3)' : '1px solid rgba(255,255,255,0.08)' }}>
              {saved ? <><Check className="w-3 h-3" /> SALVO</> : 'SALVAR PREFERÊNCIA'}
            </button>
          </div>
        </SpotlightCard>

        {/* Dados */}
        <SpotlightCard glowColor="rgba(168,85,247,0.08)" className="overflow-hidden">
          <SectionHeader icon={Download} label="Dados" color="rgba(168,85,247,0.6)" />
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            <div className="flex items-center justify-between px-4 py-4">
              <div>
                <p className="text-sm font-semibold text-white">Exportar backup</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Baixar arquivo JSON</p>
              </div>
              <button onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold tracking-widest hover:bg-white/10 transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Download className="w-3 h-3" /> EXPORTAR
              </button>
            </div>
            <div className="flex items-center justify-between px-4 py-4">
              <div>
                <p className="text-sm font-semibold text-white">Importar backup</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Restaurar de JSON</p>
              </div>
              <button onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold tracking-widest hover:bg-white/10 transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Upload className="w-3 h-3" /> IMPORTAR
              </button>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
            </div>
          </div>
        </SpotlightCard>

        {/* Zona de perigo */}
        <SpotlightCard glowColor="rgba(239,68,68,0.08)" className="overflow-hidden"
          style={{ border: '1px solid rgba(239,68,68,0.12)' }}>
          <SectionHeader icon={AlertTriangle} label="Zona de perigo" color="rgba(239,68,68,0.6)" />
          <div className="flex items-center justify-between px-4 py-4">
            <div>
              <p className="text-sm font-semibold text-red-400/80">Resetar todos os dados</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Ação irreversível</p>
            </div>
            <button onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold tracking-widest hover:bg-red-500/15 transition-colors"
              style={{ background: 'rgba(239,68,68,0.08)', color: 'rgba(239,68,68,0.6)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <Trash2 className="w-3 h-3" /> RESETAR
            </button>
          </div>
        </SpotlightCard>

        <div className="text-center pt-2 space-y-1">
          <p className="text-xs font-black tracking-[0.3em] text-white/20">V$ VANTA</p>
          <p className="text-[10px] tracking-widest" style={{ color: 'rgba(255,255,255,0.1)' }}>PRIVATE OPERATING SYSTEM · v1.0</p>
        </div>

      </div>
    </PageWrapper>
  )
}
