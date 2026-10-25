import { useMemo } from 'react'
import { hl } from '@/lib/gherkin'
import { cn } from '@/lib/utils'

/** Visualizador escuro de Gherkin com realce e, opcionalmente, números de linha. */
export function GherkinView({ texto, numeros = true, className }: { texto: string; numeros?: boolean; className?: string }) {
  const linhas = useMemo(() => hl(texto), [texto])
  return (
    <div
      className={cn(
        'overflow-x-auto bg-[#111430] font-mono leading-[1.7]',
        numeros ? 'rounded-xl py-3.5 text-[.84rem]' : 'rounded-[10px] py-3 text-[.82rem]',
        className,
      )}
    >
      {linhas.map((l) => (
        <div key={l.n} className={cn('flex min-h-[1.7em] min-w-max', !numeros && 'px-4')}>
          {numeros && (
            <span className="w-11 flex-none pr-3.5 text-right text-q-muted select-none" aria-hidden>
              {l.n}
            </span>
          )}
          <span className={cn('whitespace-pre', numeros && 'pr-[18px]')}>
            {l.toks.map((t, i) => (
              <span key={i} style={{ color: t.c, fontWeight: t.w }}>
                {t.t}
              </span>
            ))}
          </span>
        </div>
      ))}
    </div>
  )
}

/** Seta de expandir/recolher (aponta para a direita quando fechado). */
export function Chevron({ aberto, size = 16, className }: { aberto: boolean; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden
      className={cn('flex-none text-q-muted transition-transform duration-200', !aberto && '-rotate-90', className)}
    >
      <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function TagFuncionalidade() {
  return <span className="rounded-[5px] bg-q-soft px-[7px] py-0.5 font-mono text-[.72rem] font-semibold text-q-accent">FUNCIONALIDADE</span>
}
