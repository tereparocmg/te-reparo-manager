'use client'

import { useState, useEffect } from 'react'

// ============================================================
// useDebouncedValue — devuelve el valor tras `delay` ms de inactividad.
// Ideal para inputs de búsqueda: evita filtrar en cada tecla.
// ============================================================
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

// ============================================================
// useDebouncedSearch — combinación conveniente para tablas:
//   const { query, debouncedQuery, setQuery } = useDebouncedSearch(300)
//   const filtrados = useMemo(() => data.filter(d => match(d, debouncedQuery)), [data, debouncedQuery])
// ============================================================
export function useDebouncedSearch(initialDelay = 300) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, initialDelay)
  return { query, debouncedQuery, setQuery }
}
