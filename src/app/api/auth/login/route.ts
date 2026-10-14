import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { setSession } from '@/lib/session'
import { ok, fail, parseBody } from '@/lib/api-helpers'

// POST /api/auth/login — Inicio de sesión con email + password
// Compara la contraseña con el hash bcrypt almacenado en la BD.
export async function POST(req: Request) {
  try {
    const { email, password } = await parseBody<{ email?: string; password?: string }>(req)

    if (!email || !password) {
      return fail('Email y password son obligatorios', 400)
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
      include: { talleres: { include: { taller: true } } },
    })

    // Usuario inexistente, inactivo, o contraseña incorrecta
    if (!usuario || !usuario.activo) {
      return fail('Credenciales inválidas', 401)
    }

    // Comparar la contraseña en claro con el hash bcrypt almacenado.
    // Compatible también con contraseñas legacy en plaintext (migración).
    const passwordMatch = await verifyPassword(password, usuario.password)
    if (!passwordMatch) {
      return fail('Credenciales inválidas', 401)
    }

    // Establecer cookie de sesión firmada
    await setSession(usuario.id)

    // Quitar password y aplanar talleres a IDs
    const { password: _pwd, talleres, ...userData } = usuario
    return ok({
      ...userData,
      tallerIds: talleres.map((ut) => ut.tallerId),
    })
  } catch (e: any) {
    console.error('[API auth/login] Error:', e?.message)
    return fail(e?.message === 'Cuerpo JSON inválido' ? e.message : 'Error al iniciar sesión', 500)
  }
}

// ============================================================
// Helper: verificar password (bcrypt o legacy plaintext)
// ============================================================
// Para soportar migración de contraseñas en claro → bcrypt.
// Si la password almacenada empieza con $2a$/$2b$/$2y$, es bcrypt.
// Si no, es legacy plaintext (comparación directa).
// En producción, todas las passwords deberían estar hasheadas.
async function verifyPassword(plainPassword: string, storedPassword: string): Promise<boolean> {
  if (!storedPassword) return false
  // Detectar hashes bcrypt: $2a$, $2b$, $2y$
  if (/^\$2[abxy]\$\d{2}\$/.test(storedPassword)) {
    try {
      return bcrypt.compare(plainPassword, storedPassword)
    } catch (e) {
      console.error('[auth] bcrypt.compare error:', e)
      return false
    }
  }
  // Legacy: comparación directa (no recomendado, solo para migración)
  return plainPassword === storedPassword
}
