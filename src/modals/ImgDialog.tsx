import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { usePrint } from '@/data/prints'
import { useSessao } from '@/hooks/useSessao'
import type { Modal as TModal } from '@/store/slices/modal'

/** Evidência ampliada em tela cheia. Clique em qualquer lugar ou Esc fecha. */
export default function ImgDialog({ m, onClose }: { m: Extract<TModal, { kind: 'img' }>; onClose: () => void }) {
  const { orgId } = useSessao()
  const src = usePrint(orgId || null, m.printId)

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Evidência"
      onClick={onClose}
      className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-[rgba(6,16,31,.82)] p-6"
    >
      {src ? (
        <img src={src} alt="Evidência ampliada" className="block max-h-[86vh] w-auto max-w-[min(1200px,100%)] object-contain" />
      ) : (
        <Loader2 className="size-8 animate-spin text-white" aria-label="Carregando" />
      )}
    </div>,
    document.body,
  )
}
