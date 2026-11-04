import { useState, type InputHTMLAttributes } from 'react'
import { Img } from './Img'

const EYE_CLOSED_ICON = '/assets/b7d53.svg'

function EyeOpen() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden className="block">
      <path
        d="M1.67 10S4.17 4.58 10 4.58 18.33 10 18.33 10 15.83 15.42 10 15.42 1.67 10 1.67 10Z"
        stroke="#054131"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.5" stroke="#054131" strokeWidth="1.5" />
    </svg>
  )
}

export type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  label: string
  error?: string
  password?: boolean
}

export function Field({ label, error, password, ...input }: FieldProps) {
  const [visible, setVisible] = useState(false)
  return (
    <label className="flex w-full flex-col gap-[10px]">
      <span className="font-['Outfit:Regular'] text-[16px] leading-[normal] font-normal tracking-[-0.2px] text-[#054131]">{label}</span>
      <span
        className={`flex w-full items-center gap-[8px] rounded-[12px] border bg-[#fefef8] px-[10px] transition-[border-color,box-shadow] duration-200 focus-within:border-[#a6bb18] focus-within:shadow-[0_0_0_3px_rgba(166,187,24,0.14)] ${
          error ? 'border-[#e5484d] [animation:shake_360ms_ease-in-out]' : 'border-[#ececec]'
        }`}
      >
        <input
          {...input}
          type={password && !visible ? 'password' : input.type ?? 'text'}
          aria-invalid={!!error}
          className="min-w-0 flex-1 bg-transparent py-[14px] font-['Outfit:Regular'] text-[14px] leading-[normal] tracking-[-0.2px] text-[#054131] outline-none transition-colors duration-200 placeholder:text-[#8e8e8e] focus:text-[#a6bb18]"
        />
        {password && (
          <button
            type="button"
            aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            onClick={() => setVisible((v) => !v)}
            className="relative size-[20px] shrink-0 rounded-[4px] transition active:scale-90"
          >
            <span key={String(visible)} className="absolute inset-0 [animation:pop-in_220ms_cubic-bezier(0.2,0.8,0.2,1)]">
              {visible ? <EyeOpen /> : <Img src={EYE_CLOSED_ICON} skeleton="rounded-full" />}
            </span>
          </button>
        )}
      </span>
      {error && (
        <span className="font-['Outfit:Regular'] text-[12px] leading-[normal] text-[#e5484d] [animation:fade-up_220ms_ease-out]">{error}</span>
      )}
    </label>
  )
}

export function Input({
  label,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  if (!label) {
    return (
      <input
        className={`rounded-[8px] border border-[#ececec] px-[12px] py-[10px] font-['Outfit:Regular'] text-[14px] text-[#054131] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#a6bb18] focus:shadow-[0_0_0_3px_rgba(166,187,24,0.14)] ${className}`}
        {...props}
      />
    )
  }

  return (
    <label className="flex flex-col gap-[6px] font-['Outfit:Regular'] text-[12px] text-[#8e8e8e]">
      {label}
      <input
        className={`rounded-[8px] border border-[#ececec] px-[12px] py-[10px] font-['Outfit:Regular'] text-[14px] text-[#054131] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#a6bb18] focus:shadow-[0_0_0_3px_rgba(166,187,24,0.14)] ${className}`}
        {...props}
      />
    </label>
  )
}

