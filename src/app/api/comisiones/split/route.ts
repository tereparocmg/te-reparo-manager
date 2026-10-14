// POST /api/comisiones/split — Dividir comisiones entre 2 operarios a la mitad
// Body: { operarioAId, operarioBId, tallerId, notas? }
// Toma todas las comisiones ACTIVE + sin pago de ambos operarios,
// suma el total, y crea un pago para cada uno con la mitad.

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { generateFolio } from '@/lib/folio'

export async function POST(req: Request) {
  try {
    await requireRole('SUPER_ADMIN', 'ADMIN')
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === 'No autenticado' ? 401 : 403 })
  }

  const { operarioAId, operarioBId, tallerId, notas } = await req.json()

  if (!operarioAId || !operarioBId || !tallerId) {
    return NextResponse.json({ error: 'Faltan campos: operarioAId, operarioBId, tallerId' }, { status: 400 })
  }
  if (operarioAId === operarioBId) {
    return NextResponse.json({ error: 'Los operarios deben ser diferentes' }, { status: 400 })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Obtener comisiones pendientes de ambos operarios
      const [entriesA, entriesB] = await Promise.all([
        tx.commissionEntry.findMany({
          where: { operarioId: operarioAId, estado: 'ACTIVE', operatorPaymentId: null },
        }),
        tx.commissionEntry.findMany({
          where: { operarioId: operarioBId, estado: 'ACTIVE', operatorPaymentId: null },
        }),
      ])

      const totalEntries = [...entriesA, ...entriesB]
      if (totalEntries.length === 0) {
        throw new Error('No hay comisiones pendientes para dividir')
      }

      const totalAmount = totalEntries.reduce((s, e) => s + e.amount, 0)
      const halfAmount = Math.round((totalAmount / 2) * 100) / 100
      const ahora = new Date()
      const user = (req as any).user

      // 2. Crear pago para operario A con la mitad
      const pagoA = await tx.operatorPayment.create({
        data: {
          folio: generateFolio('OP'),
          operarioId: operarioAId,
          tallerId,
          amount: halfAmount,
          date: ahora,
          paidAt: ahora,
          paidById: user?.id || null,
          status: 'PAID',
          notas: notas || `División equitativa con ${operarioBId} — Total: ${totalAmount}`,
        },
      })

      // 3. Crear pago para operario B con la mitad
      const pagoB = await tx.operatorPayment.create({
        data: {
          folio: generateFolio('OP'),
          operarioId: operarioBId,
          tallerId,
          amount: halfAmount,
          date: ahora,
          paidAt: ahora,
          paidById: user?.id || null,
          status: 'PAID',
          notas: notas || `División equitativa con ${operarioAId} — Total: ${totalAmount}`,
        },
      })

      // 4. Marcar comisiones de A como pagadas (vincular a pagoA)
      await tx.commissionEntry.updateMany({
        where: { id: { in: entriesA.map((e) => e.id) } },
        data: { operatorPaymentId: pagoA.id },
      })

      // 5. Marcar comisiones de B como pagadas (vincular a pagoB)
      await tx.commissionEntry.updateMany({
        where: { id: { in: entriesB.map((e) => e.id) } },
        data: { operatorPaymentId: pagoB.id },
      })

      return {
        totalComisiones: totalEntries.length,
        montoTotal: totalAmount,
        montoPorOperario: halfAmount,
        pagoA: { id: pagoA.id, folio: pagoA.folio, amount: pagoA.amount },
        pagoB: { id: pagoB.id, folio: pagoB.folio, amount: pagoB.amount },
      }
    }, { timeout: 30000, maxWait: 10000 })

    return NextResponse.json({ ok: true, ...result })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
