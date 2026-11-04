import { Icon } from '@/components/ui'
import { CIRCLE_AVATARS, HOME_IMAGES, type CircleName } from '@/services/bill.service'

export function CircleSection({
  circle,
  managing,
  onToggleManage,
  onRemoveFriend,
}: {
  circle: CircleName[]
  managing: boolean
  onToggleManage: () => void
  onRemoveFriend: (name: CircleName) => void
}) {
  return (
    <section className="flex flex-col gap-[16px] px-[16px] md:px-0">
      <div className="flex items-center justify-between">
        <h2 className="font-['Outfit:Medium'] text-[18px] leading-[normal] font-medium tracking-[-0.2px]">
          Circle Kamu
        </h2>
        <button
          onClick={onToggleManage}
          className="flex items-center justify-center gap-[4px] rounded-[6px] bg-white transition hover:opacity-80"
        >
          <Icon src={HOME_IMAGES.usersGroup} size={18} />
          <span className="font-['Outfit:Regular'] text-[14px] leading-[normal] font-normal whitespace-nowrap text-[#a6bb18]">
            {managing ? 'Selesai' : 'Manage'}
          </span>
        </button>
      </div>
      <div className="grid grid-cols-3 gap-[14px]">
        {circle.map((name) => (
          <div key={name} className="flex min-w-0 items-center gap-[6px]">
            <Icon src={CIRCLE_AVATARS[name]} size={24} round />
            <p className="truncate font-['Outfit:Regular'] text-[14px] leading-[normal] font-normal tracking-[-0.2px] whitespace-nowrap">
              {name}
            </p>
            {managing && (
              <button
                aria-label={`Hapus ${name}`}
                onClick={() => onRemoveFriend(name)}
                className="ml-auto flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[#f2f3e6] text-[#8e8e8e] hover:bg-[#fde4e4] hover:text-[#d14343]"
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden>
                  <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        ))}
        {circle.length === 0 && (
          <p className="col-span-3 font-['Outfit:Regular'] text-[14px] text-[#8e8e8e]">Circle kamu masih kosong.</p>
        )}
      </div>
    </section>
  )
}

