import { toast } from 'sonner'
import { Campo, Modal } from '@/components/Modal'
import { inputCls } from '@/components/qa'
import { Button } from '@/components/ui/button'
import { linkDoLote } from '@/data/lotes'
import { copiar } from '@/hooks/baixar'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/store/hooks'
import type { Modal as TModal } from '@/store/slices/modal'

export default function LinkDialog({ m, onClose }: { m: Extract<TModal, { kind: 'link' }>; onClose: () => void }) {
  const lote = useAppSelector((s) => s.data.lotes.find((l) => l.id === m.loteId))
  const url = linkDoLote(m.loteId)
  const copiarLink = async () => toast((await copiar(url)) ? 'Link copiado' : 'Selecione o link e copie com Ctrl+C')
  return (
    <Modal
      onClose={onClose}
      largura={620}
      titulo="Enviar ao dev"
      descricao="O dev abre este endereço com a conta dele e vai direto para o lote, no formato de correção. Seus cadastros continuam privados."
      rodape={
        <Button variant="linha" size="modal" className="font-medium" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      <Campo label={'Link do lote “' + (lote?.titulo ?? '') + '”'}>
        <div className="flex gap-2">
          <input readOnly value={url} onFocus={(e) => e.target.select()} className={cn(inputCls, 'min-w-0 flex-1 text-[.9rem]')} />
          <Button variant="primario" size="modal" onClick={() => void copiarLink()}>
            Copiar
          </Button>
        </div>
      </Campo>
      <p className="m-0 mt-4 rounded-[10px] bg-q-warn-bg px-3.5 py-3 text-[.92rem]">
        Para abrir o link, o dev precisa de uma conta com o perfil Dev nesta empresa. Se ele ainda não tem, adicione em Minha conta ›
        Equipe. Ele vê só os lotes enviados, responde item a item e você acompanha as respostas na Visão geral. Para mandar um lote
        isolado, sem conta, use “Baixar HTML”.
      </p>
    </Modal>
  )
}
