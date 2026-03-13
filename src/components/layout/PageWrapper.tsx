import type { ReactNode } from 'react'

interface PageWrapperProps {
  children: ReactNode
  title?: string
}

export function PageWrapper({ children, title }: PageWrapperProps) {
  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      {title && (
        <h1 className="text-2xl font-bold mb-6">{title}</h1>
      )}
      {children}
    </main>
  )
}
