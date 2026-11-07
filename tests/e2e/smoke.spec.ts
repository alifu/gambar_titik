import { expect, test } from '@playwright/test'

test('halaman masuk terbuka', async ({ page }) => {
  await page.goto('/login')

  await expect(page.getByRole('heading', { name: 'Masuk' })).toBeVisible()
})
