import type { ReactNode } from 'react'
import { Eyebrow, TituloBrand } from '@/components/qa'
import { cn } from '@/lib/utils'

/** Cabeçalho escuro das abas do sistema (o primeiro cartão da página sobe sobre ele). */
export function AppHeader({
  eyebrow,
  titulo,
  sub,
  children,
  className,
  background,
}: {
  eyebrow?: ReactNode
  titulo: ReactNode
  sub?: ReactNode
  children?: ReactNode
  className?: string
  background?: string
}) {
  return (
    <header
      className={cn('relative overflow-hidden pt-10 pb-28 text-white', !background && 'bg-auth', className)}
      style={background ? { background } : undefined}
    >
      <div className="pointer-events-none absolute inset-0 hero-grid" aria-hidden />
      <div className="relative mx-auto max-w-[1168px] px-5">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <TituloBrand>{titulo}</TituloBrand>
        {sub && <p className="m-0 max-w-[62ch] text-[1.12rem] text-pretty text-hero-text">{sub}</p>}
        {children}
      </div>
    </header>
  )
}

export function Main({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cn('mx-auto w-full max-w-[1168px] flex-1 px-5', className)}>{children}</main>
}

/** Botão "voltar" em pílula, usado nos cabeçalhos escuros. */
export function Voltar({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-white/14 bg-white/8 px-3.5 py-1.5 text-[.88rem] font-semibold text-[#E3E4F7] transition-colors hover:bg-white/14"
    >
      <span aria-hidden>‹</span> {children}
    </button>
  )
}
