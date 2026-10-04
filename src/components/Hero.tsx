import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { UserMenu } from '@/components/UserMenu'

/** Cabeçalho escuro com grade sutil, usado no topo de todas as telas. */
export function Hero({
  children,
  background,
  className,
  grade = 'fade',
}: {
  children: ReactNode
  background?: string
  className?: string
  grade?: 'fade' | 'full'
}) {
  const style: CSSProperties | undefined = background ? { background } : undefined
  return (
    <header className={cn('relative overflow-hidden text-white', !background && 'bg-hero', className)} style={style}>
      <div
        className={cn('pointer-events-none absolute inset-0 hero-grid', grade === 'full' && 'mask-none')}
        aria-hidden
      />
      <div className="relative mx-auto max-w-[1168px] px-5">
        <div className="absolute top-0 right-5">
          <UserMenu />
        </div>
        {children}
      </div>
    </header>
  )
}

export function HeroTitle({ children, size = 'lg' }: { children: ReactNode; size?: 'lg' | 'md' }) {
  return (
    <h1
      className={cn(
        'm-0 w-fit max-w-full pr-14 font-serif font-bold text-brand',
        size === 'lg' ? 'mb-3.5 text-[clamp(2.2rem,5vw,3.4rem)] leading-[1.12]' : 'mb-3 text-[clamp(1.9rem,4.5vw,2.8rem)] leading-[1.12]',
      )}
    >
      {children}
    </h1>
  )
}

export function HeroLead({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('m-0 max-w-[62ch] text-[1.05rem] text-pretty text-hero-text', className)}>{children}</p>
}

export function Main({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cn('mx-auto w-full max-w-[1168px] flex-1 px-5', className)}>{children}</main>
}

/** Card branco que "sobe" sobre o hero. */
export function FloatCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('relative rounded-2xl border bg-card shadow-card', className)}>{children}</div>
  )
}
