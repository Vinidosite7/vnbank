import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface Props {
  onFinish: () => void
}

export default function DashboardIntro({ onFinish }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
    setTimeout(() => onFinish(), 900)
  }, [onFinish])

  return (
    <div className="fixed inset-0 z-[9998] bg-black flex items-center justify-center transition-opacity duration-700">

      <img
        src="/vanta-logo.svg"
        alt="VANTA"
        className={cn(
          "h-20 w-auto object-contain transition-all duration-700",
          visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}
      />

    </div>
  )
}
