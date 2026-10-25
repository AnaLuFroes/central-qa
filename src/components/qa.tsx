// Peças pequenas do visual da Central de QA, reaproveitadas em todas as telas.
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { Cor3 } from '@/lib/status'
import type { SegBarra } from '@/lib/painel'

/** Campo de formulário dos modais e páginas claras. */
export const inputCls =
  'w-full rounded-md border border-q-line bg-q-bg px-2.5 py-2 text-[.95rem] text-q-ink outline-none transition placeholder:text-q-muted/70 focus:border-q-accent focus:ring-3 focus:ring-q-soft'
/** Campo das telas escuras (login, cadastro, conta). */
export const inputEscuroCls =
  'w-full rounded-[10px] border border-white/18 bg-white/6 px-3 py-2.5 text-[.98rem] text-white outline-none transition placeholder:text-white/40 focus:border-cyan'
export const labelCls = 'mb-1 block text-[.86rem] font-semibold text-q-ink'
export const labelEscuroCls = 'mb-1.5 block text-[.86rem] font-semibold text-hero-text'

export function Logo({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="Central de QA"
      width={size}
      height={size}
      className={cn('block', className)}
      style={{ width: size, height: size, borderRadius: Math.round(size / 3.75) }}
    />
  )
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('m-0 mb-3 font-mono text-[.78rem] tracking-[.14em] text-cyan', className)}>{children}</p>
}

export function TituloBrand({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h1
      className={cn(
        'm-0 mb-3 w-fit max-w-full font-serif text-[clamp(2.2rem,5vw,3.4rem)] leading-[1.1] font-bold text-brand',
        className,
      )}
    >
      {children}
    </h1>
  )
}

/** Etiqueta arredondada com as cores de um status. */
export function Pill({ cor, children, className }: { cor: Cor3 | readonly [string, string, string]; children?: ReactNode; className?: string }) {
  return (
    <span
      className={cn('inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[.78rem] font-semibold whitespace-nowrap', className)}
      style={{ color: cor[1], background: cor[2] }}
    >
      {children ?? cor[0]}
    </span>
  )
}

/** Código fixo da ocorrência (SO5-001) ou do item (FIX 01). */
export function CodTag({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <span
      className={cn('flex-none rounded-[5px] bg-q-track px-[7px] py-0.5 font-mono text-[.76rem] font-semibold text-q-muted', className)}
      style={style}
    >
      {children}
    </span>
  )
}

export function TipoTag({ tipo }: { tipo: 'erro' | 'melhoria' }) {
  return tipo === 'erro' ? (
    <span className="flex-none rounded-[5px] bg-q-red-bg px-[7px] py-0.5 font-mono text-[.76rem] font-semibold text-q-red">ERRO</span>
  ) : (
    <span className="flex-none rounded-[5px] bg-q-soft px-[7px] py-0.5 font-mono text-[.76rem] font-semibold text-q-accent">MELHORIA</span>
  )
}

/** Barra de progresso em gradiente. */
export function Progresso({ pct, alto = 8, className }: { pct: number; alto?: number; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-full bg-q-track', className)} style={{ height: alto }}>
      <div className="h-full rounded-full bg-brand-bar transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  )
}

/** Barra segmentada (status por cor). */
export function SegBar({ segs, alto = 6, className }: { segs: SegBarra[]; alto?: number; className?: string }) {
  return (
    <div className={cn('flex overflow-hidden rounded-full bg-q-track', className)} style={{ height: alto }}>
      {segs.map((s, i) => (
        <span key={i} title={s.titulo} className="h-full" style={{ width: `${s.pct}%`, background: s.cor }} />
      ))}
    </div>
  )
}

export interface Chip<K extends string> {
  k: K
  label: ReactNode
  n?: number
}

/** Grupo de filtros em pílulas (ativo em azul-marinho). */
export function Chips<K extends string>({
  itens,
  valor,
  onChange,
  className,
  label,
}: {
  itens: Chip<K>[]
  valor: K
  onChange: (k: K) => void
  className?: string
  label?: string
}) {
  return (
    <div role="tablist" aria-label={label} className={cn('flex flex-wrap gap-2', className)}>
      {itens.map((c) => {
        const on = c.k === valor
        return (
          <button
            key={c.k}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(c.k)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[.88rem] font-semibold transition-colors',
              on ? 'border-q-chip bg-q-chip text-white' : 'border-q-line bg-q-card text-q-muted hover:border-q-accent hover:text-q-accent',
            )}
          >
            {c.label}
            {c.n != null && (
              <span className={cn('rounded-full px-1.5 font-mono text-[.7rem]', on ? 'bg-white/15' : 'bg-q-track')}>{c.n}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Cartão branco padrão (radius 12/16/20). */
export function Cartao({
  children,
  className,
  r = 16,
  sombra = true,
}: {
  children: ReactNode
  className?: string
  r?: 12 | 16 | 20
  sombra?: boolean
}) {
  return (
    <div
      className={cn(
        'relative border border-q-line bg-q-card',
        r === 12 ? 'rounded-xl' : r === 16 ? 'rounded-2xl' : 'rounded-3xl',
        sombra && (r === 20 ? 'shadow-float' : 'shadow-card'),
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Vazio({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-dashed border-q-line px-6 py-12 text-center text-[1.02rem] text-q-muted', className)}>
      {children}
    </div>
  )
}

/** Avatar redondo com foto ou iniciais. */
export function Avatar({
  nome,
  foto,
  cor = '#8FF0F2',
  size = 38,
  className,
}: {
  nome: string
  foto?: string
  cor?: string
  size?: number
  className?: string
}) {
  const ini = (() => {
    const w = String(nome || '?')
      .split(/\s+/)
      .filter((x) => x.length > 2)
    return ((w.length ? w : [nome || '?']).slice(0, 2).map((x) => x[0]).join('') || '?').toUpperCase()
  })()
  return (
    <span
      className={cn('grid flex-none place-items-center rounded-full font-bold text-navy-deep', className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        background: foto ? `center/cover no-repeat url("${foto}")` : `linear-gradient(135deg, ${cor}, #B4C8F8)`,
      }}
      aria-hidden
    >
      {foto ? '' : ini}
    </span>
  )
}

/** Fundo escuro das telas de entrada (login, cadastro, sistemas, conta). */
export function TelaEscura({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn('relative min-h-screen overflow-hidden bg-auth text-white', className)}>
      <div className="pointer-events-none absolute inset-0 auth-grid" aria-hidden />
      <div className="relative">{children}</div>
    </section>
  )
}

/** Cartão das telas escuras. */
export function CartaoEscuro({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-[18px] border border-white/14 bg-navy-card p-[22px] text-left shadow-[0_24px_48px_rgba(5,7,25,.5)]', className)}>
      {children}
    </div>
  )
}

export function Erro({ children, escuro = false }: { children?: ReactNode; escuro?: boolean }) {
  if (!children) return null
  return (
    <p role="alert" className={cn('m-0 mt-2 text-[.9rem]', escuro ? 'text-pink' : 'text-q-red')}>
      {children}
    </p>
  )
}

/** Ícone de cabeçalho de grupo por assunto (iniciais coloridas). */
export function BadgeAssunto({ ini, cor, size = 24 }: { ini: string; cor: string; size?: number }) {
  return (
    <span
      className="grid flex-none place-items-center rounded-md font-mono font-semibold text-navy-deep"
      style={{ width: size, height: size, background: cor, fontSize: size * 0.42 }}
      aria-hidden
    >
      {ini}
    </span>
  )
}
