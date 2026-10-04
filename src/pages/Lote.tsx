import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Copy, Download } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/auth/AuthProvider'
import { isQA } from '@/auth/roles'
import { Carregando } from '@/components/Carregando'
import { FilterChips } from '@/components/FilterChips'
import { FixCard, Marcador } from '@/components/FixCard'
import { Footer } from '@/components/Footer'
import { FloatCard, Hero, HeroLead, HeroTitle, Main } from '@/components/Hero'
import { ProgressoBar } from '@/components/ProgressoBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { marcarFix } from '@/data/lotes'
import { baixarLote } from '@/lib/exportLote'
import { fixCode, fmtData } from '@/lib/format'
import { cn } from '@/lib/utils'
import { EnviarDevDialog } from '@/modals/EnviarDevDialog'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { loteStats } from '@/store/slices/selectors'
import { setFRep, setRecolhidos, toggleRecolhido, type FiltroRep } from '@/store/slices/ui'

const pequeno = 'h-auto px-3.5 py-1.5 text-[.9rem]'

/** Página do lote: o que o dev vê, com o progresso que ele marca. */
export default function Lote() {
  const { id = '' } = useParams()
  const { user, role } = useAuth()
  const dispatch = useAppDispatch()
  const nav = useNavigate()
  const lote = useAppSelector((s) => s.data.lotes.find((l) => l.id === id))
  const carregado = useAppSelector((s) => s.data.carregado.lotes)
  const feitos = useAppSelector((s) => s.data.progresso[id])
  const { fRep, recolhidos } = useAppSelector((s) => s.ui)
  const [link, setLink] = useState(false)
  const qa = isQA(role)

  if (!carregado) return <Carregando />
  if (!lote)
    return (
      <div className="grid min-h-[60vh] place-items-center text-center text-muted-foreground">
        <div>
          <p>Este lote não existe mais ou você não tem acesso a ele.</p>
          <Button variant="subtle" onClick={() => nav(qa ? '/lotes' : '/dev')}>
            Voltar
          </Button>
        </div>
      </div>
    )

  const st = loteStats(lote, feitos)
  const ck = (key: string) => `${lote.id}/${key}`
  const todasKeys = lote.secoes.flatMap((s) => s.itens.map((i) => ck(i.key)))
  const tudoRecolhido = todasKeys.every((k) => recolhidos[k])

  const secoes = lote.secoes
    .map((sc) => ({
      nome: sc.nome,
      total: sc.itens.length,
      dn: sc.itens.filter((f) => feitos?.[f.key]).length,
      itens: sc.itens.filter((f) => fRep === 'all' || (fRep === 'done' ? feitos?.[f.key] : !feitos?.[f.key])),
    }))
    .filter((sc) => sc.itens.length)
  const mostrados = secoes.reduce((n, sc) => n + sc.itens.length, 0)

  const alternar = async (key: string, feito: boolean) => {
    try {
      await marcarFix(lote.id, key, feito, user!.uid)
    } catch (e) {
      toast.error('Não foi possível salvar a marcação. ' + (e as Error).message)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Hero className="pt-11 pb-[72px]">
        {lote.eyebrow && <p className="m-0 mb-3 font-mono text-[.8rem] tracking-[.06em] text-[#8FF0F2]">{lote.eyebrow}</p>}
        <HeroTitle size="md">{lote.titulo}</HeroTitle>
        <HeroLead>{lote.intro}</HeroLead>
      </Hero>
      <Main>
        <FloatCard className="-mt-11 rounded-[14px] px-[22px] py-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div className="font-serif text-[2.1rem] leading-none font-bold text-primary">
              {st.feitos}
              <small className="ml-2 font-sans text-[.95rem] font-medium text-muted-foreground">
                de {st.total} fixes concluídos
              </small>
            </div>
            <div className="font-mono text-[.82rem] text-muted-foreground">{st.pct}%</div>
          </div>
          <ProgressoBar pct={st.pct} className="mt-3.5 h-2.5" />
        </FloatCard>

        <div role="toolbar" className="sticky top-0 z-[5] mt-3.5 flex flex-wrap items-center gap-2 border-b bg-background py-3.5">
          <Button variant="outline" className={cn(pequeno, 'text-muted-foreground hover:border-primary hover:bg-card hover:text-primary')} onClick={() => nav(qa ? '/lotes' : '/dev')}>
            <ArrowLeft /> Voltar
          </Button>
          <FilterChips<FiltroRep>
            label="Filtrar fixes"
            value={fRep}
            onChange={(v) => dispatch(setFRep(v))}
            options={[
              ['all', 'Todos'],
              ['open', 'Pendentes'],
              ['done', 'Concluídos'],
            ]}
          />
          <span className="flex-1" />
          <Button
            variant="subtle"
            className={pequeno}
            onClick={() => dispatch(setRecolhidos({ keys: todasKeys, recolher: !tudoRecolhido }))}
          >
            {tudoRecolhido ? 'Expandir tudo' : 'Recolher tudo'}
          </Button>
          {qa && (
            <>
              <Button variant="subtle" className={pequeno} onClick={() => setLink(true)}>
                <Copy /> Copiar link
              </Button>
              <Button variant="subtle" className={pequeno} onClick={() => void baixarLote(lote)}>
                <Download /> Baixar HTML
              </Button>
            </>
          )}
        </div>

        {secoes.map((sc) => (
          <section key={sc.nome} className="mt-[34px]">
            <div className="mb-3.5 flex items-baseline justify-between gap-3 border-b-2 border-primary pb-2">
              <h2 className="m-0 font-serif text-[1.35rem] font-semibold">{sc.nome}</h2>
              <span
                className={cn(
                  'font-mono text-[.8rem] whitespace-nowrap',
                  sc.dn === sc.total ? 'text-sucesso' : 'text-muted-foreground',
                )}
              >
                {sc.dn} de {sc.total}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {sc.itens.map((f) => {
                const done = !!feitos?.[f.key]
                return (
                  <FixCard
                    key={f.key}
                    f={f}
                    concluido={done}
                    aberto={!recolhidos[ck(f.key)]}
                    onToggle={() => dispatch(toggleRecolhido(ck(f.key)))}
                    marcador={
                      <Marcador forma="quadrado" ativo={done} onClick={() => alternar(f.key, !done)} label="Marcar como concluído" />
                    }
                    etiqueta={
                      <Badge
                        variant="tag"
                        className={cn('h-auto px-[7px] py-0.5', done ? 'bg-sucesso-bg text-sucesso' : 'bg-melhoria-bg text-melhoria')}
                      >
                        {fixCode(f.key)}
                      </Badge>
                    }
                  />
                )
              })}
            </div>
          </section>
        ))}
        {mostrados === 0 && (
          <p className="m-0 py-10 text-center text-muted-foreground">
            {fRep === 'done' ? 'Nenhum fix concluído ainda.' : 'Todos os fixes deste lote foram concluídos.'}
          </p>
        )}
      </Main>
      <Footer>Gerado pela Central de QA em {fmtData(lote.criadoEm)}</Footer>
      <EnviarDevDialog lote={link ? lote : null} onClose={() => setLink(false)} />
    </div>
  )
}
