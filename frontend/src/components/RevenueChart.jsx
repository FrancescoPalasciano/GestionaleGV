import { useId, useLayoutEffect, useRef, useState } from 'react'

const euro = (value) => Number(value || 0).toLocaleString('it-IT', {
  style: 'currency', currency: 'EUR', maximumFractionDigits: 2,
})
const axisNumber = new Intl.NumberFormat('it-IT', { notation: 'compact', maximumFractionDigits: 1 })

// Coordinates follow the actual container size: text and circles are never stretched.
export default function RevenueChart({ points = [], variant = 'line', showWinnings = false, loading = false, label = 'Andamento economico' }) {
  const viewportRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(600)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const gradientId = useId().replace(/:/g, '')

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(Math.max(1, Math.floor(entry.contentRect.width)))
    })
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [])

  const width = Math.max(containerWidth, points.length * 36 + 72)
  const height = containerWidth < 480 ? 260 : 310
  const padding = { top: 24, right: 16, bottom: 46, left: 56 }
  const bottom = height - padding.bottom
  const plotHeight = bottom - padding.top
  const stepX = (width - padding.left - padding.right) / Math.max(1, points.length)
  const maxFound = Math.max(0, ...points.flatMap((p) => [Number(p.revenue) || 0, Number(p.aggio ?? p.profit) || 0, showWinnings ? Number(p.winnings) || 0 : 0]))
  const rawStep = Math.max(1, maxFound * 1.12 / 4)
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const step = [1, 2, 2.5, 5, 10].find((n) => n * magnitude >= rawStep) * magnitude
  const max = step * 4
  const y = (value) => bottom - Math.max(0, Number(value) || 0) / max * plotHeight
  const coords = points.map((point, index) => ({
    ...point,
    x: padding.left + stepX * (index + 0.5),
    y: y(point.revenue),
    aggio: Number(point.aggio ?? point.profit) || 0,
  }))
  const activeIndex = Math.min(selectedIndex ?? Math.max(0, points.findIndex((p) => p.isToday)), points.length - 1)
  const active = coords[activeIndex]
  const path = (key) => coords.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${y(p[key])}`).join(' ')
  const revenuePath = path('revenue')
  const areaPath = coords.length ? `${revenuePath} L ${coords.at(-1).x} ${bottom} L ${coords[0].x} ${bottom} Z` : ''
  const labelInterval = Math.max(1, Math.ceil((variant === 'bar' ? 28 : 52) / stepX))
  const selectPoint = (index) => setSelectedIndex(Math.max(0, Math.min(points.length - 1, index)))

  return (
    <div className="revenue-chart" aria-busy={loading}>
      <div className="revenue-chart-viewport" ref={viewportRef}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="group" aria-label={label}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {Array.from({ length: 5 }, (_, i) => {
            const value = i * step
            return (
              <g key={i} className="chart-grid-line">
                <line x1={padding.left} x2={width - padding.right} y1={y(value)} y2={y(value)} stroke="var(--color-border)" strokeDasharray={i ? '3 5' : undefined} />
                <text x={padding.left - 10} y={y(value) + 4} textAnchor="end">{axisNumber.format(value)} €</text>
              </g>
            )
          })}
          {active && <rect x={active.x - stepX / 2} y={padding.top} width={stepX} height={plotHeight} rx="5" fill="var(--color-primary-subtle)" />}
          {variant === 'line' && <path d={areaPath} fill={`url(#${gradientId})`} />}
          {variant === 'bar' ? coords.map((point, index) => {
            const barWidth = Math.min(46, stepX * 0.6)
            return (
              <g key={index}>
                <rect x={point.x - barWidth / 2} y={point.y} width={barWidth} height={Math.max(0, bottom - point.y)} rx="4" fill={index === activeIndex ? 'var(--color-primary)' : 'var(--color-primary-light)'} />
                <line x1={point.x - barWidth / 2 + 3} x2={point.x + barWidth / 2 - 3} y1={point.y} y2={point.y} stroke="var(--color-primary)" strokeWidth="2" />
              </g>
            )
          }) : <path d={revenuePath} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinejoin="round" />}
          <path d={path('aggio')} fill="none" stroke="var(--color-chart-secondary)" strokeWidth="2" strokeDasharray={variant === 'bar' ? '4 4' : undefined} strokeLinejoin="round" />
          {showWinnings && <path d={path('winnings')} fill="none" stroke="var(--color-chart-winnings)" strokeWidth="2" strokeDasharray="4 4" strokeLinejoin="round" />}
          {coords.map((point, index) => (
            <g key={index}>
              {variant === 'line' && <circle cx={point.x} cy={point.y} r={index === activeIndex ? 5 : 3} fill="white" stroke="var(--color-primary)" strokeWidth="2" />}
              {(index % labelInterval === 0 || index === coords.length - 1) && (
                <text className={`chart-axis-label ${index === activeIndex ? 'is-active' : ''}`} x={point.x} y={bottom + 24} textAnchor="middle">{point.label || point.dayLabel}</text>
              )}
              <rect
                className="chart-hit-target"
                x={point.x - stepX / 2} y={padding.top} width={stepX} height={plotHeight + 32}
                fill="transparent" tabIndex={index === activeIndex ? 0 : -1} role="button"
                aria-label={`${point.fullLabel || point.dayFullName || point.label} ${point.formattedDate || ''}: incasso ${euro(point.revenue)}, aggio ${euro(point.aggio)}${showWinnings ? `, vincite ${euro(point.winnings)}` : ''}`}
                aria-pressed={index === activeIndex}
                onPointerMove={(event) => {
                  // Scrolling a focused point into view must not let a stationary mouse change it.
                  if (event.pointerType === 'mouse' && (event.movementX || event.movementY)) selectPoint(index)
                }}
                onClick={() => selectPoint(index)}
                onFocus={() => selectPoint(index)}
                onKeyDown={(event) => {
                  const nextIndex = event.key === 'ArrowLeft' ? index - 1 : event.key === 'ArrowRight' ? index + 1 : event.key === 'Home' ? 0 : event.key === 'End' ? points.length - 1 : null
                  if (nextIndex !== null) {
                    event.preventDefault()
                    const next = Math.max(0, Math.min(points.length - 1, nextIndex))
                    selectPoint(next)
                    viewportRef.current.querySelectorAll('.chart-hit-target')[next]?.focus()
                  }
                  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectPoint(index) }
                }}
              />
            </g>
          ))}
        </svg>
      </div>
      {width > containerWidth + 1 && <p className="chart-scroll-hint">↔ Scorri il grafico per vedere tutti i periodi</p>}
      {!loading && !maxFound && <p className="chart-empty-message">Nessun movimento registrato nel periodo selezionato.</p>}
      {loading ? <div className="chart-detail-strip" role="status">Caricamento del grafico…</div> : active && (
        <div className="chart-detail-strip">
          <div className="chart-selected-date"><span className="chart-detail-dot" /><strong>{active.fullLabel || [active.dayFullName || active.label, active.formattedDate].filter(Boolean).join(' ')}</strong></div>
          <div><span>Incasso</span><strong>{euro(active.revenue)}</strong></div>
          <div><span>Aggio 8%</span><strong>{euro(active.aggio)}</strong></div>
          {showWinnings && <div><span>Vincite</span><strong>{euro(active.winnings)}</strong></div>}
        </div>
      )}
    </div>
  )
}
