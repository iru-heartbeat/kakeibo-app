import { useEffect, useState } from 'react'

export function usePrefersDark(): boolean {
  const [prefersDark, setPrefersDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  )

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setPrefersDark(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return prefersDark
}
