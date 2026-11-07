# Gambar Titik

Aplikasi web (PWA) untuk mewarnai pixel art. Pilih satu dari 100 gambar (pemandangan, hewan, makanan), lalu warnai dengan salah satu dari dua cara. Semua teks berbahasa Indonesia. Bisa dipasang di perangkat dan dipakai offline.

## Dua cara mewarnai

Pilih lewat kartu di galeri, atau lewat tombol mode di editor. URL editor: `/warnai/<id>?mode=nomor` atau `?mode=bebas`. Tanpa `?mode`, editor memakai mode yang terakhir dikerjakan untuk gambar itu, atau **Sesuai nomor** jika belum ada progres.

- **Sesuai nomor** (bawaan): tiap kotak punya kode (`0`-`9`, `A`-`Z`) dan hanya bisa diisi dengan warna berkode sama. Garis tepi (kode `0`) ikut diwarnai.
  - Pilih warna di **Legenda warna** (swatch, kode, sisa kotak; warna tuntas diberi centang) atau tekan tombol kodenya di keyboard. Kotak berkode terpilih disorot.
  - Mengklik kotak dengan kode lain ditolak (kotak berkedip merah). Kode di kotak tampil saat zoom cukup besar.
  - **Isi area** (`G`): mengisi seluruh area terhubung berkode sama. **Lihat contoh** menampilkan kunci jawaban.
  - Di HP (lebar <= 768 px) legenda menjadi strip horizontal yang menempel di bawah layar, jadi kanvas dan pemilih warna terlihat bersamaan.
  - Setelah semua kotak benar, muncul dialog **Selesai**.
- **Bebas**: warna apa saja dengan kuas, ember, penghapus, dan pipet; garis tepi terkunci hitam.

Progres disimpan **terpisah per mode** (satu gambar bisa dikerjakan di kedua mode). Galeri dan Profil memakai progres terbaru per gambar: badge menunjukkan mode + persen (mis. `Nomor 45%`) atau `Selesai ✓`, dan Profil menghitung gambar dikerjakan/selesai per gambar, bukan per mode.

## Lembar cetak / simpan PDF

Tombol **Cetak** (di kartu galeri dan editor) membuka `/cetak/<id>`: grid ber-kode dan legenda warna untuk diwarnai di kertas A4. Centang **Sertakan kunci jawaban** untuk menambah halaman kedua. **Cetak / Simpan PDF** membuka dialog cetak browser; pilih "Simpan sebagai PDF" untuk membuat PDF.

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
- Cadangan memakai **format versi 2** (progres per gambar per mode). File cadangan versi lama (v1) tidak bisa dipakai dan ditolak dengan pesan khusus. Progres lama tanpa mode juga dibuang otomatis saat galeri dibuka karena ukuran gambar berubah.

## Pintasan keyboard (editor)

| Tombol | Fungsi |
| --- | --- |
| `B` / `G` | Kuas / Ember (Isi area di mode nomor) |
| `E` / `I` | Penghapus / Pipet (mode bebas) |
| `0`-`9`, `A`-`Z` | Pilih warna berkode itu (mode nomor) |
| `+` / `-` | Perbesar / perkecil |
| `0` | Ukuran awal (mode bebas) |
| `Shift+0` | Ukuran awal (semua mode; di mode nomor `0` dipakai untuk kode 0), atau tombol "Ukuran awal" |
| `Ctrl/Cmd+Z`, `Ctrl+Y` atau `Ctrl/Cmd+Shift+Z` | Urungkan / Ulangi |
| Spasi + seret | Geser kanvas |

## Struktur folder

```
public/data/      artworks.json hasil generator (RLE)
scripts/          generate-artworks.ts, preview-artworks.ts (pratinjau PNG untuk kurasi)
src/generator/    generator gambar prosedural (bentuk, outline, region)
src/data/         pemuat & dekoder data gambar, hook useArtworks
src/storage/      repository IndexedDB, ekspor/impor cadangan
src/user/         sesi pengguna (Zustand), normalisasi nama, guard RequireUser
src/features/     halaman: login, gallery, editor (mode nomor & bebas), print, profile
src/editor/       logika editor murni: alat, flood fill, history, viewport, warna
src/components/   komponen bersama: PixelCanvas, AppLayout, prompt PWA
src/pwa/          hook status online dan install prompt
src/i18n/id.ts    semua teks UI
tests/e2e/        tes Playwright (alur utama, mode nomor, cetak PDF, offline, manifest/service worker)
```
