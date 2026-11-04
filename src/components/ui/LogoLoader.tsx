import { useEffect, useState } from 'react'

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

