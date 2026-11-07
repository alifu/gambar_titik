import { expect, test, type Page } from '@playwright/test'
import {
  GALLERY_SIZE,
  galleryCards,
  login,
  paintSomeRegions,
  percentBadges,
  wipeStorage,
} from './helpers.ts'

async function openFirstArtwork(page: Page) {
  await galleryCards(page).first().getByRole('link').first().click()
  await expect(page.getByRole('button', { name: /Ember/ })).toBeVisible()
}

test('login, warnai, kembali ke galeri: badge persen muncul', async ({ page }) => {
  await login(page, 'Budi Santoso')
  await expect(galleryCards(page)).toHaveCount(GALLERY_SIZE)
  await expect(percentBadges(page)).toHaveCount(0)

  await openFirstArtwork(page)
  await paintSomeRegions(page)
  await page.getByRole('link', { name: 'Kembali ke galeri' }).click()

  await expect(percentBadges(page).first()).toBeVisible()
})

test('login ulang dengan nama beda huruf/spasi memulihkan progres', async ({ page }) => {
  await login(page, 'Budi Santoso')
  await openFirstArtwork(page)
  await paintSomeRegions(page)

  await page.getByRole('navigation').getByRole('button', { name: 'Keluar' }).click()
  await expect(page.getByRole('heading', { name: 'Masuk' })).toBeVisible()
  await page.reload()
  await login(page, '  budi   SANTOSO ')

  await expect(percentBadges(page).first()).toBeVisible()
})

test('ekspor cadangan, hapus data, impor: progres kembali', async ({ page }, testInfo) => {
  await login(page, 'Ani')
  await openFirstArtwork(page)
  await paintSomeRegions(page)

  await page.getByRole('link', { name: 'Profil' }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Unduh cadangan' }).click()
  const backupPath = testInfo.outputPath('cadangan.json')
  await (await downloadPromise).saveAs(backupPath)

  await wipeStorage(page)
  await page.reload()
  await login(page, 'Ani')
  await expect(percentBadges(page)).toHaveCount(0)

  await page.getByRole('link', { name: 'Profil' }).click()
  const fileInput = page.getByLabel('Pulihkan cadangan')
  await expect(fileInput).toBeEnabled()
  await fileInput.setInputFiles(backupPath)
  await page.getByRole('button', { name: 'Gabungkan' }).click()
  await expect(page.getByText('Berhasil memulihkan 1 gambar.')).toBeVisible()

  await page.getByRole('link', { name: 'Galeri' }).click()
  await expect(percentBadges(page).first()).toBeVisible()
})

test('filter kategori dan pencarian di galeri', async ({ page }) => {
  await login(page, 'Citra')
  await expect(galleryCards(page)).toHaveCount(GALLERY_SIZE)

  await page.getByRole('button', { name: 'Hewan', exact: true }).click()
  await expect(galleryCards(page)).toHaveCount(33)
  await expect(page).toHaveURL(/kategori=hewan/)

  await page.getByRole('button', { name: 'Makanan', exact: true }).click()
  await expect(page).toHaveURL(/kategori=makanan/)
  await expect(galleryCards(page)).toHaveCount(33)

  const firstTitle = await galleryCards(page).first().getByRole('link').first().innerText()
  const query = firstTitle.split('\n')[0].slice(0, 4)
  await page.getByLabel('Cari judul gambar').fill(query)
  await expect(galleryCards(page).first()).toContainText(query)

  await page.getByLabel('Cari judul gambar').fill('zzzzzz-tidak-ada')
  await expect(page.getByText('Tidak ada gambar yang cocok.')).toBeVisible()
})

test('link Galeri di header mempertahankan filter terakhir', async ({ page }) => {
  await login(page, 'Dewi')
  await page.getByRole('button', { name: 'Hewan', exact: true }).click()
  await openFirstArtwork(page)

  await page.getByRole('navigation').getByRole('link', { name: 'Galeri' }).click()

  await expect(page).toHaveURL(/kategori=hewan/)
  await expect(galleryCards(page)).toHaveCount(33)
})
