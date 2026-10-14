'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Search, Loader2,
} from 'lucide-react'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { cn } from '@/lib/utils'

// ============================================================
// DataTable — Tabla reutilizable con:
//   - 25 registros por página (configurable con pageSize)
//   - Skeleton loading mientras carga
//   - Búsqueda con debounce 300ms
//   - Texto truncado con tooltip (usar <TruncatedText> dentro de render)
//   - Scroll horizontal en tablas anchas (overflow-x-auto)
//   - Overlay "Cargando..." al cambiar de página
// ============================================================

export interface Column<T> {
  key: string
  header: React.ReactNode
  className?: string
  render: (row: T, index: number) => React.ReactNode
  width?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  pageSize?: number
  searchable?: boolean
  searchPlaceholder?: string
  searchFn?: (row: T, query: string) => boolean
  loading?: boolean
  loadingOverlay?: boolean
  emptyMessage?: string
  rowKey?: (row: T, index: number) => string
  rowClassName?: (row: T, index: number) => string
  onRowClick?: (row: T) => void
  toolbar?: React.ReactNode
  className?: string
}

export function DataTable<T>({
  data,
  columns,
  pageSize = 25,
  searchable = true,
  searchPlaceholder = 'Buscar...',
  searchFn,
  loading = false,
  loadingOverlay = false,
  emptyMessage = 'No hay registros',
  rowKey,
  rowClassName,
  onRowClick,
  toolbar,
  className,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)
  const [pageChangeLoading, setPageChangeLoading] = useState(false)

  // Reset page when query changes (debounced)
  useEffect(() => {
    setPage(1)
  }, [debouncedQuery])

  // Filtrar con la query debounced
  const filteredData = useMemo(() => {
    if (!debouncedQuery || !searchFn) return data
    const q = debouncedQuery.toLowerCase()
    return data.filter((row) => searchFn(row, q))
  }, [data, debouncedQuery, searchFn])

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const startIndex = (safePage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const pageData = filteredData.slice(startIndex, endIndex)

  // Mostrar overlay "Cargando..." brevemente al cambiar de página
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === safePage) return
    setPageChangeLoading(true)
    // Pequeño delay para que se vea el overlay (mínimo 200ms)
    setTimeout(() => {
      setPage(newPage)
      setPageChangeLoading(false)
    }, 250)
  }, [totalPages, safePage])

  const showSkeleton = loading && pageData.length === 0

  return (
    <div className={cn('space-y-3', className)}>
      {/* Toolbar: búsqueda + acciones extras */}
      {(searchable || toolbar) && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {searchable && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8"
              />
              {query !== debouncedQuery && (
                <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-muted-foreground" />
              )}
            </div>
          )}
          {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
        </div>
      )}

      {/* Tabla con scroll horizontal */}
      <div className="relative rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={col.className}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Skeleton loading state */}
            {showSkeleton && (
              <>
                {Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {columns.map((col) => (
                      <TableCell key={col.key} className={col.className}>
                        <Skeleton className="h-4 w-full max-w-[180px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </>
            )}

            {/* Empty state */}
            {!showSkeleton && pageData.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-12 text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}

            {/* Data rows */}
            {!showSkeleton && pageData.length > 0 && (
              <>
                {pageData.map((row, index) => {
                  const realIndex = startIndex + index
                  return (
                    <TableRow
                      key={rowKey ? rowKey(row, realIndex) : realIndex}
                      className={cn(
                        onRowClick && 'cursor-pointer hover:bg-muted/50',
                        rowClassName?.(row, realIndex),
                      )}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                    >
                      {columns.map((col) => (
                        <TableCell key={col.key} className={col.className}>
                          {col.render(row, realIndex)}
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })}
              </>
            )}
          </TableBody>
        </Table>

        {/* Overlay "Cargando..." al cambiar de página */}
        {loadingOverlay && pageChangeLoading && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-[1px] flex items-center justify-center z-20">
            <div className="flex items-center gap-2 bg-card border rounded-md px-4 py-2 shadow-md">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Cargando...</span>
            </div>
          </div>
        )}

        {/* Overlay "Cargando..." cuando loading=true (carga inicial) */}
        {loading && !showSkeleton && pageData.length > 0 && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-[1px] flex items-center justify-center z-20">
            <div className="flex items-center gap-2 bg-card border rounded-md px-4 py-2 shadow-md">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Cargando...</span>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredData.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
          <p className="text-muted-foreground">
            Mostrando <strong>{startIndex + 1}</strong>–<strong>{Math.min(endIndex, filteredData.length)}</strong> de <strong>{filteredData.length}</strong> registro{filteredData.length !== 1 ? 's' : ''}
            {query !== debouncedQuery && (
              <span className="ml-2 text-xs text-amber-600">filtrando…</span>
            )}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(1)}
              disabled={safePage === 1}
              title="Primera página"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(safePage - 1)}
              disabled={safePage === 1}
              title="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm font-medium">
              Página <strong>{safePage}</strong> de <strong>{totalPages}</strong>
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(safePage + 1)}
              disabled={safePage === totalPages}
              title="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(totalPages)}
              disabled={safePage === totalPages}
              title="Última página"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
