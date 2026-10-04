import { coverBg, initials, palOf } from '@/lib/format'
import { cn } from '@/lib/utils'

/** Capa em gradiente com emoji ou iniciais do módulo. */
export function ModuleCover({
  nome,
  emoji,
  cor,
  className,
}: {
  nome: string
  emoji: string
  cor: number | null
  className?: string
}) {
  return (
    <span
      className={cn('relative grid w-full place-items-center overflow-hidden', className)}
      style={{ background: coverBg(palOf({ nome, cor })) }}
    >
      <span className="absolute inset-0 cover-grid" aria-hidden />
      {emoji ? (
        <span className="relative text-5xl drop-shadow-[0_6px_14px_rgba(8,10,30,.45)]">{emoji}</span>
      ) : (
        <span className="relative font-serif text-[2.6rem] font-bold text-white [text-shadow:0_4px_16px_rgba(8,10,30,.4)]">
          {initials(nome)}
        </span>
      )}
    </span>
  )
}
