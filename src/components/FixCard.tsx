import type { ReactNode } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { FixBody } from '@/components/FixBody'
import { cn } from '@/lib/utils'
import type { CorpoFix } from '@/types'

/** Card expansível de uma ocorrência/fix, com barra lateral em gradiente. */
export function FixCard({
  f,
  aberto,
  onToggle,
  marcador,
  etiqueta,
  extras,
  rodape,
  concluido = false,
  vazioTxt,
}: {
  f: CorpoFix
  aberto: boolean
  onToggle: () => void
  marcador: ReactNode
  etiqueta: ReactNode
  extras?: ReactNode
  rodape?: ReactNode
  concluido?: boolean
  vazioTxt?: string
}) {
  const vazio = !f.onde && !f.atual && !f.passos.length && !f.esperado.length && !f.obs && !f.erro && !f.prints.length
  return (
    <Collapsible open={aberto} onOpenChange={onToggle} asChild>
      <article
        className={cn(
          'relative overflow-hidden rounded-[10px] border bg-card transition-opacity',
          concluido && 'opacity-[.72]',
        )}
      >
        <span className={cn('absolute inset-y-0 left-0 w-1', concluido ? 'bg-sucesso' : 'bg-brand-v')} aria-hidden />
        <div className="flex items-start gap-3 py-3.5 pr-[18px] pl-5">
          {marcador}
          <button
            onClick={onToggle}
            aria-expanded={aberto}
            className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2.5 gap-y-1 text-left text-inherit"
          >
            {etiqueta}
            <span
              className={cn(
                'flex-[1_1_300px] text-[1.02rem] leading-[1.4] font-semibold',
                concluido && 'line-through decoration-muted-foreground',
              )}
            >
              {f.titulo || 'Sem título'}
            </span>
            {f.prioridade === 'alta' && (
              <Badge variant="pendente" className="h-auto px-2.5 py-0.5 text-[.78rem]">
                Prioridade alta
              </Badge>
            )}
            {extras}
            <ChevronDown
              className={cn(
                'size-4 flex-none self-center text-muted-foreground transition-transform duration-200',
                !aberto && '-rotate-90',
              )}
            />
          </button>
        </div>
        <CollapsibleContent>
          <div className="pr-[18px] pb-[18px] pl-14">
            {vazio && vazioTxt ? <p className="m-0 text-[.92rem] text-muted-foreground">{vazioTxt}</p> : <FixBody f={f} />}
            {rodape}
          </div>
        </CollapsibleContent>
      </article>
    </Collapsible>
  )
}

/** Círculo de seleção (QA) ou checkbox de concluído (dev). */
export function Marcador({
  ativo,
  onClick,
  forma,
  label,
}: {
  ativo: boolean
  onClick: () => void
  forma: 'circulo' | 'quadrado'
  label: string
}) {
  const ok = forma === 'quadrado'
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={ativo}
      className={cn(
        'mt-px grid size-6 flex-none place-items-center border-2 p-0 transition-colors',
        ok ? 'rounded-md' : 'rounded-full',
        ativo ? (ok ? 'border-sucesso bg-sucesso' : 'border-primary bg-primary') : 'border-primary bg-card',
      )}
    >
      {ativo && <Check className="size-3 text-white" strokeWidth={3.5} />}
    </button>
  )
}

export function TipoTag({ tipo }: { tipo: CorpoFix['tipo'] }) {
  return tipo === 'erro' ? (
    <Badge variant="tag" className="h-auto bg-erro-bg px-[7px] py-0.5 text-erro">
      ERRO
    </Badge>
  ) : (
    <Badge variant="tag" className="h-auto bg-melhoria-bg px-[7px] py-0.5 text-melhoria">
      MELHORIA
    </Badge>
  )
}
