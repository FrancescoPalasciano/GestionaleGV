import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { api } from '../services/api.js'

// Specifiche confezionamento stecche: numero fisso di biglietti per stecca
// €0,50 → 600, €1,00 → 300, €2,00 → 150, €3,00 → 100, €5,00 → 60, €10,00 → 30, €20,00 → 15
export const STECCHE_SPEC = {
  0.5: 600,
  1: 300,
  2: 150,
  3: 100,
  5: 60,
  10: 30,
  15: 20,
  20: 15,
  25: 12,
  30: 10,
}

export function getTicketsPerStecca(price) {
  const p = Number(price)
  if (STECCHE_SPEC[p]) return STECCHE_SPEC[p]
  return Math.max(1, Math.round(300 / p))
}

// Ogni stecca ha un costo fornitura fisso di € 300,00
export const PREZZO_STECCA = 300.00

// Calcolo limiti settimana stecche con RESET OGNI DOMENICA
export function getSteccheWeekBounds(refDate = new Date()) {
  const now = new Date(refDate)
  const day = now.getDay() // 0 = Domenica, 1 = Lunedì, ..., 6 = Sabato

  // Il ciclo settimanale delle stecche si azzera la domenica: parte dall'ultima domenica
  const start = new Date(now)
  start.setDate(now.getDate() - day)
  start.setHours(0, 0, 0, 0)

  // E si conclude il sabato alle 23:59:59
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

export function isDateInCurrentSteccheWeek(dateStr) {
  if (!dateStr) return true
  const parts = String(dateStr).split('T')[0].split('-')
  let d
  if (parts.length === 3) {
    d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0)
  } else {
    d = new Date(dateStr)
  }
  const { start, end } = getSteccheWeekBounds()
  return d >= start && d <= end
}

export default function GrattaEVinciView({ t, user }) {
  // Stato sincronizzazione database cloud
  const [syncStatus, setSyncStatus] = useState('idle') // 'idle' | 'syncing' | 'synced' | 'offline'

  // Switch tabella: 'sales' (Vendite di oggi) | 'purchases' (Acquistati a stecche)
  const [activeTableTab, setActiveTableTab] = useState('sales')

  // Contatori stecche da caricare nella vista Acquistati: { [price]: numberOfStecche }
  const [steccheCounts, setSteccheCounts] = useState({})

  // Forniture registrate nel DB
  const [purchasesList, setPurchasesList] = useState([])
  const [purchasesFilter, setPurchasesFilter] = useState('current_week') // 'current_week' | 'all'
  const [isSavingPurchase, setIsSavingPurchase] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState('')
  const [purchaseError, setPurchaseError] = useState('')

  // Di base nella pagina non sono presenti taglie di gratta e vinci predefinite (aggiunte dal gestore)
  const defaultPrices = []

  // Fasce di prezzo attive (vuoto di base)
  const [priceTiers, setPriceTiers] = useState(() => {
    try {
      const saved = localStorage.getItem('gv_price_tiers')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          return parsed.sort((a, b) => a - b)
        }
      }
    } catch (e) {
      console.error('Errore lettura priceTiers da localStorage', e)
    }
    return defaultPrices
  })

  // Vendite odierne per ciascun prezzo (vuoto di base)
  const [salesByPrice, setSalesByPrice] = useState(() => {
    try {
      const saved = localStorage.getItem('gv_sales_today')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.error('Errore lettura salesByPrice da localStorage', e)
    }
    return {}
  })

  // Vincite emesse oggi (vuoto di base)
  const [winnings, setWinnings] = useState(() => {
    try {
      const saved = localStorage.getItem('gv_winnings_today')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.error('Errore lettura vincite da localStorage', e)
    }
    return []
  })

  // Storico odierno: Ultimi Gratta e Vinci aggiunti / battuti, storni e vincite (vuoto di base)
  const [historyLog, setHistoryLog] = useState(() => {
    try {
      const saved = localStorage.getItem('gv_history_log_v2')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.error('Errore lettura historyLog da localStorage', e)
    }
    return []
  })

  // Data odierna formattata in italiano
  const todayFormatted = useMemo(() => {
    const d = new Date()
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    const str = d.toLocaleDateString('it-IT', options)
    return str.charAt(0).toUpperCase() + str.slice(1)
  }, [])

  // Filtro per la visualizzazione compatta (ultime 5)
  const [historyFilter, setHistoryFilter] = useState('gv_only') // 'gv_only' | 'all' | 'wins'

  // Modali
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [showWinModal, setShowWinModal] = useState(false)
  const [winModalMode, setWinModalMode] = useState('single') // 'single' | 'daily_total'
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false)
  
  // Modale Registro Completo con Tabella e Paginazione
  const [showAllTransactionsModal, setShowAllTransactionsModal] = useState(false)
  const [modalSearch, setModalSearch] = useState('')
  const [modalTypeFilter, setModalTypeFilter] = useState('all') // 'all' | 'sales' | 'storni' | 'wins'
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  // State per aggiunta fascia di prezzo
  const [newPriceInput, setNewPriceInput] = useState('')
  const [priceError, setPriceError] = useState('')

  // State per inserimento vincita singola
  const [winAmount, setWinAmount] = useState('')
  const [winTier, setWinTier] = useState('€10')
  const [winCustomTime, setWinCustomTime] = useState('')
  const [winError, setWinError] = useState('')

  // State per inserimento totale fine giornata
  const [dailyTotalAmount, setDailyTotalAmount] = useState('')
  const [dailyTotalMode, setDailyTotalMode] = useState('replace') // 'replace' | 'append'
  const [dailyTotalNote, setDailyTotalNote] = useState('Chiusura serale terminale')

  // Salvataggio su localStorage
  useEffect(() => {
    try {
      localStorage.setItem('gv_price_tiers', JSON.stringify(priceTiers))
    } catch (e) {
      console.error(e)
    }
  }, [priceTiers])

  useEffect(() => {
    try {
      localStorage.setItem('gv_sales_today', JSON.stringify(salesByPrice))
    } catch (e) {
      console.error(e)
    }
  }, [salesByPrice])

  useEffect(() => {
    try {
      localStorage.setItem('gv_winnings_today', JSON.stringify(winnings))
    } catch (e) {
      console.error(e)
    }
  }, [winnings])

  useEffect(() => {
    try {
      localStorage.setItem('gv_history_log_v2', JSON.stringify(historyLog))
    } catch (e) {
      console.error(e)
    }
  }, [historyLog])

  // Reset pagination on filter change in modal
  useEffect(() => {
    setCurrentPage(1)
  }, [modalSearch, modalTypeFilter])

  // Caricamento dei dati dal backend con polling automatico ogni 15 secondi (multi-dispositivo)
  const loadDataFromDb = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setSyncStatus('syncing')

      // 1. Fasce di prezzo
      const backendTiers = await api.gv.getPriceTiers()
      if (Array.isArray(backendTiers)) {
        const prices = backendTiers.map((t) => Number(t.price)).sort((a, b) => a - b)
        setPriceTiers(prices)
      }

      // 2. Vendite odierne
      const backendSales = await api.gv.getSalesToday()
      if (Array.isArray(backendSales)) {
        const salesMap = {}
        backendSales.forEach((s) => {
          salesMap[Number(s.price)] = s.quantity
        })
        setSalesByPrice(salesMap)
      }

      // 3. Vincite odierne
      const backendWins = await api.gv.getWinningsToday()
      if (Array.isArray(backendWins)) {
        const formattedWins = backendWins.map((w) => ({
          id: w.id,
          time: w.timeRecorded,
          amount: Number(w.amount),
          tier: w.tier,
          type: w.type,
          note: w.note,
        }))
        setWinnings(formattedWins)
      }

      // 4. Storico odierno
      const backendTransactions = await api.gv.getTransactionsToday()
      if (Array.isArray(backendTransactions)) {
        const formattedLog = backendTransactions.map((t) => ({
          id: t.id,
          time: t.timeRecorded,
          type: t.type,
          price: t.price ? Number(t.price) : undefined,
          qty: t.quantity,
          amount: Number(t.amount),
          tier: t.tier,
          label: t.label,
        }))
        setHistoryLog(formattedLog)
      }

      // 5. Forniture caricate dal database (conteggi attivi filtrati sulla settimana con reset domenica)
      const backendPurchases = await api.gv.getPurchases()
      if (Array.isArray(backendPurchases)) {
        setPurchasesList(backendPurchases)
        const counts = {}
        backendPurchases.forEach((p) => {
          if (isDateInCurrentSteccheWeek(p.purchaseDate)) {
            if (p.price != null) {
              const pKey = Number(p.price)
              counts[pKey] = (counts[pKey] || 0) + (p.packsCount || p.quantity || 1)
            } else if (p.description) {
              const match = p.description.match(/da\s*€\s*([0-9]+(?:[.,][0-9]+)?)/i)
              if (match) {
                const pKey = parseFloat(match[1].replace(',', '.'))
                counts[pKey] = (counts[pKey] || 0) + (p.packsCount || p.quantity || 1)
              }
            }
          }
        })
        setSteccheCounts(counts)
      }

      if (!isSilent) setSyncStatus('synced')
    } catch (err) {
      if (!isSilent) {
        console.warn('Backend non raggiungibile, utilizzo cache locale:', err)
        setSyncStatus('offline')
      }
    }
  }, [])

  // Caricamento iniziale e polling automatico ogni 15s per aggiornamenti da diversi dispositivi
  useEffect(() => {
    loadDataFromDb(false)

    const intervalId = setInterval(() => {
      loadDataFromDb(true)
    }, 15000)

    return () => clearInterval(intervalId)
  }, [loadDataFromDb, user])

  // Reset delle vendite del giorno seguente con conferma
  const handleConfirmResetSales = async () => {
    try {
      const zeroed = {}
      priceTiers.forEach((p) => {
        zeroed[p] = 0
      })
      setSalesByPrice(zeroed)
      localStorage.setItem('gv_sales_today', JSON.stringify(zeroed))

      await api.gv.resetSalesToday()
    } catch (err) {
      console.warn('Errore azzeramento vendite DB:', err)
    } finally {
      setShowResetConfirmModal(false)
    }
  }

  // Modifica vendite con scaglioni (+1, +5, -1) con AGGREGAZIONE SIA PER AGGIUNTE SIA PER STORNI
  const handleUpdateCount = (price, delta) => {
    const now = new Date()
    const timeFormatted = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    setSalesByPrice((prev) => {
      const current = prev[price] || 0
      const next = Math.max(0, current + delta)

      // Aggiorna lo storico odierno con aggregazione nello stesso minuto
      setHistoryLog((hPrev) => {
        if (delta > 0) {
          // ── AGGIUNTE: Cerca se esiste già un'aggiunta per lo stesso prezzo nello stesso minuto ──
          const existingIndex = hPrev.findIndex(
            (item) => item.time === timeFormatted && item.type === 'gv_add' && item.price === price
          )

          if (existingIndex !== -1) {
            const existing = hPrev[existingIndex]
            const updatedQty = (existing.qty || 1) + delta
            const updatedAmount = price * updatedQty
            const updatedItem = {
              ...existing,
              qty: updatedQty,
              amount: updatedAmount,
              label: `+${updatedQty} bigliett${updatedQty === 1 ? 'o' : 'i'} da € ${price}`,
            }

            const remaining = hPrev.filter((_, idx) => idx !== existingIndex)
            return [updatedItem, ...remaining]
          } else {
            const newHistoryItem = {
              id: `h-gv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              time: timeFormatted,
              type: 'gv_add',
              price: price,
              qty: delta,
              amount: price * delta,
              label: delta === 1 ? `+1 biglietto da € ${price}` : `+${delta} biglietti da € ${price}`,
            }
            return [newHistoryItem, ...hPrev]
          }
        } else if (delta < 0 && current > 0) {
          // ── STORNI: Cerca se esiste già uno storno per lo stesso prezzo nello stesso minuto ──
          const existingStornoIndex = hPrev.findIndex(
            (item) => item.time === timeFormatted && item.type === 'gv_sub' && item.price === price
          )

          if (existingStornoIndex !== -1) {
            // Aggrega gli storni nello stesso minuto
            const existing = hPrev[existingStornoIndex]
            const updatedQty = (existing.qty || 1) + 1
            const updatedAmount = price * updatedQty
            const updatedItem = {
              ...existing,
              qty: updatedQty,
              amount: updatedAmount,
              label: `–${updatedQty} storn${updatedQty === 1 ? 'o' : 'i'} da € ${price}`,
            }

            const remaining = hPrev.filter((_, idx) => idx !== existingStornoIndex)
            return [updatedItem, ...remaining]
          } else {
            // Nuovo storno
            const newStornoItem = {
              id: `h-gv-sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              time: timeFormatted,
              type: 'gv_sub',
              price: price,
              qty: 1,
              amount: price,
              label: `–1 storno da € ${price}`,
            }
            return [newStornoItem, ...hPrev]
          }
        }
        return hPrev
      })

      return {
        ...prev,
        [price]: next,
      }
    })

    // Sincronizzazione atomica con il database backend
    api.gv.updateSale(price, delta)
      .then(() => setSyncStatus('synced'))
      .catch((err) => {
        console.warn('Errore salvataggio vendita nel DB:', err)
        setSyncStatus('offline')
      })

    api.gv.logTransaction({
      type: delta > 0 ? 'gv_add' : 'gv_sub',
      price: price,
      quantity: Math.abs(delta),
      amount: price * Math.abs(delta),
      label: delta > 0
        ? (delta === 1 ? `+1 biglietto da € ${price}` : `+${delta} biglietti da € ${price}`)
        : `–1 storno da € ${price}`,
      timeRecorded: timeFormatted,
    }).catch((err) => console.warn('Errore salvataggio transazione nel DB:', err))
  }

  // Aggiungi una nuova fascia di prezzo
  const handleAddPriceTier = (e) => {
    e.preventDefault()
    setPriceError('')
    const priceNum = parseFloat(newPriceInput.replace(',', '.'))
    if (isNaN(priceNum) || priceNum <= 0) {
      setPriceError('Inserisci un prezzo valido maggiore di 0')
      return
    }
    if (priceTiers.includes(priceNum)) {
      setPriceError(`La fascia di prezzo € ${priceNum} esiste già`)
      return
    }

    const updated = [...priceTiers, priceNum].sort((a, b) => a - b)
    setPriceTiers(updated)
    setSalesByPrice((prev) => ({
      ...prev,
      [priceNum]: prev[priceNum] || 0,
    }))
    setNewPriceInput('')

    // Sincronizza nuova fascia con il DB
    api.gv.addPriceTier(priceNum)
      .then(() => setSyncStatus('synced'))
      .catch((err) => {
        console.warn('Errore salvataggio fascia nel DB:', err)
        setSyncStatus('offline')
      })
  }

  // Rimuovi una fascia di prezzo
  const handleRemovePriceTier = (priceToRemove) => {
    if (priceTiers.length <= 1) {
      setPriceError('Deve rimanere almeno una fascia di prezzo attiva')
      return
    }
    setPriceTiers((prev) => prev.filter((p) => p !== priceToRemove))

    // Sincronizza rimozione fascia con il DB
    api.gv.removePriceTier(priceToRemove)
      .then(() => setSyncStatus('synced'))
      .catch((err) => {
        console.warn('Errore rimozione fascia dal DB:', err)
        setSyncStatus('offline')
      })
  }

  // Registra nuova vincita singola
  const handleAddSingleWinning = (e) => {
    e.preventDefault()
    setWinError('')
    const amountNum = parseFloat(winAmount.replace(',', '.'))
    if (isNaN(amountNum) || amountNum <= 0) {
      setWinError('Inserisci un importo valido per la vincita')
      return
    }

    const now = new Date()
    const timeFormatted = winCustomTime.trim() || 
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const newWin = {
      id: `w-${Date.now()}`,
      time: timeFormatted,
      amount: amountNum,
      tier: winTier,
      type: 'single',
    }

    const newHistoryWin = {
      id: `h-w-${Date.now()}`,
      time: timeFormatted,
      type: 'win',
      amount: amountNum,
      tier: winTier,
      label: `Vincita · Biglietto ${winTier}`,
    }

    setWinnings((prev) => [newWin, ...prev])
    setHistoryLog((prev) => [newHistoryWin, ...prev])
    setWinAmount('')
    setShowWinModal(false)

    // Sincronizza vincita e log col DB
    api.gv.addWinning({
      amount: amountNum,
      tier: winTier,
      type: 'single',
      timeRecorded: timeFormatted,
    })
      .then(() => setSyncStatus('synced'))
      .catch((err) => {
        console.warn('Errore salvataggio vincita nel DB:', err)
        setSyncStatus('offline')
      })

    api.gv.logTransaction({
      type: 'win',
      amount: amountNum,
      tier: winTier,
      label: `Vincita · Biglietto ${winTier}`,
      timeRecorded: timeFormatted,
    }).catch((err) => console.warn('Errore salvataggio log vincita nel DB:', err))
  }

  // Registra totale vincite a fine giornata (chiusura)
  const handleAddDailyTotalWinning = (e) => {
    e.preventDefault()
    setWinError('')
    const amountNum = parseFloat(dailyTotalAmount.replace(',', '.'))
    if (isNaN(amountNum) || amountNum <= 0) {
      setWinError('Inserisci un importo valido per la chiusura di fine giornata')
      return
    }

    const now = new Date()
    const timeFormatted = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const closingEntry = {
      id: `w-closing-${Date.now()}`,
      time: timeFormatted,
      amount: amountNum,
      tier: dailyTotalNote.trim() || 'Chiusura terminale',
      type: 'closing',
    }

    const closingHistoryItem = {
      id: `h-closing-${Date.now()}`,
      time: timeFormatted,
      type: 'closing',
      amount: amountNum,
      label: 'Chiusura serale terminale',
      tier: dailyTotalNote.trim() || 'Chiusura terminale',
    }

    if (dailyTotalMode === 'replace') {
      setWinnings([closingEntry])
    } else {
      setWinnings((prev) => [closingEntry, ...prev])
    }

    setHistoryLog((prev) => [closingHistoryItem, ...prev])
    setDailyTotalAmount('')
    setShowWinModal(false)

    // Sincronizza chiusura vincite col DB
    api.gv.addWinning({
      amount: amountNum,
      tier: dailyTotalNote.trim() || 'Chiusura terminale',
      type: 'closing',
      mode: dailyTotalMode,
      timeRecorded: timeFormatted,
      note: dailyTotalNote.trim() || 'Chiusura terminale',
    })
      .then(() => setSyncStatus('synced'))
      .catch((err) => {
        console.warn('Errore salvataggio chiusura vincite nel DB:', err)
        setSyncStatus('offline')
      })

    api.gv.logTransaction({
      type: 'closing',
      amount: amountNum,
      tier: dailyTotalNote.trim() || 'Chiusura terminale',
      label: 'Chiusura serale terminale',
      timeRecorded: timeFormatted,
    }).catch((err) => console.warn('Errore salvataggio log chiusura nel DB:', err))
  }

  // Rimuovi voce dallo storico odierno
  const handleRemoveHistoryItem = (id) => {
    setHistoryLog((prev) => prev.filter((item) => item.id !== id))
    setWinnings((prev) => prev.filter((w) => w.id !== id))

    if (typeof id === 'number' || (!isNaN(Number(id)) && !String(id).startsWith('h-') && !String(id).startsWith('w-'))) {
      api.gv.deleteTransaction(id).catch((err) => console.warn('Errore rimozione transazione DB:', err))
      api.gv.deleteWinning(id).catch((err) => console.warn('Errore rimozione vincita DB:', err))
    }
  }

  // Calcoli riassuntivi
  const totalTicketsSold = Object.entries(salesByPrice).reduce((acc, [price, count]) => {
    return priceTiers.includes(Number(price)) ? acc + (count || 0) : acc
  }, 0)

  const totalIncassoGv = Object.entries(salesByPrice).reduce((acc, [price, count]) => {
    return priceTiers.includes(Number(price)) ? acc + Number(price) * (count || 0) : acc
  }, 0)

  const totalWinningsAmount = winnings.reduce((acc, curr) => acc + (curr.amount || 0), 0)
  const aggioStimato = (totalIncassoGv * 0.08).toFixed(2)

  // Stepper stecche: SALVATAGGIO IMMEDIATO NEL DATABASE (Ogni aggiunta o storno aggiorna il DB)
  const handleUpdateSteccheCount = async (price, delta) => {
    // 1. Aggiorna ottimisticamente il conteggio a video
    setSteccheCounts((prev) => {
      const current = prev[price] || 0
      const next = Math.max(0, current + delta)
      return { ...prev, [price]: next }
    })
    setPurchaseError('')
    setPurchaseSuccess('')

    try {
      // 2. Chiama l'endpoint per salvare immediatamente la stecca nel database
      await api.gv.updateStecca(price, delta)
      setSyncStatus('synced')

      // 3. Ricarica l'elenco forniture dal backend per allineare tutto
      const updatedPurchases = await api.gv.getPurchases()
      if (Array.isArray(updatedPurchases)) {
        setPurchasesList(updatedPurchases)
        const counts = {}
        updatedPurchases.forEach((p) => {
          if (isDateInCurrentSteccheWeek(p.purchaseDate)) {
            if (p.price != null) {
              const pKey = Number(p.price)
              counts[pKey] = (counts[pKey] || 0) + (p.packsCount || p.quantity || 1)
            } else if (p.description) {
              const match = p.description.match(/da\s*€\s*([0-9]+(?:[.,][0-9]+)?)/i)
              if (match) {
                const pKey = parseFloat(match[1].replace(',', '.'))
                counts[pKey] = (counts[pKey] || 0) + (p.packsCount || p.quantity || 1)
              }
            }
          }
        })
        setSteccheCounts(counts)
      }

      const tickets = getTicketsPerStecca(price) * Math.abs(delta)
      const cost = (Math.abs(delta) * PREZZO_STECCA).toFixed(2).replace('.', ',')
      const formattedP = Number(price).toFixed(2).replace('.', ',')
      if (delta > 0) {
        setPurchaseSuccess(`Registrata ${delta} ${delta === 1 ? 'stecca' : 'stecche'} da € ${formattedP} (${tickets} pz · € ${cost}) nel database.`)
      } else {
        setPurchaseSuccess(`Stornata 1 stecca da € ${formattedP} nel database.`)
      }
      setTimeout(() => setPurchaseSuccess(''), 4500)
    } catch (err) {
      console.error('Errore registrazione stecca:', err)
      setPurchaseError(err.message || 'Errore durante la registrazione della stecca nel database')
      setSyncStatus('offline')
      loadDataFromDb(true)
    }
  }

  // Calcolo totale stecche, biglietti e costo per la settimana corrente (reset automatico ogni domenica)
  const { totalStecche, totalSteccheTickets, totalSteccheAmount } = useMemo(() => {
    let stSum = 0
    let tSum = 0
    priceTiers.forEach((p) => {
      const count = steccheCounts[p] || 0
      if (count > 0) {
        stSum += count
        tSum += count * getTicketsPerStecca(p)
      }
    })
    return {
      totalStecche: stSum,
      totalSteccheTickets: tSum,
      totalSteccheAmount: stSum * PREZZO_STECCA,
    }
  }, [priceTiers, steccheCounts])

  // Eliminazione fornitura caricata con aggiornamento conteggi
  const handleDeletePurchase = async (id) => {
    if (!window.confirm('Confermi di voler eliminare questa fornitura registrata nel database?')) return
    try {
      await api.gv.deletePurchase(id)
      const updated = await api.gv.getPurchases()
      if (Array.isArray(updated)) {
        setPurchasesList(updated)
        const counts = {}
        updated.forEach((p) => {
          if (isDateInCurrentSteccheWeek(p.purchaseDate)) {
            if (p.price != null) {
              const pKey = Number(p.price)
              counts[pKey] = (counts[pKey] || 0) + (p.packsCount || p.quantity || 1)
            } else if (p.description) {
              const match = p.description.match(/da\s*€\s*([0-9]+(?:[.,][0-9]+)?)/i)
              if (match) {
                const pKey = parseFloat(match[1].replace(',', '.'))
                counts[pKey] = (counts[pKey] || 0) + (p.packsCount || p.quantity || 1)
              }
            }
          }
        })
        setSteccheCounts(counts)
      }
      setPurchaseSuccess('Fornitura eliminata con successo dal database.')
      setTimeout(() => setPurchaseSuccess(''), 4000)
    } catch (err) {
      alert('Errore eliminazione fornitura: ' + (err.message || 'Errore di rete'))
    }
  }

  // Elenco forniture filtrate (settimana corrente vs tutte)
  const displayedPurchases = useMemo(() => {
    if (purchasesFilter === 'current_week') {
      return purchasesList.filter((p) => isDateInCurrentSteccheWeek(p.purchaseDate))
    }
    return purchasesList
  }, [purchasesList, purchasesFilter])

  // Conteggio forniture della settimana corrente
  const currentWeekPurchasesCount = useMemo(() => {
    return purchasesList.filter((p) => isDateInCurrentSteccheWeek(p.purchaseDate)).length
  }, [purchasesList])

  // Formattazione pulita della data fornitura
  const formatPurchaseDate = (dateStr) => {
    if (!dateStr) return 'Oggi'
    try {
      const parts = String(dateStr).split('T')[0].split('-')
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`
      }
      return new Date(dateStr).toLocaleDateString('it-IT')
    } catch (e) {
      return dateStr
    }
  }

  // Filtro per la lista dello storico odierno nella card (ordinata cronologicamente decrescente)
  const filteredHistory = useMemo(() => {
    return historyLog.filter((item) => {
      if (historyFilter === 'gv_only') return item.type === 'gv_add' || item.type === 'gv_sub'
      if (historyFilter === 'wins') return item.type === 'win' || item.type === 'closing'
      return true // 'all'
    })
  }, [historyLog, historyFilter])

  // SOLO LE ULTIME 5 TRANSAZIONI per la sidebar
  const displayedHistory = filteredHistory.slice(0, 5)

  // Elenco completo per la modale tabellare a pagine
  const allFilteredModalTransactions = useMemo(() => {
    return historyLog.filter((item) => {
      // Filtro per tipologia
      if (modalTypeFilter === 'sales' && item.type !== 'gv_add') return false
      if (modalTypeFilter === 'storni' && item.type !== 'gv_sub') return false
      if (modalTypeFilter === 'wins' && item.type !== 'win' && item.type !== 'closing') return false

      // Ricerca testuale
      if (modalSearch.trim()) {
        const q = modalSearch.toLowerCase()
        const matchLabel = item.label ? item.label.toLowerCase().includes(q) : false
        const matchTime = item.time ? item.time.includes(q) : false
        const matchPrice = item.price ? `€ ${item.price}`.toLowerCase().includes(q) : false
        if (!matchLabel && !matchTime && !matchPrice) return false
      }

      return true
    })
  }, [historyLog, modalTypeFilter, modalSearch])

  // Paginazione
  const totalPages = Math.max(1, Math.ceil(allFilteredModalTransactions.length / pageSize))
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return allFilteredModalTransactions.slice(start, start + pageSize)
  }, [allFilteredModalTransactions, currentPage, pageSize])

  return (
    <div className="gv-workspace">
      {/* Header principale della pagina */}
      <div className="gv-page-header">
        <div className="gv-page-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <h1 className="gv-page-title" style={{ margin: 0 }}>Gratta e Vinci</h1>
            <div
              className="gv-today-date-pill"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#0F6B4F',
                backgroundColor: '#eef7f2',
                border: '1px solid #cce5d7',
                padding: '4px 10px',
                borderRadius: '6px',
                letterSpacing: '-0.1px'
              }}
              title="Data odierna di registrazione vendite"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F6B4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{todayFormatted}</span>
            </div>
          </div>
          <p className="gv-page-subtitle">Registra le vendite della giornata con un click.</p>
        </div>

        <div className="gv-header-actions">
          <button
            type="button"
            className="gv-btn-reset-day"
            onClick={() => setShowResetConfirmModal(true)}
            id="btn-reset-vendite-giorno"
            title="Azzera tutte le vendite registrate oggi per la nuova giornata"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }} aria-hidden="true">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            Azzera Vendite Giornata
          </button>

          <button
            type="button"
            className="gv-btn-primary"
            onClick={() => setShowPriceModal(true)}
            id="btn-gestisci-fasce"
          >
            <span className="btn-icon">+</span> Aggiungi / Modifica Fasce
          </button>
        </div>
      </div>

      {/* Griglia principale a due sezioni: Vendite (Sinistra) e Vincite/Storico (Destra) */}
      {/* Griglia principale a due sezioni: Vendite/Acquistati (Sinistra) e Vincite/Storico (Destra) */}
      <div className="gv-main-layout">
        {/* Sezione Sinistra: Vendite di oggi o Acquistati (con switch) */}
        <section className="gv-sales-section" aria-labelledby="sales-title">
          <div className="gv-section-header">
            <div>
              <h2 id="sales-title" className="gv-section-title">
                {activeTableTab === 'sales' ? 'Vendite di oggi' : 'Acquistati'}
              </h2>
              <p className="gv-section-subtitle">
                {activeTableTab === 'sales'
                  ? 'Usa i controlli grandi per registrare rapidamente.'
                  : 'Carico fornitura a stecche. Ogni stecca ha un costo fisso di € 300,00.'}
              </p>
            </div>

            {/* Switch per passare alla vista Acquistati */}
            <div className="gv-table-switch-wrapper">
              <div className="gv-segmented-switch" role="tablist" aria-label="Selettore modalità Vendite / Acquistati">
                <button
                  type="button"
                  role="tab"
                  id="tab-switch-vendite"
                  aria-selected={activeTableTab === 'sales'}
                  className={`gv-switch-tab ${activeTableTab === 'sales' ? 'active' : ''}`}
                  onClick={() => setActiveTableTab('sales')}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
                    <line x1="12" y1="5" x2="12" y2="19" />
                  </svg>
                  <span>Vendite di oggi</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  id="tab-switch-acquistati"
                  aria-selected={activeTableTab === 'purchases'}
                  className={`gv-switch-tab ${activeTableTab === 'purchases' ? 'active' : ''}`}
                  onClick={() => setActiveTableTab('purchases')}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                  <span>Acquistati</span>
                </button>
              </div>
            </div>
          </div>

          {/* Griglia delle fasce di prezzo (Modalità Vendite vs Modalità Acquistati) */}
          {activeTableTab === 'sales' ? (
            <div className="gv-cards-grid">
              {priceTiers.length === 0 ? (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    padding: '40px 24px',
                    textAlign: 'center',
                    backgroundColor: '#ffffff',
                    border: '1px dashed #d0dcd4',
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{ marginBottom: '12px', color: '#0F6B4F' }}>
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                      <line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#171717', marginBottom: '6px' }}>
                    Nessuna fascia configurata
                  </h3>
                  <p style={{ fontSize: '13.5px', color: '#63736b', maxWidth: '420px', margin: '0 auto 18px auto', lineHeight: '1.5' }}>
                    Aggiungi le fasce di prezzo del tuo punto vendita per iniziare a registrare le vendite al banco.
                  </p>
                  <button
                    type="button"
                    className="gv-btn-primary"
                    onClick={() => setShowPriceModal(true)}
                    style={{ padding: '10px 22px' }}
                  >
                    <span className="btn-icon">+</span> Aggiungi Fascia di Prezzo
                  </button>
                </div>
              ) : (
                priceTiers.map((price) => {
                  const count = salesByPrice[price] || 0
                  return (
                    <div key={price} className="gv-price-card">
                      <div className="gv-price-card-header">
                        <div className="gv-price-display">
                          € {Number(price).toFixed(2).replace('.', ',')}
                        </div>
                      </div>

                      <span className="gv-price-label">venduti oggi</span>

                      {/* Bottoni a scaglioni: decremento -, conteggio centrale, incremento +1 e +5 */}
                      <div className="gv-counter-controls">
                        <button
                          type="button"
                          className="gv-ctrl-btn gv-ctrl-minus"
                          onClick={() => handleUpdateCount(price, -1)}
                          disabled={count <= 0}
                          title="Storna / Sottrai 1 biglietto"
                          aria-label={`Storna 1 biglietto da € ${price}`}
                        >
                          –
                        </button>

                        <div className="gv-count-badge" aria-live="polite">
                          {count}
                        </div>

                        <button
                          type="button"
                          className="gv-ctrl-btn gv-ctrl-plus-1"
                          onClick={() => handleUpdateCount(price, 1)}
                          title="Aggiungi 1 biglietto (+1)"
                          aria-label={`Aggiungi 1 biglietto da € ${price}`}
                        >
                          +1
                        </button>

                        <button
                          type="button"
                          className="gv-ctrl-btn gv-ctrl-plus-5"
                          onClick={() => handleUpdateCount(price, 5)}
                          title="Scaglione rapido (+5)"
                          aria-label={`Aggiungi 5 biglietti da € ${price}`}
                        >
                          +5
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          ) : (
            /* VISTA ACQUISTATI: CARICO A STECCHE (€300 a stecca e conteggio automatico) */
            <div className="gv-cards-grid">
              {priceTiers.length === 0 ? (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    padding: '40px 24px',
                    textAlign: 'center',
                    backgroundColor: '#ffffff',
                    border: '1px dashed #d0dcd4',
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{ marginBottom: '12px', color: '#0F6B4F' }}>
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#171717', marginBottom: '6px' }}>
                    Nessuna fascia configurata
                  </h3>
                  <p style={{ fontSize: '13.5px', color: '#63736b', maxWidth: '420px', margin: '0 auto 18px auto', lineHeight: '1.5' }}>
                    Configura prima le fasce di prezzo per caricare le forniture di stecche.
                  </p>
                  <button
                    type="button"
                    className="gv-btn-primary"
                    onClick={() => setShowPriceModal(true)}
                    style={{ padding: '10px 22px' }}
                  >
                    <span className="btn-icon">+</span> Configura Fasce
                  </button>
                </div>
              ) : (
                priceTiers.map((price) => {
                  const stecche = steccheCounts[price] || 0
                  const ticketsPerStecca = getTicketsPerStecca(price)
                  const totalTicketsTier = stecche * ticketsPerStecca
                  const totalCostTier = stecche * PREZZO_STECCA

                  return (
                    <div key={price} className={`gv-price-card gv-stecche-card ${stecche > 0 ? 'card-has-stecche' : ''}`}>
                      <div className="gv-price-card-header">
                        <div className="gv-price-display">
                          € {Number(price).toFixed(2).replace('.', ',')}
                        </div>
                        <span className="gv-stecca-spec-pill" title={`1 stecca contiene ${ticketsPerStecca} biglietti da € ${Number(price).toFixed(2).replace('.', ',')}`}>
                          1 st = {ticketsPerStecca} pz
                        </span>
                      </div>

                      <span className="gv-price-label">stecche fornite</span>

                      {/* Controlli stecche */}
                      <div className="gv-counter-controls">
                        <button
                          type="button"
                          className="gv-ctrl-btn gv-ctrl-minus"
                          onClick={() => handleUpdateSteccheCount(price, -1)}
                          disabled={stecche <= 0}
                          title="Rimuovi 1 stecca"
                          aria-label={`Rimuovi 1 stecca da € ${price}`}
                        >
                          –
                        </button>

                        <div className="gv-count-badge gv-stecche-count-badge" aria-live="polite">
                          <span className="stecche-badge-num">{stecche}</span>
                          <span className="stecche-badge-unit">st</span>
                        </div>

                        <button
                          type="button"
                          className="gv-ctrl-btn gv-ctrl-plus-1"
                          onClick={() => handleUpdateSteccheCount(price, 1)}
                          title="Aggiungi 1 stecca (+1)"
                          aria-label={`Aggiungi 1 stecca da € ${price}`}
                        >
                          +1
                        </button>

                        <button
                          type="button"
                          className="gv-ctrl-btn gv-ctrl-plus-5"
                          onClick={() => handleUpdateSteccheCount(price, 5)}
                          title="Aggiungi 5 stecche (+5)"
                          aria-label={`Aggiungi 5 stecche da € ${price}`}
                        >
                          +5
                        </button>
                      </div>

                      {/* Riga Calcolo automatico dinamico per questa card */}
                      <div className="gv-stecca-subtotal-line">
                        {stecche > 0 ? (
                          <span className="stecca-subtotal-active">
                            {totalTicketsTier} pz · € {totalCostTier.toFixed(2).replace('.', ',')}
                          </span>
                        ) : (
                          <span className="stecca-subtotal-idle">
                            € 300,00 / stecca
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* Barra riassuntiva in fondo al blocco (Vendite vs Acquistati) */}
          {activeTableTab === 'sales' ? (
            <div className="gv-sales-footer-summary">
              <div className="summary-stat-pill">
                <span className="pill-label">Totale biglietti:</span>
                <strong className="pill-val">{totalTicketsSold} pz</strong>
              </div>
              <div className="summary-stat-pill">
                <span className="pill-label">Incasso odierno:</span>
                <strong className="pill-val highlight">€ {totalIncassoGv.toFixed(2).replace('.', ',')}</strong>
              </div>
              <div className="summary-stat-pill">
                <span className="pill-label">Aggio 8%:</span>
                <strong className="pill-val accent">€ {aggioStimato.replace('.', ',')}</strong>
              </div>
            </div>
          ) : (
            <div className="gv-sales-footer-summary gv-stecche-footer-summary">
              <div className="gv-stecche-summary-left">
                <div className="summary-stat-pill">
                  <span className="pill-label">Totale stecche:</span>
                  <strong className="pill-val highlight">{totalStecche} st</strong>
                </div>
                <div className="summary-stat-pill">
                  <span className="pill-label">Totale biglietti:</span>
                  <strong className="pill-val">{totalSteccheTickets} pz</strong>
                </div>
                <div className="summary-stat-pill">
                  <span className="pill-label">Importo fornitura (€ 300/st):</span>
                  <strong className="pill-val accent">€ {totalSteccheAmount.toFixed(2).replace('.', ',')}</strong>
                </div>
              </div>

              <div className="summary-actions-wrap">
                <div className="gv-sync-badge-live" title="Ogni stecca aggiunta o stornata viene registrata immediatamente nel database">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F6B4F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Salvataggio immediato nel database</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Sezione Destra: Differenziata per visualizzazione */}
        <aside className="gv-winnings-aside" aria-labelledby={activeTableTab === 'sales' ? 'winnings-title' : 'purchases-registry-title'}>
          {activeTableTab === 'sales' ? (
            <>
              {/* Box Vincite emesse oggi (visibile solo nella visualizzazione Vendite) */}
              <div className="gv-winnings-card">
                <h2 id="winnings-title" className="gv-winnings-title">Vincite emesse oggi</h2>

                <div className="gv-winnings-total">
                  € {totalWinningsAmount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>

                {/* Gruppo bottoni: Singola vincita & Totale fine giornata */}
                <div className="gv-winnings-actions-group">
                  <button
                    type="button"
                    className="gv-btn-primary gv-btn-win-single"
                    onClick={() => {
                      setWinModalMode('single')
                      setWinError('')
                      setShowWinModal(true)
                    }}
                    id="btn-singola-vincita"
                    title="Registra un singolo biglietto vincente pagato"
                  >
                    + Singola vincita
                  </button>

                  <button
                    type="button"
                    className="gv-btn-secondary gv-btn-win-closing"
                    onClick={() => {
                      setWinModalMode('daily_total')
                      setWinError('')
                      setShowWinModal(true)
                    }}
                    id="btn-totale-fine-giornata"
                    title="Inserisci la chiusura complessiva da scontrino terminale a fine giornata"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }} aria-hidden="true">
                      <rect x="4" y="2" width="16" height="20" rx="2" />
                      <line x1="8" y1="6" x2="16" y2="6" />
                      <line x1="8" y1="10" x2="16" y2="10" />
                      <line x1="8" y1="14" x2="12" y2="14" />
                    </svg>
                    Totale fine giornata
                  </button>
                </div>

                {/* Storico Odierno (Mostra le ultime 5 transazioni con tasto "Mostra tutte") */}
                <div className="gv-history-box">
                  <div className="gv-history-header-row">
                    <span className="gv-history-header-title">STORICO ODIERNO</span>
                    <span className="gv-history-count-tag">{filteredHistory.length} tot</span>
                  </div>

                  {/* Filtri rapidi: G&V Aggiunti / Tutte / Vincite */}
                  <div className="gv-history-filter-pills" role="tablist">
                    <button
                      type="button"
                      className={`gv-history-pill ${historyFilter === 'gv_only' ? 'active' : ''}`}
                      onClick={() => setHistoryFilter('gv_only')}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }} aria-hidden="true">
                        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
                      </svg>
                      G&V
                    </button>
                    <button
                      type="button"
                      className={`gv-history-pill ${historyFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setHistoryFilter('all')}
                    >
                      Tutti
                    </button>
                    <button
                      type="button"
                      className={`gv-history-pill ${historyFilter === 'wins' ? 'active' : ''}`}
                      onClick={() => setHistoryFilter('wins')}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }} aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                      </svg>
                      Vincite
                    </button>
                  </div>

                  {displayedHistory.length === 0 ? (
                    <div className="gv-history-empty">
                      {historyFilter === 'gv_only'
                        ? 'Nessun Gratta e Vinci aggiunto recentemente.'
                        : historyFilter === 'wins'
                        ? 'Nessuna vincita registrata oggi.'
                        : 'Nessuna operazione registrata oggi.'}
                    </div>
                  ) : (
                    <div className="gv-history-list">
                      {displayedHistory.map((item) => {
                        const isGvAdd = item.type === 'gv_add'
                        const isGvSub = item.type === 'gv_sub'
                        const isClosing = item.type === 'closing'
                        const isWin = item.type === 'win'

                        return (
                          <div
                            key={item.id}
                            className={`gv-history-item ${isGvAdd ? 'is-sale' : ''} ${isGvSub ? 'is-storno' : ''} ${
                              isClosing ? 'is-closing' : ''
                            } ${isWin ? 'is-win' : ''}`}
                          >
                            <div className="gv-history-time">{item.time}</div>

                            <div className="gv-history-values">
                              <div
                                className={`gv-history-amount ${
                                  isGvAdd ? 'text-green' : isGvSub ? 'text-danger' : isWin || isClosing ? 'text-amber' : ''
                                }`}
                              >
                                {isGvAdd && '+ '}
                                {isGvSub && '– '}
                                € {item.amount.toFixed(2).replace('.', ',')}
                              </div>

                              <div className="gv-history-tier">
                                {isGvAdd && (
                                  <span className="history-type-badge badge-sale">
                                    +{item.qty} da € {item.price}
                                  </span>
                                )}
                                {isGvSub && (
                                  <span className="history-type-badge badge-storno">
                                    –{item.qty} storno € {item.price}
                                  </span>
                                )}
                                {isClosing && <span className="history-type-badge badge-closing">Chiusura</span>}
                                {isWin && (
                                  <span className="history-type-badge badge-win">
                                    Vincita {item.tier}
                                  </span>
                                )}
                                <span className="history-item-label">{item.label}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Tasto per aprire l'overlay completo con tutte le transazioni */}
                  <div className="gv-history-footer-action">
                    <button
                      type="button"
                      className="gv-btn-view-all"
                      onClick={() => {
                        setCurrentPage(1)
                        setShowAllTransactionsModal(true)
                      }}
                      id="btn-mostra-tutte-transazioni"
                    >
                      Mostra tutte le transazioni ({historyLog.length}) ↗
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* MODALITÀ ACQUISTATI: NESSUN BOX VINCITE EMESSE OGGI! */
            <div className="gv-winnings-card gv-purchases-registry-card">
              <div className="gv-purchases-card-header">
                <div>
                  <h2 id="purchases-registry-title" className="gv-winnings-title">
                    Forniture caricate
                  </h2>
                  <p className="gv-purchases-card-subtitle">
                    Registro stecche con reset automatico ogni domenica
                  </p>
                </div>
                <span className="gv-history-count-tag" title="Carichi visualizzati">
                  {displayedPurchases.length} {displayedPurchases.length === 1 ? 'carico' : 'carichi'}
                </span>
              </div>

              {/* Totale fornitura registrata (settimana attiva) con formattazione italiana completa */}
              <div className="gv-winnings-total" style={{ color: '#0F6B4F', marginBottom: '4px' }}>
                € {totalSteccheAmount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '13px', color: '#66776e', marginBottom: '18px', fontWeight: 600 }}>
                {totalStecche} {totalStecche === 1 ? 'stecca attiva' : 'stecche attive'} · {totalSteccheTickets.toLocaleString('it-IT')} biglietti totali
              </div>

              {/* Selettore filtri: Questa settimana vs Tutte */}
              <div className="gv-purchases-filter-pills" role="tablist" aria-label="Filtro forniture">
                <button
                  type="button"
                  role="tab"
                  aria-selected={purchasesFilter === 'current_week'}
                  className={`gv-purchases-pill-btn ${purchasesFilter === 'current_week' ? 'active' : ''}`}
                  onClick={() => setPurchasesFilter('current_week')}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>Questa settimana ({currentWeekPurchasesCount})</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={purchasesFilter === 'all'}
                  className={`gv-purchases-pill-btn ${purchasesFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setPurchasesFilter('all')}
                >
                  <span>Tutte ({purchasesList.length})</span>
                </button>
              </div>

              {/* Elenco dettagliato forniture salvate nel DB */}
              <div className="gv-history-box" style={{ marginTop: '4px' }}>
                <div className="gv-history-header-row">
                  <span className="gv-history-header-title">ELENCO FORNITURE</span>
                  <span style={{ fontSize: '11px', color: '#7a8b83', fontWeight: 600 }}>
                    {purchasesFilter === 'current_week' ? 'Ciclo domenicale attivo' : 'Archivio storico'}
                  </span>
                </div>

                {displayedPurchases.length === 0 ? (
                  <div className="gv-history-empty" style={{ padding: '24px 12px' }}>
                    {purchasesFilter === 'current_week'
                      ? 'Nessuna fornitura registrata per la settimana in corso. Ogni domenica il ciclo si azzera automaticamente. Usa i pulsanti +1 e +5 sulle fasce a sinistra per caricare le nuove stecche.'
                      : 'Nessuna fornitura registrata nel database.'}
                  </div>
                ) : (
                  <div className="gv-purchases-scroll-list">
                    {displayedPurchases.map((p) => {
                      const qty = p.packsCount || p.quantity || 1
                      const amountNum = Number(p.amount || qty * PREZZO_STECCA)
                      const amountFormatted = amountNum.toLocaleString('it-IT', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                      const dateFormatted = formatPurchaseDate(p.purchaseDate)
                      const isCurrent = isDateInCurrentSteccheWeek(p.purchaseDate)

                      return (
                        <div key={p.id} className="gv-purchase-card-item">
                          <div className="gv-purchase-card-info">
                            <div className="gv-purchase-card-top">
                              <span className="gv-purchase-amount">
                                € {amountFormatted}
                              </span>
                              <span className="gv-purchase-stecche-tag">
                                {qty} {qty === 1 ? 'stecca' : 'stecche'}
                              </span>
                              {isCurrent && (
                                <span className="gv-purchase-active-pill" title="Inclusa nel conteggio settimanale">
                                  Settimana attiva
                                </span>
                              )}
                            </div>
                            <div className="gv-purchase-desc">
                              {p.description || 'Fornitura Gratta e Vinci'}
                            </div>
                            <div className="gv-purchase-meta">
                              <span>Data: {dateFormatted}</span>
                              <span>·</span>
                              <span>{p.supplier || 'Logista Italia S.p.A.'}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="gv-btn-trash-stecca"
                            onClick={() => handleDeletePurchase(p.id)}
                            title="Elimina / Storna questa fornitura dal database"
                            aria-label={`Elimina fornitura ${p.description || ''}`}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          OVERLAY TABELLARE A PAGINE CON NAVBAR (TUTTE LE TRANSAZIONI)
          ══════════════════════════════════════════════════════════════════════ */}
      {showAllTransactionsModal && (
        <div className="gv-modal-overlay" onClick={() => setShowAllTransactionsModal(false)}>
          <div
            className="gv-modal-dialog gv-modal-dialog-large"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Header modale */}
            <div className="gv-modal-header">
              <div>
                <h3 className="gv-modal-title">Registro Completo Transazioni Odierne</h3>
                <p className="gv-modal-desc">
                  Elenco cronologico decrescente di tutte le battute Gratta e Vinci, storni e vincite odierne.
                </p>
              </div>
              <button
                type="button"
                className="gv-modal-close"
                onClick={() => setShowAllTransactionsModal(false)}
                aria-label="Chiudi"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Toolbar di ricerca e filtri rapidi */}
            <div className="gv-table-toolbar">
              <input
                type="text"
                className="gv-table-search-input"
                placeholder="Cerca per taglio o orario (es. 5, 10:48)..."
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
              />

              <div className="gv-table-filter-group" role="group">
                <button
                  type="button"
                  className={`gv-tb-filter-btn ${modalTypeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setModalTypeFilter('all')}
                >
                  Tutte ({historyLog.length})
                </button>
                <button
                  type="button"
                  className={`gv-tb-filter-btn ${modalTypeFilter === 'sales' ? 'active' : ''}`}
                  onClick={() => setModalTypeFilter('sales')}
                >
                  Vendite G&V
                </button>
                <button
                  type="button"
                  className={`gv-tb-filter-btn ${modalTypeFilter === 'storni' ? 'active' : ''}`}
                  onClick={() => setModalTypeFilter('storni')}
                >
                  Storni
                </button>
                <button
                  type="button"
                  className={`gv-tb-filter-btn ${modalTypeFilter === 'wins' ? 'active' : ''}`}
                  onClick={() => setModalTypeFilter('wins')}
                >
                  Vincite
                </button>
              </div>
            </div>

            {/* Tabella transazioni */}
            <div className="gv-table-responsive-wrapper">
              <table className="gv-full-history-table">
                <thead>
                  <tr>
                    <th>Orario</th>
                    <th>Tipo</th>
                    <th>Dettaglio / Descrizione</th>
                    <th style={{ textAlign: 'center' }}>Quantità</th>
                    <th style={{ textAlign: 'right' }}>Importo</th>
                    <th style={{ textAlign: 'center' }}>Azione</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="table-empty-message">
                        Nessuna transazione corrispondente trovata.
                      </td>
                    </tr>
                  ) : (
                    paginatedTransactions.map((item) => {
                      const isGvAdd = item.type === 'gv_add'
                      const isGvSub = item.type === 'gv_sub'
                      const isClosing = item.type === 'closing'
                      const isWin = item.type === 'win'

                      return (
                        <tr key={item.id} className="table-row-item">
                          <td>
                            <strong style={{ fontFamily: 'monospace', fontSize: '13px' }}>{item.time}</strong>
                          </td>
                          <td>
                            {isGvAdd && <span className="history-type-badge badge-sale">Vendita</span>}
                            {isGvSub && <span className="history-type-badge badge-storno">Storno</span>}
                            {isClosing && <span className="history-type-badge badge-closing">Chiusura</span>}
                            {isWin && <span className="history-type-badge badge-win">Vincita</span>}
                          </td>
                          <td>
                            <div className="table-desc-cell">
                              <span className="desc-main-text">
                                {isGvAdd && `Biglietto Gratta e Vinci da € ${item.price}`}
                                {isGvSub && `Storno biglietto da € ${item.price}`}
                                {isWin && `Pagamento vincita (${item.tier})`}
                                {isClosing && `Chiusura serale terminale (${item.tier})`}
                              </span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="table-qty-badge">
                              {isGvAdd && `+${item.qty || 1}`}
                              {isGvSub && `–${item.qty || 1}`}
                              {(isWin || isClosing) && `1`}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <strong
                              className={`table-amount-val ${
                                isGvAdd ? 'text-green' : isGvSub ? 'text-danger' : 'text-amber'
                              }`}
                            >
                              {isGvAdd && '+ '}
                              {isGvSub && '– '}
                              € {item.amount.toFixed(2).replace('.', ',')}
                            </strong>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="table-delete-btn"
                              onClick={() => handleRemoveHistoryItem(item.id)}
                              title="Elimina questa transazione"
                              aria-label="Elimina transazione"
                            >
                              Elimina
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Navbar di Paginazione */}
            <div className="gv-pagination-navbar">
              <div className="pagination-info">
                Mostrando{' '}
                <strong>
                  {allFilteredModalTransactions.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{' '}
                  {Math.min(currentPage * pageSize, allFilteredModalTransactions.length)}
                </strong>{' '}
                di <strong>{allFilteredModalTransactions.length}</strong> transazioni
              </div>

              <div className="pagination-controls">
                <button
                  type="button"
                  className="page-nav-btn"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  title="Prima pagina"
                >
                  «
                </button>
                <button
                  type="button"
                  className="page-nav-btn"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  title="Pagina precedente"
                >
                  ‹ Prec
                </button>

                {/* Numeri di pagina */}
                <div className="page-numbers-group">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      className={`page-num-btn ${pageNum === currentPage ? 'active' : ''}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="page-nav-btn"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  title="Pagina successiva"
                >
                  Succ ›
                </button>
                <button
                  type="button"
                  className="page-nav-btn"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  title="Ultima pagina"
                >
                  »
                </button>
              </div>
            </div>

            {/* Footer modale */}
            <div className="gv-modal-footer">
              <button
                type="button"
                className="gv-btn-primary"
                onClick={() => setShowAllTransactionsModal(false)}
              >
                Chiudi Registro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Gestione Fasce di Prezzo */}
      {showPriceModal && (
        <div className="gv-modal-overlay" onClick={() => setShowPriceModal(false)}>
          <div className="gv-modal-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="gv-modal-header">
              <div>
                <h3 className="gv-modal-title">Gestione Fasce di Prezzo</h3>
                <p className="gv-modal-desc">
                  Personalizza i tagliandi disponibili aggiungendo o rimuovendo fasce di prezzo.
                </p>
              </div>
              <button
                type="button"
                className="gv-modal-close"
                onClick={() => setShowPriceModal(false)}
                aria-label="Chiudi"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Form per aggiungere una nuova fascia */}
            <form onSubmit={handleAddPriceTier} className="gv-add-tier-form">
              <label className="gv-form-label" htmlFor="new-price-input">
                Aggiungi nuova fascia (€)
              </label>
              <div className="gv-input-button-row">
                <input
                  id="new-price-input"
                  type="number"
                  step="0.5"
                  min="0.5"
                  placeholder="es. 3, 15, 50"
                  className="gv-modal-input"
                  value={newPriceInput}
                  onChange={(e) => {
                    setNewPriceInput(e.target.value)
                    if (priceError) setPriceError('')
                  }}
                  autoFocus
                />
                <button type="submit" className="gv-btn-primary">
                  + Aggiungi
                </button>
              </div>
              {priceError && <div className="gv-form-error">{priceError}</div>}
            </form>

            {/* Elenco fasce attive */}
            <div className="gv-active-tiers-section">
              <label className="gv-form-label">Fasce di prezzo attive</label>
              <div className="gv-tiers-chip-list">
                {priceTiers.map((price) => (
                  <div key={price} className="gv-tier-chip">
                    <span className="gv-tier-chip-text">€ {price}</span>
                    <button
                      type="button"
                      className="gv-tier-delete-btn"
                      onClick={() => handleRemovePriceTier(price)}
                      title={`Rimuovi fascia € ${price}`}
                      aria-label={`Rimuovi fascia € ${price}`}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="gv-modal-footer">
              <button
                type="button"
                className="gv-btn-secondary"
                onClick={() => setShowPriceModal(false)}
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Inserimento Vincite (Singola vs Totale fine giornata) */}
      {showWinModal && (
        <div className="gv-modal-overlay" onClick={() => setShowWinModal(false)}>
          <div className="gv-modal-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="gv-modal-header">
              <div>
                <h3 className="gv-modal-title">
                  {winModalMode === 'single' ? 'Registra Singola Vincita' : 'Chiusura Vincite Fine Giornata'}
                </h3>
                <p className="gv-modal-desc">
                  {winModalMode === 'single'
                    ? 'Inserisci il pagamento di un singolo biglietto vincente presentato in cassa.'
                    : 'Inserisci il totale complessivo delle vincite emesse risultante dalla chiusura terminale.'}
                </p>
              </div>
              <button
                type="button"
                className="gv-modal-close"
                onClick={() => setShowWinModal(false)}
                aria-label="Chiudi"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Tab selector per passare istantaneamente tra le due modalità */}
            <div className="gv-modal-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={winModalMode === 'single'}
                className={`gv-modal-tab ${winModalMode === 'single' ? 'active' : ''}`}
                onClick={() => {
                  setWinModalMode('single')
                  setWinError('')
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }} aria-hidden="true">
                  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
                </svg>
                Singola Vincita
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={winModalMode === 'daily_total'}
                className={`gv-modal-tab ${winModalMode === 'daily_total' ? 'active' : ''}`}
                onClick={() => {
                  setWinModalMode('daily_total')
                  setWinError('')
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }} aria-hidden="true">
                  <rect x="4" y="2" width="16" height="20" rx="2" />
                  <line x1="8" y1="6" x2="16" y2="6" />
                  <line x1="8" y1="10" x2="16" y2="10" />
                  <line x1="8" y1="14" x2="12" y2="14" />
                </svg>
                Totale Fine Giornata
              </button>
            </div>

            {/* MODALITÀ 1: SINGOLA VINCITA */}
            {winModalMode === 'single' && (
              <form onSubmit={handleAddSingleWinning} className="gv-modal-form">
                <div className="gv-form-group">
                  <label className="gv-form-label" htmlFor="win-amount-input">
                    Importo Vincita (€) *
                  </label>
                  <input
                    id="win-amount-input"
                    type="number"
                    step="0.01"
                    min="0.5"
                    placeholder="es. 20,00"
                    className="gv-modal-input"
                    value={winAmount}
                    onChange={(e) => {
                      setWinAmount(e.target.value)
                      if (winError) setWinError('')
                    }}
                    autoFocus
                    required
                  />
                </div>

                <div className="gv-form-group">
                  <label className="gv-form-label" htmlFor="win-tier-select">
                    Fascia Tagliando
                  </label>
                  <select
                    id="win-tier-select"
                    className="gv-modal-select"
                    value={winTier}
                    onChange={(e) => setWinTier(e.target.value)}
                  >
                    {priceTiers.map((p) => (
                      <option key={p} value={`€${p}`}>
                        Biglietto da € {p}
                      </option>
                    ))}
                    <option value="Generale">Generale / Altro</option>
                  </select>
                </div>

                <div className="gv-form-group">
                  <label className="gv-form-label" htmlFor="win-time-input">
                    Orario Registrazione (Opzionale)
                  </label>
                  <input
                    id="win-time-input"
                    type="text"
                    placeholder="es. 11:30 (vuoto = orario attuale)"
                    className="gv-modal-input"
                    value={winCustomTime}
                    onChange={(e) => setWinCustomTime(e.target.value)}
                  />
                </div>

                {winError && <div className="gv-form-error">{winError}</div>}

                <div className="gv-modal-footer">
                  <button
                    type="button"
                    className="gv-btn-secondary"
                    onClick={() => setShowWinModal(false)}
                  >
                    Annulla
                  </button>
                  <button type="submit" className="gv-btn-primary">
                    Conferma Singola Vincita
                  </button>
                </div>
              </form>
            )}

            {/* MODALITÀ 2: TOTALE FINE GIORNATA */}
            {winModalMode === 'daily_total' && (
              <form onSubmit={handleAddDailyTotalWinning} className="gv-modal-form">
                <div className="gv-form-group">
                  <label className="gv-form-label" htmlFor="daily-total-input">
                    Totale Vincite Terminale (€) *
                  </label>
                  <input
                    id="daily-total-input"
                    type="number"
                    step="0.01"
                    min="0.5"
                    placeholder="es. 345,00"
                    className="gv-modal-input"
                    value={dailyTotalAmount}
                    onChange={(e) => {
                      setDailyTotalAmount(e.target.value)
                      if (winError) setWinError('')
                    }}
                    autoFocus
                    required
                  />
                  <span className="gv-field-hint">
                    Inserisci l'importo totale delle vincite pagate riportato sullo scontrino di chiusura serale del terminale.
                  </span>
                </div>

                <div className="gv-form-group">
                  <label className="gv-form-label">Modalità di Salvataggio</label>
                  <div className="gv-radio-options">
                    <label className="gv-radio-label">
                      <input
                        type="radio"
                        name="dailyTotalMode"
                        value="replace"
                        checked={dailyTotalMode === 'replace'}
                        onChange={() => setDailyTotalMode('replace')}
                      />
                      <div>
                        <strong>Imposta come Totale Ufficiale Odierno</strong>
                        <p className="radio-sub">Riconcilia e sostituisce le singole registrazioni con la chiusura del terminale.</p>
                      </div>
                    </label>

                    <label className="gv-radio-label">
                      <input
                        type="radio"
                        name="dailyTotalMode"
                        value="append"
                        checked={dailyTotalMode === 'append'}
                        onChange={() => setDailyTotalMode('append')}
                      />
                      <div>
                        <strong>Aggiungi come Blocco Cumulativo</strong>
                        <p className="radio-sub">Conserva lo storico e somma questa voce al totale attuale.</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="gv-form-group">
                  <label className="gv-form-label" htmlFor="daily-total-note">
                    Riferimento / Dicitura
                  </label>
                  <input
                    id="daily-total-note"
                    type="text"
                    className="gv-modal-input"
                    value={dailyTotalNote}
                    onChange={(e) => setDailyTotalNote(e.target.value)}
                    placeholder="es. Chiusura serale terminale Lottomatica"
                  />
                </div>

                {winError && <div className="gv-form-error">{winError}</div>}

                <div className="gv-modal-footer">
                  <button
                    type="button"
                    className="gv-btn-secondary"
                    onClick={() => setShowWinModal(false)}
                  >
                    Annulla
                  </button>
                  <button type="submit" className="gv-btn-primary">
                    Salva Chiusura Giornaliera
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: Conferma Reset Vendite Giornata */}
      {showResetConfirmModal && (
        <div className="gv-modal-overlay" onClick={() => setShowResetConfirmModal(false)}>
          <div
            className="gv-modal-dialog"
            style={{ maxWidth: '460px', padding: '26px 28px' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="gv-modal-header" style={{ borderBottom: 'none', paddingBottom: '0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: '#FEF3C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    color: '#B45309',
                    flexShrink: 0,
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div>
                  <h3 className="gv-modal-title" style={{ fontSize: '18px', margin: 0, color: '#171717' }}>
                    Azzera Vendite di Oggi
                  </h3>
                  <p className="gv-modal-desc" style={{ marginTop: '2px', fontSize: '13px' }}>
                    Preparazione per la giornata successiva
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="gv-modal-close"
                onClick={() => setShowResetConfirmModal(false)}
                aria-label="Chiudi"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div style={{ padding: '20px 0 10px 0', fontSize: '14px', color: '#4B5563', lineHeight: '1.6' }}>
              Sei sicuro di voler <strong>azzerare tutti i contatori delle vendite odierne</strong> per iniziare il giorno seguente?
              <br /><br />
              I contatori dei biglietti venduti per ciascuna fascia di prezzo verranno riportati a <strong>0</strong> sia su questa schermata che nel database cloud.
            </div>

            <div className="gv-modal-footer" style={{ gap: '10px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #f0f4f1' }}>
              <button
                type="button"
                className="gv-btn-secondary"
                onClick={() => setShowResetConfirmModal(false)}
              >
                Annulla
              </button>
              <button
                type="button"
                className="gv-btn-primary"
                style={{ backgroundColor: '#DC2626', borderColor: '#B91C1C', color: '#ffffff' }}
                onClick={handleConfirmResetSales}
              >
                Conferma Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast galleggiante non invasivo per notifiche stecche - ZERO layout shift */}
      {(purchaseSuccess || purchaseError) && (
        <div
          className={`gv-floating-toast ${purchaseError ? 'is-error' : 'is-success'}`}
          role="status"
          aria-live="polite"
        >
          <div className="gv-toast-icon">
            {purchaseError ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          <span className="gv-toast-text">{purchaseError || purchaseSuccess}</span>
          <button
            type="button"
            className="gv-toast-close"
            onClick={() => {
              setPurchaseSuccess('')
              setPurchaseError('')
            }}
            aria-label="Chiudi notifica"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
