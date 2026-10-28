import { test, expect } from '@playwright/test'

const user = { nome: 'Francesco', cognome: 'Rossi', ragioneSociale: 'Tabaccheria Palasciano', email: 'rivendita@example.test' }

function statistics(period, sold, loaded) {
  return {
    period, totalRevenue: 645, totalAggio: 51.6, totalWinnings: 120, winningsCount: 4, netCashFlow: 525,
    totalTickets: sold, totalPurchases: 1500, totalStecche: 5, totalSteccheTickets: loaded,
    averageTicketPrice: 5, payoutRate: 18.6, chartPoints: [], tierStats: [], purchaseTierStats: [],
  }
}

async function openStatistics(page, numbers) {
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
    else if (path === '/dashboard/stats') data = { soldGv: 0, winningsPaid: 0, purchased: 0, partialProfit: 0, chartPoints: [], recentOperations: [] }
    else if (path === '/gv/statistics') {
      const period = url.searchParams.get('period')
      data = statistics(period, ...(numbers[period] || [10, 0]))
    } else throw new Error(`Unexpected API request: ${route.request().method()} ${path}`)
    await route.fulfill({ json: data })
  })
  await page.goto('/')
  if (page.viewportSize().width <= 900) await page.getByRole('button', { name: 'Menu di navigazione' }).click()
  await page.getByRole('navigation').getByRole('button', { name: 'Statistiche', exact: true }).click()
}

const stockCard = (page) => page.getByTestId('kpi-stock-diff')

test('week and month show loaded minus sold tickets instead of the average ticket', async ({ page }) => {
  await openStatistics(page, { week: [129, 300], month: [900, 600] })

  // Giorno: resta lo scontrino medio
  await expect(page.getByText('Scontrino Medio G&V')).toBeVisible()
  await expect(stockCard(page)).toHaveCount(0)

  await page.getByRole('tab', { name: 'Settimana' }).click()
  await expect(stockCard(page)).toContainText('Differenza Caricati / Venduti')
  await expect(stockCard(page)).toContainText('+171 pz')
  await expect(stockCard(page)).toContainText('Caricati 300 · Venduti 129')
  await expect(page.getByText('Scontrino Medio G&V')).toHaveCount(0)

  // Venduti più di quanti caricati nel periodo: differenza negativa
  await page.getByRole('tab', { name: 'Mese' }).click()
  await expect(stockCard(page)).toContainText('−300 pz')
  await expect(stockCard(page)).toContainText('Caricati 600 · Venduti 900')

  await page.getByRole('tab', { name: 'Anno' }).click()
  await expect(page.getByText('Scontrino Medio G&V')).toBeVisible()
  await expect(stockCard(page)).toHaveCount(0)
})
