let requested = false

/** Minta browser agar tidak menghapus data sembarangan. Aman jika API tidak tersedia. */
export async function requestPersistentStorage(): Promise<boolean> {
  if (requested) return false
  requested = true
  try {
    return (await navigator.storage?.persist?.()) ?? false
  } catch {
    // Permintaan persist hanya bersifat anjuran; kegagalannya tidak boleh menghalangi login.
    return false
  }
}

/** Hanya untuk test. */
export function resetPersistRequestForTests(): void {
  requested = false
}
