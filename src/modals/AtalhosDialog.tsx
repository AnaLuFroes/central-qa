import { Modal } from '@/components/Modal'
import { Button } from '@/components/ui/button'

const ATALHOS: [string, string][] = [
  ['/ ou Ctrl+K', 'Buscar'],
  ['N', 'Nova ocorrência'],
  ['T', 'Critérios ou casos de teste'],
  ['1 a 4', 'Trocar de aba'],
  ['Esc', 'Fechar janela'],
  ['?', 'Ver atalhos'],
]

export default function AtalhosDialog({ onClose }: { onClose: () => void }) {
  return (
    <Modal
      onClose={onClose}
      largura={460}
      titulo="Atalhos de teclado"
      className="mt-[calc(10vh-24px)] w-full"
      rodape={
        <Button variant="linha" size="modal" className="font-medium" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      <div className="mt-3 flex flex-col">
        {ATALHOS.map(([k, d]) => (
          <div key={k} className="flex items-center justify-between gap-3 border-b border-dashed border-q-line py-[9px]">
            <span>{d}</span>
            <span className="rounded-[5px] border border-b-2 border-q-line bg-q-card px-1.5 py-px font-mono text-[.75rem] text-q-muted">{k}</span>
          </div>
        ))}
      </div>
    </Modal>
  )
}
