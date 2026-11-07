import { expect, test } from '@playwright/test'
import {
  GALLERY_SIZE,
  galleryCards,
  login,
  paintSomeRegions,
  waitForServiceWorkerControl,
} from './helpers.ts'

interface ManifestIcon {
  readonly src: string
  readonly sizes: string
  readonly type: string
  readonly purpose?: string
}

test('manifest valid: nama, start_url, mode standalone, ikon 192/512/maskable', async ({
  page,
  request,
}) => {
  await page.goto('/login')
  const href = await page.locator('link[rel="manifest"]').getAttribute('href')
  expect(href).toBeTruthy()

  const response = await request.get(href ?? '')
  expect(response.ok()).toBe(true)
  const manifest = await response.json()
  expect(manifest).toMatchObject({
    name: 'Gambar Titik',
    start_url: '/',
    display: 'standalone',
    lang: 'id',
  })

  const icons: readonly ManifestIcon[] = manifest.icons
  expect(icons.map((icon) => icon.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']))
  expect(icons.some((icon) => icon.purpose === 'maskable' && icon.sizes === '512x512')).toBe(true)
  for (const icon of icons) {
    const iconResponse = await request.get(`/${icon.src}`)
    expect(iconResponse.ok(), icon.src).toBe(true)
    expect(iconResponse.headers()['content-type']).toContain('image/png')
  }
})

test('service worker terdaftar dan mengontrol halaman', async ({ page }) => {
  await page.goto('/login')
  await waitForServiceWorkerControl(page)

  const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope)
  expect(scope).toBe(new URL('/', page.url()).href)
})

test('offline: start_url, galeri dan editor tetap bisa dibuka dan mewarnai', async ({
  page,
  context,
}) => {
  await page.goto('/login')
  await waitForServiceWorkerControl(page)
  await login(page, 'Eko')

  await context.setOffline(true)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Galeri' })).toBeVisible()
  await expect(page.getByText(/Kamu sedang offline/)).toBeVisible()
  await expect(galleryCards(page)).toHaveCount(GALLERY_SIZE)

  await galleryCards(page).first().getByRole('link').click()
  await paintSomeRegions(page)

  await context.setOffline(false)
  await expect(page.getByText(/Kamu sedang offline/)).toBeHidden()
})
