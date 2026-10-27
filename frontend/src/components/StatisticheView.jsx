import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { api } from '../services/api.js'
import RevenueChart from './RevenueChart.jsx'

// Formattazione valuta italiana standard
function formatEuro(val) {
  const num = Number(val || 0)
  return '€ ' + num.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function toLocalIso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Vero se il periodo (giorno, settimana lun-dom, mese, anno) di refDate include oggi:
// solo allora i dati possono cambiare e vale la pena aggiornarli in automatico
function periodContainsToday(period, refDate) {
  const today = toLocalIso(new Date())
  if (period === 'year') return refDate.slice(0, 4) === today.slice(0, 4)
  if (period === 'month') return refDate.slice(0, 7) === today.slice(0, 7)
  if (period === 'week') {
    const mondayOf = (iso) => {
      const [y, m, d] = iso.split('-').map(Number)
      const date = new Date(y, m - 1, d, 12)
      date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
      return toLocalIso(date)
    }
    return mondayOf(refDate) === mondayOf(today)
  }
  return refDate === today
}

function formatNumber(val) {
  const num = Number(val || 0)
  return num.toLocaleString('it-IT')
}

export default function StatisticheView({ t, user }) {
  // Stato filtro temporale: 'day' | 'week' | 'month' | 'year'
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

  // Fetch silenzioso per polling multi-dispositivo (non mostra loading, non sovrascrive errori)
  const fetchStatisticsSilent = useCallback(async () => {
    try {
      const data = await api.gv.getStatistics(period, refDate)
      setStats(data)
    } catch (err) {
      // Silenzioso: non sovrascrivere l'interfaccia con errori di polling
    }
  }, [period, refDate])

  // Caricamento iniziale e polling ogni 30s, solo se il periodo è quello in corso (i periodi passati non cambiano)
  useEffect(() => {
    fetchStatistics()
    if (!periodContainsToday(period, refDate)) return undefined

    const intervalId = setInterval(() => {
      if (!document.hidden) fetchStatisticsSilent()
    }, 30000)

    return () => clearInterval(intervalId)
  }, [fetchStatistics, fetchStatisticsSilent, period, refDate])

  // Navigazione temporale (Giorno / Settimana / Mese / Anno precedente e successivo)
  const handleNavigate = (delta) => {
    const parts = refDate.split('-').map(Number)
    const current = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0)

    if (period === 'day') {
      current.setDate(current.getDate() + delta)
    } else if (period === 'week') {
      current.setDate(current.getDate() + delta * 7)
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

  // Etichetta del periodo calcolata (estesa per desktop, compatta per mobile)
  const { displayedPeriodLabel, shortPeriodLabel } = useMemo(() => {
    const parts = refDate.split('-').map(Number)
    const d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0)
    let full = ''
    let short = ''

    if (period === 'day') {
      const s = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      full = s.charAt(0).toUpperCase() + s.slice(1)
      const sh = d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })
      short = sh.charAt(0).toUpperCase() + sh.slice(1)
    } else if (period === 'week') {
      const start = new Date(d)
      start.setDate(start.getDate() - (start.getDay() + 6) % 7)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      const fullOptions = { day: 'numeric', month: 'long', year: 'numeric' }
      const shortOptions = { day: '2-digit', month: '2-digit' }
      full = `${start.toLocaleDateString('it-IT', fullOptions)} – ${end.toLocaleDateString('it-IT', fullOptions)}`
      short = `${start.toLocaleDateString('it-IT', shortOptions)} – ${end.toLocaleDateString('it-IT', shortOptions)}`
    } else if (period === 'month') {
      const s = d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
      full = s.charAt(0).toUpperCase() + s.slice(1)
      const sh = d.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' })
      short = sh.charAt(0).toUpperCase() + sh.slice(1)
    } else {
      full = `Anno ${d.getFullYear()}`
      short = `${d.getFullYear()}`
    }

    if (stats?.periodLabel) {
      full = stats.periodLabel
    }

    return { displayedPeriodLabel: full, shortPeriodLabel: short }
  }, [stats, period, refDate])

  // Generazione del prospetto contabile A4 pronto per la stampa e salvataggio in PDF
  const handlePrintPdf = useCallback(() => {
    const s = stats || {
      totalRevenue: 0,
      totalAggio: 0,
      totalWinnings: 0,
      winningsCount: 0,
      netCashFlow: 0,
      averageTicketPrice: 0,
      payoutRate: 0,
      totalTickets: 0,
      singleWinningsAmount: 0,
      singleWinningsCount: 0,
      closingWinningsAmount: 0,
      closingWinningsCount: 0,
      totalStecche: 0,
      totalSteccheTickets: 0,
      totalPurchases: 0,
      tierStats: [],
      winningStats: [],
    }

    const now = new Date()
    const printDateStr = now.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    const printTimeStr = now.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    })

    const operatore = user?.nome || user?.username || 'Operatore di cassa'
    const docTitle = `Prospetto_Statistiche_GV_${refDate}_${period}`

    const tierRowsHtml = (s.tierStats || []).map((t) => {
      const p = Number(t.price).toFixed(2).replace('.', ',')
      const tickets = formatNumber(t.ticketsSold)
      const rev = formatEuro(t.revenue)
      const agg = formatEuro(t.aggio)
      const share = Number(t.percentageShare || 0).toFixed(1).replace('.', ',') + '%'
      return `
        <tr>
          <td style="font-weight: 700; color: #171717;">€ ${p}</td>
          <td style="text-align: center; font-weight: 600;">${tickets} pz</td>
          <td style="text-align: right; font-weight: 600; color: #171717;">${rev}</td>
          <td style="text-align: right; font-weight: 700; color: #0F6B4F;">${agg}</td>
          <td style="text-align: right; font-weight: 600;">${share}</td>
        </tr>
      `
    }).join('')

    const printableHtml = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>${docTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Source+Sans+3:wght@700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 12mm 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      font-size: 10pt;
      color: #171717;
      background: #ffffff;
      line-height: 1.35;
    }
    .print-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 10px;
      border-bottom: 2px solid #0F6B4F;
      margin-bottom: 12px;
    }
    .brand-group h1 {
      font-family: 'Source Sans 3', sans-serif;
      font-size: 19pt;
      margin: 0;
      color: #0F6B4F;
      letter-spacing: -0.3px;
    }
    .brand-group p {
      margin: 2px 0 0 0;
      font-size: 8.5pt;
      color: #55665d;
      font-weight: 600;
    }
    .meta-group {
      text-align: right;
      font-size: 8.5pt;
      color: #55665d;
      line-height: 1.4;
    }
    .meta-group strong {
      color: #171717;
    }
    .report-banner {
      background: #f4f8f5;
      border-left: 4px solid #0F6B4F;
      padding: 7px 12px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .report-banner h2 {
      margin: 0;
      font-size: 11pt;
      font-weight: 800;
      color: #0F6B4F;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .report-banner .period-tag {
      font-size: 9.5pt;
      font-weight: 700;
      color: #171717;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 14px;
    }
    .kpi-box {
      border: 1px solid #dce5df;
      background: #fafcfb;
      border-radius: 6px;
      padding: 8px 10px;
    }
    .kpi-box.highlight {
      border: 1.5px solid #0F6B4F;
      background: #f2f9f5;
    }
    .kpi-label {
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      color: #63736b;
      letter-spacing: 0.2px;
      margin-bottom: 2px;
    }
    .kpi-val {
      font-size: 12.5pt;
      font-weight: 800;
      color: #171717;
      margin-bottom: 1px;
    }
    .kpi-val.green {
      color: #0F6B4F;
    }
    .kpi-val.amber {
      color: #b45309;
    }
    .kpi-sub {
      font-size: 7.5pt;
      color: #63736b;
    }
    .section-title {
      font-size: 9.5pt;
      font-weight: 800;
      color: #171717;
      margin: 0 0 6px 0;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .section-title::before {
      content: '';
      display: inline-block;
      width: 6px;
      height: 6px;
      background-color: #0F6B4F;
      border-radius: 1px;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin-bottom: 14px;
    }
    table.data-table th {
      background-color: #f0f5f2;
      color: #3b5044;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 7.5pt;
      letter-spacing: 0.3px;
      padding: 5px 8px;
      border-top: 1px solid #d0ded6;
      border-bottom: 1.5px solid #0F6B4F;
    }
    table.data-table td {
      padding: 5px 8px;
      border-bottom: 1px solid #e5ece8;
      color: #171717;
    }
    table.data-table tr:nth-child(even) {
      background-color: #fcfdfc;
    }
    table.data-table tfoot td {
      background-color: #eef5f1;
      font-weight: 800;
      border-top: 1.5px solid #0F6B4F;
      border-bottom: 1.5px solid #0F6B4F;
      color: #0F6B4F;
      font-size: 9pt;
    }
    .sub-panels-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 14px;
      page-break-inside: avoid;
    }
    .sub-panel {
      border: 1px solid #dce5df;
      border-radius: 6px;
      padding: 9px 11px;
      background: #fafcfb;
    }
    .sub-panel h3 {
      margin: 0 0 6px 0;
      font-size: 8.5pt;
      font-weight: 800;
      color: #0F6B4F;
      text-transform: uppercase;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      padding: 3px 0;
      border-bottom: 1px dashed #e2e9e5;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-row span {
      color: #55665d;
    }
    .info-row strong {
      color: #171717;
    }
    .print-signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
      padding-top: 12px;
      border-top: 1px solid #d8e3dc;
      page-break-inside: avoid;
    }
    .sig-box {
      width: 44%;
    }
    .sig-title {
      font-size: 7.5pt;
      font-weight: 700;
      color: #63736b;
      text-transform: uppercase;
      margin-bottom: 26px;
    }
    .sig-line {
      border-top: 1px solid #171717;
      font-size: 7.5pt;
      color: #63736b;
      padding-top: 3px;
      text-align: center;
    }
    .print-footer-note {
      margin-top: 14px;
      text-align: center;
      font-size: 7pt;
      color: #8c9e94;
      border-top: 1px solid #edf2ee;
      padding-top: 5px;
    }
  </style>
</head>
<body>
  <div class="print-header">
    <div class="brand-group">
      <h1>Palasciano</h1>
      <p>Gestione Certificata Monopolio · Gratta e Vinci</p>
    </div>
    <div class="meta-group">
      <div>Data di emissione: <strong>${printDateStr} ore ${printTimeStr}</strong></div>
      <div>Operatore: <strong>${operatore}</strong></div>
      <div>Protocollo: <strong>GV-${refDate.replace(/-/g, '')}-${period.toUpperCase()}</strong></div>
    </div>
  </div>

  <div class="report-banner">
    <h2>Prospetto Contabile Statistico</h2>
    <div class="period-tag">${displayedPeriodLabel}</div>
  </div>

  <!-- Quadro di Sintesi Economica -->
  <div class="kpi-grid">
    <div class="kpi-box">
      <div class="kpi-label">Incasso Lordo Vendite</div>
      <div class="kpi-val">${formatEuro(s.totalRevenue)}</div>
      <div class="kpi-sub">${formatNumber(s.totalTickets)} biglietti venduti</div>
    </div>

    <div class="kpi-box highlight">
      <div class="kpi-label">Aggio Rivendita (8% ADM)</div>
      <div class="kpi-val green">${formatEuro(s.totalAggio)}</div>
      <div class="kpi-sub">Compenso netto spettante</div>
    </div>

    <div class="kpi-box">
      <div class="kpi-label">Vincite Pagate al Banco</div>
      <div class="kpi-val amber">${formatEuro(s.totalWinnings)}</div>
      <div class="kpi-sub">${formatNumber(s.winningsCount)} vincite rimborsate</div>
    </div>

    <div class="kpi-box">
      <div class="kpi-label">Saldo Flusso Cassa</div>
      <div class="kpi-val ${(s.netCashFlow || 0) >= 0 ? 'green' : 'amber'}">${formatEuro(s.netCashFlow)}</div>
      <div class="kpi-sub">Incasso lordo meno rimborsi</div>
    </div>

    <div class="kpi-box">
      <div class="kpi-label">Scontrino Medio Biglietto</div>
      <div class="kpi-val">${formatEuro(s.averageTicketPrice)}</div>
      <div class="kpi-sub">Prezzo medio per tagliando</div>
    </div>

    <div class="kpi-box">
      <div class="kpi-label">Payout Rate al Banco</div>
      <div class="kpi-val amber">${Number(s.payoutRate || 0).toFixed(1).replace('.', ',')}%</div>
      <div class="kpi-sub">Rapporto vincite / incasso</div>
    </div>
  </div>

  <!-- Tabella Dettagliata per Fascia di Prezzo -->
  <div class="section-title">Ripartizione Vendite per Fascia di Prezzo</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="text-align: left;">Taglio Prezzo</th>
        <th style="text-align: center;">Biglietti Battuti</th>
        <th style="text-align: right;">Incasso Lordo</th>
        <th style="text-align: right;">Aggio Netto (8%)</th>
        <th style="text-align: right;">Incidenza %</th>
      </tr>
    </thead>
    <tbody>
      ${tierRowsHtml || '<tr><td colspan="5" style="text-align: center; padding: 10px; color: #888;">Nessuna vendita registrata nel periodo.</td></tr>'}
    </tbody>
    <tfoot>
      <tr>
        <td>TOTALE COMPLESSIVO</td>
        <td style="text-align: center;">${formatNumber(s.totalTickets)} pz</td>
        <td style="text-align: right;">${formatEuro(s.totalRevenue)}</td>
        <td style="text-align: right;">${formatEuro(s.totalAggio)}</td>
        <td style="text-align: right;">100,0%</td>
      </tr>
    </tfoot>
  </table>

  <!-- Dettaglio Flussi & Scorte -->
  <div class="sub-panels-grid">
    <div class="sub-panel">
      <h3>Dettaglio Vincite Rimborsate</h3>
      <div class="info-row">
        <span>Vincite singole al banco:</span>
        <strong>${formatEuro(s.singleWinningsAmount)} (${s.singleWinningsCount || 0} op.)</strong>
      </div>
      <div class="info-row">
        <span>Chiusure serali scontrino:</span>
        <strong>${formatEuro(s.closingWinningsAmount)} (${s.closingWinningsCount || 0} op.)</strong>
      </div>
      <div class="info-row" style="font-weight: 700; color: #0F6B4F;">
        <span>Totale rimborsi erogati:</span>
        <strong>${formatEuro(s.totalWinnings)}</strong>
      </div>
    </div>

    <div class="sub-panel">
      <h3>Bilancio Scorte & Forniture Ricevute</h3>
      <div class="info-row">
        <span>Stecche fornite dal logista:</span>
        <strong>${formatNumber(s.totalStecche)} st (${formatNumber(s.totalSteccheTickets)} pz)</strong>
      </div>
      <div class="info-row">
        <span>Costo fornitura (€ 300/st):</span>
        <strong>${formatEuro(s.totalPurchases)}</strong>
      </div>
      <div class="info-row">
        <span>Biglietti venduti al banco:</span>
        <strong style="color: #0F6B4F;">${formatNumber(s.totalTickets)} pz</strong>
      </div>
    </div>
  </div>

  <!-- Firme e Convalida -->
  <div class="print-signatures">
    <div class="sig-box">
      <div class="sig-title">Timbro Rivendita Monopoli</div>
      <div class="sig-line">Timbro della Tabaccheria</div>
    </div>
    <div class="sig-box">
      <div class="sig-title">Firma Titolare / Operatore</div>
      <div class="sig-line">Firma per quietanza contabile</div>
    </div>
  </div>

  <div class="print-footer-note">
    Documento contabile ad uso interno gestionale emesso dal software Palasciano · Conforme alle percentuali di aggio vigenti (8% ADM)
  </div>
</body>
</html>`

    let printFrame = document.getElementById('stats-print-frame')
    if (!printFrame) {
      printFrame = document.createElement('iframe')
      printFrame.id = 'stats-print-frame'
      printFrame.style.position = 'fixed'
      printFrame.style.right = '0'
      printFrame.style.bottom = '0'
      printFrame.style.width = '0'
      printFrame.style.height = '0'
      printFrame.style.border = '0'
      document.body.appendChild(printFrame)
    }

    const frameDoc = printFrame.contentWindow.document
    frameDoc.open()
    frameDoc.write(printableHtml)
    frameDoc.close()

    setTimeout(() => {
      printFrame.contentWindow.focus()
      printFrame.contentWindow.print()
    }, 250)
  }, [stats, period, refDate, displayedPeriodLabel, user])


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

        {/* Barra controlli filtro temporale: Giorno / Settimana / Mese / Anno + Navigatore Data */}
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
              aria-selected={period === 'week'}
              className={`stats-pill-btn ${period === 'week' ? 'active' : ''}`}
              onClick={() => setPeriod('week')}
            >
              Settimana
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
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="stats-date-text desktop-label">{displayedPeriodLabel}</span>
              <span className="stats-date-text mobile-label">{shortPeriodLabel}</span>
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
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
            </div>
          </div>
          <div className="stats-kpi-value">
            {isLoading ? '—' : formatEuro(stats?.totalPurchases)}
          </div>
          <div className="stats-kpi-sub">
            {isLoading ? 'Caricamento...' : `${formatNumber(stats?.totalStecche)} stecche · ${formatNumber(stats?.totalSteccheTickets)} biglietti caricati`}
          </div>
        </div>

        {/* KPI 6: Prezzo Medio del Biglietto */}
        <div className="stats-kpi-card">
          <div className="stats-kpi-header">
            <span className="stats-kpi-label">Scontrino Medio G&V</span>
            <div className="stats-kpi-icon-wrap" aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                : period === 'week'
                ? 'Andamento giornaliero delle vendite e aggio da lunedì a domenica'
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
                aria-pressed={showWinningsCurve}
                onClick={() => setShowWinningsCurve(!showWinningsCurve)}
                title="Attiva/Disattiva curva vincite"
              >
                <span className="stats-legend-line amber" />
                <span>Vincite pagate</span>
              </button>
            </div>
          </div>
        </div>

        <RevenueChart
          key={`${period}-${refDate}`}
          points={stats?.chartPoints || []}
          showWinnings={showWinningsCurve}
          loading={isLoading}
          label="Andamento di incasso, aggio e vincite nel periodo selezionato"
        />
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
              {/* Tabella Standard per Desktop / Schermi Grandi */}
              <table className="stats-tier-table stats-tier-table-desktop">
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
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>
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

              {/* Vista Mobile Cards ad alta leggibilità (niente scrolling orizzontale forzato su phone) */}
              <div className="stats-tier-mobile-list" aria-label="Elenco fasce di prezzo">
                {stats.tierStats.map((tier) => {
                  const priceFormatted = Number(tier.price).toFixed(2).replace('.', ',')
                  const shareNum = Number(tier.percentageShare || 0)

                  return (
                    <div key={tier.price} className="stats-tier-mobile-card">
                      <div className="stats-tier-mobile-top">
                        <div className="stats-tier-badge">
                          <strong>€ {priceFormatted}</strong>
                        </div>
                        <div className="stats-tier-mobile-amounts">
                          <span className="stats-tier-mobile-rev">{formatEuro(tier.revenue)}</span>
                          <span className="stats-tier-mobile-agg">+{formatEuro(tier.aggio)} aggio</span>
                        </div>
                      </div>
                      <div className="stats-tier-mobile-bottom">
                        <span className="stats-tier-qty">{formatNumber(tier.ticketsSold)} pz venduti</span>
                        <div className="stats-share-bar-cell">
                          <div className="stats-progress-track">
                            <div
                              className="stats-progress-fill"
                              style={{ width: `${Math.min(100, Math.max(shareNum > 0 ? 4 : 0, shareNum))}%` }}
                            />
                          </div>
                          <span className="stats-share-text">{shareNum.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
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

      {/* ── TASTO IN FONDO ALLA PAGINA LUNGO QUANTO LA SCHERMATA IN ORIZZONTALE ── */}
      <div className="stats-fullwidth-action-wrap">
        <button
          type="button"
          className="stats-btn-fullwidth-pdf"
          onClick={handlePrintPdf}
          id="btn-stampa-pdf-statistiche"
          title="Genera ed esporta il documento PDF con tutte le statistiche pronto da stampare"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          <span>Stampa / Esporta Report PDF Statistiche</span>
        </button>
      </div>
    </div>
  )
}
