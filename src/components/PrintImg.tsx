import { Loader2 } from 'lucide-react'
import { usePrint } from '@/data/prints'
import { cn } from '@/lib/utils'
import type { Print } from '@/types'

/** Miniatura de um print guardado no Firestore (carrega o base64 sob demanda). */
export function PrintImg({ p, className }: { p: Print; className?: string }) {
  const src = usePrint(p.id)
  if (!src)
    return (
      <span className={cn('grid w-28 place-items-center text-muted-foreground', className)}>
        <Loader2 className="size-4 animate-spin" />
      </span>
    )
  return <img src={src} alt={p.nome} className={className} />
}
