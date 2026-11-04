import { useCallback, useEffect, useState } from 'react'

export function Skeleton({
  className = '',
  tone = 'soft',
}: {
  className?: string
  tone?: 'soft' | 'muted'
}) {
  const bg = tone === 'soft' ? 'bg-[#F2F3E6]' : 'bg-[#ECECEC]'
  return <div aria-hidden className={`animate-pulse rounded-[8px] ${bg} ${className}`} />
}

/**
 * Custom hook that manages an `isLoading` state with a simulated 700ms-1000ms delay
 * so Skeleton Loading transitions are visible and smooth in the frontend.
 */
export function useSimulatedLoading(initialLoading = true, delayMs = 800) {
  const [isLoading, setIsLoading] = useState(initialLoading)

  useEffect(() => {
    if (!initialLoading) return
    const timer = setTimeout(() => setIsLoading(false), delayMs)
    return () => clearTimeout(timer)
  }, [initialLoading, delayMs])

  const triggerLoading = useCallback(
    (customDelayMs = delayMs) => {
      setIsLoading(true)
      const timer = setTimeout(() => setIsLoading(false), customDelayMs)
      return () => clearTimeout(timer)
    },
    [delayMs],
  )

  return { isLoading, setIsLoading, triggerLoading }
}

