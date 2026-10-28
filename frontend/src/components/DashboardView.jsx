import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { api } from '../services/api.js'
import RevenueChart from './RevenueChart.jsx'

export default function DashboardView({ t, onNavigateToGv }) {
  const [timeFilter, setTimeFilter] = useState('today')
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false)
  const periodMenuRef = useRef(null)

  // Chiusura dropdown al click fuori o con tasto Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (periodMenuRef.current && !periodMenuRef.current.contains(event.target)) {
        setIsPeriodMenuOpen(false)
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsPeriodMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Calcolo data odierna formattata in italiano per fallback
  const fallbackFormattedDate = useMemo(() => {
    const d = new Date()
    const raw = d.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    return raw.charAt(0).toUpperCase() + raw.slice(1)
  }, [])

  // Opzioni del selettore temporale con helper testuali
  const filterOptions = [
    { value: 'today', label: 'Oggi', hint: 'Dati della giornata odierna' },
    { value: 'yesterday', label: 'Ieri', hint: 'Giornata precedente' },
    { value: 'week', label: 'Questa settimana', hint: 'Settimana corrente (Lun–Dom)' },
    { value: 'month', label: 'Questo mese', hint: 'Mese corrente (fornitura mensile)' },
  ]

  // Recupero dati reali dal database backend
  const fetchStats = useCallback(async (period, showLoader = true) => {
    if (showLoader) setIsLoading(true)
    else setIsRefreshing(true)
    setError(null)

    try {
      const data = await api.dashboard.getStats(period)
      setStats(data)
    } catch (err) {
      console.error('Errore caricamento statistiche dashboard:', err)
      setError('Impossibile caricare i dati della dashboard. Verifica la connessione al server.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchStats(timeFilter, true)
  }, [timeFilter, fetchStats])

  // Polling automatico ogni 20 secondi per sincronizzare nuove vendite/vincite
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) fetchStats(timeFilter, false)
    }, 20000)

    const handleFocus = () => {
      fetchStats(timeFilter, false)
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [timeFilter, fetchStats])

  // Sottotitolo contestuale in base al filtro
  const headerSubtitle = useMemo(() => {
    const dateStr = stats?.currentDateFormatted || fallbackFormattedDate
    if (timeFilter === 'today') {
      return `${dateStr} · giornata in corso`
    } else if (timeFilter === 'yesterday') {
      return `Ieri · dati consolidati di chiusura`
    } else if (timeFilter === 'week') {
      return `Questa settimana · andamento aggregato dal lunedì`
    } else {
      return `Questo mese · andamento mensile consolidato`
    }
  }, [timeFilter, stats, fallbackFormattedDate])

  const chartPeriodCopy = useMemo(() => {
    if (timeFilter === 'week') {
      return {
        total: 'Totale settimana',
        subtitle: 'Ricavo lordo Gratta e Vinci e aggio calcolato nella settimana corrente',
      }
    }
    if (timeFilter === 'yesterday') {
      return {
        total: 'Totale 7 giorni',
        subtitle: 'Andamento dei sette giorni fino alla giornata di ieri',
      }
    }
    if (timeFilter === 'month') {
      return {
        total: 'Totale ultimi 7 giorni',
        subtitle: 'Dettaglio degli ultimi sette giorni del periodo mensile',
      }
    }
    return {
      total: 'Totale ultimi 7 giorni',
      subtitle: 'Andamento dei sette giorni fino a oggi',
    }
  }, [timeFilter])

  // Calcolo robusto dei 7 giorni della settimana corrente (da Lunedì a Domenica) con date esatte
  const defaultChartPoints = useMemo(() => {
    const today = new Date()
    // getDay: 0=Dom, 1=Lun, 2=Mar, 3=Mer, 4=Gio, 5=Ven, 6=Sab
    const currentDayOfWeek = today.getDay()
    const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek

    const monday = new Date(today)
    monday.setDate(today.getDate() + distanceToMonday)

    const shortLabels = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
    const fullLabels = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica']

    return Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + idx)

      const isToday = d.toDateString() === today.toDateString()
      const dayLabel = shortLabels[idx]
      const dayFullName = fullLabels[idx]
      const dayNum = d.getDate()
      const monthShort = d.toLocaleDateString('it-IT', { month: 'short' }).replace('.', '')
      const formattedDate = `${dayNum} ${monthShort}`

      return {
        dayLabel,
        dayFullName,
        formattedDate,
        isToday,
        date: d.toISOString().split('T')[0],
        revenue: 0,
        tickets: 0,
        profit: 0,
      }
    })
  }, [])

  const chartPoints = useMemo(() => defaultChartPoints.map((fallback, index) => ({
    ...fallback,
    ...stats?.chartPoints?.[index],
  })), [stats, defaultChartPoints])
  const totalRevenue = chartPoints.reduce((sum, point) => sum + (Number(point.revenue) || 0), 0)

  return (
    <div className="dashboard-mockup-wrapper" id="view-dashboard-container">
      {/* Intestazione principale Dashboard con Selettore */}
      <header className="dash-mockup-header" aria-label="Intestazione Dashboard">
        <div className="dash-title-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="dash-main-heading">{t.dashboard.title || 'Dashboard'}</h1>
            {isRefreshing && (
              <span className="dash-live-badge" title="Sincronizzazione dati dal database in tempo reale">
                <span className="live-dot" /> Live
              </span>
            )}
          </div>
          <p className="dash-date-sub">{headerSubtitle}</p>
        </div>

        {/* Dropdown Personalizzato Selezione Periodo */}
        <div className="dash-header-tools"><button type="button" className="gv-btn-primary dashboard-open-counter" onClick={onNavigateToGv}><span aria-hidden="true">+</span> Apri il banco</button>
        <div className="dash-filter-dropdown-wrapper" ref={periodMenuRef}>
          <div className="dash-custom-select-container">
            <button
              type="button"
              id="dash-period-dropdown-btn"
              className={`dash-period-dropdown-btn ${isPeriodMenuOpen ? 'active' : ''}`}
              onClick={() => setIsPeriodMenuOpen(!isPeriodMenuOpen)}
              aria-haspopup="listbox"
              aria-expanded={isPeriodMenuOpen}
              aria-label={`Seleziona periodo temporale. Periodo attivo: ${(filterOptions.find(o => o.value === timeFilter) || filterOptions[0]).label}`}
              disabled={isLoading}
            >
              <span className="dash-period-btn-content">
                <svg
                  className="dash-period-calendar-icon"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span className="dash-period-prefix">Periodo:</span>
                <span className="dash-period-active-label">
                  {(filterOptions.find(o => o.value === timeFilter) || filterOptions[0]).label}
                </span>
              </span>
              <svg
                className={`dash-period-chevron ${isPeriodMenuOpen ? 'open' : ''}`}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {isPeriodMenuOpen && (
              <div
                className="dash-period-popover"
                role="listbox"
                aria-label="Periodo temporale"
              >
                <div className="dash-period-popover-header">
                  <span>Seleziona intervallo</span>
                </div>
                {filterOptions.map((opt) => {
                  const isSelected = opt.value === timeFilter
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`dash-period-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setTimeFilter(opt.value)
                        setIsPeriodMenuOpen(false)
                      }}
                    >
                      <div className="dash-period-option-text">
                        <span className="dash-period-option-title">{opt.label}</span>
                        {opt.hint && <span className="dash-period-option-hint">{opt.hint}</span>}
                      </div>
                      {isSelected && (
                        <svg
                          className="dash-period-check"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--color-primary)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        </div>
      </header>

      {/* Messaggio di errore con opzione riprova */}
      {error && (
        <div className="dash-error-banner" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
          <button type="button" onClick={() => fetchStats(timeFilter, true)} className="dash-retry-btn">
            Riprova
          </button>
        </div>
      )}

      {/* 4 Card Metriche Superiori (KPI) */}
      <section className="dash-kpi-row" aria-label="Indicatori Chiave di Prestazione">
        {/* Card 1: Gratta e Vinci Venduti */}
        <article className="dash-metric-card" id="card-kpi-venduti">
          <div className="dash-card-header-line">
            <span className="dash-card-label">Gratta e Vinci venduti</span>
            <div className="dash-card-icon-wrap" aria-hidden="true">
              {/* Ticket Icon SVG */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
                <path d="M13 5v2" />
                <path d="M13 17v2" />
                <path d="M13 11v2" />
              </svg>
            </div>
          </div>
          <span className="dash-card-value">
            {isLoading && !stats ? '—' : (stats?.soldGv ?? 0)}
          </span>
          <div className="dash-trend-container">
            <span
              className={`dash-card-trend ${
                stats?.soldGvTrendDirection === 'down' ? 'trend-orange' : 'trend-green'
              }`}
            >
              {stats?.soldGvTrend || (isLoading ? 'Caricamento...' : 'Pari vs ieri')}
            </span>
          </div>
        </article>

        {/* Card 2: Vincite Emesse */}
        <article className="dash-metric-card" id="card-kpi-vincite">
          <div className="dash-card-header-line">
            <span className="dash-card-label">Vincite emesse</span>
            <div className="dash-card-icon-wrap" aria-hidden="true">
              {/* Payout Icon SVG */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                <path d="M12 6v2" />
                <path d="M12 16v2" />
              </svg>
            </div>
          </div>
          <span className="dash-card-value">
            {isLoading && !stats
              ? '—'
              : `€ ${(stats?.winningsPaid || 0).toFixed(2).replace('.', ',')}`}
          </span>
          <div className="dash-trend-container">
            <span className="dash-card-trend trend-orange">
              {stats?.winningsTrend || (isLoading ? 'Caricamento...' : '0 operazioni')}
            </span>
          </div>
        </article>

        {/* Card 3: Acquistati (Fornitura Settimanale o Mensile) */}
        <article className="dash-metric-card" id="card-kpi-acquistati">
          <div className="dash-card-header-line">
            <span className="dash-card-label">
              {timeFilter === 'month' ? 'Acquistati (Mensile)' : 'Acquistati (Settimanale)'}
            </span>
            <div className="dash-card-icon-wrap" aria-hidden="true">
              {/* Package Icon SVG */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
          </div>
          <span className="dash-card-value">
            {isLoading && !stats
              ? '—'
              : `€ ${(stats?.purchased || 0).toFixed(2).replace('.', ',')}`}
          </span>
          <div className="dash-trend-container">
            <span className="dash-card-trend trend-muted">
              {stats?.purchasedSub || (timeFilter === 'month' ? 'Fornitura mensile' : 'Fornitura settimanale')}
            </span>
          </div>
        </article>

        {/* Card 4: Guadagno Parziale (Aggio Legale 8%) */}
        <article className="dash-metric-card" id="card-kpi-guadagno">
          <div className="dash-card-header-line">
            <span className="dash-card-label">Guadagno parziale</span>
            <div className="dash-card-icon-wrap" aria-hidden="true">
              {/* Trending Up Icon SVG */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
          </div>
          <span className="dash-card-value">
            {isLoading && !stats
              ? '—'
              : `€ ${(stats?.partialProfit || 0).toFixed(2).replace('.', ',')}`}
          </span>
          <div className="dash-trend-container">
            <span
              className={`dash-card-trend ${
                stats?.partialProfitTrendDirection === 'down' ? 'trend-orange' : 'trend-green'
              }`}
            >
              {stats?.partialProfitTrend || (isLoading ? 'Caricamento...' : 'Pari vs ieri')}
            </span>
          </div>
        </article>
      </section>

      {/* Griglia Inferiore: Andamento Economico a Sinistra + Ultime Operazioni a Destra */}
      <div className="dash-bottom-grid">
        {/* Sezione Sinistra: Grafico Andamento Economico Reale a Tutta Larghezza */}
        <section className="dash-chart-card" aria-label="Grafico Andamento Economico">
          <div className="dash-chart-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 className="dash-section-title">Andamento economico</h2>
                {totalRevenue > 0 && (
                  <span className="dash-week-summary-pill">
                    {chartPeriodCopy.total}: € {totalRevenue.toFixed(2).replace('.', ',')}
                  </span>
                )}
              </div>
              <p className="dash-section-subtitle">
                {chartPeriodCopy.subtitle}
              </p>
            </div>

            <div className="dash-chart-legend">
              <span className="legend-item">
                <span className="legend-line" style={{ background: 'var(--color-primary)' }} />
                Incasso lordo (€)
              </span>
              <span className="legend-item">
                <span className="legend-dot" style={{ background: 'var(--color-chart-secondary)' }} />
                Aggio netto 8%
              </span>
            </div>
          </div>

          <RevenueChart
            points={chartPoints}
            variant="bar"
            loading={isLoading && !stats}
            label="Incasso lordo e aggio negli ultimi sette giorni"
          />
        </section>

        {/* Sezione Destra: Ultime Operazioni Reali dal DB */}
        <section className="dash-operations-card" aria-label="Ultime Operazioni Registrate">
          <div className="dash-chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="dash-section-title">Ultime operazioni</h2>
            <span className="dash-ops-badge" title="Operazioni registrate nel database">
              {stats?.recentOperations?.length || 0} recenti
            </span>
          </div>

          <div className="dash-operations-list">
            {isLoading && !stats ? (
              <div className="dash-empty-ops" style={{ padding: '24px 0', textAlign: 'center', color: '#839189' }}>
                Caricamento operazioni in corso...
              </div>
            ) : !stats?.recentOperations || stats.recentOperations.length === 0 ? (
              <div className="dash-empty-ops">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a39b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 8px', display: 'block' }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p style={{ margin: 0, fontWeight: '600', color: '#44514a', fontSize: '13.5px' }}>
                  Nessuna operazione registrata
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#839189' }}>
                  Le vendite e vincite battute dal banco Gratta e Vinci compariranno qui in tempo reale.
                </p>
              </div>
            ) : (
              stats.recentOperations.slice(0, 7).map((op) => {
                const isWin = op.type === 'win'
                const isSub = op.type === 'gv_sub'
                const isClosing = op.type === 'closing'
                const isAdd = op.type === 'gv_add'

                return (
                  <div key={op.id} className="dash-operation-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        className={`dash-op-icon-pill ${
                          isWin ? 'pill-win' : isSub ? 'pill-sub' : isClosing ? 'pill-closing' : 'pill-add'
                        }`}
                        aria-hidden="true"
                      >
                        {isAdd && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        )}
                        {isSub && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        )}
                        {isWin && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                          </svg>
                        )}
                        {isClosing && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                      <span className="op-time">{op.time || op.timeRecorded || 'Oggi'}</span>
                    </div>

                    <span className={`op-detail ${isSub ? 'op-detail-sub' : isWin ? 'op-detail-win' : ''}`}>
                      {op.text}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
