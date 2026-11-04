import { Img } from './Img'

export function Icon({ src, size, round }: { src: string; size: number; round?: boolean }) {
  return (
    <span className="relative block shrink-0" style={{ width: size, height: size }}>
      <Img src={src} skeleton={round ? 'rounded-full' : 'rounded-[5px]'} />
    </span>
  )
}

export function Avatar({
  src,
  alt = '',
  size = 24,
  ring = false,
  className = '',
}: {
  src: string
  alt?: string
  size?: number
  ring?: boolean
  className?: string
}) {
  return (
    <span className={`relative block shrink-0 ${className}`} style={{ width: size, height: size }}>
      <Img src={src} alt={alt} skeleton={ring ? 'rounded-full ring-2 ring-white' : 'rounded-full'} />
    </span>
  )
}

