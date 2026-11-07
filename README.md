# Gambar Titik

Aplikasi web (PWA) untuk mewarnai pixel art secara bebas. Pilih satu dari 100 gambar (pemandangan, hewan, makanan), lalu warnai pixel dengan warna apa pun. Semua teks berbahasa Indonesia. Bisa dipasang di perangkat dan dipakai offline.

## Menjalankan

```bash
npm install
npm run dev            # server pengembangan
npm run generate       # membuat ulang public/data/artworks.json (100 gambar, deterministik)
npm run build          # generate + type-check + build produksi (dist/, termasuk service worker)
npm run preview        # menjalankan hasil build
```

Pengujian dan pemeriksaan:

```bash
npm run lint
npm test               # unit/komponen (Vitest + Testing Library)
npm run test:coverage  # dengan coverage (ambang 80%)
npm run test:e2e       # E2E Playwright terhadap build produksi (build + preview otomatis)
```

E2E memakai Chromium; pasang sekali dengan `npx playwright install chromium`.

## Cara kerja pengguna (tanpa database)

- Tidak ada server dan tidak ada akun. Saat masuk, kamu mengetik nama; nama dinormalisasi (huruf kecil, spasi dirapikan) menjadi ID, jadi `  budi   SANTOSO ` dan `Budi Santoso` adalah pengguna yang sama.
- Profil dan progres mewarnai disimpan di IndexedDB browser pada perangkat ini. Masuk lagi dengan nama yang sama otomatis memulihkan progres.
- Karena tidak ada autentikasi, siapa pun yang memakai browser yang sama bisa masuk dengan nama yang sama.

Batasan:

- Data hanya ada di perangkat dan browser tempat kamu mewarnai. Menghapus data situs atau berganti HP/browser berarti progres tidak ikut.
- Gunakan **Profil > Unduh cadangan** untuk menyimpan file JSON, dan **Pulihkan cadangan** untuk memuatnya kembali (mode Gabungkan atau Timpa). File divalidasi ketat dan dibatasi 10 MB.

## Struktur folder

```
public/data/      artworks.json hasil generator (RLE)
scripts/          generate-artworks.ts, preview-artworks.ts (pratinjau PNG untuk kurasi)
src/generator/    generator gambar prosedural (bentuk, outline, region)
src/data/         pemuat & dekoder data gambar, hook useArtworks
src/storage/      repository IndexedDB, ekspor/impor cadangan
src/user/         sesi pengguna (Zustand), normalisasi nama, guard RequireUser
src/features/     halaman: login, gallery, editor, profile
src/editor/       logika editor murni: alat, flood fill, history, viewport, warna
src/components/   komponen bersama: PixelCanvas, AppLayout, prompt PWA
src/pwa/          hook status online dan install prompt
src/i18n/id.ts    semua teks UI
tests/e2e/        tes Playwright (alur utama, offline, manifest/service worker)
```
