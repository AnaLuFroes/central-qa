import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AppHero } from '@/components/AppHero'
import { ConfirmButton } from '@/components/ConfirmButton'
import { Footer } from '@/components/Footer'
import { FloatCard, Main } from '@/components/Hero'
import { LoteCard } from '@/components/LoteCard'
import { Button } from '@/components/ui/button'
import { excluirLote } from '@/data/lotes'
import { baixarLote } from '@/lib/exportLote'
import { EnviarDevDialog } from '@/modals/EnviarDevDialog'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selLoteStats } from '@/store/slices/selectors'
import { setFRep } from '@/store/slices/ui'
import type { Lote } from '@/types'

const acao = 'h-auto px-3.5 py-1.5 text-[.9rem]'

export default function Lotes() {
  const dispatch = useAppDispatch()
  const nav = useNavigate()
  const lotes = useAppSelector((s) => s.data.lotes)
  const ocorrencias = useAppSelector((s) => s.data.ocorrencias)
  const stats = useAppSelector(selLoteStats)
  const [linkLote, setLinkLote] = useState<Lote | null>(null)

  return (
    <div className="flex min-h-screen flex-col">
      <AppHero />
      <Main>
        <FloatCard className="-mt-[60px] px-[26px] py-[22px]">
          <p className="m-0 max-w-[80ch] text-[1.02rem]">
            Cada lote é a página que o dev recebe, no formato de correção, com o progresso que ele marca. Para enviar,
            copie o link do lote e mande ao dev; ele precisa ter uma conta com nível Dev.
          </p>
        </FloatCard>
        <div className="mt-[34px] flex flex-col gap-3">
          {!lotes.length && (
            <p className="m-0 py-10 text-center text-muted-foreground">
              Nenhum lote gerado ainda.
              <br />
              Em um módulo, selecione os itens e clique em “Gerar lote para o dev”.
            </p>
          )}
          {lotes.map((l) => (
            <LoteCard
              key={l.id}
              lote={l}
              stats={stats[l.id]}
              acoes={
                <>
                  <Button
                    variant="subtle"
                    className={acao}
                    onClick={() => {
                      dispatch(setFRep('all'))
                      nav(`/lote/${l.id}`)
                    }}
                  >
                    Abrir
                  </Button>
                  <Button variant="subtle" className={acao} onClick={() => setLinkLote(l)}>
                    Copiar link
                  </Button>
                  <Button variant="subtle" className={acao} onClick={() => void baixarLote(l)}>
                    Baixar HTML
                  </Button>
                  <ConfirmButton
                    titulo="Excluir lote?"
                    descricao={`O lote “${l.titulo}” e o progresso marcado pelo dev serão apagados. As ocorrências voltam para “não enviadas”.`}
                    acao="Excluir lote"
                    onConfirm={async () => {
                      await excluirLote(l, ocorrencias)
                      toast.success('Lote excluído')
                    }}
                  >
                    <Button variant="danger" className={acao}>
                      Excluir lote
                    </Button>
                  </ConfirmButton>
                </>
              }
            />
          ))}
        </div>
      </Main>
      <Footer />
      <EnviarDevDialog lote={linkLote} onClose={() => setLinkLote(null)} />
    </div>
  )
}
