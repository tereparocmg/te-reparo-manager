// Diagnóstico: inspeccionar las ventas recientes, sus ítems (snapshots de pago
// operario y garantía), operarios y sus ramas, y garantías registradas.
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  const talleres = await db.taller.findMany()
  console.log('== TALLERES ==')
  for (const t of talleres) console.log(t.id, t.nombre, 'activo:', t.activo)

  const operarios = await db.operario.findMany({ include: { talleres: true } })
  console.log('\n== OPERARIOS ==')
  for (const o of operarios)
    console.log(o.id, o.nombre, 'rama:', o.rama, 'activo:', o.activo, 'talleres:', o.talleres.map((t) => t.tallerId))

  const usuarios = await db.usuario.findMany({ select: { id: true, nombre: true, username: true, rol: true, tallerId: true, operarioId: true } })
  console.log('\n== USUARIOS ==')
  for (const u of usuarios) console.log(u.id, u.nombre, u.username, 'rol:', u.rol, 'taller:', u.tallerId, 'operario:', u.operarioId)

  const productos = await db.producto.findMany({ select: { id: true, nombre: true, tipo: true, garantiaDias: true, pagoOperarioTipo: true, pagoOperarioValor: true, monedaPrecio: true, precio: true, tallerId: true } })
  console.log('\n== PRODUCTOS (pago operario / garantía) ==')
  for (const p of productos)
    console.log(p.id, p.nombre, '| tipo:', p.tipo, '| garantiaDias:', p.garantiaDias, '| pago:', p.pagoOperarioTipo, p.pagoOperarioValor.toString(), p.monedaPrecio)

  const ventas = await db.venta.findMany({
    orderBy: { fecha: 'desc' },
    take: 10,
    include: {
      cliente: { select: { nombre: true } },
      items: { include: { producto: { select: { nombre: true } }, operario: { select: { nombre: true, rama: true } } } },
    },
  })
  console.log('\n== ÚLTIMAS VENTAS ==')
  for (const v of ventas) {
    console.log(`--- ${v.codigo} | ${v.fecha.toISOString()} | estado: ${v.estado} | total: ${v.totalCUP} CUP | cliente: ${v.cliente?.nombre ?? 'Mostrador'}`)
    for (const it of v.items) {
      console.log(
        `    item ${it.id} | ${it.producto.nombre} | cant: ${it.cantidad} | subtotal: ${it.subtotalCUP} CUP | operario: ${it.operario ? it.operario.nombre + ' (' + it.operario.rama + ')' : 'NULL'} | pagoSnapshot: ${it.pagoOperarioTipoSnapshot} ${it.pagoOperarioValorSnapshot} | garantiaSnap: ${it.garantiaDiasSnapshot}d | costoAdicional: ${it.costoAdicional}`
      )
    }
  }

  const garantias = await db.garantia.findMany({ include: { ventaItem: { include: { producto: { select: { nombre: true } } } } } })
  console.log('\n== GARANTÍAS (reclamos) ==')
  console.log(garantias.length === 0 ? '(ninguna)' : '')
  for (const g of garantias)
    console.log(g.id, g.tipo, g.fechaReclamo.toISOString(), g.ventaItem.producto.nombre, '| desc:', g.descripcion)

  const liq = await db.liquidacionOperario.findMany({ orderBy: { fecha: 'desc' }, take: 5 })
  console.log('\n== LIQUIDACIONES ==')
  for (const l of liq) console.log(l.id, 'fecha:', l.fecha.toISOString(), 'estado:', l.estado, 'total:', l.totalCUP.toString(), 'taller:', l.tallerId)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
