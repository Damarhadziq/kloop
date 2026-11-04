import type { HTMLAttributes, ReactNode } from 'react'

export function Card({
  children,
  className = '',
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex w-full flex-col rounded-[12px] border border-[#ececec] bg-white p-[12px] ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

