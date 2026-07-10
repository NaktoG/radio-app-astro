export const StorageUtil = {
  setItem(key: string, value: any): void {
    try {
      const encoded = btoa(encodeURIComponent(JSON.stringify(value)))
      localStorage.setItem(key, encoded)
    } catch (e) {
      console.error('StorageUtil.setItem error:', e)
    }
  },

  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key)
      if (!item) return null
      const decoded = decodeURIComponent(atob(item))
      return JSON.parse(decoded) as T
    } catch {
      return null
    }
  },

  removeItem(key: string): void {
    localStorage.removeItem(key)
  },

  clear(): void {
    localStorage.clear()
  },

  hasItem(key: string): boolean {
    return localStorage.getItem(key) !== null
  }
}
