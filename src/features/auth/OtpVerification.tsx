import { useEffect, useRef, useState, type FormEvent } from 'react'
import { LinkButton, PrimaryButton } from '@/components/ui'
import { verifyOtp } from '@/services/auth.service'
import { AuthHeader, AuthShell, Heading, OTP_LENGTH, RESEND_SECONDS, digitsOnly, type AuthNav } from './AuthShared'

export function OtpVerificationScreen({
  support,
  notify,
  onBack,
  onVerified,
}: AuthNav & { onBack: () => void; onVerified: () => void }) {
  const [code, setCode] = useState('')
  const [focused, setFocused] = useState(false)
  const [error, setError] = useState(false)
  const [seconds, setSeconds] = useState(RESEND_SECONDS)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (seconds <= 0) return
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [seconds])

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 420)
    return () => clearTimeout(t)
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (code.length < OTP_LENGTH) {
      setError(false)
      requestAnimationFrame(() => setError(true))
      inputRef.current?.focus()
      return
    }
    setLoading(true)
    try {
      await verifyOtp(code)
      onVerified()
    } finally {
      setLoading(false)
    }
  }

  const active = Math.min(code.length, OTP_LENGTH - 1)

  return (
    <AuthShell header={<AuthHeader onBack={onBack} onSupport={support} />}>
      <form noValidate onSubmit={submit} className="stagger flex flex-col gap-[32px]">
        <Heading title="Cek Kode Verifikasi" subtitle="Masukkan 6 digit kode yang kami kirim ke WhatsApp" />
        <div className="flex flex-col items-center gap-[16px]">
          <div className={`relative flex w-full items-center gap-[12px] ${error ? '[animation:shake_360ms_ease-in-out]' : ''}`}>
            {Array.from({ length: OTP_LENGTH }, (_, i) => {
              const digit = code[i]
              const isActive = focused && i === active
              return (
                <div
                  key={i}
                  className={`relative flex aspect-square min-w-px flex-1 items-center justify-center overflow-clip rounded-[10px] bg-[#fefef8] transition-[border-color,box-shadow] duration-200 ${
                    isActive
                      ? 'border-[1.5px] border-[#a6bb18] shadow-[0_0_0_3px_rgba(166,187,24,0.12)]'
                      : error && !digit
                        ? 'border border-[#e5484d]'
                        : 'border border-[#ececec]'
                  }`}
                >
                  {digit ? (
                    <span
                      key={digit + i}
                      className="font-['Outfit:SemiBold'] text-[40px] leading-[normal] font-semibold tracking-[-0.2px] text-[#a6bb18] [animation:pop-in_240ms_cubic-bezier(0.2,0.8,0.2,1)]"
                    >
                      {digit}
                    </span>
                  ) : (
                    isActive && <span className="h-[28px] w-[2px] rounded-full bg-[#a6bb18] [animation:caret_1s_steps(1)_infinite]" />
                  )}
                </div>
              )
            })}
            <input
              ref={inputRef}
              aria-label="Kode verifikasi"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={OTP_LENGTH}
              value={code}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onChange={(e) => {
                setError(false)
                setCode(digitsOnly(e.target.value).slice(0, OTP_LENGTH))
              }}
              className="absolute inset-0 size-full cursor-text opacity-0"
            />
          </div>
          <div className="flex items-center gap-[6px] font-['Outfit:Regular'] text-[14px] leading-[normal] font-normal tracking-[-0.2px] whitespace-nowrap">
            {seconds > 0 ? (
              <>
                <p className="text-[#8e8e8e]">Kirim ulang kode dalam</p>
                <p className="text-[#a6bb18] tabular-nums">{`00:${String(seconds).padStart(2, '0')}`}</p>
              </>
            ) : (
              <>
                <p className="text-[#8e8e8e]">Belum terima kode?</p>
                <LinkButton
                  onClick={() => {
                    setSeconds(RESEND_SECONDS)
                    setCode('')
                    notify('Kode baru sudah dikirim')
                  }}
                >
                  Kirim ulang
                </LinkButton>
              </>
            )}
          </div>
        </div>
        <PrimaryButton loading={loading}>Verifikasi Akun</PrimaryButton>
      </form>
    </AuthShell>
  )
}
