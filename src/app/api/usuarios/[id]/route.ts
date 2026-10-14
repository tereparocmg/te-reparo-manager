import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { ok, fail, parseBody, withAuth } from '@/lib/api-helpers'

type Params = { params: Promise<{ id: string }> }

// GET /api/usuarios/[id] — Ver usuario (SUPER_ADMIN o propio usuario)
export async function GET(req: Request, { params }: Params) {
  const { id } = await params
  return withAuth(req, async (user) => {
    const allow = user.rol === 'SUPER_ADMIN' || user.id === id
    if (!allow) return fail('No autorizado', 403)

    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: { talleres: { include: { taller: true } } },
    })
    if (!usuario) return fail('Usuario no encontrado', 404)
    const { password, talleres, ...userData } = usuario
    return ok({ ...userData, tallerIds: talleres.map((ut) => ut.tallerId) })
  })
}

// PUT /api/usuarios/[id] — Actualizar usuario (sólo SUPER_ADMIN)
// Si se envía `password`, se hashea con bcrypt antes de almacenar.
// Si no se envía `password`, no se modifica.
export async function PUT(req: Request, { params }: Params) {
  const { id } = await params
  return withAuth(req, async () => {
    const body = await parseBody<any>(req)
    const { tallerIds, password, ...userData } = body

    // Reasignar talleres si viene el array
    if (Array.isArray(tallerIds)) {
      await prisma.usuarioTaller.deleteMany({ where: { usuarioId: id } })
      if (tallerIds.length > 0) {
        await prisma.usuarioTaller.createMany({
          data: tallerIds.map((tallerId: string) => ({ usuarioId: id, tallerId })),
        })
      }
    }

    // Construir el objeto data para Prisma:
    //   - Si password viene no vacío, hashear con bcrypt.
    //   - Si password viene vacío o no viene, omitir (no cambiar).
    const dataUpdate: any = { ...userData }
    if (userData.email !== undefined) {
      dataUpdate.email = String(userData.email).toLowerCase()
    }
    if (password && String(password).trim() !== '') {
      dataUpdate.password = await bcrypt.hash(String(password), 10)
    } else {
      delete dataUpdate.password
    }

    try {
      const usuario = await prisma.usuario.update({
        where: { id },
        data: dataUpdate,
        include: { talleres: { include: { taller: true } } },
      })
      const { password: _pwd, talleres, ...updated } = usuario
      return ok({ ...updated, tallerIds: talleres.map((ut) => ut.tallerId) })
    } catch (e: any) {
      if (e?.code === 'P2002') return fail('El email ya está registrado', 409)
      if (e?.code === 'P2025') return fail('Usuario no encontrado', 404)
      if (e?.code === 'P2003') return fail('Taller inválido (FK)', 400)
      throw e
    }
  }, ['SUPER_ADMIN'])
}

// DELETE /api/usuarios/[id] — Soft delete (sólo SUPER_ADMIN)
export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params
  return withAuth(req, async () => {
    try {
      const usuario = await prisma.usuario.update({
        where: { id },
        data: { activo: false, deletedAt: new Date() },
      })
      const { password, ...userData } = usuario
      return ok(userData)
    } catch (e: any) {
      if (e?.code === 'P2025') return fail('Usuario no encontrado', 404)
      throw e
    }
  }, ['SUPER_ADMIN'])
}
