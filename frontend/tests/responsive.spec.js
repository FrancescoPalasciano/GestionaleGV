import { test, expect } from '@playwright/test'

const user = { nome: 'Francesco', cognome: 'Rossi', ragioneSociale: 'Tabaccheria Palasciano', email: 'rivendita@example.test', codiceRivendita: '12345', indirizzo: 'Via Roma 42, Roma', partitaIva: '12345678901', codiceFiscale: 'RSSFNC80A01H501Z' }
const prices = [1, 2, 3, 5, 10, 20]
const values = [450, 610, 380, 720, 580, 850, 680]
const dashboard = {
  soldGv: 129, soldGvTrend: '+12% rispetto a ieri', soldGvTrendDirection: 'up',
  winningsPaid: 240, winningsCount: 8, winningsTrend: '8 operazioni',
  purchased: 1500, purchasedSub: 'Fornitura settimanale', partialProfit: 103.2,
  partialProfitTrend: '+8% rispetto a ieri', partialProfitTrendDirection: 'up',
  chartPoints: values.map((revenue, i) => ({ revenue, profit: revenue * .08, tickets: 65 + i, dayLabel: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'][i], dayFullName: ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'][i], formattedDate: `${14 + i} set`, isToday: i === 3 })),
  recentOperations: Array.from({ length: 7 }, (_, i) => ({ id: i, type: i % 3 === 0 ? 'win' : 'gv_add', time: `1${6 - i}:30`, text: i % 3 === 0 ? 'Vincita · Biglietto da € 10' : '+2 biglietti da € 5 (€ 10,00)' })),
}

function statistics(period) {
  const count = period === 'week' ? 7 : period === 'month' ? 31 : period === 'year' ? 12 : 9
  return {
    totalRevenue: 1290, totalAggio: 103.2, totalWinnings: 240, winningsCount: 8,
    netCashFlow: 1050, totalTickets: 129, totalPurchases: 1500, totalStecche: 5,
    totalSteccheTickets: 300, averageTicketPrice: 10, payoutRate: 18.6,
    singleWinningsAmount: 180, singleWinningsCount: 7, closingWinningsAmount: 60, closingWinningsCount: 1,
    chartPoints: Array.from({ length: count }, (_, i) => ({ label: period === 'day' ? `${8 + i}:00` : period === 'month' ? `${i + 1}/09` : `${i + 1}`, fullLabel: `Periodo ${i + 1}`, revenue: values[i % 7], aggio: values[i % 7] * .08, winnings: i % 3 * 70, tickets: 24 })),
    tierStats: prices.map((price, i) => ({ price, ticketsSold: 20 + i, revenue: price * (20 + i), aggio: price * (20 + i) * .08, percentageShare: 16.6 })),
    purchaseTierStats: [],
  }
}

async function mockApi(page) {
  await page.addInitScript((profile) => {
    localStorage.setItem('gv_token', 'ui-test-session')
    localStorage.setItem('gv_user', JSON.stringify(profile))
  }, user)
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname.replace('/api/v1', '')
    let data
    if (path === '/health') data = { status: 'UP' }
    else if (path === '/tabacchini/me') data = user
    else if (path === '/dashboard/stats') data = dashboard
    else if (path === '/gv/statistics') data = statistics(url.searchParams.get('period'))
    else if (path === '/gv/price-tiers') data = prices.map((price, id) => ({ id, price }))
    else if (path === '/gv/sales/today') data = prices.map((price, id) => ({ price, quantity: 20 + id }))
    else if (path === '/gv/winnings/today') data = [{ id: 1, amount: 50, timeRecorded: '10:20', type: 'single', tier: '€ 5' }]
    else if (path === '/gv/transactions/today') data = Array.from({ length: 12 }, (_, id) => ({ id, type: id % 3 === 0 ? 'win' : 'gv_add', timeRecorded: `12:${String(id + 10).padStart(2, '0')}`, price: 5, quantity: 2, amount: 10, label: 'Vendita di due biglietti da 5 euro', tier: '€ 5' }))
    else if (path === '/gv/purchases') data = [{ id: 1, price: 5, amount: 600, quantity: 2, packsCount: 2, purchaseDate: new Date().toISOString().slice(0, 10), description: 'Fornitura da € 5,00', supplier: 'Logista Italia S.p.A.' }]
    else throw new Error(`Unexpected API request: ${route.request().method()} ${path}`)
    await route.fulfill({ json: data })
  })
}

async function navigate(page, label) {
  if (page.viewportSize().width <= 900) await page.getByRole('button', { name: 'Menu di navigazione' }).click()
  await page.getByRole('navigation').getByRole('button', { name: label, exact: true }).click()
}

async function expectNoPageOverflow(page) {
  const sizes = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, page: document.documentElement.scrollWidth }))
  expect(sizes.page, 'The document should not scroll horizontally').toBeLessThanOrEqual(sizes.viewport + 1)
}

async function expectCardsContainControls(page) {
  const errors = await page.locator('.gv-price-card').evaluateAll((cards) => cards.flatMap((card) => {
    const bounds = card.getBoundingClientRect()
    return [...card.querySelectorAll('button, .gv-count-badge')].filter((control) => {
      const box = control.getBoundingClientRect()
      return box.left < bounds.left || box.right > bounds.right
    }).map((control) => control.textContent)
  }))
  expect(errors).toEqual([])
}

for (const [width, height] of [[320, 740], [375, 812], [390, 844], [640, 900], [768, 1024], [844, 390], [900, 900], [1024, 768], [1280, 800], [1440, 900], [1920, 1080]]) {
  test(`all views fit ${width}x${height}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await mockApi(page)
    await page.goto('/')
    await expect(page.locator('.chart-hit-target')).toHaveCount(7)
    await expectNoPageOverflow(page)
    const svg = await page.locator('.revenue-chart svg').evaluate((el) => ({ width: el.getBoundingClientRect().width, viewBox: el.viewBox.baseVal.width, height: el.getBoundingClientRect().height }))
    expect(svg.width).toBeCloseTo(svg.viewBox, 0)
    expect(svg.height).toBeGreaterThanOrEqual(260)
    if ([390, 1440].includes(width)) await page.screenshot({ path: testInfo.outputPath('dashboard.png'), fullPage: true })

    await navigate(page, 'Gratta e Vinci')
    await expect(page.locator('.gv-price-card')).toHaveCount(6)
    await expectNoPageOverflow(page)
    await expectCardsContainControls(page)
    if ([390, 1440].includes(width)) await page.screenshot({ path: testInfo.outputPath('banco.png'), fullPage: true })

    await page.getByRole('tab', { name: 'Acquistati', exact: true }).click()
    await expectCardsContainControls(page)
    await expectNoPageOverflow(page)
    await expect(page.locator('.gv-purchase-card-item')).toHaveCount(1)
    await page.getByRole('button', { name: /^Elimina fornitura/ }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Annulla', exact: true }).click()
    await page.getByRole('tab', { name: 'Vendite di oggi', exact: true }).click()

    // Sidebar fills the viewport even at the bottom of a long page.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    if (width > 900) {
      const sidebar = await page.locator('.app-sidebar').boundingBox()
      expect(sidebar.y).toBe(0)
      expect(sidebar.height).toBe(height)
    } else {
      const originalScroll = await page.evaluate(() => window.scrollY)
      await page.getByRole('button', { name: 'Menu di navigazione' }).click()
      await expect(page.getByRole('button', { name: 'Chiudi menu' })).toBeVisible()
      await page.keyboard.press('Escape')
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(originalScroll)
    }

    await navigate(page, 'Statistiche')
    await expect(page.locator('.chart-hit-target')).toHaveCount(9)
    await expectNoPageOverflow(page)
    await page.getByRole('tab', { name: 'Settimana', exact: true }).click()
    await expect(page.locator('.chart-hit-target')).toHaveCount(7)
    await expectNoPageOverflow(page)
    await page.getByRole('tab', { name: 'Mese', exact: true }).click()
    await expect(page.locator('.chart-hit-target')).toHaveCount(31)
    await expectNoPageOverflow(page)
    await page.locator('.chart-hit-target[tabindex="0"]').focus()
    await page.keyboard.press('End')
    await expect(page.locator('.chart-selected-date')).toContainText('Periodo 31')
    await page.getByRole('tab', { name: 'Anno', exact: true }).click()
    await expect(page.locator('.chart-hit-target')).toHaveCount(12)
    await expectNoPageOverflow(page)
    if ([390, 1440].includes(width)) await page.screenshot({ path: testInfo.outputPath('statistiche.png'), fullPage: true })

    await navigate(page, 'Profilo attività')
    await expect(page.locator('.settings-info-grid')).toBeVisible()
    await expectNoPageOverflow(page)
    expect(errors).toEqual([])
  })
}

for (const width of [320, 1440]) {
  test(`weekly statistics navigation at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await mockApi(page)
    await page.goto('/')
    await navigate(page, 'Statistiche')
    await page.getByLabel('Seleziona data personalizzata').fill('2027-01-01')
    const week = page.getByRole('tab', { name: 'Settimana', exact: true })
    const response = page.waitForResponse((res) => {
      const url = new URL(res.url())
      return url.pathname.endsWith('/gv/statistics') && url.searchParams.get('period') === 'week'
        && url.searchParams.get('date') === '2027-01-01'
    })
    await week.click()
    await response
    await expect(week).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('.chart-hit-target')).toHaveCount(7)
    await expect(page.locator('.stats-date-text.desktop-label')).toHaveText('28 dicembre 2026 – 3 gennaio 2027')
    await expect(page.locator('.stats-date-text.mobile-label')).toHaveText('28/12 – 03/01')
    await expectNoPageOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('settimana.png'), fullPage: true })
    await page.getByRole('button', { name: 'Periodo precedente', exact: true }).click()
    await expect(page.getByLabel('Seleziona data personalizzata')).toHaveValue('2026-12-25')
    await expect(page.locator('.stats-date-text.desktop-label')).toHaveText('21 dicembre 2026 – 27 dicembre 2026')
    await page.getByRole('button', { name: 'Periodo successivo', exact: true }).click()
    await expect(page.getByLabel('Seleziona data personalizzata')).toHaveValue('2027-01-01')
    await page.getByRole('button', { name: 'Oggi', exact: true }).click()
    const today = await page.evaluate(() => {
      const d = new Date()
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    })
    await expect(page.getByLabel('Seleziona data personalizzata')).toHaveValue(today)
    await expect(week).toHaveAttribute('aria-selected', 'true')
  })
}

for (const [width, height] of [[320, 740], [390, 844], [844, 390], [1440, 900]]) {
  test(`dialogs remain reachable at ${width}x${height}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height })
    await mockApi(page)
    await page.goto('/')
    await page.getByRole('button', { name: 'Apri il banco' }).click()
    await expect(page.locator('.gv-price-card')).toHaveCount(6)
    for (const selector of ['.gv-header-actions .gv-btn-primary', '.gv-btn-win-single', '.gv-btn-win-closing', '.gv-btn-view-all', '.gv-btn-reset-day']) {
      await page.locator(selector).click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      const bounds = await dialog.boundingBox()
      expect(bounds.x).toBeGreaterThanOrEqual(0)
      expect(bounds.y).toBeGreaterThanOrEqual(0)
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1)
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(height + 1)
      await expectNoPageOverflow(page)
      if (width === 390 && selector === '.gv-btn-win-single') await page.screenshot({ path: testInfo.outputPath('vincita-mobile.png') })
      const footerButton = dialog.locator('.gv-modal-footer button').last()
      await footerButton.scrollIntoViewIfNeeded()
      await expect(footerButton).toBeInViewport()
      await page.keyboard.press('Escape')
      await expect(dialog).toHaveCount(0)
      expect(await page.evaluate(() => document.body.style.position)).not.toBe('fixed')
    }
  })
}

test('desktop collapse survives switching to mobile and back', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await mockApi(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Nascondi barra laterale' }).click()
  await expect(page.locator('.app-sidebar')).toBeHidden()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Menu di navigazione' }).click()
  await expect(page.locator('.app-sidebar')).toBeVisible()
  await page.setViewportSize({ width: 1440, height: 900 })
  await expect(page.locator('.app-sidebar')).toBeHidden()
  await page.getByRole('button', { name: 'Menu di navigazione' }).click()
  await expect(page.locator('.app-sidebar')).toBeVisible()
  await expectNoPageOverflow(page)
})

test('touch interaction, focus containment, and a short mobile viewport', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
  const page = await context.newPage()
  await mockApi(page)
  await page.goto('http://127.0.0.1:4174')
  await page.locator('.chart-hit-target').nth(5).tap()
  await expect(page.locator('.chart-selected-date')).toContainText('Sabato')
  await page.getByRole('button', { name: 'Menu di navigazione' }).tap()
  await page.keyboard.press('Shift+Tab')
  expect(await page.locator('.app-sidebar').evaluate((el) => el.contains(document.activeElement))).toBe(true)
  await page.getByRole('navigation').getByRole('button', { name: 'Gratta e Vinci', exact: true }).tap()
  await expect(page.getByRole('button', { name: 'Menu di navigazione' })).toHaveAttribute('aria-expanded', 'false')
  await page.locator('.gv-btn-win-single').tap()
  await page.setViewportSize({ width: 390, height: 420 })
  const save = page.getByRole('dialog').locator('button[type="submit"]')
  await save.scrollIntoViewIfNeeded()
  await expect(save).toBeInViewport()
  await page.getByRole('dialog').locator('.gv-modal-close').tap()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expectNoPageOverflow(page)
  await context.close()
})

test('empty data, long labels, large amounts and service errors fit on a small phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await mockApi(page)
  await page.route('**/api/v1/dashboard/stats*', (route) => route.fulfill({ json: { ...dashboard, soldGv: 123456, winningsPaid: 12345678.9, partialProfit: 123456.78, chartPoints: [], recentOperations: [], purchasedSub: 'Fornitura con descrizione particolarmente lunga da consultare integralmente' } }))
  await page.goto('/')
  await expect(page.getByText('Nessun movimento registrato nel periodo selezionato.')).toBeVisible()
  await expectNoPageOverflow(page)
  const cards = await page.locator('.dash-metric-card').evaluateAll((elements) => elements.map((element) => element.scrollWidth <= element.clientWidth + 1))
  expect(cards.every(Boolean)).toBe(true)
  await page.route('**/api/v1/gv/statistics*', (route) => route.fulfill({ status: 503, json: { message: 'Servizio temporaneamente non disponibile. Riprova tra qualche istante.' } }))
  await navigate(page, 'Statistiche')
  await expect(page.getByRole('alert')).toContainText('Servizio temporaneamente non disponibile')
  await expect(page.getByRole('button', { name: 'Riprova', exact: true })).toBeVisible()
  await expectNoPageOverflow(page)
})

test('login and registration fit a small phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.route('**/api/v1/health', (route) => route.fulfill({ json: { status: 'UP' } }))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Accedi al gestionale' })).toBeVisible()
  await expectNoPageOverflow(page)
  await page.locator('.auth-footer button').click()
  await expect(page.getByRole('heading', { name: 'Crea il tuo account' })).toBeVisible()
  const submit = page.getByRole('button', { name: 'Registra la tua Tabaccheria', exact: true })
  await submit.scrollIntoViewIfNeeded()
  await expect(submit).toBeInViewport()
  await expectNoPageOverflow(page)
})
