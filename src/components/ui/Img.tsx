import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/** Sources already downloaded and verified; these render without a skeleton. */
const loadedSrcs = new Set<string>()
const inflightPreloads = new Map<string, Promise<boolean>>()

// Concurrency limiter so tunnels (e.g. devtunnels.ms) never drop icon requests
const MAX_CONCURRENT_LOADS = 4
let activeLoads = 0
const waitQueue: (() => void)[] = []

function acquireSlot(): Promise<void> {
  if (activeLoads < MAX_CONCURRENT_LOADS) {
    activeLoads++
    return Promise.resolve()
  }
  return new Promise<void>((resolve) => {
    waitQueue.push(() => {
      activeLoads++
      resolve()
    })
  })
}

function releaseSlot() {
  activeLoads = Math.max(0, activeLoads - 1)
  const next = waitQueue.shift()
  if (next) next()
}

export function isImageLoaded(src: string): boolean {
  return !src || loadedSrcs.has(src)
}

export function areAllImagesLoaded(srcs: readonly string[]): boolean {
  return srcs.every((s) => !s || loadedSrcs.has(s))
}

function loadSingleImageWithRetry(src: string, retriesLeft = 3): Promise<boolean> {
  if (!src || loadedSrcs.has(src)) return Promise.resolve(true)

  return acquireSlot().then(
    () =>
      new Promise<boolean>((resolve) => {
        const img = new Image()
        let settled = false

        const finish = (ok: boolean) => {
          if (settled) return
          settled = true
          releaseSlot()
          if (ok) {
            loadedSrcs.add(src)
            resolve(true)
          } else if (retriesLeft > 0) {
            setTimeout(() => {
              loadSingleImageWithRetry(src, retriesLeft - 1).then(resolve)
            }, 350 * (4 - retriesLeft))
          } else {
            resolve(false)
          }
        }

        img.onload = () => {
          // On iOS Safari, img.decode() on SVGs can reject even when onload succeeded.
          if (typeof img.decode === 'function' && !src.endsWith('.svg')) {
            img
              .decode()
              .then(() => finish(true))
              .catch(() => finish(true))
          } else {
            finish(true)
          }
        }

        img.onerror = () => finish(false)
        img.src = src
      }),
  )
}

/** Resolves once an image is downloaded (with automatic retry and tunnel-safe queuing). */
export function preloadImage(src: string): Promise<void> {
  if (!src || loadedSrcs.has(src)) return Promise.resolve()
  const existing = inflightPreloads.get(src)
  if (existing) return existing.then(() => undefined)

  const p = loadSingleImageWithRetry(src, 3).finally(() => {
    inflightPreloads.delete(src)
  })
  inflightPreloads.set(src, p)
  return p.then(() => undefined)
}

/** Preloads a list of images and resolves when all of them are ready. */
export function preloadImages(srcs: readonly string[]): Promise<void> {
  const unique = Array.from(new Set(srcs.filter(Boolean)))
  if (unique.every((s) => loadedSrcs.has(s))) return Promise.resolve()
  return Promise.all(unique.map((s) => preloadImage(s))).then(() => undefined)
}

/** Warms the cache for images a later screen will need, without flooding the network. */
export function preloadWhenIdle(srcs: readonly string[]) {
  const run = () => {
    void preloadImages(srcs)
  }
  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(run, { timeout: 2000 })
  } else {
    setTimeout(run, 300)
  }
}

/**
 * Hook that returns `ready = true` ONLY when all specified `srcs` are completely loaded
 * AND `minSkeletonMs` has elapsed. If even 1 asset is not ready, returns `false` so
 * the caller displays a Skeleton first.
 */
export function useAssetsReady(
  srcs: readonly string[],
  minSkeletonMs = 320,
  triggerKey: string | number = '',
): boolean {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let alive = true
    setReady(false)
    const start = performance.now()

    Promise.all([
      preloadImages(srcs),
      new Promise<void>((r) => setTimeout(r, minSkeletonMs)),
    ]).then(() => {
      if (!alive) return
      const elapsed = performance.now() - start
      const remaining = Math.max(0, minSkeletonMs - elapsed)
      if (remaining > 0) {
        setTimeout(() => alive && setReady(true), remaining)
      } else {
        setReady(true)
      }
    })

    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcs.join('|'), minSkeletonMs, triggerKey])

  return ready
}

/**
 * Image that fills its positioned parent. Until the file has genuinely loaded it shows a
 * shimmering skeleton in `skeleton`'s shape, then cross-fades to the image.
 * If a network error occurs (e.g. tunnel throttling), it keeps the skeleton visible
 * and retries automatically so icons never disappear.
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
  const [attempt, setAttempt] = useState(0)
  const ref = useRef<HTMLImageElement>(null)

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

  const handleLoad = () => {
    loadedSrcs.add(src)
    setLoaded(true)
  }

  const handleError = () => {
    // Keep skeleton visible and retry loading up to 4 times
    setLoaded(false)
    setNeedsSkeleton(true)
    if (attempt < 4) {
      setTimeout(() => {
        setAttempt((a) => a + 1)
      }, 450 * (attempt + 1))
    }
  }

  const effectiveSrc = attempt > 0 && !src.startsWith('data:') && !src.startsWith('blob:')
    ? `${src}${src.includes('?') ? '&' : '?'}retry=${attempt}`
    : src

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
        src={effectiveSrc}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`absolute inset-0 block size-full max-w-none transition-opacity duration-300 ease-out ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
      />
    </>
  )
}
