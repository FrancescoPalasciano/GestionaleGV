import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { api } from '../services/api.js'

// Formattazione valuta italiana standard
function formatEuro(val) {
  const num = Number(val || 0)
  return '€ ' + num.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatNumber(val) {
  const num = Number(val || 0)
  return num.toLocaleString('it-IT')
}

export default function StatisticheView({ t, user }) {
  // Stato filtro temporale: 'day' | 'month' | 'year'
  const [period, setPeriod] = useState('day')

  // Data di riferimento (default oggi in formato YYYY-MM-DD)
  const [refDate, setRefDate] = useState(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  })

  // Dati statistici dal backend
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Visualizzazione curva vincite nel grafico
  const [showWinningsCurve, setShowWinningsCurve] = useState(true)

  // Punto attivo in hover sul grafico
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null)

  // Caricamento dati dal backend
  const fetchStatistics = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await api.gv.getStatistics(period, refDate)
      setStats(data)
    } catch (err) {
      console.error('Errore caricamento statistiche:', err)
      setError(err.message || 'Impossibile caricare le statistiche dal server.')
    } finally {
      setIsLoading(false)
    }
  }, [period, refDate])

  useEffect(() => {
    fetchStatistics()
  }, [fetchStatistics])

  // Navigazione temporale (Giorno / Mese / Anno precedente e successivo)
  const handleNavigate = (delta) => {
    const parts = refDate.split('-').map(Number)
    const current = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0)

    if (period === 'day') {
      current.setDate(current.getDate() + delta)
    } else if (period === 'month') {
      current.setMonth(current.getMonth() + delta)
    } else if (period === 'year') {
      current.setFullYear(current.getFullYear() + delta)
    }

    const y = current.getFullYear()
    const m = String(current.getMonth() + 1).padStart(2, '0')
    const d = String(current.getDate()).padStart(2, '0')
    setRefDate(`${y}-${m}-${d}`)
  }

  const handleResetToToday = () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    setRefDate(`${y}-${m}-${d}`)
  }

  // Etichetta del periodo calcolata
  const displayedPeriodLabel = useMemo(() => {
    if (stats?.periodLabel) return stats.periodLabel
    const parts = refDate.split('-').map(Number)
    const d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0)
    if (period === 'day') {
      const s = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      return s.charAt(0).toUpperCase() + s.slice(1)
    }
    if (period === 'month') {
      const s = d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
      return s.charAt(0).toUpperCase() + s.slice(1)
    }
    return `Anno ${d.getFullYear()}`
  }, [stats, period, refDate])

  // Configurazione del Grafico SVG
  const chartConfig = useMemo(() => {
    const width = 880
    const height = 260
    const padLeft = 65
    const padRight = 30
    const padTop = 25
    const padBottom = 38

    const points = stats?.chartPoints || []
    if (points.length === 0) {
      return { width, height, padLeft, padRight, padTop, padBottom, maxVal: 100, coords: [], gridLines: [] }
    }

    // Calcolo valore massimo tra incasso lordo e vincite
    let maxFound = 0
    points.forEach((p) => {
      if (p.revenue > maxFound) maxFound = p.revenue
      if (p.winnings > maxFound) maxFound = p.winnings
    })

    // Arrotondamento per gradini gradevoli
    let maxVal = Math.max(20, Math.ceil(maxFound * 1.15))
    if (maxVal <= 50) maxVal = 50
    else if (maxVal <= 100) maxVal = 100
    else if (maxVal <= 250) maxVal = 250
    else if (maxVal <= 500) maxVal = 500
    else if (maxVal <= 1000) maxVal = 1000
    else if (maxVal <= 2500) maxVal = 2500
    else maxVal = Math.ceil(maxVal / 500) * 500

    const plotWidth = width - padLeft - padRight
    const plotHeight = height - padTop - padBottom

    // Linee orizzontali griglia
    const gridLines = [0, 0.33, 0.66, 1].map((ratio) => {
      const val = Math.round(maxVal * ratio)
      const y = height - padBottom - ratio * plotHeight
      return { val, y }
    })

    // Calcolo coordinate dei punti
    const n = points.length
    const coords = points.map((p, idx) => {
      const x = n === 1 ? padLeft + plotWidth / 2 : padLeft + (idx / (n - 1)) * plotWidth
      const revRatio = Math.min(1, Math.max(0, (p.revenue || 0) / maxVal))
      const yRev = height - padBottom - revRatio * plotHeight

      const aggRatio = Math.min(1, Math.max(0, (p.aggio || 0) / maxVal))
      const yAgg = height - padBottom - aggRatio * plotHeight

      const winRatio = Math.min(1, Math.max(0, (p.winnings || 0) / maxVal))
      const yWin = height - padBottom - winRatio * plotHeight

      return {
        ...p,
        x,
        yRev,
        yAgg,
        yWin,
      }
    })

    // Path area sfumata incasso
    const areaPath = coords.length > 0
      ? `M ${coords[0].x} ${height - padBottom} ` +
        coords.map((c) => `L ${c.x} ${c.yRev}`).join(' ') +
        ` L ${coords[coords.length - 1].x} ${height - padBottom} Z`
      : ''

    // Path linea incasso lordo
    const revLinePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.yRev}`).join(' ')

    // Path linea aggio netto 8%
    const aggLinePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.yAgg}`).join(' ')

    // Path linea vincite pagate
    const winLinePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.yWin}`).join(' ')

    return {
      width,
      height,
      padLeft,
      padRight,
      padTop,
      padBottom,
      maxVal,
      coords,
      gridLines,
      areaPath,
      revLinePath,
      aggLinePath,
      winLinePath,
    }
  }, [stats])

  return (
    <div className="stats-view-container">
      {/* ── HEADER DELLA PAGINA CON FILTRI TEMPORALI INTEGRATI ──────────────── */}
      <header className="stats-header">
        <div className="stats-header-titles">
          <div className="stats-tag-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span>Analisi Economica Monopolio</span>
          </div>
          <h1 className="stats-main-title">Statistiche Gratta e Vinci</h1>
          <p className="stats-subtitle">
            Riepilogo analitico incassi, aggi certificati ADM (8%), vincite liquidate ai clienti e carichi stecche
          </p>
        </div>

        {/* Barra controlli filtro temporale: Giorno / Mese / Anno + Navigatore Data */}
        <div className="stats-controls-panel">
          {/* Selettore a pill del periodo */}
          <div className="stats-period-pills" role="tablist" aria-label="Seleziona intervallo temporale">
            <button
              type="button"
              role="tab"
              aria-selected={period === 'day'}
              className={`stats-pill-btn ${period === 'day' ? 'active' : ''}`}
              onClick={() => setPeriod('day')}
            >
              Giorno
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={period === 'month'}
              className={`stats-pill-btn ${period === 'month' ? 'active' : ''}`}
              onClick={() => setPeriod('month')}
            >
              Mese
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={period === 'year'}
              className={`stats-pill-btn ${period === 'year' ? 'active' : ''}`}
              onClick={() => setPeriod('year')}
            >
              Anno
            </button>
          </div>

          {/* Navigatore Data (Precedente / Badge Corrente / Successivo) */}
          <div className="stats-date-navigator">
            <button
              type="button"
              className="stats-nav-btn"
              onClick={() => handleNavigate(-1)}
              title="Periodo precedente"
              aria-label="Periodo precedente"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div className="stats-date-badge" title="Data selezionata">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0F6B4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="stats-date-text">{displayedPeriodLabel}</span>
            </div>

            <button
              type="button"
              className="stats-nav-btn"
              onClick={() => handleNavigate(1)}
              title="Periodo successivo"
              aria-label="Periodo successivo"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            <button
              type="button"
              className="stats-today-btn"
              onClick={handleResetToToday}
              title="Torna alla data odierna"
            >
              Oggi
            </button>

            {/* Input nativo per selezione calendario veloce */}
            <label className="stats-calendar-picker-label" title="Scegli data dal calendario">
              <input
                type="date"
                value={refDate}
                onChange={(e) => {
                  if (e.target.value) setRefDate(e.target.value)
                }}
                className="stats-native-date-input"
                aria-label="Seleziona data personalizzata"
              />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </label>
          </div>
        </div>
      </header>

      {/* Banner di errore eventuale */}
      {error && (
        <div className="stats-error-banner" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
          <button type="button" onClick={fetchStatistics} className="stats-retry-btn">
            Riprova
          </button>
        </div>
      )}

      {/* ── SEZIONE 1: 6 KPI CARDS CHIAVE PER IL TABACCAIO ─────────────────── */}
      <section className="stats-kpi-grid" aria-label="Metriche chiave del periodo">
        {/* KPI 1: Incasso Lordo Vendite */}
        <div className="stats-kpi-card">
          <div className="stats-kpi-header">
            <span className="stats-kpi-label">Incasso Lordo Vendite</span>
            <div className="stats-kpi-icon-wrap" aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0F6B4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
                <path d="M12 9v6" />
              </svg>
            </div>
          </div>
          <div className="stats-kpi-value">
            {isLoading ? '—' : formatEuro(stats?.totalRevenue)}
          </div>
          <div className="stats-kpi-sub">
            {isLoading ? 'Caricamento...' : `${formatNumber(stats?.totalTickets)} biglietti venduti`}
          </div>
        </div>

        {/* KPI 2: Aggio Netto Tabaccaio (8% ADM) in forte evidenza */}
        <div className="stats-kpi-card stats-kpi-highlight">
          <div className="stats-kpi-header">
            <span className="stats-kpi-label">Aggio Netto Rivendita (8%)</span>
            <div className="stats-kpi-icon-wrap icon-primary" aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0F6B4F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
          </div>
          <div className="stats-kpi-value text-green">
            {isLoading ? '—' : formatEuro(stats?.totalAggio)}
          </div>
          <div className="stats-kpi-sub">
            Guadagno netto certificato ADM
          </div>
        </div>

        {/* KPI 3: Vincite Validate al Banco */}
        <div className="stats-kpi-card">
          <div className="stats-kpi-header">
            <span className="stats-kpi-label">Vincite Pagate al Banco</span>
            <div className="stats-kpi-icon-wrap icon-amber" aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="7" />
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
              </svg>
            </div>
          </div>
          <div className="stats-kpi-value text-amber">
            {isLoading ? '—' : formatEuro(stats?.totalWinnings)}
          </div>
          <div className="stats-kpi-sub">
            {isLoading ? 'Caricamento...' : `${formatNumber(stats?.winningsCount)} vincite liquidate`}
          </div>
        </div>

        {/* KPI 4: Saldo Flusso Cassa (Incasso − Vincite) */}
        <div className="stats-kpi-card">
          <div className="stats-kpi-header">
            <span className="stats-kpi-label">Saldo Flusso Cassa</span>
            <div className="stats-kpi-icon-wrap" aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0F6B4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
          </div>
          <div className={`stats-kpi-value ${(stats?.netCashFlow || 0) >= 0 ? 'text-green' : 'text-danger'}`}>
            {isLoading ? '—' : formatEuro(stats?.netCashFlow)}
          </div>
          <div className="stats-kpi-sub">
            Differenziale incasso vs rimborsi
          </div>
        </div>

        {/* KPI 5: Forniture Stecche Ricevute */}
        <div className="stats-kpi-card">
          <div className="stats-kpi-header">
            <span className="stats-kpi-label">Forniture Stecche (Logista)</span>
            <div className="stats-kpi-icon-wrap" aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0F6B4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
            </div>
          </div>
          <div className="stats-kpi-value">
            {isLoading ? '—' : `${formatNumber(stats?.totalStecche)} st · ${formatEuro(stats?.totalPurchases)}`}
          </div>
          <div className="stats-kpi-sub">
            {isLoading ? 'Caricamento...' : `${formatNumber(stats?.totalSteccheTickets)} biglietti caricati`}
          </div>
        </div>

        {/* KPI 6: Prezzo Medio del Biglietto */}
        <div className="stats-kpi-card">
          <div className="stats-kpi-header">
            <span className="stats-kpi-label">Scontrino Medio G&V</span>
            <div className="stats-kpi-icon-wrap" aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0F6B4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="6" x2="12" y2="12" />
                <line x1="12" y1="12" x2="16" y2="16" />
              </svg>
            </div>
          </div>
          <div className="stats-kpi-value">
            {isLoading ? '—' : formatEuro(stats?.averageTicketPrice)}
          </div>
          <div className="stats-kpi-sub">
            Prezzo medio per tagliando battuto
          </div>
        </div>
      </section>

      {/* ── SEZIONE 2: GRAFICO ANDAMENTO ECONOMICO NEL TEMPO (SVG REATTIVO) ─── */}
      <section className="stats-panel-card stats-chart-section" aria-label="Grafico andamento economico">
        <div className="stats-panel-header">
          <div>
            <h2 className="stats-panel-title">Andamento Economico nel Tempo</h2>
            <p className="stats-panel-subtitle">
              {period === 'day'
                ? 'Distribuzione oraria delle vendite al banco e aggio maturato'
                : period === 'month'
                ? `Progressione giornaliera dell'incasso e aggio per ${displayedPeriodLabel}`
                : `Confronto mensile delle vendite e aggio per l'${displayedPeriodLabel}`}
            </p>
          </div>

          <div className="stats-chart-controls">
            {/* Legenda interattiva con toggle per la linea vincite */}
            <div className="stats-chart-legend">
              <span className="stats-legend-item">
                <span className="stats-legend-line green" />
                <span>Incasso lordo</span>
              </span>
              <span className="stats-legend-item">
                <span className="stats-legend-line yellow" />
                <span>Aggio 8%</span>
              </span>
              <button
                type="button"
                className={`stats-legend-toggle ${showWinningsCurve ? 'active' : ''}`}
                onClick={() => setShowWinningsCurve(!showWinningsCurve)}
                title="Attiva/Disattiva curva vincite"
              >
                <span className="stats-legend-line amber" />
                <span>Vincite pagate</span>
              </button>
            </div>
          </div>
        </div>

        {/* Grafico SVG Responsivo con Griglia e Tooltip */}
        <div className="stats-chart-viewport-wrapper">
          <div className="stats-svg-container">
            <svg
              className="stats-trend-svg"
              viewBox={`0 0 ${chartConfig.width} ${chartConfig.height}`}
              preserveAspectRatio="none"
              aria-label="Grafico andamento temporale"
            >
              <defs>
                {/* Gradiente sfumato verde sotto l'incasso */}
                <linearGradient id="statsGreenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0F6B4F" stopOpacity="0.22" />
                  <stop offset="85%" stopColor="#0F6B4F" stopOpacity="0.03" />
                  <stop offset="100%" stopColor="#0F6B4F" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Linee orizzontali di riferimento con importi in euro */}
              {chartConfig.gridLines.map((g, idx) => (
                <g key={idx}>
                  <line
                    x1={chartConfig.padLeft}
                    y1={g.y}
                    x2={chartConfig.width - chartConfig.padRight}
                    y2={g.y}
                    stroke="#e8efe9"
                    strokeWidth="1"
                    strokeDasharray={idx === 0 ? 'none' : '3 3'}
                  />
                  <text
                    x={chartConfig.padLeft - 10}
                    y={g.y + 4}
                    textAnchor="end"
                    fontSize="11"
                    fontWeight="600"
                    fill="#839189"
                  >
                    €{g.val}
                  </text>
                </g>
              ))}

              {/* Area sfumata verde */}
              {chartConfig.areaPath && (
                <path d={chartConfig.areaPath} fill="url(#statsGreenGradient)" />
              )}

              {/* Curva Vincite (se attivata) */}
              {showWinningsCurve && chartConfig.winLinePath && (
                <path
                  d={chartConfig.winLinePath}
                  fill="none"
                  stroke="#c97108"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                />
              )}

              {/* Curva Incasso Lordo */}
              {chartConfig.revLinePath && (
                <path
                  d={chartConfig.revLinePath}
                  fill="none"
                  stroke="#0F6B4F"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Curva Aggio 8% */}
              {chartConfig.aggLinePath && (
                <path
                  d={chartConfig.aggLinePath}
                  fill="none"
                  stroke="#F5C400"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Linea verticale indicatrice se punto in hover */}
              {hoveredPointIndex !== null && chartConfig.coords[hoveredPointIndex] && (
                <line
                  x1={chartConfig.coords[hoveredPointIndex].x}
                  y1={chartConfig.padTop}
                  x2={chartConfig.coords[hoveredPointIndex].x}
                  y2={chartConfig.height - chartConfig.padBottom}
                  stroke="#0F6B4F"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                />
              )}

              {/* Punti dati e aree di cattura mouse */}
              {chartConfig.coords.map((pt, idx) => {
                const isHovered = hoveredPointIndex === idx
                return (
                  <g
                    key={idx}
                    className="stats-chart-point-group"
                    onMouseEnter={() => setHoveredPointIndex(idx)}
                    onMouseLeave={() => setHoveredPointIndex(null)}
                  >
                    {/* Cerchietto punto incasso */}
                    <circle
                      cx={pt.x}
                      cy={pt.yRev}
                      r={isHovered ? 5.5 : pt.revenue > 0 ? 3.5 : 2}
                      fill="#ffffff"
                      stroke="#0F6B4F"
                      strokeWidth={isHovered ? 2.5 : 2}
                    />

                    {/* Cerchietto punto aggio */}
                    {pt.aggio > 0 && (
                      <circle
                        cx={pt.x}
                        cy={pt.yAgg}
                        r={isHovered ? 4.5 : 2.5}
                        fill="#F5C400"
                        stroke="#785900"
                        strokeWidth="1"
                      />
                    )}

                    {/* Cerchietto vincite */}
                    {showWinningsCurve && pt.winnings > 0 && (
                      <circle
                        cx={pt.x}
                        cy={pt.yWin}
                        r={isHovered ? 4.5 : 2.5}
                        fill="#ffffff"
                        stroke="#c97108"
                        strokeWidth="1.8"
                      />
                    )}

                    {/* Area invisibile allargata per facilitare l'hover */}
                    <rect
                      x={pt.x - (chartConfig.width / (chartConfig.coords.length * 2))}
                      y={chartConfig.padTop}
                      width={chartConfig.width / chartConfig.coords.length}
                      height={chartConfig.height - chartConfig.padTop - chartConfig.padBottom}
                      fill="transparent"
                      style={{ cursor: 'pointer' }}
                    />

                    {/* Etichette asse X (mostrate in base al periodo per non sovrapporsi) */}
                    {(period === 'day' ||
                      period === 'year' ||
                      (period === 'month' && (idx % 2 === 0 || idx === chartConfig.coords.length - 1))) && (
                      <text
                        x={pt.x}
                        y={chartConfig.height - chartConfig.padBottom + 18}
                        textAnchor="middle"
                        fontSize={period === 'month' ? '10' : '11'}
                        fontWeight={isHovered ? '700' : '600'}
                        fill={isHovered ? '#0F6B4F' : '#738379'}
                      >
                        {pt.label}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>

            {/* Tooltip flottante dinamico al passaggio del mouse */}
            {hoveredPointIndex !== null && chartConfig.coords[hoveredPointIndex] && (
              <div
                className="stats-chart-tooltip"
                style={{
                  left: `${(chartConfig.coords[hoveredPointIndex].x / chartConfig.width) * 100}%`,
                  top: `${Math.max(10, (chartConfig.coords[hoveredPointIndex].yRev / chartConfig.height) * 100 - 32)}%`,
                }}
              >
                <div className="stats-tooltip-title">
                  {chartConfig.coords[hoveredPointIndex].fullLabel || chartConfig.coords[hoveredPointIndex].label}
                </div>
                <div className="stats-tooltip-row">
                  <span className="dot green" />
                  <span>Incasso:</span>
                  <strong>{formatEuro(chartConfig.coords[hoveredPointIndex].revenue)}</strong>
                  <span className="tooltip-tickets">({chartConfig.coords[hoveredPointIndex].tickets} pz)</span>
                </div>
                <div className="stats-tooltip-row">
                  <span className="dot yellow" />
                  <span>Aggio (8%):</span>
                  <strong className="text-green">{formatEuro(chartConfig.coords[hoveredPointIndex].aggio)}</strong>
                </div>
                {chartConfig.coords[hoveredPointIndex].winnings > 0 && (
                  <div className="stats-tooltip-row">
                    <span className="dot amber" />
                    <span>Vincite:</span>
                    <strong className="text-amber">{formatEuro(chartConfig.coords[hoveredPointIndex].winnings)}</strong>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── SEZIONE 3: GRIGLIA A 2 COLONNE (RIPARTIZIONE FASCE & ANALISI FLUSSI) ─ */}
      <div className="stats-bottom-grid">
        {/* Colonna Sinistra: Ripartizione Vendite per Fascia di Prezzo */}
        <section className="stats-panel-card" aria-label="Ripartizione vendite per fascia di prezzo">
          <div className="stats-panel-header">
            <div>
              <h2 className="stats-panel-title">Ripartizione per Fascia di Prezzo</h2>
              <p className="stats-panel-subtitle">
                Quote di vendita e incasso generate dai diversi tagli di Gratta e Vinci
              </p>
            </div>
            <span className="stats-count-tag">
              {(stats?.tierStats || []).length} fasce
            </span>
          </div>

          {(stats?.tierStats || []).length === 0 ? (
            <div className="stats-empty-state">
              Nessuna vendita registrata per le fasce di prezzo in questo periodo.
            </div>
          ) : (
            <div className="stats-tier-table-wrapper">
              <table className="stats-tier-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Taglio</th>
                    <th style={{ textAlign: 'center' }}>Biglietti</th>
                    <th style={{ textAlign: 'right' }}>Incasso</th>
                    <th style={{ textAlign: 'right' }}>Aggio 8%</th>
                    <th style={{ textAlign: 'left', width: '28%' }}>Incidenza %</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.tierStats.map((tier) => {
                    const priceFormatted = Number(tier.price).toFixed(2).replace('.', ',')
                    const shareNum = Number(tier.percentageShare || 0)

                    return (
                      <tr key={tier.price}>
                        <td>
                          <div className="stats-tier-badge">
                            <strong>€ {priceFormatted}</strong>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="stats-tier-qty">{formatNumber(tier.ticketsSold)} pz</span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#171717' }}>
                          {formatEuro(tier.revenue)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#0F6B4F' }}>
                          {formatEuro(tier.aggio)}
                        </td>
                        <td>
                          <div className="stats-share-bar-cell">
                            <div className="stats-progress-track">
                              <div
                                className="stats-progress-fill"
                                style={{ width: `${Math.min(100, Math.max(shareNum > 0 ? 4 : 0, shareNum))}%` }}
                              />
                            </div>
                            <span className="stats-share-text">{shareNum.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Colonna Destra: Flusso Cassa, Payout Rate e Forniture Ricevute */}
        <section className="stats-panel-card" aria-label="Analisi flussi cassa e scorte">
          <div className="stats-panel-header">
            <div>
              <h2 className="stats-panel-title">Analisi Cassa & Flusso Banco</h2>
              <p className="stats-panel-subtitle">
                Rapporto vincite/incasso, liquidità di cassa e bilancio forniture
              </p>
            </div>
          </div>

          <div className="stats-cashflow-body">
            {/* Box 1: Payout Rate del banco */}
            <div className="stats-submodule-box">
              <div className="stats-submodule-header">
                <div>
                  <h3 className="stats-submodule-title">Payout Rate (Rapporto Vincite/Venduto)</h3>
                  <p className="stats-submodule-desc">
                    Percentuale di incasso restituita ai clienti in vincite rimborsate al banco
                  </p>
                </div>
                <div className="stats-payout-badge">
                  {Number(stats?.payoutRate || 0).toFixed(1)}%
                </div>
              </div>

              {/* Progress Bar del Payout */}
              <div className="stats-progress-track payout-track">
                <div
                  className="stats-progress-fill payout-fill"
                  style={{
                    width: `${Math.min(100, Number(stats?.payoutRate || 0))}%`,
                    backgroundColor: Number(stats?.payoutRate || 0) > 65 ? '#dc2626' : '#d97706',
                  }}
                />
              </div>

              <div className="stats-payout-legend">
                <span>0% (Minimo rimborsi)</span>
                <span>Bilancio ideale: 35% – 50%</span>
                <span>100% (Pareggio cassa)</span>
              </div>
            </div>

            {/* Box 2: Dettaglio Vincite per Tipologia */}
            <div className="stats-submodule-box">
              <h3 className="stats-submodule-title" style={{ marginBottom: '10px' }}>
                Tipologia Vincite Liquidate
              </h3>
              <div className="stats-summary-rows">
                <div className="stats-summary-row">
                  <div className="stats-row-left">
                    <span className="stats-type-tag tag-single">Singole vincite</span>
                    <span className="stats-row-desc">Tagliandi singoli vidimati al banco</span>
                  </div>
                  <div className="stats-row-right">
                    <strong>{formatEuro(stats?.singleWinningsAmount)}</strong>
                    <span className="stats-row-count">{stats?.singleWinningsCount || 0} operazioni</span>
                  </div>
                </div>

                <div className="stats-summary-row">
                  <div className="stats-row-left">
                    <span className="stats-type-tag tag-closing">Chiusura terminale</span>
                    <span className="stats-row-desc">Riepilogo cumulativo serale scontrino</span>
                  </div>
                  <div className="stats-row-right">
                    <strong>{formatEuro(stats?.closingWinningsAmount)}</strong>
                    <span className="stats-row-count">{stats?.closingWinningsCount || 0} chiusure</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Box 3: Bilancio Forniture Stecche Ricevute */}
            <div className="stats-submodule-box">
              <h3 className="stats-submodule-title" style={{ marginBottom: '10px' }}>
                Rifornimenti Logista vs Biglietti Venduti
              </h3>
              <div className="stats-inventory-comparison">
                <div className="stats-inv-stat">
                  <span className="stats-inv-label">Biglietti forniti nelle stecche</span>
                  <strong className="stats-inv-val">{formatNumber(stats?.totalSteccheTickets)} pz</strong>
                  <span className="stats-inv-sub">({stats?.totalStecche || 0} stecche da € 300)</span>
                </div>
                <div className="stats-inv-divider" />
                <div className="stats-inv-stat">
                  <span className="stats-inv-label">Biglietti venduti al banco</span>
                  <strong className="stats-inv-val text-green">{formatNumber(stats?.totalTickets)} pz</strong>
                  <span className="stats-inv-sub">Tagliandi battuti in cassa</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
