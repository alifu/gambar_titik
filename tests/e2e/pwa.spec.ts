import { expect, test } from '@playwright/test'
import {
  GALLERY_SIZE,
  galleryCards,
  login,
  paintSomeRegions,
  waitForServiceWorkerControl,
} from './helpers.ts'

const APP_DESCRIPTION =
  'Mewarnai pixel art sesuai nomor atau secara bebas — pemandangan, hewan, dan makanan. Bisa dicetak dan dipakai offline.'
const APPLE_TOUCH_ICON_SIZE = 180
const IOS_META: readonly { readonly name: string; readonly content: string }[] = [
  { name: 'apple-mobile-web-app-capable', content: 'yes' },
  { name: 'mobile-web-app-capable', content: 'yes' },
  { name: 'apple-mobile-web-app-title', content: 'Gambar Titik' },
  { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
]
const PNG_SIGNATURE = '89504e470d0a1a0a'

interface ManifestIcon {
  readonly src: string
  readonly sizes: string
  readonly type: string
  readonly purpose?: string
}

interface ManifestScreenshot {
  readonly src: string
  readonly sizes: string
  readonly type: string
  readonly form_factor?: string
  readonly label?: string
}

/** Membaca lebar dan tinggi dari header IHDR PNG; gagal jika bukan PNG. */
function readPngSize(body: Buffer): { width: number; height: number } {
  expect(body.subarray(0, 8).toString('hex')).toBe(PNG_SIGNATURE)
  return { width: body.readUInt32BE(16), height: body.readUInt32BE(20) }
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
    description: APP_DESCRIPTION,
    id: '/',
    start_url: '/',
    display: 'standalone',
    lang: 'id',
    categories: expect.arrayContaining(['games', 'kids', 'entertainment']),
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

test('deskripsi di halaman sama dengan manifest', async ({ page }) => {
  await page.goto('/login')
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    APP_DESCRIPTION,
  )
})

test('apple-touch-icon 180x180 dan meta iOS tersedia', async ({ page, request }) => {
  await page.goto('/login')
  const href = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href')
  expect(href).toBe('/apple-touch-icon.png')

  const response = await request.get(href ?? '')
  expect(response.ok()).toBe(true)
  expect(response.headers()['content-type']).toContain('image/png')
  expect(readPngSize(await response.body())).toEqual({
    width: APPLE_TOUCH_ICON_SIZE,
    height: APPLE_TOUCH_ICON_SIZE,
  })

  for (const meta of IOS_META) {
    await expect(page.locator(`meta[name="${meta.name}"]`), meta.name).toHaveAttribute(
      'content',
      meta.content,
    )
  }
})

test('screenshot manifest bisa diambil sebagai PNG dengan sizes sesuai dimensi file', async ({
  page,
  request,
}) => {
  await page.goto('/login')
  const href = await page.locator('link[rel="manifest"]').getAttribute('href')
  const manifest = await (await request.get(href ?? '')).json()

  const screenshots: readonly ManifestScreenshot[] = manifest.screenshots
  expect(screenshots).toHaveLength(2)
  for (const screenshot of screenshots) {
    const response = await request.get(`/${screenshot.src}`)
    expect(response.ok(), screenshot.src).toBe(true)
    expect(response.headers()['content-type'], screenshot.src).toContain('image/png')
    const { width, height } = readPngSize(await response.body())
    expect(screenshot.sizes, screenshot.src).toBe(`${width}x${height}`)
  }
})

test('service worker hanya memprecache aset, bukan screenshot', async ({ request }) => {
  const response = await request.get('/sw.js')
  expect(response.ok()).toBe(true)
  const swSource = await response.text()
  expect(swSource).toContain('apple-touch-icon.png')
  expect(swSource).not.toContain('screenshots/')
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

  await galleryCards(page).first().getByRole('link').first().click()
  await paintSomeRegions(page)

  await context.setOffline(false)
  await expect(page.getByText(/Kamu sedang offline/)).toBeHidden()
})
