import { Navigate } from "react-router-dom"
import { useAuth } from "@/lib/auth"

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-6">
      <img src="/vanta-logo-horizontal.svg" alt="VANTA" className="h-12 w-auto object-contain animate-fadeIn" />
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-green-500"
            style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}
