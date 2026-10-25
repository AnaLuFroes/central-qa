import { Loader2 } from 'lucide-react'
import { usePrint } from '@/data/prints'
import { useSessao } from '@/hooks/useSessao'
import { cn } from '@/lib/utils'
import { useAppDispatch } from '@/store/hooks'
import { abrirModal } from '@/store/slices/modal'
import type { Print } from '@/types'

/** Imagem de um print guardado no Firestore (carrega o base64 sob demanda). */
export function PrintImg({ p, className }: { p: Print; className?: string }) {
  const { orgId } = useSessao()
  const src = usePrint(orgId || null, p.id)
  if (!src)
    return (
      <span className={cn('grid place-items-center bg-q-track text-q-muted', className)}>
        <Loader2 className="size-4 animate-spin" />
      </span>
    )
  return <img src={src} alt={p.nome} className={cn('object-cover', className)} />
}

/** Miniatura de evidência (136×90) que abre a imagem ampliada. */
export function PrintThumb({ p, alt }: { p: Print; alt: string }) {
  const dispatch = useAppDispatch()
  return (
    <button
      type="button"
      onClick={() => dispatch(abrirModal({ kind: 'img', printId: p.id }))}
      aria-label={alt}
      className="h-[90px] w-[136px] cursor-zoom-in overflow-hidden rounded-lg border border-q-line bg-q-card p-0 transition-colors hover:border-q-accent"
    >
      <PrintImg p={{ ...p, nome: alt }} className="block size-full" />
    </button>
  )
}
