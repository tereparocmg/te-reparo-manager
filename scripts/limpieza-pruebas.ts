// Limpieza de datos residuales de las pruebas de paginación:
//  - ZZTEST Stock Bajo (producto con movimiento ENTRADA → no borra por API)
//  - Cliente Prueba 1..5 (no existe endpoint DELETE de clientes)
import { db } from '@/lib/db'

async function main() {
  const movs = await db.movimientoInventario.findMany({
    where: { producto: { nombre: 'ZZTEST Stock Bajo' } },
    select: { id: true },
  })
  if (movs.length) {
    await db.movimientoInventario.deleteMany({ where: { id: { in: movs.map((m) => m.id) } } })
    console.log('movimientos borrados:', movs.length)
  }
  const borrados = await db.producto.deleteMany({ where: { nombre: 'ZZTEST Stock Bajo' } })
  console.log('productos borrados:', borrados.count)

  const clientes = await db.cliente.deleteMany({ where: { nombre: { contains: 'Cliente Prueba' } } })
  console.log('clientes borrados:', clientes.count)

  const restantes = await db.producto.count()
  const clientesRest = await db.cliente.count()
  console.log('estado final → productos:', restantes, '· clientes:', clientesRest)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect?.())
