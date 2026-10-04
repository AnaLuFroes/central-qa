import { FloatCard } from '@/components/Hero'
import type { StatsModulo } from '@/store/slices/selectors'

export function StatsCard({ stats }: { stats: StatsModulo }) {
  const itens: [number, string, string][] = [
    [stats.total, 'ocorrências', 'text-primary'],
    [stats.erros, 'erros', 'text-erro'],
    [stats.melh, 'melhorias', 'text-primary'],
    [stats.pend, 'ainda não enviadas', 'text-sucesso'],
  ]
  return (
    <FloatCard className="-mt-[60px] flex flex-wrap gap-10 px-7 py-[26px]">
      {itens.map(([n, l, c]) => (
        <div key={l}>
          <div className={`font-serif text-[2.2rem] leading-none font-bold ${c}`}>{n}</div>
          <div className="mt-2 text-[1.05rem] text-muted-foreground">{l}</div>
        </div>
      ))}
    </FloatCard>
  )
}
