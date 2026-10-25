import { coverBg, initials, palOf } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * Capa em gradiente com emoji ou iniciais do módulo. O brilho passa ao passar o mouse
 * sobre o elemento pai que tiver a classe `group`.
 */
export function ModuleCover({
  nome,
  emoji,
  cor,
  className,
  grande = false,
}: {
  nome: string
  emoji: string
  cor: number | null
  className?: string
  grande?: boolean
}) {
  return (
    <span
      className={cn(
        'relative grid w-full place-items-center overflow-hidden transition-[filter] duration-400 group-hover:brightness-108 group-hover:saturate-130',
        className,
      )}
      style={{ background: coverBg(palOf({ nome, cor })) }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-2 -translate-x-[110%] bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,.32)_50%,transparent_70%)] transition-transform duration-900 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:translate-x-[110%]"
      />
      <span className="absolute inset-0 cover-grid" aria-hidden />
      {emoji ? (
        <span className={cn('relative drop-shadow-[0_6px_14px_rgba(8,10,30,.45)]', grande ? 'text-[3.2rem]' : 'text-5xl')}>{emoji}</span>
      ) : (
        <span
          className={cn(
            'relative font-serif font-bold text-white [text-shadow:0_4px_16px_rgba(8,10,30,.4)]',
            grande ? 'text-[2.4rem]' : 'text-[2.6rem]',
          )}
        >
          {initials(nome)}
        </span>
      )}
    </span>
  )
}

/** Selo pequeno do módulo (emoji ou iniciais sobre a capa). */
export function ModuleBadge({ nome, emoji, cor, size = 36 }: { nome: string; emoji: string; cor: number | null; size?: number }) {
  return (
    <span
      className="grid flex-none place-items-center rounded-[10px] font-serif text-base font-bold text-white"
      style={{ width: size, height: size, background: coverBg(palOf({ nome, cor })) }}
      aria-hidden
    >
      {emoji || initials(nome)}
    </span>
  )
}
