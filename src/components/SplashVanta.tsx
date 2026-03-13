import { useEffect, useState } from 'react'

export default function SplashVanta() {
  const [showName, setShowName] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowName(true)
    }, 1200)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center flex-col text-white z-50">
      
      {/* V$ */}
      <h1 className="text-6xl font-black tracking-tight animate-pulse">
        V$
      </h1>

      {/* VANTA aparece depois */}
      {showName && (
        <p className="mt-4 text-sm tracking-[0.5em] text-gray-400 animate-fadeIn">
          V A N T A
        </p>
      )}

    </div>
  )
}
