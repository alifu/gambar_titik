import { expect, test } from '@playwright/test'
import { galleryCards, login } from './helpers.ts'
import {
  clickCell,
  fillRegion,
  legendButton,
  loadArtworksFromDisk,
  openFromCard,
  regionsOf,
  simplestArtwork,
} from './numberHelpers.ts'

const artworks = loadArtworksFromDisk()
const artwork = simplestArtwork(artworks)
const regions = regionsOf(artwork)

function percentText(page: import('@playwright/test').Page) {
  return page.getByText(/^\d+% diwarnai$/)
}

test('mode nomor: kotak salah ditolak, kotak benar terisi, selesaikan gambar', async ({ page }) => {
  test.setTimeout(120_000)
  await login(page, 'Nomor Satu')
  await openFromCard(page, artwork.title, 'Sesuai nomor')
  await expect(page.getByRole('button', { name: 'Sesuai nomor', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  const first = regions[0]
  const wrong = regions.find((r) => r.code !== first.code)
  if (!wrong) throw new Error('Gambar uji butuh minimal dua kode')
  const remainingBefore = await legendButton(page, first.code).getAttribute('aria-label')

  await legendButton(page, first.code).click()
  await clickCell(page, artwork, wrong.start)
  await expect(legendButton(page, first.code)).toHaveAttribute('aria-label', remainingBefore ?? '')
  await expect(percentText(page)).toHaveText('0% diwarnai')

  await clickCell(page, artwork, first.start)
  await expect(legendButton(page, first.code)).not.toHaveAttribute(
    'aria-label',
    remainingBefore ?? '',
  )

  await page.getByRole('button', { name: /Isi area/ }).click()
  for (const region of regions) await fillRegion(page, artwork, region)

  await expect(page.getByText('Selesai! 🎉')).toBeVisible()
  await expect(percentText(page)).toHaveText('100% diwarnai')
  await page.getByRole('dialog').getByRole('link', { name: 'Kembali ke galeri' }).click()
  await expect(galleryCards(page).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /Selesai ✓$/ }).first()).toBeVisible()
})

test('progres tiap mode terpisah setelah muat ulang', async ({ page }) => {
  await login(page, 'Dua Mode')
  await openFromCard(page, artwork.title, 'Sesuai nomor')
  await page.getByRole('button', { name: /Isi area/ }).click()
  await fillRegion(page, artwork, regions[0])
  const numberPercent = (await percentText(page).innerText()).trim()
  expect(numberPercent).not.toBe('0% diwarnai')
  await expect(page.getByText('Tersimpan')).toBeVisible()

  await page.getByRole('button', { name: 'Bebas', exact: true }).click()
  await expect(percentText(page)).toHaveText('0% diwarnai')
  await page.getByRole('button', { name: /Ember/ }).click()
  const spots = [0.3, 0.5, 0.7]
  const canvas = page.getByRole('img', { name: /Kanvas mewarnai/ })
  const box = await canvas.boundingBox()
  if (!box) throw new Error('Kanvas tidak punya ukuran')
  for (const fx of spots) {
    for (const fy of spots) await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy)
  }
  await expect(page.getByText(/^[1-9]\d*% diwarnai$/)).toBeVisible()
  const freePercent = (await percentText(page).innerText()).trim()
  await expect(page.getByText('Tersimpan')).toBeVisible()

  await page.goto(`/warnai/${artwork.id}?mode=nomor`)
  await expect(percentText(page)).toHaveText(numberPercent)
  await page.goto(`/warnai/${artwork.id}?mode=bebas`)
  await expect(percentText(page)).toHaveText(freePercent)
})
