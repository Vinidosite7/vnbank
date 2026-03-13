import { useEffect, useState } from "react"

interface Props {
  onFinish?: () => void
}

export default function SystemLoader({ onFinish }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!onFinish) return

    const timer = setTimeout(() => {
      setVisible(false)
      onFinish()
    }, 1800)

    return () => clearTimeout(timer)
  }, [onFinish])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[999] bg-black flex flex-col items-center justify-center">

      {/* LOGO */}
      <img
        src="/vanta-logo-horizontal.svg"
        alt="VANTA"
        className="h-14 w-auto object-contain animate-fadeIn"
      />

      {/* TEXTO */}
      <div className="mt-6 text-green-400 text-xs tracking-[0.5em] animate-pulse">
        V$ SYSTEM INITIALIZING...
      </div>

    </div>
  )
}
