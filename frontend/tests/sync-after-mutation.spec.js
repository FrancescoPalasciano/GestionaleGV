import { test, expect } from '@playwright/test'

const user = { nome: 'Francesco', cognome: 'Rossi', ragioneSociale: 'Tabaccheria Palasciano', email: 'rivendita@example.test' }

test('a sale reloads today data from the database right after saving, not at the next poll', async ({ page }) => {
  const calls = {}
  await page.addInitScript((profile) => {
    localStorage.setItem('gv_token', 'ui-test-session')
    localStorage.setItem('gv_user', JSON.stringify(profile))
  }, user)
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace('/api/v1', '')
    calls[path] = (calls[path] || 0) + 1
    let data
    if (path === '/health') data = { status: 'UP' }
    else if (path === '/tabacchini/me') data = user
    else if (path === '/dashboard/stats') data = { soldGv: 0, winningsPaid: 0, purchased: 0, partialProfit: 0, chartPoints: [], recentOperations: [] }
    else if (path === '/gv/price-tiers') data = [{ id: 1, price: 5 }]
    else if (path === '/gv/sales/today' || path === '/gv/winnings/today' || path === '/gv/transactions/today' || path === '/gv/purchases') data = []
    else if (path === '/gv/sales/transaction') data = { price: 5, quantity: 1 }
    else throw new Error(`Unexpected API request: ${route.request().method()} ${path}`)
    await route.fulfill({ json: data })
  })

  await page.goto('/')
  if (page.viewportSize().width <= 900) await page.getByRole('button', { name: 'Menu di navigazione' }).click()
  await page.getByRole('navigation').getByRole('button', { name: 'Gratta e Vinci', exact: true }).click()
  await expect(page.locator('.gv-price-card').first()).toBeVisible()
  await expect.poll(() => calls['/gv/transactions/today']).toBeGreaterThan(0)
  const before = calls['/gv/transactions/today']

  await page.locator('.gv-ctrl-plus-1').first().click()
  await expect.poll(() => calls['/gv/sales/transaction']).toBe(1)
  // Il polling è ogni 15 s: una ricarica entro 3 s può venire solo dal refetch dopo il salvataggio
  await expect.poll(() => calls['/gv/transactions/today'], { timeout: 3000 }).toBeGreaterThan(before)
})
