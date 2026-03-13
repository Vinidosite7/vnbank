import { useAuth } from '@/lib/auth'
import { useFinanceStore } from '@/store/finance-store'
import { LogOut } from 'lucide-react'

export function Header() {
  const { settings } = useFinanceStore()
  const { signOut } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full" style={{ background: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>

      {/* Linha verde topo */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(74,222,128,0.4), transparent)' }} />

      <div className="flex h-14 items-center justify-between px-4 max-w-lg mx-auto">

        {/* BRAND */}
        <div className="flex items-center gap-3">
          <div className="relative">
            {/* Glow atrás do V$ */}
            <div className="absolute inset-0 blur-lg" style={{ background: 'rgba(74,222,128,0.3)' }} />
            <span className="relative text-green-400 text-xs font-black tracking-[0.2em]">V$</span>
          </div>

          <div className="w-px h-6" style={{ background: 'rgba(255,255,255,0.08)' }} />

          <div className="flex flex-col leading-none">
            <span className="text-white text-base font-black tracking-[0.15em]">VANTA</span>
            <span className="text-[8px] tracking-[0.4em] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
              PRIVATE OS
            </span>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">

          {/* Nome do usuário */}
          {settings.name && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px rgba(74,222,128,0.8)' }} />
              <span className="text-[11px] tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {settings.name.toUpperCase()}
              </span>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={signOut}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.2)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.06)'
            }}
          >
            <LogOut className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
          </button>

        </div>
      </div>
    </header>
  )
}
