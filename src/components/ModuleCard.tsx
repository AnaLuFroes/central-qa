import { Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ModuleCover } from '@/components/ModuleCover'
import { plural } from '@/lib/format'
import type { StatsModulo } from '@/store/slices/selectors'
import type { Modulo } from '@/types'

export function ModuleCard({
  modulo,
  stats,
  onOpen,
  onEdit,
}: {
  modulo: Modulo
  stats: StatsModulo
  onOpen: () => void
  onEdit: () => void
}) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border bg-card transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-[3px] hover:border-primary hover:shadow-card">
      <button onClick={onOpen} className="flex size-full flex-col text-left text-inherit">
        <ModuleCover nome={modulo.nome} emoji={modulo.emoji} cor={modulo.cor} className="h-[142px]" />
        <span className="flex flex-col gap-1 px-5 pt-4 pb-5">
          <span className="text-[1.2rem] leading-[1.3] font-semibold">{modulo.nome}</span>
          <span className="text-base text-muted-foreground">
            {stats.total ? plural(stats.total, 'ocorrência', 'ocorrências') : 'Sem ocorrências'}
          </span>
          <span className="mt-2 flex flex-wrap gap-1.5">
            {stats.erros > 0 && <Chip v="erro">{plural(stats.erros, 'erro', 'erros')}</Chip>}
            {stats.melh > 0 && <Chip v="melhoria">{plural(stats.melh, 'melhoria', 'melhorias')}</Chip>}
            {stats.pend > 0 && <Chip v="pendente">{stats.pend} a enviar</Chip>}
            {stats.total > 0 && stats.pend === 0 && <Chip v="sucesso">Tudo enviado</Chip>}
          </span>
        </span>
      </button>
      <button
        onClick={onEdit}
        aria-label="Editar módulo"
        className="absolute top-2 right-2 grid size-8 place-items-center rounded-[9px] bg-[rgba(14,16,39,.55)] text-white backdrop-blur-sm hover:bg-[rgba(14,16,39,.75)]"
      >
        <Pencil className="size-[15px]" />
      </button>
    </article>
  )
}

function Chip({ v, children }: { v: 'erro' | 'melhoria' | 'pendente' | 'sucesso'; children: React.ReactNode }) {
  return (
    <Badge variant={v} className="h-auto px-[11px] py-0.5 text-[.88rem]">
      {children}
    </Badge>
  )
}
