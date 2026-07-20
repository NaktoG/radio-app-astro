import 'astro/client'

declare global {
  namespace App {
    interface Locals {
      lang: 'es' | 'en'
      user: import('./lib/types').User | null
    }
  }
}
