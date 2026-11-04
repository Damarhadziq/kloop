import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Img } from './Img'
import { Spinner } from './Spinner'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const styles = {
    primary:
      "bg-[#a6bb18] text-white hover:bg-[#97ab12] active:scale-[0.98] disabled:hover:bg-[#a6bb18]",
    secondary:
      "bg-[#f2f3e6] text-[#a6bb18] hover:bg-[#e8ead2] active:scale-[0.98] disabled:hover:bg-[#f2f3e6]",
    outline:
      "border border-[#ececec] bg-white text-[#054131] hover:bg-[#f8f8ec] active:scale-[0.98]",
    ghost:
      "bg-white text-[#a6bb18] hover:bg-[#f8f8ec] active:scale-[0.98]",
  }

  return (
    <button
      disabled={loading || disabled}
      className={`flex items-center justify-center gap-[6px] rounded-[8px] px-[14px] py-[8px] font-['Outfit:Medium'] text-[14px] leading-[normal] font-medium whitespace-nowrap transition duration-200 disabled:cursor-default disabled:opacity-60 ${styles[variant]} ${className}`}
      {...rest}
    >
      {loading ? <Spinner /> : children}
    </button>
  )
}

export function PrimaryButton({
  children,
  loading,
  disabled,
  type = 'submit',
  onClick,
  className = '',
}: {
  children: ReactNode
  loading?: boolean
  disabled?: boolean
  type?: 'submit' | 'button'
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className={`flex h-[48px] w-full items-center justify-center gap-[8px] rounded-[12px] bg-[#a6bb18] px-[12px] font-['Outfit:Medium'] text-[16px] leading-[normal] font-medium whitespace-nowrap text-white transition duration-200 hover:bg-[#97ab12] active:scale-[0.985] disabled:cursor-default disabled:opacity-70 disabled:hover:bg-[#a6bb18] disabled:active:scale-100 ${className}`}
    >
      {loading ? <Spinner /> : children}
    </button>
  )
}

export function LinkButton({
  children,
  onClick,
  className = '',
}: {
  children: ReactNode
  onClick: () => void
  className?: string
}) {
  return (
    <button type="button" onClick={onClick} className={`text-[#a6bb18] transition-opacity hover:opacity-75 ${className}`}>
      {children}
    </button>
  )
}

export function RoundIconButton({
  label,
  src,
  onClick,
  active,
  skeleton = 'rounded-full',
}: {
  label: string
  src: string
  onClick: () => void
  active?: boolean
  skeleton?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`flex shrink-0 items-center rounded-[999px] p-[8px] transition duration-200 active:scale-95 ${
        active ? 'bg-[#a6bb18]/30 ring-2 ring-[#a6bb18]' : 'bg-[#f8f8ec] hover:bg-[#eef0d6]'
      }`}
    >
      <span className="relative block size-[24px] shrink-0">
        <Img src={src} skeleton={skeleton} />
      </span>
    </button>
  )
}

