import { useCallback, useEffect, useRef, useState } from 'react'

/** Keeps an element mounted while its exit animation plays. */
export function usePresence(open: boolean, exitMs = 240) {
  const [mounted, setMounted] = useState(open)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      setClosing(false)
      return
    }
    if (!mounted) return
    setClosing(true)
    const t = setTimeout(() => {
      setMounted(false)
      setClosing(false)
    }, exitMs)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, exitMs])

  return { mounted, closing }
}

/**
 * Swaps between views with an exit animation: `shown` lags behind `value`
 * until the outgoing view has finished animating out.
 */
export function useSwitch<T>(value: T, exitMs = 220) {
  const [shown, setShown] = useState(value)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (value === shown) {
      setLeaving(false)
      return
    }
    setLeaving(true)
    const t = setTimeout(() => {
      setShown(value)
      setLeaving(false)
      window.scrollTo({ top: 0 })
    }, exitMs)
    return () => clearTimeout(t)
  }, [value, shown, exitMs])

  return { shown, leaving }
}

export const screenClass = (leaving: boolean) =>
  leaving
    ? '[animation:screen-out_220ms_cubic-bezier(0.4,0,1,1)_forwards]'
    : '[animation:screen-in_420ms_cubic-bezier(0.2,0.8,0.2,1)_both]'

export function useToast(duration = 2400) {
  const [toast, setToast] = useState<string | null>(null)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), duration)
    return () => clearTimeout(t)
  }, [toast, duration])
  const show = useCallback((msg: string) => setToast(msg), [])
  return [toast, show] as const
}

/**
 * Locks page scrolling while any overlay is mounted. Counted, so overlays that
 * hand off to each other (one closing while the next opens) never unlock early.
 */
let scrollLocks = 0
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    const root = document.documentElement
    if (scrollLocks++ === 0) root.style.overflow = 'hidden'
    return () => {
      if (--scrollLocks === 0) root.style.overflow = ''
    }
  }, [active])
}

const FONT_FACES = [
  "400 16px 'Outfit:Regular'",
  "500 16px 'Outfit:Medium'",
  "600 16px 'Outfit:SemiBold'",
  "16px 'Courgette:Regular'",
]

export const loadFonts = () =>
  document.fonts ? Promise.all(FONT_FACES.map((f) => document.fonts.load(f).catch(() => undefined))) : Promise.resolve()

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Animates from the currently displayed value to `target` (ease-out cubic). */
export function useCountUp(target: number, duration = 700) {
  const [value, setValue] = useState(target)
  const valueRef = useRef(target)

  useEffect(() => {
    const from = valueRef.current
    if (from === target || prefersReducedMotion()) {
      valueRef.current = target
      setValue(target)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const next = Math.round(from + (target - from) * eased)
      valueRef.current = next
      setValue(next)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}

