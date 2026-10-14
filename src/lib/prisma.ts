// ============================================================
// Prisma Client Singleton (Next.js + PostgreSQL)
// ============================================================
// Aplicación web 100% online — sin sincronización local ni cloud-api.
// Todas las mutaciones se persisten directamente en PostgreSQL.
// ============================================================

import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

export { prisma }
export default prisma

// ============================================================
// Helpers
// ============================================================

// Convertir fechas de Prisma (Date) a ISO strings para el frontend
export function normalizeDates<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj as T
  if (obj instanceof Date) return obj.toISOString() as unknown as T
  if (Array.isArray(obj)) return obj.map(normalizeDates) as unknown as T
  if (typeof obj === 'object') {
    const out: any = {}
    for (const k in obj as any) out[k] = normalizeDates((obj as any)[k])
    return out
  }
  return obj
}

// Parsear tags de JSON string a array
export function parseTags(tagsStr: string | null | undefined): string[] {
  if (!tagsStr) return []
  try { return JSON.parse(tagsStr) } catch { return [] }
}

// Serializar tags de array a JSON string
export function serializeTags(tagsArr: string[] | null | undefined): string {
  if (!tagsArr || !Array.isArray(tagsArr)) return '[]'
  return JSON.stringify(tagsArr)
}
