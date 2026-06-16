import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface BarData {
  label: string
  value: number
  color?: string
}

interface BarChartProps {
  data: BarData[]
  maxValue: number
}

export default function BarChart({ data, maxValue }: BarChartProps) {
  const [mounted, setMounted] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  useEffect(() => {
    const timer = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(timer)
  }, [])

  const safeMax = Math.max(maxValue, 1)

  return (
    <div className="flex items-end justify-between gap-2" style={{ height: 160 }}>
      {data.map((item, index) => {
        const heightPercent = (item.value / safeMax) * 100
        const barColor = item.color || '#FF8C42'
        const isActive = activeIndex === index

        return (
          <div
            key={index}
            className="relative flex flex-1 flex-col items-center"
            style={{ height: '100%' }}
          >
            {/* Tooltip */}
            {isActive && (
              <div
                className="absolute -top-7 z-10 rounded-md bg-gray-800 px-2 py-0.5 text-xs text-white shadow"
              >
                {item.value}
              </div>
            )}

            {/* Bar area */}
            <div className="flex w-full flex-1 items-end justify-center">
              <div
                className={cn(
                  'w-full max-w-[32px] rounded-t-lg transition-all duration-700 ease-out'
                )}
                style={{
                  height: mounted ? `${heightPercent}%` : '0%',
                  background: `linear-gradient(to top, ${barColor}CC, ${barColor})`,
                  minHeight: item.value > 0 && mounted ? 4 : 0,
                }}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onTouchStart={() => setActiveIndex(index)}
                onTouchEnd={() => setActiveIndex(null)}
              />
            </div>

            {/* Label */}
            <span className="mt-1.5 text-xs text-gray-500">{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}
