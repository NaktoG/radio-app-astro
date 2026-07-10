export function proxyImage(url: string | undefined | null): string | undefined {
  if (!url) return undefined
  if (!url.startsWith('http://') && !url.startsWith('https://')) return undefined
  return `/api/image-proxy?url=${encodeURIComponent(url)}`
}
