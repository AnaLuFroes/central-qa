import { toast } from 'sonner'
import { AppHeader, Main } from '@/components/AppHeader'
import { Progresso } from '@/components/qa'
import { Button } from '@/components/ui/button'
import { excluirLote } from '@/data/lotes'
import { useIr } from '@/hooks/useIr'
import { useArmar, useExecutar, useSessao, useSistema } from '@/hooks/useSessao'
import { baixarLote } from '@/lib/exportLote'
import { fmtData, hojeEyebrow } from '@/lib/format'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { abrirModal } from '@/store/slices/modal'
import { selLoteStats, selLotes, selOcorrencias, selRespostas } from '@/store/slices/selectors'
import { setFRep } from '@/store/slices/ui'
import type { Lote } from '@/types'

const SUB = 'O que já foi para o dev e como está o andamento de cada entrega.'

export default function Lotes() {
  const sistema = useSistema()
  const lotes = useAppSelector(selLotes)
  return (
    <>
      <AppHeader eyebrow={'LOTES ENVIADOS · ' + hojeEyebrow()} titulo={sistema?.nome ?? ''} sub={SUB} />
      <Main>
        <div className="relative -mt-[60px] rounded-2xl border border-q-line bg-q-card px-[26px] py-[22px] shadow-card">
          <p className="m-0 max-w-[80ch] text-[1.02rem]">
            Cada lote é o que o dev vê ao entrar com a conta dele: só os itens enviados, com evidências e contexto. Ele responde item a
            item, e as respostas voltam para a Visão geral.
          </p>
        </div>
        <div className="mt-[34px] flex flex-col gap-3">
          {!lotes.length && (
            <p className="m-0 py-10 text-center text-q-muted">
              Nenhum lote gerado ainda.
              <br />
              Em um módulo, selecione os itens e clique em “Gerar lote para o dev”.
            </p>
          )}
          {lotes.map((l) => (
            <CartaoLote key={l.id} l={l} />
          ))}
        </div>
      </Main>
    </>
  )
}

function CartaoLote({ l }: { l: Lote }) {
  const dispatch = useAppDispatch()
  const ir = useIr()
  const exec = useExecutar()
  const { orgId } = useSessao()
  const { armado, armar } = useArmar()
  const st = useAppSelector(selLoteStats)[l.id]
  const resp = useAppSelector(selRespostas)
  const ocorrencias = useAppSelector(selOcorrencias)
  const meta = (l.eyebrow ? l.eyebrow + ' · ' : '') + fmtData(l.criadoEm) + ' · ' + (st?.dn ?? 0) + ' de ' + (st?.total ?? 0) + ' respondidos pelo dev'
  const btn = 'bg-transparent font-medium text-[.9rem]'
  const baixar = async () => {
    try {
      await baixarLote(orgId, l, resp)
      toast('Arquivo “' + l.titulo + '.html” baixado')
    } catch (e) {
      toast.error('Não foi possível gerar o arquivo. ' + ((e as Error)?.message ?? ''))
    }
  }
  return (
    <div className="rounded-xl border border-q-line bg-q-card px-[22px] py-[18px]">
      <h3 className="m-0 mb-0.5 font-serif text-[1.25rem] font-bold">{l.titulo}</h3>
      <p className="m-0 text-[.92rem] text-q-muted">{meta}</p>
      <Progresso pct={st?.pct ?? 0} className="mt-3" />
      <div className="mt-3.5 flex flex-wrap gap-2">
        <Button
          variant="linha"
          size="mini"
          className={btn}
          onClick={() => {
            dispatch(setFRep('all'))
            ir.lote(l.id)
          }}
        >
          Abrir
        </Button>
        <Button variant="linha" size="mini" className={btn} onClick={() => dispatch(abrirModal({ kind: 'link', loteId: l.id }))}>
          Copiar link
        </Button>
        <Button variant="linha" size="mini" className={btn} onClick={() => void baixar()}>
          Baixar HTML
        </Button>
        <Button
          variant="perigo"
          size="mini"
          className={btn}
          onClick={() => armar('dl' + l.id, () => void exec(excluirLote(orgId, l, ocorrencias, resp), 'Lote excluído'))}
        >
          {armado('dl' + l.id) ? 'Clique de novo para confirmar' : 'Excluir lote'}
        </Button>
      </div>
    </div>
  )
}
