import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

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

export function Toast({ message }: { message: string | null }) {
  const [last, setLast] = useState(message)
  const { mounted, closing } = usePresence(!!message, 200)
  useEffect(() => {
    if (message) setLast(message)
  }, [message])
  if (!mounted || !last) return null
  return (
    <div
      role="status"
      className={`fixed bottom-[24px] left-1/2 z-50 max-w-[calc(100vw-32px)] rounded-[10px] bg-[#054131] px-[16px] py-[10px] text-center font-['Outfit:Regular'] text-[14px] text-white shadow-lg ${
        closing ? '[animation:toast-out_200ms_ease-in_forwards]' : '[animation:toast-in_260ms_cubic-bezier(0.2,0.8,0.2,1)]'
      }`}
      style={{ transform: 'translateX(-50%)' }}
    >
      {last}
    </div>
  )
}

/** Bottom sheet with backdrop, Escape-to-close and enter/exit animation. */
export function Sheet({
  open,
  onClose,
  labelledBy,
  className = '',
  children,
}: {
  open: boolean
  onClose: () => void
  labelledBy?: string
  className?: string
  children: ReactNode
}) {
  const { mounted, closing } = usePresence(open, 260)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!mounted) return null
  return (
    <div
      className={`fixed inset-0 z-40 flex items-end justify-center bg-[#054131]/30 ${
        closing ? '[animation:fade-out_260ms_ease-in_forwards]' : '[animation:fade-in_220ms_ease-out]'
      }`}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-[560px] rounded-t-[24px] bg-white ${className} ${
          closing
            ? '[animation:sheet-down_260ms_cubic-bezier(0.4,0,1,1)_forwards]'
            : '[animation:sheet-up_360ms_cubic-bezier(0.2,0.8,0.2,1)]'
        }`}
      >
        {children}
      </div>
    </div>
  )
}

export function Spinner() {
  return (
    <span
      aria-hidden
      className="block size-[18px] rounded-full border-2 border-white/40 border-t-white [animation:spin_700ms_linear_infinite]"
    />
  )
}

/** Sources already downloaded and decoded; these render without a skeleton. */
const loadedSrcs = new Set<string>()

/** Resolves once an image is downloaded and decoded (never rejects). */
export function preloadImage(src: string) {
  if (loadedSrcs.has(src)) return Promise.resolve()
  const img = new Image()
  img.src = src
  return img
    .decode()
    .then(() => {
      loadedSrcs.add(src)
    })
    .catch(() => undefined)
}

/** Warms the cache for images a later screen will need, without blocking the current one. */
export function preloadWhenIdle(srcs: readonly string[]) {
  const run = () => srcs.forEach((s) => void preloadImage(s))
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(run, { timeout: 2000 })
  else setTimeout(run, 300)
}

/**
 * Image that fills its positioned parent. Until the file has loaded it shows a
 * shimmering skeleton in `skeleton`'s shape, then cross-fades to the image.
 * Already-loaded sources render straight away, so revisited screens never flash.
 */
export function Img({
  src,
  alt = '',
  className = '',
  skeleton = 'rounded-[6px]',
}: {
  src: string
  alt?: string
  className?: string
  skeleton?: string
}) {
  const [loaded, setLoaded] = useState(() => loadedSrcs.has(src))
  const [needsSkeleton, setNeedsSkeleton] = useState(() => !loadedSrcs.has(src))
  const ref = useRef<HTMLImageElement>(null)

  // Catches cached images whose load event fired before React attached onLoad.
  useLayoutEffect(() => {
    const el = ref.current
    if (loadedSrcs.has(src) || (el?.complete && el.naturalWidth > 0)) {
      loadedSrcs.add(src)
      setLoaded(true)
    } else {
      setLoaded(false)
      setNeedsSkeleton(true)
    }
  }, [src])

  const done = () => {
    loadedSrcs.add(src)
    setLoaded(true)
  }

  return (
    <>
      {needsSkeleton && (
        <span
          aria-hidden
          onTransitionEnd={() => loaded && setNeedsSkeleton(false)}
          className={`skeleton pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out ${skeleton} ${
            loaded ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}
      <img
        ref={ref}
        alt={alt}
        src={src}
        decoding="async"
        onLoad={done}
        onError={done}
        className={`absolute inset-0 block size-full max-w-none transition-opacity duration-300 ease-out ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
      />
    </>
  )
}

export const KLOOP_LOGO = '/assets/1d1c8.svg'
const LOGO_INTRO_MS = 900
const LOGO_EXIT_MS = 420

/**
 * Main Kloop logo used for every loading moment. It writes itself in, breathes
 * softly while `ready` is false, then lifts away and calls `onDone`. The exit
 * only starts once both the intro has played and the content is ready.
 */
export function LogoLoader({ ready, onDone, width = 118 }: { ready: boolean; onDone: () => void; width?: number }) {
  const [phase, setPhase] = useState<'intro' | 'idle' | 'exit'>('intro')

  useEffect(() => {
    if (phase !== 'intro') return
    const t = setTimeout(() => setPhase('idle'), LOGO_INTRO_MS)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (phase === 'idle' && ready) setPhase('exit')
  }, [phase, ready])

  useEffect(() => {
    if (phase !== 'exit') return
    const t = setTimeout(onDone, LOGO_EXIT_MS)
    return () => clearTimeout(t)
  }, [phase, onDone])

  const motion =
    phase === 'intro'
      ? '[animation:logo-intro_900ms_cubic-bezier(0.6,0,0.3,1)_both]'
      : phase === 'idle'
        ? '[animation:logo-breathe_1600ms_ease-in-out_infinite]'
        : '[animation:logo-exit_420ms_cubic-bezier(0.4,0,0.2,1)_forwards]'

  return (
    <div
      role="img"
      aria-label="Kloop"
      aria-busy={phase !== 'exit'}
      className={`relative shrink-0 ${motion}`}
      style={{ width, height: (width * 27) / 59 }}
    >
      <img alt="" className="absolute inset-0 block size-full max-w-none" src={KLOOP_LOGO} />
    </div>
  )
}
