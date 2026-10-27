import { test, expect } from '@playwright/test'

const user = { nome: 'Francesco', cognome: 'Rossi', ragioneSociale: 'Tabaccheria Palasciano', email: 'rivendita@example.test' }
const dashboard = { soldGv: 0, winningsPaid: 0, purchased: 0, partialProfit: 0, chartPoints: [], recentOperations: [] }

// `state.down` simula il backend irraggiungibile: ogni chiamata fallisce a livello di rete
async function mockApi(page, state) {
  await page.addInitScript((profile) => {
    localStorage.setItem('gv_token', 'ui-test-session')
    localStorage.setItem('gv_user', JSON.stringify(profile))
  }, user)
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace('/api/v1', '')
    state.calls[path] = (state.calls[path] || 0) + 1
    if (state.down) return route.abort('internetdisconnected')
    let data
    if (path === '/health') data = { status: 'UP' }
    else if (path === '/tabacchini/me') data = user
    else if (path === '/dashboard/stats') data = dashboard
    else if (path === '/gv/price-tiers') data = [{ id: 1, price: 5 }]
    else if (path === '/gv/sales/today' || path === '/gv/winnings/today' || path === '/gv/transactions/today' || path === '/gv/purchases') data = []
    else if (path === '/gv/sales/transaction') data = { price: 5, quantity: 1 }
    else throw new Error(`Unexpected API request: ${route.request().method()} ${path}`)
    await route.fulfill({ json: data })
  })
}

const lock = (page) => page.getByRole('alertdialog', { name: 'Connessione persa' })

test('browser going offline locks the app and unlocks with fresh data when back', async ({ page, context }) => {
  const state = { down: false, calls: {} }
  await mockApi(page, state)
  await page.goto('/')
  await expect(page.locator('.header-status-text')).toHaveText('Online')
  await expect(lock(page)).toBeHidden()

  state.down = true
  await context.setOffline(true)
  await expect(lock(page)).toBeVisible()
  await expect(page.locator('.app-shell')).toHaveAttribute('inert', '')
  await expect(lock(page).getByRole('button', { name: 'Riprova ora' })).toBeFocused()
  // Offline la sessione non viene persa
  expect(await page.evaluate(() => localStorage.getItem('gv_token'))).toBe('ui-test-session')

  const dashboardCallsBefore = state.calls['/dashboard/stats']
  state.down = false
  await context.setOffline(false)
  await expect(lock(page)).toBeHidden()
  await expect(page.locator('.app-shell')).not.toHaveAttribute('inert', '')
  // La vista attiva viene rimontata e ricarica i dati dal backend
  await expect.poll(() => state.calls['/dashboard/stats']).toBeGreaterThan(dashboardCallsBefore)
})

test('a failed request while the backend is down locks the app immediately', async ({ page }) => {
  const state = { down: false, calls: {} }
  await mockApi(page, state)
  await page.goto('/')
  if (page.viewportSize().width <= 900) await page.getByRole('button', { name: 'Menu di navigazione' }).click()
  await page.getByRole('navigation').getByRole('button', { name: 'Gratta e Vinci', exact: true }).click()
  await expect(page.locator('.gv-price-card').first()).toBeVisible()

  // Il backend cade senza che il browser se ne accorga (Wi-Fi collegato, server irraggiungibile)
  state.down = true
  await page.locator('.gv-ctrl-plus-1').first().click()
  await expect(lock(page)).toBeVisible({ timeout: 5000 })

  // "Riprova ora" con il backend ancora giù lascia il blocco
  await lock(page).getByRole('button', { name: 'Riprova ora' }).click()
  await expect(lock(page)).toBeVisible()

  state.down = false
  await lock(page).getByRole('button', { name: 'Riprova ora' }).click()
  await expect(lock(page)).toBeHidden()
})

test('a session opened while offline is kept and shows the lock', async ({ page }) => {
  const state = { down: true, calls: {} }
  await mockApi(page, state)
  await page.goto('/')
  await expect(lock(page)).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('gv_token'))).toBe('ui-test-session')

  state.down = false
  await lock(page).getByRole('button', { name: 'Riprova ora' }).click()
  await expect(lock(page)).toBeHidden()
  await expect(page.locator('.header-status-text')).toHaveText('Online')
})
