import { useMemo, useState } from 'react'
import { motion as Motion } from 'framer-motion'

function formatDelta(delta) {
  if (!Number.isFinite(delta)) return 'N/A'
  const rounded = Number(delta.toFixed(1))
  return `${rounded > 0 ? '+' : ''}${rounded}`
}

function TrendLineChart({ data, onPointClick, selectedId, metricLabel = 'ESG' }) {
  const [hoveredId, setHoveredId] = useState(null)

  const chart = useMemo(() => {
    const width = 760
    const height = 280
    const padX = 28
    const padTop = 18
    const padBottom = 30
    const innerWidth = width - padX * 2
    const innerHeight = height - padTop - padBottom

    const values = data.map((item) => item.value).filter((value) => Number.isFinite(value))
    const minRaw = values.length ? Math.min(...values) : 0
    const maxRaw = values.length ? Math.max(...values) : 100
    const min = Math.max(0, Math.floor((minRaw - 5) / 5) * 5)
    const max = Math.min(100, Math.ceil((maxRaw + 5) / 5) * 5)
    const range = max - min || 1

    const points = data.map((item, index) => {
      const x = data.length > 1 ? padX + (index / (data.length - 1)) * innerWidth : width / 2
      const normalized = (item.value - min) / range
      const y = padTop + innerHeight - normalized * innerHeight
      return { ...item, x, y }
    })

    const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ')

    return { width, height, padX, padBottom, min, max, points, path }
  }, [data])

  const hovered = chart.points.find((point) => point.id === hoveredId) || null

  return (
    <div className='relative'>
      <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className='h-72 w-full'>
        {[0, 1, 2, 3, 4].map((step) => {
          const y = 18 + ((chart.height - 48) * step) / 4
          return (
            <line
              key={step}
              x1={chart.padX}
              y1={y}
              x2={chart.width - chart.padX}
              y2={y}
              stroke='rgb(161 161 170 / 0.2)'
              strokeWidth='1'
            />
          )
        })}

        <Motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: 'easeOut' }} d={chart.path} fill='none' stroke='rgb(34 197 94)' strokeWidth='2.4' />

        {chart.points.map((point) => {
          const isSelected = selectedId === point.id
          const isHovered = hoveredId === point.id
          return (
            <g key={point.id}>
              <circle
                cx={point.x}
                cy={point.y}
                r={isSelected ? 6 : isHovered ? 5 : 4}
                fill={isSelected ? 'rgb(21 128 61)' : 'rgb(34 197 94)'}
                className='cursor-pointer transition-all'
                onMouseEnter={() => setHoveredId(point.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onPointClick(point.id)}
              />
            </g>
          )
        })}

        {chart.points.map((point) => (
          <text key={`${point.id}-x`} x={point.x} y={chart.height - 10} textAnchor='middle' className='fill-zinc-500 text-[10px]'>
            {point.shortDate}
          </text>
        ))}
      </svg>

      {hovered ? (
        <div className='pointer-events-none absolute right-4 top-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-zinc-700 dark:bg-zinc-900'>
          <p className='font-semibold text-zinc-900 dark:text-white'>{hovered.dateLabel}</p>
          <p className='text-zinc-600 dark:text-zinc-300'>
            {metricLabel}: <span className='font-medium'>{hovered.value.toFixed(1)}</span>
          </p>
          <p className='text-zinc-500 dark:text-zinc-400'>Change: {formatDelta(hovered.delta)}</p>
        </div>
      ) : null}
    </div>
  )
}

export default TrendLineChart
