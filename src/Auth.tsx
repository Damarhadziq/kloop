import { useEffect, useRef, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react'
import { LogoLoader, Spinner, Toast, screenClass, useSwitch, useToast } from './ui'

const a = (f: string) => `/assets/${f}`

const icons = {
  back: a('5ceb4.svg'),
  support: a('40c1c.svg'),
  eyeClosed: a('b7d53.svg'),
  heroBill: a('068d6.png'),
  heroMasuk: a('d6d31.png'),
  heroTagihan: a('5ee37.png'),
}

export type Session = { name: string; phone: string }

const OTP_LENGTH = 6
const RESEND_SECONDS = 45
const digitsOnly = (v: string) => v.replace(/\D/g, '')
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/* ---------------- Opening splash ---------------- */

/** Images the first auth screen needs, preloaded while the splash plays. */
export const AUTH_ASSETS = [icons.heroBill, icons.heroMasuk, icons.heroTagihan, icons.support, icons.eyeClosed]

export function Splash({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-white">
      <LogoLoader ready={ready} onDone={onDone} />
    </div>
  )
}

/* ---------------- Shared auth building blocks ---------------- */

function RoundIcon({ label, src, onClick }: { label: string; src: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex shrink-0 items-center rounded-[999px] bg-[#f8f8ec] p-[8px] transition duration-200 hover:bg-[#eef0d6] active:scale-95"
    >
      <span className="relative block size-[24px] shrink-0">
        <img alt="" className="absolute inset-0 block size-full max-w-none" src={src} />
      </span>
    </button>
  )
}

function Brand() {
  return (
    <p className="font-['Courgette:Regular'] text-[24px] leading-[normal] tracking-[-0.3px] whitespace-nowrap text-[#054131]">
      Kloop
    </p>
  )
}

function AuthHeader({ onBack, onSupport }: { onBack?: () => void; onSupport: () => void }) {
  return (
    <header className="flex w-full items-center justify-between [animation:fade-down_420ms_cubic-bezier(0.2,0.8,0.2,1)_both]">
      {onBack ? <RoundIcon label="Kembali" src={icons.back} onClick={onBack} /> : <Brand />}
      {onBack && <Brand />}
      <RoundIcon label="Customer service" src={icons.support} onClick={onSupport} />
    </header>
  )
}

function AuthShell({ header, footer, children }: { header: ReactNode; footer?: ReactNode; children: ReactNode }) {
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

function Heading({ title, subtitle, narrow }: { title: ReactNode; subtitle: string; narrow?: boolean }) {
  return (
    <div className="flex w-full flex-col gap-[6px] tracking-[-0.2px]">
      <div className="font-['Outfit:Medium'] text-[24px] leading-[normal] font-medium text-[#054131]">{title}</div>
      <p className={`${narrow ? 'max-w-[294px]' : ''} font-['Outfit:Regular'] text-[14px] leading-[20px] font-normal text-[#8e8e8e]`}>{subtitle}</p>
    </div>
  )
}

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

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  label: string
  error?: string
  password?: boolean
}

function Field({ label, error, password, ...input }: FieldProps) {
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
              {visible ? <EyeOpen /> : <img alt="" className="absolute inset-0 block size-full max-w-none" src={icons.eyeClosed} />}
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

function PrimaryButton({ children, loading, disabled }: { children: ReactNode; loading?: boolean; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="flex h-[48px] w-full items-center justify-center gap-[8px] rounded-[12px] bg-[#a6bb18] px-[12px] font-['Outfit:Medium'] text-[16px] leading-[normal] font-medium whitespace-nowrap text-white transition duration-200 hover:bg-[#97ab12] active:scale-[0.985] disabled:cursor-default disabled:opacity-70 disabled:hover:bg-[#a6bb18] disabled:active:scale-100"
    >
      {loading ? <Spinner /> : children}
    </button>
  )
}

function LinkButton({ children, onClick, className = '' }: { children: ReactNode; onClick: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={`text-[#a6bb18] transition-opacity hover:opacity-75 ${className}`}>
      {children}
    </button>
  )
}

function SwitchPrompt({ prompt, action, onClick }: { prompt: string; action: string; onClick: () => void }) {
  return (
    <div className="flex items-center justify-center gap-[8px] font-['Outfit:Regular'] text-[14px] leading-[normal] font-normal tracking-[-0.2px] whitespace-nowrap">
      <p className="text-[#054131]">{prompt}</p>
      <LinkButton onClick={onClick}>{action}</LinkButton>
    </div>
  )
}

function useSubmit() {
  const [loading, setLoading] = useState(false)
  const run = async (fn: () => void, ms = 900) => {
    setLoading(true)
    await wait(ms)
    setLoading(false)
    fn()
  }
  return { loading, run }
}

/* ---------------- Screens ---------------- */

function HeroCollage() {
  const card = 'absolute flex items-center justify-center'
  return (
    <div aria-hidden className="relative h-[244px] w-full shrink-0 overflow-clip rounded-[12px] border border-[#ececec] bg-[#f4f4ec]">
      <div className={`${card} top-[-21px] left-[-81px] h-[181.492px] w-[337.085px] [animation:card-in_700ms_cubic-bezier(0.2,0.8,0.2,1)_120ms_both]`}>
        <div className="flex-none rotate-[-4.95deg]">
          <div className="relative h-[154px] w-[325px]">
            <img alt="" className="pointer-events-none absolute inset-0 size-full max-w-none object-cover" src={icons.heroBill} />
          </div>
        </div>
      </div>
      <div className={`${card} top-[-46.02px] left-[130.7px] h-[212.577px] w-[417.209px] [animation:card-in_700ms_cubic-bezier(0.2,0.8,0.2,1)_240ms_both]`}>
        <div className="flex-none rotate-[11.18deg]">
          <div className="relative h-[138px] w-[398px] shadow-[0px_6px_24px_0px_rgba(0,0,0,0.12)]">
            <img alt="" className="pointer-events-none absolute inset-0 size-full max-w-none object-cover" src={icons.heroMasuk} />
          </div>
        </div>
      </div>
      <div className={`${card} top-[100px] left-[-11px] h-[159.124px] w-[404.821px] [animation:card-in_700ms_cubic-bezier(0.2,0.8,0.2,1)_360ms_both]`}>
        <div className="flex-none rotate-[3.07deg]">
          <div className="relative h-[138px] w-[398px]">
            <img alt="" className="pointer-events-none absolute inset-0 size-full max-w-none object-cover" src={icons.heroTagihan} />
          </div>
        </div>
      </div>
    </div>
  )
}

type Nav = {
  go: (s: AuthScreen) => void
  notify: (m: string) => void
  support: () => void
  onAuthed: (s: Session, message: string) => void
}

function LoginScreen({ go, support, onAuthed }: Nav) {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({})
  const { loading, run } = useSubmit()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next = {
      phone: digitsOnly(phone).length < 9 ? 'Nomor telepon belum valid' : undefined,
      password: password.length < 6 ? 'Kata sandi minimal 6 karakter' : undefined,
    }
    setErrors(next)
    if (next.phone || next.password) return
    run(() => onAuthed({ name: 'Kamu', phone: digitsOnly(phone) }, 'Berhasil masuk. Selamat datang kembali!'))
  }

  return (
    <AuthShell
      header={<AuthHeader onSupport={support} />}
      footer={<SwitchPrompt prompt="Belum punya akun?" action="Daftar sekarang" onClick={() => go('register')} />}
    >
      <div className="stagger flex flex-col gap-[32px]">
        <HeroCollage />
        <Heading title="Selamat Datang Kembali!" subtitle="Masuk ke akunmu buat lanjut pantau tagihan." />
        <form noValidate onSubmit={submit} className="flex flex-col gap-[32px]">
          <div className="flex flex-col gap-[16px]">
            <Field
              label="Nomor Telepon"
              placeholder="Masukkan nomor telepon"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={errors.phone}
            />
            <Field
              label="Kata Sandi"
              placeholder="Masukkan kata sandi"
              autoComplete="current-password"
              password
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />
            <div className="flex justify-end">
              <LinkButton onClick={() => go('forgot')} className="font-['Outfit:Regular'] text-[14px] leading-[normal] tracking-[-0.2px]">
                lupa kata sandi
              </LinkButton>
            </div>
          </div>
          <PrimaryButton loading={loading}>Masuk Kloop</PrimaryButton>
        </form>
      </div>
    </AuthShell>
  )
}

function RegisterScreen({ go, support, notify, setPending }: Nav & { setPending: (p: Session) => void }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ name?: string; phone?: string; password?: string }>({})
  const { loading, run } = useSubmit()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next = {
      name: name.trim().length < 2 ? 'Isi nama panggilanmu' : undefined,
      phone: digitsOnly(phone).length < 9 ? 'Nomor telepon belum valid' : undefined,
      password: password.length < 6 ? 'Kata sandi minimal 6 karakter' : undefined,
    }
    setErrors(next)
    if (next.name || next.phone || next.password) return
    run(() => {
      setPending({ name: name.trim(), phone: digitsOnly(phone) })
      notify('Kode verifikasi terkirim ke WhatsApp')
      go('otp-register')
    })
  }

  return (
    <AuthShell
      header={<AuthHeader onSupport={support} />}
      footer={<SwitchPrompt prompt="Sudah punya akun?" action="Masuk" onClick={() => go('login')} />}
    >
      <div className="stagger flex flex-col gap-[32px]">
        <Heading
          title={
            <span className="flex items-baseline gap-[8px] whitespace-nowrap">
              Buat Akun
              <span className="font-['Courgette:Regular'] font-normal tracking-[-0.3px]">Kloop</span>
            </span>
          }
          subtitle="Mulai bagi tagihan bareng teman."
        />
        <form noValidate onSubmit={submit} className="flex flex-col gap-[32px]">
          <div className="flex flex-col gap-[16px]">
            <Field
              label="Nama Panggilan"
              placeholder="Nama yang bakal dilihat teman"
              autoComplete="nickname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />
            <Field
              label="Nomor Telepon"
              placeholder="08xxxxxxxxxx"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={errors.phone}
            />
            <Field
              label="Kata Sandi"
              placeholder="Kata sandi baru"
              autoComplete="new-password"
              password
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />
            <p className="font-['Outfit:Regular'] text-[14px] leading-[22px] font-normal tracking-[-0.2px] text-[#b1b1b1]">
              {'Dengan mendaftar, kamu menyetujui '}
              <LinkButton onClick={() => notify('Ketentuan Layanan segera tersedia')}>{'Ketentuan Layanan & Kebijakan Privasi'}</LinkButton>
              {' Kloop.'}
            </p>
          </div>
          <PrimaryButton loading={loading}>{'Daftar & Kirim Kode'}</PrimaryButton>
        </form>
      </div>
    </AuthShell>
  )
}

function OtpScreen({ support, notify, onBack, onVerified }: Nav & { onBack: () => void; onVerified: () => void }) {
  const [code, setCode] = useState('')
  const [focused, setFocused] = useState(false)
  const [error, setError] = useState(false)
  const [seconds, setSeconds] = useState(RESEND_SECONDS)
  const inputRef = useRef<HTMLInputElement>(null)
  const { loading, run } = useSubmit()

  useEffect(() => {
    if (seconds <= 0) return
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [seconds])

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 420)
    return () => clearTimeout(t)
  }, [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (code.length < OTP_LENGTH) {
      setError(false)
      requestAnimationFrame(() => setError(true))
      inputRef.current?.focus()
      return
    }
    run(onVerified)
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

function ForgotScreen({ go, support, notify }: Nav) {
  const [contact, setContact] = useState('')
  const [error, setError] = useState<string>()
  const { loading, run } = useSubmit()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const ok = contact.includes('@') ? /\S+@\S+\.\S+/.test(contact) : digitsOnly(contact).length >= 9
    setError(ok ? undefined : 'Masukkan nomor HP atau email yang valid')
    if (!ok) return
    run(() => {
      notify('Kode verifikasi terkirim')
      go('otp-reset')
    })
  }

  return (
    <AuthShell header={<AuthHeader onBack={() => go('login')} onSupport={support} />}>
      <form noValidate onSubmit={submit} className="stagger flex flex-col gap-[32px]">
        <Heading
          title="Lupa Kata Sandi?"
          subtitle="Tenang, masukkan nomor HP atau email yang terdaftar untuk mengatur ulang kata sandi."
          narrow
        />
        <Field
          label="Nomor Telepon"
          placeholder="Masukkan kontak terdaftarmu"
          autoComplete="username"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          error={error}
        />
        <PrimaryButton loading={loading}>Kirim Tautan</PrimaryButton>
      </form>
    </AuthShell>
  )
}

function ResetScreen({ go, support, onAuthed }: Nav) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({})
  const { loading, run } = useSubmit()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next = {
      password: password.length < 6 ? 'Kata sandi minimal 6 karakter' : undefined,
      confirm: confirm !== password || !confirm ? 'Kata sandi belum sama' : undefined,
    }
    setErrors(next)
    if (next.password || next.confirm) return
    run(() => onAuthed({ name: 'Kamu', phone: '' }, 'Kata sandi berhasil diperbarui'))
  }

  return (
    <AuthShell header={<AuthHeader onBack={() => go('login')} onSupport={support} />}>
      <form noValidate onSubmit={submit} className="stagger flex flex-col gap-[32px]">
        <Heading title="Buat Kata Sandi Baru" subtitle="Gunakan kombinasi kata sandi yang aman dan mudah kamu ingat." narrow />
        <div className="flex flex-col gap-[16px]">
          <Field
            label="Kata Sandi Baru"
            placeholder="Kata sandi baru"
            autoComplete="new-password"
            password
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <Field
            label="Konfirmasi Kata Sandi Baru"
            placeholder="Ulangi kata sandi baru"
            autoComplete="new-password"
            password
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={errors.confirm}
          />
        </div>
        <PrimaryButton loading={loading}>{'Simpan & Masuk'}</PrimaryButton>
      </form>
    </AuthShell>
  )
}

/* ---------------- Flow ---------------- */

type AuthScreen = 'login' | 'register' | 'otp-register' | 'forgot' | 'otp-reset' | 'reset'

export function AuthFlow({ onAuthed }: { onAuthed: (s: Session, message: string) => void }) {
  const [screen, setScreen] = useState<AuthScreen>('login')
  const [pending, setPending] = useState<Session | null>(null)
  const [toast, notify] = useToast()
  const { shown, leaving } = useSwitch(screen)

  const nav: Nav = {
    go: setScreen,
    notify,
    support: () => notify('Customer service Kloop segera hadir'),
    onAuthed,
  }

  let view: ReactNode
  switch (shown) {
    case 'login':
      view = <LoginScreen {...nav} />
      break
    case 'register':
      view = <RegisterScreen {...nav} setPending={setPending} />
      break
    case 'otp-register':
      view = (
        <OtpScreen
          {...nav}
          onBack={() => setScreen('register')}
          onVerified={() => onAuthed(pending ?? { name: 'Kamu', phone: '' }, 'Akun berhasil dibuat. Selamat datang di Kloop!')}
        />
      )
      break
    case 'forgot':
      view = <ForgotScreen {...nav} />
      break
    case 'otp-reset':
      view = <OtpScreen {...nav} onBack={() => setScreen('forgot')} onVerified={() => setScreen('reset')} />
      break
    case 'reset':
      view = <ResetScreen {...nav} />
      break
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
