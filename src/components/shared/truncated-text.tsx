'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

// ============================================================
// TruncatedText — muestra texto truncado con tooltip al hacer hover.
// ============================================================
// Comportamiento:
//   - Si el texto no cabe en el ancho visible, lo trunca con "…"
//   - Al hacer hover, muestra el texto completo en un tooltip
//   - Si el texto cabe completo, no muestra tooltip (mejor UX)
//
// Props:
//   text: el texto a mostrar (string)
//   className: clases extra (max-w, font-mono, etc.)
//   maxWidth?: ancho máximo en píxeles. Si no se pasa, usa max-w-[200px]
//   lineClamp?: si se pasa > 0, usa line-clamp en lugar de truncar con CSS
// ============================================================

interface TruncatedTextProps {
  text: React.ReactNode
  className?: string
  maxWidth?: string
  lineClamp?: number
}

export function TruncatedText({
  text,
  className,
  maxWidth = 'max-w-[200px]',
  lineClamp,
}: TruncatedTextProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isTruncated, setIsTruncated] = useState(false)

  // Detectar si el texto está truncado comparando scrollWidth vs clientWidth
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => {
      if (lineClamp && lineClamp > 0) {
        setIsTruncated(el.scrollHeight > el.clientHeight)
      } else {
        setIsTruncated(el.scrollWidth > el.clientWidth + 2)
      }
    }
    check()
    // Re-check on resize
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [text, lineClamp])

  const content = (
    <div
      ref={ref}
      className={cn(
        'truncate',
        lineClamp && lineClamp > 0 && `line-clamp-${lineClamp}`,
        !lineClamp && maxWidth,
        className,
      )}
      style={lineClamp && lineClamp > 0 ? {
        display: '-webkit-box',
        WebkitLineClamp: lineClamp,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      } : undefined}
      title={typeof text === 'string' && isTruncated ? text : undefined}
    >
      {text}
    </div>
  )

  // Si no está truncado, devolver el contenido sin Tooltip (mejor performance)
  if (!isTruncated) return content

  // Si está truncado, envolver en Tooltip
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-[400px] break-words whitespace-normal"
        >
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
