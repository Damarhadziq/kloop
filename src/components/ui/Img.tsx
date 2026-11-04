import { useLayoutEffect, useRef, useState } from 'react'

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

