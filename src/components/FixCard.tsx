import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { Assunto } from '@/lib/assuntos'

/** Seta de expandir/recolher. */
export function Chevron({ aberto }: { aberto: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden
      className={cn('flex-none self-center text-q-muted transition-transform duration-200', !aberto && '-rotate-90')}
    >
      <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Check({ size = 12, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 8.5l3.2 3L13 4.5" />
    </svg>
  )
}

/**
 * Cartão expansível de uma ocorrência ou item do lote: barra colorida à esquerda, marcador
 * (seleção ou concluído), cabeçalho clicável e corpo quando aberto.
 */
export function FixCard({
  barra,
  marcador,
  cabecalho,
  aberto,
  onToggle,
  children,
  raio = 12,
  apagado = false,
}: {
  barra: string
  marcador: ReactNode
  cabecalho: ReactNode
  aberto: boolean
  onToggle: () => void
  children?: ReactNode
  raio?: 10 | 12
  apagado?: boolean
}) {
  return (
    <article
      className={cn(
        'relative overflow-hidden border border-q-line bg-q-card transition-[box-shadow,opacity] duration-200 hover:shadow-[0_6px_18px_rgba(17,20,48,.08)]',
        raio === 10 ? 'rounded-[10px]' : 'rounded-xl',
        apagado && 'opacity-[.78]',
      )}
    >
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: barra }} aria-hidden />
      <div className="flex items-start gap-3 py-3.5 pr-[18px] pl-5">
        {marcador}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={aberto}
          className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2.5 gap-y-1 bg-transparent p-0 text-left text-inherit"
        >
          {cabecalho}
          <Chevron aberto={aberto} />
        </button>
      </div>
      {aberto && <div className="pr-[18px] pb-[18px] pl-14">{children}</div>}
    </article>
  )
}

/** Título do item no cabeçalho do cartão. */
export function TituloFix({ children }: { children: ReactNode }) {
  return <span className="flex-[1_1_300px] text-[1.02rem] leading-[1.4] font-semibold">{children}</span>
}

/** Etiqueta "Prioridade alta". */
export function Alta() {
  return <span className="rounded-full bg-q-warn-bg px-2.5 py-0.5 text-[.78rem] font-semibold text-q-warn">Prioridade alta</span>
}

/** Etiqueta de assunto (bolinha colorida + nome), usada na visão em lista. */
export function TagAssunto({ a }: { a: Assunto }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-q-line px-[9px] py-px text-[.78rem] font-semibold text-q-muted">
      <span className="size-2 rounded-full" style={{ background: a.cor }} />
      {a.nome}
    </span>
  )
}

/** Cabeçalho do grupo de assunto (ícone, nome, contagem e linha). */
export function CabecalhoAssunto({ a, txt, primeiro }: { a: Assunto; txt: string; primeiro: boolean }) {
  return (
    <div className={cn('flex items-center gap-3', !primeiro && 'mt-[22px]')}>
      <span
        className="grid size-[34px] flex-none place-items-center rounded-[10px] font-mono text-[.74rem] font-semibold text-navy-deep"
        style={{ background: a.cor }}
      >
        {a.ini}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[1.05rem] font-semibold">{a.nome}</span>
        <span className="text-[.8rem] text-q-muted">{txt}</span>
      </span>
      <span className="h-px flex-1 bg-q-line" />
    </div>
  )
}
