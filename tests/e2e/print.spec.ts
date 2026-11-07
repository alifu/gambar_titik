import { expect, test } from '@playwright/test'
import { login } from './helpers.ts'

function pageCount(pdf: Buffer): number {
  return pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)?.length ?? 0
}

test('lembar cetak: 1 halaman tanpa kunci, 2 halaman dengan kunci jawaban', async ({ page }) => {
  await login(page, 'Pencetak')
  await page
    .getByRole('link', { name: /^Cetak lembar / })
    .first()
    .click()
  await expect(page).toHaveURL(/\/cetak\//)
  await expect(page.getByRole('button', { name: 'Cetak / Simpan PDF' })).toBeVisible()

  const options = { format: 'A4' as const, printBackground: true }
  expect(pageCount(await page.pdf(options))).toBe(1)

  await page.getByLabel('Sertakan kunci jawaban').check()
  await expect(page.getByText('Kunci jawaban', { exact: true })).toBeVisible()
  expect(pageCount(await page.pdf(options))).toBe(2)
})
