import { useState, type FormEvent } from 'react'
import { Field, LinkButton, PrimaryButton } from '@/components/ui'
import { registerUser } from '@/services/auth.service'
import type { Session } from '@/types'
import { AuthHeader, AuthShell, Heading, SwitchPrompt, digitsOnly, type AuthNav } from './AuthShared'

export function SignUpScreen({ go, support, notify, setPending }: AuthNav & { setPending: (p: Session) => void }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ name?: string; phone?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next = {
      name: name.trim().length < 2 ? 'Isi nama panggilanmu' : undefined,
      phone: digitsOnly(phone).length < 9 ? 'Nomor telepon belum valid' : undefined,
      password: password.length < 6 ? 'Kata sandi minimal 6 karakter' : undefined,
    }
    setErrors(next)
    if (next.name || next.phone || next.password) return
    setLoading(true)
    try {
      const res = await registerUser(name, phone, password)
      setPending(res.pendingSession)
      notify(res.message)
      go('otp-register')
    } finally {
      setLoading(false)
    }
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

