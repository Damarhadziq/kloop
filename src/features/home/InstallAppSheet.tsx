import { useEffect, useState } from 'react'
import { Sheet } from '@/components/ui'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredInstallPrompt = e as BeforeInstallPromptEvent
  })
}

export function InstallAppSheet({
  open,
  onClose,
  notify,
}: {
  open: boolean
  onClose: () => void
  notify: (msg: string) => void
}) {
  const isIOSDevice =
    typeof navigator !== 'undefined' &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

  const [platformTab, setPlatformTab] = useState<'ios' | 'android'>(isIOSDevice ? 'ios' : 'android')
  const [canInstallNative, setCanInstallNative] = useState(() => Boolean(deferredInstallPrompt))
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const checkStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
    setIsStandalone(checkStandalone)

    const onPrompt = (e: Event) => {
      e.preventDefault()
      deferredInstallPrompt = e as BeforeInstallPromptEvent
      setCanInstallNative(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const handleTriggerNativeInstall = async () => {
    if (!deferredInstallPrompt) {
      notify('Ikuti langkah menu browser di bawah untuk menginstal Kloop')
      return
    }
    await deferredInstallPrompt.prompt()
    const choice = await deferredInstallPrompt.userChoice
    if (choice.outcome === 'accepted') {
      deferredInstallPrompt = null
      setCanInstallNative(false)
      notify('Aplikasi Kloop berhasil diinstal ke layar utama!')
      onClose()
    }
  }

  return (
    <Sheet open={open} onClose={onClose} labelledBy="install-app-title">
      <div className="flex flex-col gap-[16px] p-[20px] pt-[8px] pb-[32px] text-[#054131]">
        <div className="mx-auto h-[4px] w-[64px] shrink-0 rounded-[12px] bg-[#dedede]" />

        <div className="flex items-start justify-between gap-[10px] pt-[6px]">
          <div className="flex flex-col gap-[4px]">
            <div className="flex items-center gap-[8px]">
              <p
                id="install-app-title"
                className="font-['Outfit:Medium'] text-[18px] font-medium tracking-[-0.2px] text-[#054131]"
              >
                Download Aplikasi Kloop
              </p>
              <span className="rounded-[6px] bg-[#f2f3e6] px-[8px] py-[2px] font-['Outfit:Medium'] text-[11px] font-medium text-[#a6bb18]">
                iOS & Android
              </span>
            </div>
            <p className="font-['Outfit:Regular'] text-[13px] text-[#8e8e8e]">
              Pasang Kloop di layar utama HP agar tampil layar penuh seperti aplikasi native.
            </p>
          </div>
        </div>

        {isStandalone && (
          <div className="rounded-[10px] bg-[#2acb70]/12 px-[12px] py-[10px] font-['Outfit:Medium'] text-[13px] text-[#2acb70]">
            ✓ Kamu sudah menjalankan Kloop dalam mode Aplikasi Terinstal.
          </div>
        )}

        {/* Platform Switcher */}
        <div className="grid grid-cols-2 gap-[8px] rounded-[10px] border border-[#ececec] bg-white p-[6px]">
          {(
            [
              { id: 'ios', label: 'iPhone / iOS (Safari)' },
              { id: 'android', label: 'Android (Chrome)' },
            ] as const
          ).map((t) => {
            const active = platformTab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setPlatformTab(t.id)}
                className={`rounded-[8px] py-[8px] px-[10px] font-['Outfit:Medium'] text-[13px] font-medium transition ${
                  active ? 'bg-[#a6bb18] text-white' : 'bg-white text-[#8e8e8e] hover:bg-[#f8f8ec]'
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        {platformTab === 'ios' ? (
          <div className="flex flex-col gap-[10px] rounded-[12px] border border-[#ececec] bg-[#fefef8] p-[14px]">
            <p className="font-['Outfit:Medium'] text-[14px] font-medium text-[#054131]">
              Cara Install di iPhone / iPad (Tanpa App Store):
            </p>
            <ol className="flex flex-col gap-[10px] font-['Outfit:Regular'] text-[13px] leading-[19px] text-[#054131]">
              <li className="flex items-start gap-[10px]">
                <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[#f2f3e6] font-['Outfit:SemiBold'] text-[12px] font-semibold text-[#a6bb18]">
                  1
                </span>
                <span>
                  Buka link Kloop ini menggunakan browser <strong>Safari</strong> di iPhone/iPad kamu.
                </span>
              </li>
              <li className="flex items-start gap-[10px]">
                <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[#f2f3e6] font-['Outfit:SemiBold'] text-[12px] font-semibold text-[#a6bb18]">
                  2
                </span>
                <span>
                  Ketuk ikon <strong>Share / Bagikan</strong> (kotak dengan panah ke atas{' '}
                  <span className="inline-block rounded bg-[#ececec] px-[5px] py-[1px] font-mono text-[11px]">↑</span>)
                  di bagian bawah layar Safari.
                </span>
              </li>
              <li className="flex items-start gap-[10px]">
                <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[#f2f3e6] font-['Outfit:SemiBold'] text-[12px] font-semibold text-[#a6bb18]">
                  3
                </span>
                <span>
                  Geser ke bawah lalu pilih <strong>&ldquo;Add to Home Screen&rdquo;</strong> (atau{' '}
                  <strong>&ldquo;Tambah ke Layar Utama&rdquo;</strong>), lalu ketuk <strong>Add / Tambah</strong>.
                </span>
              </li>
            </ol>
          </div>
        ) : (
          <div className="flex flex-col gap-[12px] rounded-[12px] border border-[#ececec] bg-[#fefef8] p-[14px]">
            {canInstallNative && (
              <button
                type="button"
                onClick={() => void handleTriggerNativeInstall()}
                className="flex w-full items-center justify-center gap-[8px] rounded-[10px] bg-[#a6bb18] py-[11px] px-[14px] font-['Outfit:Medium'] text-[14px] font-medium text-white transition hover:bg-[#97ab12] active:scale-[0.98]"
              >
                <span>Download & Install Sekarang</span>
              </button>
            )}
            <p className="font-['Outfit:Medium'] text-[14px] font-medium text-[#054131]">
              Cara Install di HP Android (Chrome):
            </p>
            <ol className="flex flex-col gap-[10px] font-['Outfit:Regular'] text-[13px] leading-[19px] text-[#054131]">
              <li className="flex items-start gap-[10px]">
                <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[#f2f3e6] font-['Outfit:SemiBold'] text-[12px] font-semibold text-[#a6bb18]">
                  1
                </span>
                <span>
                  Ketuk ikon <strong>Titik Tiga (⋮)</strong> di pojok kanan atas browser Chrome.
                </span>
              </li>
              <li className="flex items-start gap-[10px]">
                <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[#f2f3e6] font-['Outfit:SemiBold'] text-[12px] font-semibold text-[#a6bb18]">
                  2
                </span>
                <span>
                  Pilih menu <strong>&ldquo;Install app&rdquo; / &ldquo;Instal aplikasi&rdquo;</strong> atau{' '}
                  <strong>&ldquo;Tambahkan ke Layar Utama&rdquo;</strong>.
                </span>
              </li>
            </ol>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-[10px] bg-[#f2f3e6] py-[10px] font-['Outfit:Medium'] text-[14px] font-medium text-[#a6bb18] transition hover:bg-[#e8ead2]"
        >
          Mengerti
        </button>
      </div>
    </Sheet>
  )
}
