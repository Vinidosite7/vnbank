import { useState, useEffect } from "react"
import type { Page } from "@/types"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { useCardNotifications } from "@/hooks/useCardNotifications"

import DashboardPage from "@/pages/Dashboard"
import CartoesPage from "@/pages/Cartoes"
import TransacoesPage from "@/pages/Transacoes"
import CategoriasPage from "@/pages/Categorias"
import ResumoPage from "@/pages/Resumo"
import DividasPage from "@/pages/Dividas"
import ConfigPage from "@/pages/Config"
import MetasPage from "@/pages/Metas"

function useServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.warn('SW registration failed:', err)
      })
    }
  }, [])
}

export default function MainApp() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard")

  useServiceWorker()
  useCardNotifications()

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":   return <DashboardPage />
      case "cartoes":     return <CartoesPage />
      case "transacoes":  return <TransacoesPage />
      case "categorias":  return <CategoriasPage />
      case "resumo":      return <ResumoPage />
      case "dividas":     return <DividasPage />
      case "config":      return <ConfigPage />
      default:            return <DashboardPage />
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#080808', paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
      <Header />
      {renderPage()}
      <BottomNav currentPage={currentPage} onPageChange={setCurrentPage} />
    </div>
  )
}
