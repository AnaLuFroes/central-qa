import type { ReactNode } from 'react'
import { Dialog as D } from 'radix-ui'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Janela no estilo do protótipo: fundo escurecido, cartão no topo da tela com rolagem,
 * título em serif e rodapé com status à esquerda e botões à direita.
 */
export function Modal({
  aberto = true,
  onClose,
  titulo,
  descricao,
  largura = 720,
  children,
  rodape,
  className,
}: {
  aberto?: boolean
  onClose: () => void
  titulo: ReactNode
  descricao?: ReactNode
  largura?: number
  children: ReactNode
  rodape?: ReactNode
  className?: string
}) {
  return (
    <D.Root open={aberto} onOpenChange={(o) => !o && onClose()}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-40 overflow-y-auto bg-[rgba(6,16,31,.55)] px-3.5 py-6 data-[state=open]:animate-in data-[state=open]:fade-in-0">
          <D.Content
            aria-describedby={undefined}
            className={cn(
              'relative mx-auto rounded-[14px] border border-q-line bg-q-card px-6 pt-6 pb-5 text-q-ink shadow-card outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[.98]',
              className,
            )}
            style={{ maxWidth: largura }}
          >
            <D.Title className="m-0 mb-1.5 pr-8 font-serif text-[1.45rem] leading-tight font-bold">{titulo}</D.Title>
            {descricao && <D.Description className="m-0 mb-4 text-[.95rem] text-q-muted">{descricao}</D.Description>}
            <D.Close
              aria-label="Fechar"
              className="absolute top-4 right-4 grid size-8 place-items-center rounded-full text-q-muted transition hover:bg-q-track hover:text-q-ink"
            >
              <X className="size-4" />
            </D.Close>
            {children}
            {rodape && <div className="mt-4 flex flex-wrap items-center justify-end gap-2.5">{rodape}</div>}
          </D.Content>
        </D.Overlay>
      </D.Portal>
    </D.Root>
  )
}

/** Texto de status no rodapé do modal (vermelho quando é erro). */
export function StatusModal({ children, erro }: { children?: ReactNode; erro?: boolean }) {
  return <span className={cn('mr-auto text-[.88rem]', erro ? 'text-q-red' : 'text-q-muted')}>{children}</span>
}

export function Campo({ label, dica, children, className }: { label: ReactNode; dica?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-3 flex flex-col gap-1', className)}>
      <label className="text-[.86rem] font-semibold">{label}</label>
      {children}
      {dica && <span className="text-[.8rem] text-q-muted">{dica}</span>}
    </div>
  )
}
