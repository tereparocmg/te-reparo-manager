// Diagnóstico: ventas recientes + cálculo de liquidación por día (replica la
// lógica de /api/liquidaciones para ver qué ve el usuario por cada fecha).
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  const ventas = await db.venta.findMany({
    orderBy: { fecha: 'desc' },
    take: 8,
    include: {
      cliente: { select: { nombre: true } },
      items: {
        include: {
          producto: { select: { nombre: true } },
          operario: { select: { nombre: true, rama: true } },
        },
      },
    },
  })
  console.log('== ÚLTIMAS VENTAS ==')
  for (const v of ventas) {
    console.log(`--- ${v.codigo} | fecha: ${v.fecha.toISOString()} | estado: ${v.estado} | total: ${v.totalCUP} CUP | cliente: ${v.cliente?.nombre ?? 'Mostrador'}`)
    for (const it of v.items) {
      console.log(
        `    item | ${it.producto.nombre} | cant: ${it.cantidad} | devuelta: ${it.cantidadDevuelta} | subtotal: ${it.subtotalCUP} CUP | costoAdicional: ${it.costoAdicional} | operario: ${it.operario ? it.operario.nombre + ' (' + it.operario.rama + ')' : 'NULL'} | pagoSnapshot: ${it.pagoOperarioTipoSnapshot} ${it.pagoOperarioValorSnapshot}`
      )
    }
  }

  const operarios = await db.operario.findMany({ where: { activo: true } })
  console.log('\n== OPERARIOS ACTIVOS ==')
  for (const o of operarios) console.log(o.id, o.nombre, '| rama:', o.rama)

  // Simular la liquidación por día (misma lógica que la API) para los días con ventas
  const dias = new Set<string>()
  for (const v of ventas) dias.add(v.fecha.toISOString().slice(0, 10))
  for (const dia of dias) {
    const inicio = new Date(dia + 'T00:00:00.000Z')
    const fin = new Date(inicio.getTime() + 86400000)
    const delDia = await db.venta.findMany({
      where: { tallerId: 'taller-piloto', fecha: { gte: inicio, lt: fin } },
      include: { items: true },
    })
    console.log(`\n== LIQUIDACIÓN ${dia} (ventas: ${delDia.length}) ==`)
    for (const o of operarios) {
      let monto = 0
      let lineas = 0
      for (const v of delDia)
        for (const it of v.items)
          if (it.operarioId === o.id) {
            const subtotal = Number(it.subtotalCUP)
            const costo = Number(it.costoAdicional ?? 0)
            const valor = Number(it.pagoOperarioValorSnapshot)
            const pago =
              it.pagoOperarioTipoSnapshot === 'PORCENTAJE'
                ? Math.max(0, subtotal - costo) * (valor / 100)
                : valor * it.cantidad
            monto += pago
            lineas++
            console.log(`   ${o.nombre}: línea ${it.id.slice(-6)} pago=${pago.toFixed(2)} (${it.pagoOperarioTipoSnapshot} ${valor} × subtotal ${subtotal} - costo ${costo})`)
          }
      console.log(`   >> ${o.nombre} (${o.rama}): ${lineas} líneas, pago líneas = ${monto.toFixed(2)} CUP`)
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
