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

## Menjalankan di jaringan lokal (HP / tablet di Wi-Fi yang sama)

```bash
npm run lan
```

Perintah ini membuat build produksi lalu menyalakan server di port `4173` untuk semua perangkat di jaringan. Alamatnya tampil di terminal sebagai `Network`, misalnya `http://192.168.88.17:4173/`. Buka alamat itu dari HP yang terhubung ke Wi-Fi yang sama.

**Batasan HTTP:** browser hanya mengaktifkan service worker di HTTPS atau `localhost`. Lewat `http://<IP>:4173` aplikasi tetap bisa dipakai dan progres tetap tersimpan di perangkat masing-masing, tetapi **tidak bisa di-install dan tidak bisa offline**.

### Opsional: HTTPS agar bisa di-install dan offline

1. Pasang mkcert di Mac ini: `brew install mkcert`, lalu `mkcert -install`.
2. Buat sertifikat untuk IP Mac (ganti dengan IP kamu):
   ```bash
   mkdir -p .certs
   mkcert -cert-file .certs/lan.pem -key-file .certs/lan-key.pem 192.168.88.17 localhost
   ```
3. Jalankan `npm run lan` lagi. Server otomatis memakai HTTPS jika kedua file di `.certs/` ada. Buka `https://192.168.88.17:4173/`.
4. Setiap HP perlu memercayai sertifikat root mkcert (file `rootCA.pem` di folder hasil `mkcert -CAROOT`):
   - **Android:** kirim `rootCA.pem` ke HP, lalu Setelan → Keamanan → Enkripsi & kredensial → Instal sertifikat → Sertifikat CA.
   - **iPhone/iPad:** kirim `rootCA.pem` (mis. lewat AirDrop), pasang profilnya di Setelan → Profil Diunduh, lalu aktifkan di Setelan → Umum → Mengenai → Pengaturan Kepercayaan Sertifikat.

Folder `.certs/` di-ignore git. Jangan bagikan file `rootCA-key.pem`.

**IP berubah?** Jika router memberi IP baru ke Mac, buat ulang sertifikat di langkah 2 (atau atur IP tetap / DHCP reservation di router).

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
