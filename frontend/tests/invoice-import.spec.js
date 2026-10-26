import { test, expect } from '@playwright/test'

const user = { nome: 'Francesco', cognome: 'Rossi', ragioneSociale: 'Tabaccheria Palasciano', email: 'rivendita@example.test' }
const today = new Date()
const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

// Righe come le restituisce il backend dal PDF "Dettaglio Ordine" Lottomatica
const lines = [
  { price: 0.5, game: 'Fortuna in Tasca', packs: 1, tickets: 200, amount: 100 },
  { price: 1, game: 'Buondi', packs: 1, tickets: 150, amount: 150 },
  { price: 5, game: 'New Tutto per Tutto', packs: 1, tickets: 60, amount: 300 },
  { price: 5, game: '20X NEW', packs: 1, tickets: 60, amount: 300 },
  { price: 20, game: '100X NEW', packs: 2, tickets: 30, amount: 600 },
]
const preview = {
  orderNumber: '20221513', orderDate: '2026-10-23', lines,
  totalPacks: 6, totalTickets: 500, totalAmount: 1450, alreadyImported: false, warnings: [],
}

async function mockApi(page, state) {
  await page.addInitScript((profile) => {
    localStorage.setItem('gv_token', 'ui-test-session')
    localStorage.setItem('gv_user', JSON.stringify(profile))
  }, user)
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace('/api/v1', '')
    let data
    if (path === '/health') data = { status: 'UP' }
    else if (path === '/tabacchini/me') data = user
    else if (path === '/dashboard/stats') data = { soldGv: 0, winningsPaid: 0, purchased: 0, partialProfit: 0, chartPoints: [], recentOperations: [] }
    else if (path === '/gv/price-tiers') data = state.tiers.map((price, id) => ({ id, price }))
    else if (path === '/gv/sales/today' || path === '/gv/winnings/today' || path === '/gv/transactions/today') data = []
    else if (path === '/gv/purchases') data = state.purchases
    else if (path === '/gv/purchases/invoice/preview') {
      state.previewContentType = request.headers()['content-type']
      data = preview
    } else if (path === '/gv/purchases/invoice/import') {
      state.importBody = request.postDataJSON()
      state.tiers = [...new Set([...state.tiers, ...lines.map((l) => l.price)])].sort((a, b) => a - b)
      state.purchases = lines.map((l, id) => ({
        id: id + 10, price: l.price, amount: l.amount, packsCount: l.packs, tickets: l.tickets,
        purchaseDate: state.importBody.purchaseDate, supplier: 'Lottomatica / Lotterie Nazionali',
        description: `${l.game} · ${l.packs} stecca da € ${l.price.toFixed(2).replace('.', ',')} (${l.tickets} pz) · Ordine Lottomatica n. 20221513`,
      }))
      await route.fulfill({ status: 201, json: state.purchases })
      return
    } else throw new Error(`Unexpected API request: ${request.method()} ${path}`)
    await route.fulfill({ json: data })
  })
}

async function openPurchases(page) {
  await page.goto('/')
  if (page.viewportSize().width <= 900) await page.getByRole('button', { name: 'Menu di navigazione' }).click()
  await page.getByRole('navigation').getByRole('button', { name: 'Gratta e Vinci', exact: true }).click()
  await page.getByRole('tab', { name: 'Acquistati' }).click()
}

for (const [width, height] of [[375, 812], [1280, 800]]) {
  test(`Lottomatica invoice loads stecche at ${width}px`, async ({ page }, testInfo) => {
    const state = { tiers: [1, 2, 5, 10, 20], purchases: [] }
    await page.setViewportSize({ width, height })
    await mockApi(page, state)
    await openPurchases(page)

    await page.locator('#input-fattura-lottomatica').setInputFiles({
      name: 'Dettaglio_Ordine_20221513.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test'),
    })

    const dialog = page.getByRole('dialog', { name: 'Ordine Lottomatica n. 20221513' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('cell', { name: 'Fortuna in Tasca' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Carica 6 stecche' })).toBeEnabled()
    expect(state.previewContentType).toContain('multipart/form-data')
    await page.screenshot({ path: testInfo.outputPath(`invoice-preview-${width}.png`), fullPage: false })

    await dialog.getByRole('button', { name: 'Carica 6 stecche' }).click()
    await expect(dialog).toBeHidden()

    expect(state.importBody).toEqual({ orderNumber: '20221513', purchaseDate: todayIso, lines })
    // Le fasce mancanti (€ 0,50) compaiono e i totali usano biglietti/importi reali della fattura
    await expect(page.locator('.gv-stecche-card', { hasText: '0,50' })).toContainText('200 pz · € 100,00')
    await expect(page.locator('.gv-stecche-card', { hasText: '€ 20,00' })).toContainText('30 pz · € 600,00')
    await expect(page.locator('.gv-stecche-footer-summary')).toContainText('6 st')
    await expect(page.locator('.gv-stecche-footer-summary')).toContainText('500 pz')
    await expect(page.locator('.gv-stecche-footer-summary')).toContainText('€ 1450,00')
    await page.screenshot({ path: testInfo.outputPath(`invoice-imported-${width}.png`), fullPage: true })
  })
}

test('already imported invoice cannot be loaded twice', async ({ page }) => {
  const state = { tiers: [1, 5, 20], purchases: [] }
  await mockApi(page, state)
  await page.route('**/api/v1/gv/purchases/invoice/preview', (route) => route.fulfill({ json: { ...preview, alreadyImported: true } }))
  await openPurchases(page)

  await page.locator('#input-fattura-lottomatica').setInputFiles({
    name: 'Dettaglio_Ordine_20221513.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test'),
  })

  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('alert')).toContainText('già stato caricato')
  await expect(dialog.getByRole('button', { name: 'Carica 6 stecche' })).toBeDisabled()
})
