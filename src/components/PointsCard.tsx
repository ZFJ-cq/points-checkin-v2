import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PointsCardProps {
  label: string
  value: number
  icon: ReactNode
  color?: string
}

export default function PointsCard({ label, value, icon, color = '#FF8C42' }: PointsCardProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const prevValue = useRef(0)

  useEffect(() => {
    const start = prevValue.current
    const end = value
    const duration = 600
    const startTime = performance.now()

    function animate(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.round(start + (end - start) * eased))
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
    prevValue.current = value
  }, [value])

  const gradientStyle = {
    background: `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`,
  }

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-2xl p-4 shadow-md'
      )}
      style={gradientStyle}
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-sm text-gray-500">{label}</span>
        <span
          className="text-3xl font-bold leading-tight"
          style={{ color }}
        >
          {displayValue}
        </span>
      </div>
    </div>
  )
}
