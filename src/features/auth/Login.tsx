import { useState, type FormEvent } from 'react'
import { Field, LinkButton, PrimaryButton } from '@/components/ui'
import { login } from '@/services/auth.service'
import { AuthHeader, AuthShell, Heading, SwitchPrompt, digitsOnly, type AuthNav } from './AuthShared'
import { HeroCollage } from './Onboarding'

export function LoginScreen({ go, support, onAuthed }: AuthNav) {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next = {
      phone: digitsOnly(phone).length < 9 ? 'Nomor telepon belum valid' : undefined,
      password: password.length < 6 ? 'Kata sandi minimal 6 karakter' : undefined,
    }
    setErrors(next)
    if (next.phone || next.password) return
    setLoading(true)
    try {
      const res = await login(phone, password)
      onAuthed(res.session, res.message)
    } finally {
      setLoading(false)
    }
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

