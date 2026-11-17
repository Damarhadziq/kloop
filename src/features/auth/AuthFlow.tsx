import { useState, type ReactNode } from 'react'
import { AuthScreenSkeleton } from '@/components/skeletons'
import { Toast, screenClass, useAssetsReady, useSwitch, useToast } from '@/components/ui'
import type { Session } from '@/types'
import { AUTH_ASSETS, AuthHeader, AuthShell, type AuthNav, type AuthScreen } from './AuthShared'
import { ForgotScreen, ResetScreen } from './ForgotPassword'
import { LoginScreen } from './Login'
import { OtpVerificationScreen } from './OtpVerification'
import { SignUpScreen } from './SignUp'

export function AuthFlow({ onAuthed }: { onAuthed: (s: Session, message: string) => void }) {
  const [screen, setScreen] = useState<AuthScreen>('login')
  const [pending, setPending] = useState<Session | null>(null)
  const [toast, notify] = useToast()
  const { shown, leaving } = useSwitch(screen)
  const ready = useAssetsReady(AUTH_ASSETS, 260, shown)

  const nav: AuthNav = {
    go: setScreen,
    notify,
    support: () => notify('Customer service Kloop segera hadir'),
    onAuthed,
  }

  let view: ReactNode
  if (!ready) {
    view = (
      <AuthShell header={<AuthHeader onBack={shown !== 'login' ? () => setScreen('login') : undefined} onSupport={nav.support} />}>
        <AuthScreenSkeleton showHero={shown === 'login'} />
      </AuthShell>
    )
  } else {
    switch (shown) {
      case 'login':
        view = <LoginScreen {...nav} />
        break
      case 'register':
        view = <SignUpScreen {...nav} setPending={setPending} />
        break
      case 'otp-register':
        view = (
          <OtpVerificationScreen
            {...nav}
            onBack={() => setScreen('register')}
            onVerified={() =>
              onAuthed(pending ?? { name: 'Kamu', phone: '' }, 'Akun berhasil dibuat. Selamat datang di Kloop!')
            }
          />
        )
        break
      case 'forgot':
        view = <ForgotScreen {...nav} />
        break
      case 'otp-reset':
        view = <OtpVerificationScreen {...nav} onBack={() => setScreen('forgot')} onVerified={() => setScreen('reset')} />
        break
      case 'reset':
        view = <ResetScreen {...nav} />
        break
    }
  }

  return (
    <>
      <div key={shown} className={screenClass(leaving)}>
        {view}
      </div>
      <Toast message={toast} />
    </>
  )
}
