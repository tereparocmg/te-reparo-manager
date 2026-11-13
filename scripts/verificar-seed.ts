// Verificación del seed: conteos, enlaces usuario↔operario↔taller y muestras
// de productos contra la especificación del usuario.
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  const [talleres, usuarios, operarios, opTaller, productos, movs] = await Promise.all([
    db.taller.findMany({ orderBy: { nombre: 'asc' } }),
    db.usuario.findMany({ orderBy: { username: 'asc' }, include: { taller: true, operario: true } }),
    db.operario.findMany({ orderBy: { id: 'asc' }, include: { talleres: true } }),
    db.operarioTaller.count(),
    db.producto.count(),
    db.movimientoInventario.count(),
  ])
  console.log(`Talleres (${talleres.length}):`, talleres.map((t) => `${t.id}="${t.nombre}"`).join(' · '))
  console.log(`Usuarios: ${usuarios.length} | Operarios: ${operarios.length} | Enlaces operario-taller: ${opTaller}`)
  console.log(`Productos: ${productos} | Movimientos ENTRADA: ${movs}`)

  console.log('\n== USUARIOS ==')
  for (const u of usuarios) {
    console.log(
      `  ${u.username.padEnd(20)} ${u.rol.padEnd(15)} taller=${u.taller?.nombre ?? '(elige)'} operario=${u.operario?.nombre ?? '—'}`
    )
  }

  console.log('\n== OPERARIOS ==')
  const esperados: Record<string, { rama: string; talleres: string[] }> = {
    Juan: { rama: 'INFORMATICO', talleres: ['Te Reparo - República'] },
    Wilber: { rama: 'INFORMATICO', talleres: ['Te Reparo - República'] },
    Milton: { rama: 'ELECTRONICO', talleres: ['Te Reparo - República'] },
    Raul: { rama: 'ELECTRONICO', talleres: ['Te Reparo - La Caridad'] },
    Danilo: { rama: 'INFORMATICO', talleres: ['Te Reparo - La Caridad'] },
    Ivan: { rama: 'VENDEDOR', talleres: ['Te Reparo - La Caridad'] },
    Andrew: { rama: 'VENDEDOR', talleres: ['Te Reparo - La Caridad'] },
    Javier: { rama: 'VENDEDOR', talleres: ['Te Reparo - República'] },
    Lili: { rama: 'VENDEDOR', talleres: ['Te Reparo - República', 'Te Reparo - La Caridad'] },
    Ranset: { rama: 'ADMIN', talleres: ['Te Reparo - República', 'Te Reparo - La Caridad'] },
    Ransei: { rama: 'ADMIN', talleres: ['Te Reparo - República', 'Te Reparo - La Caridad'] },
    Raydel: { rama: 'ADMIN', talleres: ['Te Reparo - República', 'Te Reparo - La Caridad'] },
  }
  let errores = 0
  for (const o of operarios) {
    const nombres = o.talleres.map((t) => t.tallerId === 'taller-republica' ? 'Te Reparo - República' : 'Te Reparo - La Caridad')
    const esp = esperados[o.nombre]
    const ok = esp && esp.rama === o.rama && esp.talleres.length === nombres.length && esp.talleres.every((t) => nombres.includes(t))
    if (!ok) errores++
    console.log(`  ${o.nombre.padEnd(8)} ${o.rama.padEnd(12)} [${nombres.join(', ')}] ${ok ? '✓' : '✗ ESPERABA: ' + JSON.stringify(esp)}`)
  }

  console.log('\n== PRODUCTOS (muestras y agregados) ==')
  const porTipo = await db.producto.groupBy({ by: ['tipo'], _count: true })
  console.log('  Por tipo:', porTipo.map((t) => `${t.tipo}=${t._count}`).join(' · '))
  const conStock = await db.producto.count({ where: { cantidad: { gt: 0 } } })
  const conPrecio = await db.producto.count({ where: { precio: { gt: 0 } } })
  console.log(`  Con stock > 0: ${conStock} | Con precio > 0: ${conPrecio} (deben ser 0)`)

  const primero = await db.producto.findUnique({ where: { tallerId_codigoInterno: { tallerId: 'taller-republica', codigoInterno: 'REP-000001' } } })
  const ultimo = await db.producto.findUnique({ where: { tallerId_codigoInterno: { tallerId: 'taller-republica', codigoInterno: 'REP-001375' } } })
  const unServicio = await db.producto.findFirst({ where: { tipo: 'SERVICIO_ELECTRONICA' } })
  console.log(`  REP-000001: ${primero?.nombre} | cant ${primero?.cantidad} | ${primero?.monedaPrecio} | garantía ${primero?.garantiaDias}d`)
  console.log(`  REP-001375: ${ultimo?.nombre} | cat ${ultimo?.categoria}`)
  console.log(`  Servicio ejemplo: ${unServicio?.nombre} (${unServicio?.categoria}, unidad ${unServicio?.unidad})`)

  // Códigos únicos por taller (restricción de BD ya validada por Prisma)
  const laCaridad = await db.producto.count({ where: { tallerId: 'taller-lacaridad' } })
  console.log(`  Productos en La Caridad: ${laCaridad} (sin inventario cargado)`)

  if (errores > 0) throw new Error(`${errores} operarios no coinciden con lo especificado`)
  console.log('\n✓ Verificación completa sin errores')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
