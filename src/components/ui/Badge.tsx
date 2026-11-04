import type { ReactNode } from 'react'

export function Badge({
  children,
  variant = 'neutral',
  className = '',
}: {
  children: ReactNode
  variant?: 'neutral' | 'primary' | 'settled' | 'warning'
  className?: string
}) {
  const variants = {
    neutral: 'border border-[#ececec] bg-[#f9f9f9] text-[#054131]',
    primary: 'bg-[#f2f3e6] text-[#a6bb18]',
    settled: 'bg-[#2acb70]/12 text-[#2acb70]',
    warning: 'bg-[#f2f3e6] text-[#8e8e8e]',
  }
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-[6px] px-[8px] pb-px font-['Outfit:Regular'] text-[14px] leading-[18px] font-normal whitespace-nowrap ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

