import type { ReactNode } from 'react'
import { ProgressoBar } from '@/components/ProgressoBar'
import { fmtData } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { LoteStats } from '@/store/slices/selectors'
import type { Lote } from '@/types'

export function LoteCard({
  lote,
  stats,
  acoes,
  className,
}: {
  lote: Lote
  stats: LoteStats
  acoes: ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-xl border bg-card px-[22px] py-[18px]', className)}>
      <h3 className="m-0 mb-0.5 font-serif text-[1.25rem] font-semibold">{lote.titulo}</h3>
      <p className="m-0 text-[.92rem] text-muted-foreground">
        {(lote.eyebrow ? lote.eyebrow + ' · ' : '') + fmtData(lote.criadoEm)} · {stats.feitos} de {stats.total} concluídos
      </p>
      <ProgressoBar pct={stats.pct} className="mt-3" />
      <div className="mt-3.5 flex flex-wrap gap-2">{acoes}</div>
    </div>
  )
}
