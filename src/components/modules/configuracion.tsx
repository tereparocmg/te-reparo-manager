'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { useDataService } from '@/lib/electron-adapter'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Settings, Save, Building2, Globe, ShieldCheck, DollarSign,
} from 'lucide-react'
import { setTipoCambio, formatCUP } from '@/lib/format'
import { toast } from 'sonner'

export function ConfiguracionModule() {
  const configuracion = useStore((s) => s.configuracion)
  const talleres = useStore((s) => s.talleres)
  const usuarioActual = useStore((s) => s.usuarioActual)

  const esSuperAdmin = usuarioActual?.rol === 'SUPER_ADMIN'
  const [configGlobal, setConfigGlobal] = useState(configuracion)
  const [tallerEditId, setTallerEditId] = useState<string>(talleres[0]?.id || '')
  const [tallerDatos, setTallerDatos] = useState(
    talleres.find((t) => t.id === talleres[0]?.id) || null
  )

  // Sincronizar tipo de cambio global con el módulo de formato
  useEffect(() => {
    setTipoCambio(configuracion.tipoCambio || 650)
  }, [configuracion.tipoCambio])

  const guardarGlobal = async () => {
    try {
      await useDataService().updateConfiguracion(configGlobal)
      setTipoCambio(configGlobal.tipoCambio || 650)
      toast.success('Configuración global guardada')
    } catch (err: any) {
      console.error('[Configuracion] Error al guardar configuracion global:', err)
      toast.error('Error al guardar la configuración', { description: err?.message })
    }
  }

  const guardarTaller = async () => {
    if (!tallerDatos) return
    try {
      await useDataService().updateTallerConfig(tallerDatos.id, tallerDatos)
      toast.success('Configuración del taller guardada')
    } catch (err: any) {
      console.error('[Configuracion] Error al guardar configuracion del taller:', err)
      toast.error('Error al guardar la configuración', { description: err?.message })
    }
  }

  const cambiarTaller = (id: string) => {
    setTallerEditId(id)
    setTallerDatos(talleres.find((t) => t.id === id) || null)
  }

  const talleresDisponibles = esSuperAdmin
    ? talleres
    : talleres.filter((t) => usuarioActual?.tallerIds.includes(t.id))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        description={esSuperAdmin ? 'Parámetros globales y por taller' : 'Configuración del taller'}
        icon={<Settings className="h-5 w-5" />}
      />

      {esSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-5 w-5 text-accent" />
              Configuración Global
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tipo de cambio */}
            <div className="p-4 rounded-lg border border-accent/30 bg-accent/5">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-5 w-5 text-accent" />
                <h4 className="text-sm font-semibold">Tipo de Cambio</h4>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Todos los precios se ingresan en USD (dólares). El sistema calcula automáticamente el equivalente en CUP (pesos cubanos) usando este tipo de cambio.
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Label>1 USD =</Label>
                  <Input
                    type="number"
                    step="1"
                    value={configGlobal.tipoCambio || 0}
                    onChange={(e) => setConfigGlobal({ ...configGlobal, tipoCambio: Number(e.target.value) })}
                    placeholder="650"
                  />
                </div>
                <div className="text-sm font-semibold pt-5">CUP</div>
              </div>
              <div className="mt-3 p-2 rounded bg-muted text-xs space-y-1">
                <p>Ejemplo con tipo de cambio actual:</p>
                <p>$100.00 USD = <strong>{formatCUP(100 * (configGlobal.tipoCambio || 650))}</strong></p>
                <p>$50.00 USD = <strong>{formatCUP(50 * (configGlobal.tipoCambio || 650))}</strong></p>
                <p>$1000.00 USD = <strong>{formatCUP(1000 * (configGlobal.tipoCambio || 650))}</strong></p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>País</Label>
                <Input
                  value={configGlobal.pais || 'Cuba'}
                  onChange={(e) => setConfigGlobal({ ...configGlobal, pais: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Formato de Ticket</Label>
                <Input
                  value={configGlobal.formatoTicket || ''}
                  onChange={(e) => setConfigGlobal({ ...configGlobal, formatoTicket: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Datos de la Empresa</Label>
                <Textarea
                  value={configGlobal.datosFiscalesEmpresa || ''}
                  onChange={(e) => setConfigGlobal({ ...configGlobal, datosFiscalesEmpresa: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <Button onClick={guardarGlobal}>
              <Save className="h-4 w-4 mr-2" />
              Guardar Configuración Global
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Configuración por taller */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-5 w-5 text-accent" />
            Configuración por Taller
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {talleresDisponibles.length > 1 && (
            <div className="space-y-2">
              <Label>Seleccionar Taller</Label>
              <div className="flex flex-wrap gap-2">
                {talleresDisponibles.map((t) => (
                  <Button
                    key={t.id}
                    variant={tallerEditId === t.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => cambiarTaller(t.id)}
                  >
                    {t.nombre}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {tallerDatos && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del Taller</Label>
                  <Input
                    value={tallerDatos.nombre}
                    onChange={(e) => setTallerDatos({ ...tallerDatos, nombre: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Encargado</Label>
                  <Input
                    value={tallerDatos.encargado || ''}
                    onChange={(e) => setTallerDatos({ ...tallerDatos, encargado: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <Input
                    value={tallerDatos.direccion}
                    onChange={(e) => setTallerDatos({ ...tallerDatos, direccion: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input
                    value={tallerDatos.telefono}
                    onChange={(e) => setTallerDatos({ ...tallerDatos, telefono: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horario Apertura</Label>
                  <Input
                    type="time"
                    value={tallerDatos.horarioApertura || ''}
                    onChange={(e) => setTallerDatos({ ...tallerDatos, horarioApertura: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horario Cierre</Label>
                  <Input
                    type="time"
                    value={tallerDatos.horarioCierre || ''}
                    onChange={(e) => setTallerDatos({ ...tallerDatos, horarioCierre: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Métodos de Pago (separados por coma)</Label>
                  <Input
                    value={tallerDatos.metodosPago}
                    onChange={(e) => setTallerDatos({ ...tallerDatos, metodosPago: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-4 w-4 text-accent" />
                  <h4 className="text-sm font-semibold">Configuración de Garantías</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Garantía por defecto — Productos (días)</Label>
                    <Input
                      type="number"
                      value={tallerDatos.garantiaProductoDias}
                      onChange={(e) => setTallerDatos({ ...tallerDatos, garantiaProductoDias: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Garantía por defecto — Servicios (días)</Label>
                    <Input
                      type="number"
                      value={tallerDatos.garantiaServicioDias}
                      onChange={(e) => setTallerDatos({ ...tallerDatos, garantiaServicioDias: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Plantilla de Texto para Certificados de Garantía</Label>
                  <Textarea
                    value={tallerDatos.plantillaGarantia || ''}
                    onChange={(e) => setTallerDatos({ ...tallerDatos, plantillaGarantia: e.target.value })}
                    rows={4}
                    placeholder="Esta garantía cubre defectos de fabricación e instalación por el período indicado..."
                  />
                </div>
              </div>

              <Button onClick={guardarTaller}>
                <Save className="h-4 w-4 mr-2" />
                Guardar Configuración del Taller
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Información del sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground uppercase">Versión</p>
            <p className="font-semibold">Te Reparo Manager v2.0</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Framework</p>
            <p className="font-semibold">Next.js 16 + TypeScript</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Base de datos</p>
            <p className="font-semibold">PostgreSQL (Online)</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Tipo de Cambio</p>
            <p className="font-semibold">1 USD = {configuracion.tipoCambio || 650} CUP</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
