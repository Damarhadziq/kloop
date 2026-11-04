import type { ReactNode } from 'react'
import { LinkButton, RoundIconButton } from '@/components/ui'
import { HOME_IMAGES, INITIAL_BILLS } from '@/services/bill.service'
import type { Session } from '@/types'

const a = (f: string) => `/assets/${f}`

export const authIcons = {
  back: a('5ceb4.svg'),
  support: a('40c1c.svg'),
  eyeClosed: a('b7d53.svg'),
  heroBill: a('068d6.png'),
  heroMasuk: a('d6d31.png'),
  heroTagihan: a('5ee37.png'),
} as const

/** Images the first auth screen needs, preloaded while the splash plays. */
export const AUTH_ASSETS = [
  authIcons.support,
  authIcons.eyeClosed,
  authIcons.back,
  HOME_IMAGES.cashOut,
  HOME_IMAGES.bell,
  HOME_IMAGES.chefHat,
  HOME_IMAGES.dashedLine,
  HOME_IMAGES.verified,
  HOME_IMAGES.bellSmall,
  ...HOME_IMAGES.stack,
  ...INITIAL_BILLS[0].participants.map((p) => p.avatarUrl),
]

export const OTP_LENGTH = 6
export const RESEND_SECONDS = 45
export const digitsOnly = (v: string) => v.replace(/\D/g, '')

export type AuthScreen = 'login' | 'register' | 'otp-register' | 'forgot' | 'otp-reset' | 'reset'

export type AuthNav = {
  go: (s: AuthScreen) => void
  notify: (m: string) => void
  support: () => void
  onAuthed: (s: Session, message: string) => void
}

export function Brand() {
  return (
    <p className="font-['Courgette:Regular'] text-[24px] leading-[normal] tracking-[-0.3px] whitespace-nowrap text-[#054131]">
      Kloop
    </p>
  )
}

export function AuthHeader({ onBack, onSupport }: { onBack?: () => void; onSupport: () => void }) {
  return (
    <header className="flex w-full items-center justify-between [animation:fade-down_420ms_cubic-bezier(0.2,0.8,0.2,1)_both]">
      {onBack ? <RoundIconButton label="Kembali" src={authIcons.back} onClick={onBack} /> : <Brand />}
      {onBack && <Brand />}
      <RoundIconButton label="Customer service" src={authIcons.support} onClick={onSupport} />
    </header>
  )
}

export function AuthShell({ header, footer, children }: { header: ReactNode; footer?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full flex-col bg-white text-[#054131]">
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-[16px] pt-[24px] pb-[28px] md:pt-[40px]">
        {header}
        <div className="mt-[32px] flex flex-col">{children}</div>
        {footer && <div className="mt-auto pt-[40px] [animation:fade-in_500ms_ease-out_400ms_both]">{footer}</div>}
      </div>
    </div>
  )
}

export function Heading({ title, subtitle, narrow }: { title: ReactNode; subtitle: string; narrow?: boolean }) {
  return (
    <div className="flex w-full flex-col gap-[6px] tracking-[-0.2px]">
      <div className="font-['Outfit:Medium'] text-[24px] leading-[normal] font-medium text-[#054131]">{title}</div>
      <p
        className={`${narrow ? 'max-w-[294px]' : ''} font-['Outfit:Regular'] text-[14px] leading-[20px] font-normal text-[#8e8e8e]`}
      >
        {subtitle}
      </p>
    </div>
  )
}

export function SwitchPrompt({ prompt, action, onClick }: { prompt: string; action: string; onClick: () => void }) {
  return (
    <div className="flex items-center justify-center gap-[8px] font-['Outfit:Regular'] text-[14px] leading-[normal] font-normal tracking-[-0.2px] whitespace-nowrap">
      <p className="text-[#054131]">{prompt}</p>
      <LinkButton onClick={onClick}>{action}</LinkButton>
    </div>
  )
}
