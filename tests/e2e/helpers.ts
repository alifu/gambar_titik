/// <reference lib="dom" />
import { expect, type Page } from '@playwright/test'

export const GALLERY_SIZE = 100
const STORE_DB = 'gambar-titik'

export async function login(page: Page, name: string): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Nama kamu').fill(name)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await expect(page.getByRole('heading', { name: 'Galeri' })).toBeVisible()
}

export function galleryCards(page: Page) {
  return page.getByRole('main').getByRole('listitem')
}

export function percentBadges(page: Page) {
  return page.getByRole('link', { name: /\d+%$/ })
}

/** Warnai area gambar dengan ember di beberapa titik, supaya pasti ada region yang terisi. */
export async function paintSomeRegions(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Ember/ }).click()
  const canvas = page.getByRole('img', { name: /Kanvas mewarnai/ })
  await expect(canvas).toBeVisible()
  const box = await canvas.boundingBox()
  if (!box) throw new Error('Kanvas tidak punya ukuran')
  const spots = [0.3, 0.5, 0.7]
  for (const fx of spots) {
    for (const fy of spots) {
      await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy)
    }
  }
  await expect(page.getByText(/^[1-9]\d*% diwarnai$/)).toBeVisible()
  await expect(page.getByText('Tersimpan')).toBeVisible()
}

/** Kosongkan penyimpanan IndexedDB aplikasi (meniru hapus data browser) tanpa menutup koneksi. */
export async function wipeStorage(page: Page): Promise<void> {
  await page.evaluate(
    (dbName) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open(dbName)
        open.onerror = () => reject(open.error)
        open.onsuccess = () => {
          const db = open.result
          const tx = db.transaction('kv', 'readwrite')
          tx.objectStore('kv').clear()
          tx.oncomplete = () => {
            db.close()
            resolve()
          }
          tx.onerror = () => reject(tx.error)
        }
      }),
    STORE_DB,
  )
}

/** Tunggu service worker aktif, lalu muat ulang agar halaman dikontrol olehnya. */
export async function waitForServiceWorkerControl(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
}
