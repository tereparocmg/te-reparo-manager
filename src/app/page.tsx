'use client'

import { useStore } from '@/lib/store'
import { LoginScreen } from '@/components/login-screen'
import { AppShell } from '@/components/app-shell'

export default function Home() {
  const usuario = useStore((s) => s.usuarioActual)

  if (!usuario) return <LoginScreen />
  return <AppShell />
}
