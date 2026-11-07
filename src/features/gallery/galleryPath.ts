export const GALLERY_PATH = '/galeri'
const STORAGE_KEY = 'gambar-titik:gallery-query'

/** Simpan query filter galeri terakhir (sessionStorage; gagal diam-diam jika diblokir browser). */
export function rememberGalleryQuery(search: string): void {
  try {
    if (search) sessionStorage.setItem(STORAGE_KEY, search)
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // sessionStorage bisa diblokir (mode privat); filter tidak diingat, tidak mengganggu fungsi lain.
  }
}

/** Path galeri beserta query filter terakhir, mis. `/galeri?kategori=hewan`. */
export function galleryPathWithQuery(): string {
  try {
    const search = sessionStorage.getItem(STORAGE_KEY) ?? ''
    return search.startsWith('?') ? `${GALLERY_PATH}${search}` : GALLERY_PATH
  } catch {
    return GALLERY_PATH
  }
}
