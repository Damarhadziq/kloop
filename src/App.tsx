import { useCallback, useEffect, useState } from 'react'
import { Toast, loadFonts, preloadImage, preloadWhenIdle, useSwitch, useToast } from '@/components/ui'
import { AUTH_ASSETS, AuthFlow, Splash } from '@/features/auth'
import { HomeDashboard } from '@/features/home'
import { clearStoredSession, persistSession, readStoredSession } from '@/services/auth.service'
import { HOME_ASSETS, HOME_IMAGES, SCAN_ASSETS } from '@/services/bill.service'
import type { Session } from '@/types'

export default function App() {
  const [session, setSession] = useState<Session | null>(readStoredSession)
  const [splashDone, setSplashDone] = useState(false)
  const [contentReady, setContentReady] = useState(false)
  const [toast, notify] = useToast()

  // The splash stays up until fonts and the first screen's images are ready.
  useEffect(() => {
    let alive = true
    const assets = session ? [HOME_IMAGES.profile, HOME_IMAGES.illustration, ...HOME_IMAGES.stack] : AUTH_ASSETS
    Promise.race([
      Promise.all([loadFonts(), ...assets.map(preloadImage)]),
      new Promise((r) => setTimeout(r, 6000)),
    ]).then(() => {
      if (!alive) return
      setContentReady(true)
      // Warm the screens that come next so they open without placeholders.
      preloadWhenIdle([...HOME_ASSETS, ...SCAN_ASSETS, ...AUTH_ASSETS])
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stage = !splashDone ? 'splash' : session ? 'app' : 'auth'
  const { shown, leaving } = useSwitch(stage, 320)
  const finishSplash = useCallback(() => setSplashDone(true), [])

  const signIn = (s: Session, message: string) => {
    persistSession(s)
    setSession(s)
    setTimeout(() => notify(message), 500)
  }

  const signOut = () => {
    clearStoredSession()
    setSession(null)
  }

  return (
    <>
      <div
        key={shown}
        className={
          leaving
            ? '[animation:stage-out_320ms_cubic-bezier(0.4,0,1,1)_forwards]'
            : '[animation:stage-in_520ms_cubic-bezier(0.2,0.8,0.2,1)_both]'
        }
      >
        {shown === 'splash' && <Splash ready={contentReady} onDone={finishSplash} />}
        {shown === 'auth' && <AuthFlow onAuthed={signIn} />}
        {shown === 'app' && session && <HomeDashboard session={session} onLogout={signOut} notify={notify} />}
      </div>
      <Toast message={toast} />
    </>
  )
}
