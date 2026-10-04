import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Carregando } from '@/components/Carregando'
import { ConfirmButton } from '@/components/ConfirmButton'
import { FilterChips } from '@/components/FilterChips'
import { FixCard, Marcador, TipoTag } from '@/components/FixCard'
import { Footer } from '@/components/Footer'
import { Hero, Main } from '@/components/Hero'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { excluirOcorrencia } from '@/data/ocorrencias'
import { heroBg, palOf, plural } from '@/lib/format'
import { GerarLoteDialog } from '@/modals/GerarLoteDialog'
import { ModuloDialog } from '@/modals/ModuloDialog'
import { OcorrenciaDialog, type AlvoOcorrencia } from '@/modals/OcorrenciaDialog'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selOcorrenciasPorModulo, selSelecionadas } from '@/store/slices/selectors'
import { limparSelecao, selecionar, setFTipo, toggleAberta, toggleSelecao, type FiltroTipo } from '@/store/slices/ui'

const pequeno = 'h-auto px-3.5 py-1.5 text-[.9rem]'
const mini = 'h-auto px-3 py-1.5 text-[.85rem]'

export default function Modulo() {
  const { id = '' } = useParams()
  const dispatch = useAppDispatch()
  const nav = useNavigate()
  const carregado = useAppSelector((s) => s.data.carregado.modulos && s.data.carregado.ocorrencias)
  const modulo = useAppSelector((s) => s.data.modulos.find((m) => m.id === id))
  const fs = useAppSelector(selOcorrenciasPorModulo).get(id) ?? []
  const lotes = useAppSelector((s) => s.data.lotes)
  const { fTipo, abertas, selecao } = useAppSelector((s) => s.ui)
  const nSel = useAppSelector(selSelecionadas).length
  const [ocAlvo, setOcAlvo] = useState<AlvoOcorrencia | null>(null)
  const [editMod, setEditMod] = useState(false)
  const [gerar, setGerar] = useState(false)

  if (!carregado) return <Carregando />
  if (!modulo) return <Navigate to="/" replace />

  const pend = fs.filter((f) => !f.loteId)
  const lista = fs.filter((f) => fTipo === 'all' || (fTipo === 'pend' ? !f.loteId : f.tipo === fTipo))

  return (
    <div className="flex min-h-screen flex-col">
      <Hero background={heroBg(palOf(modulo))} className="pt-7 pb-10" grade="full">
        <Button variant="glass" className="h-auto rounded-full py-[5px] pr-3.5 pl-2.5 text-[.9rem]" onClick={() => nav('/')}>
          <ChevronLeft /> Todos os módulos
        </Button>
        <h1 className="mt-5 mb-1.5 flex flex-wrap items-center gap-3.5 pr-14 font-serif text-[clamp(1.9rem,4.5vw,2.8rem)] leading-[1.15] font-bold">
          {modulo.emoji && <span>{modulo.emoji}</span>}
          <span className="text-brand">{modulo.nome}</span>
        </h1>
        <p className="m-0 text-[1.05rem] text-hero-text">
          {fs.length
            ? `${plural(fs.length, 'ocorrência', 'ocorrências')}, ${pend.length} ainda não ${pend.length === 1 ? 'enviada' : 'enviadas'} ao dev`
            : 'Nenhuma ocorrência neste módulo ainda.'}
        </p>
      </Hero>

      <Main>
        <div className="sticky top-0 z-[5] flex flex-wrap items-center gap-2 border-b bg-background py-3.5">
          <FilterChips<FiltroTipo>
            label="Filtrar ocorrências"
            value={fTipo}
            onChange={(v) => dispatch(setFTipo(v))}
            options={[
              ['all', 'Todas'],
              ['erro', 'Erros'],
              ['melhoria', 'Melhorias'],
              ['pend', 'Não enviadas'],
            ]}
          />
          <span className="flex-1" />
          <Button variant="subtle" className={pequeno} onClick={() => setEditMod(true)}>
            Editar módulo
          </Button>
          {pend.length > 0 && (
            <Button variant="subtle" className={pequeno} onClick={() => dispatch(selecionar(pend.map((f) => f.id)))}>
              Selecionar não enviadas
            </Button>
          )}
          <Button variant="gradient" className={pequeno} onClick={() => setOcAlvo({ modo: 'nova', modulo: modulo.nome })}>
            Nova ocorrência
          </Button>
        </div>

        <div className="mt-7 flex flex-col gap-3">
          {!lista.length && (
            <p className="m-0 py-10 text-center text-muted-foreground">
              {fs.length
                ? 'Nenhuma ocorrência neste filtro.'
                : 'Clique em “Nova ocorrência” e descreva o problema do seu jeito; a organização no padrão do dev é feita na hora.'}
            </p>
          )}
          {lista.map((f) => {
            const lote = f.loteId ? lotes.find((l) => l.id === f.loteId) : undefined
            return (
              <FixCard
                key={f.id}
                f={f}
                aberto={!!abertas[f.id]}
                onToggle={() => dispatch(toggleAberta(f.id))}
                vazioTxt="Sem detalhes ainda. Edite para completar."
                marcador={
                  <Marcador
                    forma="circulo"
                    ativo={!!selecao[f.id]}
                    onClick={() => dispatch(toggleSelecao(f.id))}
                    label="Selecionar para o lote"
                  />
                }
                etiqueta={<TipoTag tipo={f.tipo} />}
                extras={
                  f.loteId && (
                    <Badge variant="sucesso" className="h-auto px-2.5 py-0.5 text-[.78rem]">
                      Enviado
                    </Badge>
                  )
                }
                rodape={
                  <>
                    {lote && (
                      <p className="mt-3 mb-0 text-[.92rem] text-muted-foreground">
                        Enviado no lote <b className="font-semibold">{lote.titulo}</b>.
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-dashed pt-3">
                      <Button variant="subtle" className={mini} onClick={() => setOcAlvo({ modo: 'editar', ocorrencia: f })}>
                        Editar
                      </Button>
                      <Button variant="subtle" className={mini} onClick={() => setOcAlvo({ modo: 'duplicar', ocorrencia: f })}>
                        Duplicar
                      </Button>
                      <ConfirmButton
                        titulo="Excluir ocorrência?"
                        descricao={`“${f.titulo}” será excluída. ${f.loteId ? 'O lote já enviado continua com a cópia dela.' : ''}`}
                        onConfirm={async () => {
                          await excluirOcorrencia(f)
                          if (selecao[f.id]) dispatch(toggleSelecao(f.id))
                          toast.success('Ocorrência excluída')
                        }}
                      >
                        <Button variant="danger" className={mini}>
                          Excluir
                        </Button>
                      </ConfirmButton>
                    </div>
                  </>
                }
              />
            )
          })}
        </div>

        {nSel > 0 && (
          <div className="sticky bottom-3 z-[6] mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-navy px-4 py-3 text-white shadow-card">
            <b>{plural(nSel, 'selecionada', 'selecionadas')}</b>
            <span className="flex-1" />
            <Button
              variant="outline"
              className="h-auto border-white/35 bg-transparent px-3 py-1.5 text-[.85rem] text-white hover:bg-white/10 hover:text-white"
              onClick={() => dispatch(limparSelecao())}
            >
              Limpar seleção
            </Button>
            <Button className="h-auto bg-white px-3 py-1.5 text-[.85rem] font-semibold text-navy-deep hover:bg-white/90" onClick={() => setGerar(true)}>
              Gerar lote para o dev
            </Button>
          </div>
        )}
      </Main>
      <Footer />

      <OcorrenciaDialog alvo={ocAlvo} onClose={() => setOcAlvo(null)} />
      <ModuloDialog open={editMod} modulo={modulo} onClose={() => setEditMod(false)} />
      <GerarLoteDialog open={gerar} onClose={() => setGerar(false)} />
    </div>
  )
}
