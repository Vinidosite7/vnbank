import { useState } from "react"
import type { Page } from "@/types"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"

import DashboardPage from "@/pages/Dashboard"
import CartoesPage from "@/pages/Cartoes"
import TransacoesPage from "@/pages/Transacoes"
import CategoriasPage from "@/pages/Categorias"
import ResumoPage from "@/pages/Resumo"
import DividasPage from "@/pages/Dividas"
import ConfigPage from "@/pages/Config"

export default function MainApp() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard")

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return <DashboardPage />
      case "cartoes": return <CartoesPage />
      case "transacoes": return <TransacoesPage />
      case "categorias": return <CategoriasPage />
      case "resumo": return <ResumoPage />
      case "dividas": return <DividasPage />
      case "config": return <ConfigPage />
      default: return <DashboardPage />
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      {renderPage()}
      <BottomNav
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}
