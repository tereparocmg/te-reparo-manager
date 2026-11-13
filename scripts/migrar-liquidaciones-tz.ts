// Migración única: consolidar liquidaciones duplicadas por día civil.
// El servidor cambió de zona horaria entre sesiones (America/Havana ↔ UTC), lo
// que creó registros con claves distintas (T00:00Z y T05:00Z) para el mismo
// día. Con las claves estables de lib/fecha.ts (medianoche UTC), cada día debe
// tener UN solo registro en T00:00Z con todos sus hijos y su estado real.
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()
const esT00 = (f: Date) => f.getUTCHours() === 0 && f.getUTCMinutes() === 0 && f.getUTCSeconds() === 0
const etiqueta = (f: Date) => `${f.getUTCFullYear()}-${String(f.getUTCMonth() + 1).padStart(2, '0')}-${String(f.getUTCDate()).padStart(2, '0')}`

async function main() {
  const liquidaciones = await db.liquidacionOperario.findMany({ orderBy: { fecha: 'asc' } })
  const porDia = new Map<string, typeof liquidaciones>()
  for (const l of liquidaciones) {
    const clave = etiqueta(l.fecha) // etiqueta UTC de cualquiera de las dos claves del día
    porDia.set(clave, [...(porDia.get(clave) ?? []), l])
  }

  for (const [dia, filas] of porDia) {
    if (filas.length < 2) {
      console.log(`${dia}: OK (única, ${filas[0]?.fecha.toISOString()} ${filas[0]?.estado})`)
      continue
    }
    const t00 = filas.find((f) => esT00(f.fecha))
    const otras = filas.filter((f) => f !== t00)
    if (!t00) {
      console.log(`${dia}: SIN registro T00:00Z — no se toca (${filas.length} filas)`)
      continue
    }
    await db.$transaction(async (tx) => {
      // 1) mover hijos de las duplicadas a la canónica (clave T00:00Z)
      for (const otra of otras) {
        await tx.ajusteLiquidacion.updateMany({ where: { liquidacionId: otra.id }, data: { liquidacionId: t00.id } })
        await tx.liquidacionLinea.updateMany({ where: { liquidacionId: otra.id }, data: { liquidacionId: t00.id } })
        await tx.pagoLiquidacion.updateMany({ where: { liquidacionId: otra.id }, data: { liquidacionId: t00.id } })
      }
      // 2) si alguna duplicada estaba CERRADA, la canónica hereda el cierre
      const cerrada = filas.find((f) => f.estado === 'CERRADA')
      if (cerrada && cerrada.id !== t00.id) {
        await tx.liquidacionOperario.update({
          where: { id: t00.id },
          data: {
            estado: 'CERRADA',
            totalCUP: cerrada.totalCUP,
            cerradaPor: cerrada.cerradaPor,
            fechaCierre: cerrada.fechaCierre,
          },
        })
      }
      // 3) borrar duplicadas (ya sin hijos)
      for (const otra of otras) await tx.liquidacionOperario.delete({ where: { id: otra.id } })
    })
    console.log(`${dia}: consolidado → ${t00.id} (${t00.estado} → verificado abajo)`)
  }

  console.log('\n== ESTADO FINAL ==')
  const finales = await db.liquidacionOperario.findMany({ orderBy: { fecha: 'asc' } })
  for (const l of finales) {
    const [aj, ln, pg] = await Promise.all([
      db.ajusteLiquidacion.count({ where: { liquidacionId: l.id } }),
      db.liquidacionLinea.count({ where: { liquidacionId: l.id } }),
      db.pagoLiquidacion.count({ where: { liquidacionId: l.id } }),
    ])
    console.log(`${etiqueta(l.fecha)} | ${l.fecha.toISOString()} | ${l.estado} | total: ${l.totalCUP} | ajustes: ${aj}, lineas: ${ln}, pagos: ${pg}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
