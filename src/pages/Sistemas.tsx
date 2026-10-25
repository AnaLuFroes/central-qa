import { useMemo, useRef, type ChangeEvent, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImageIcon, Settings, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/auth/AuthProvider'
import { PERFIL_LABEL } from '@/auth/roles'
import { botaoBrandCls, botaoVidroCls, CabecalhoEntrada, CantoConta, TelaCentro } from '@/components/Entrada'
import { imagemCapa } from '@/data/prints'
import { definirCapaSistema } from '@/data/sistemas'
import { baixar } from '@/hooks/baixar'
import { useExecutar, useSessao } from '@/hooks/useSessao'
import { gerarBackup, lerBackup, nomeBackup, restaurarBackup } from '@/lib/backup'
import { capaBg, listaE, PALS, plural } from '@/lib/format'
import { loteStats } from '@/lib/status'
import { cn } from '@/lib/utils'
import { useSair } from '@/store/SessionStore'
import { useAppSelector } from '@/store/hooks'
import type { Sistema } from '@/types'

interface Tile {
  s: Sistema
  meta: string
}

/** Escolha do sistema: QA e Admin veem todos; o dev vê só onde há lotes aguardando resposta. */
export default function Sistemas() {
  const { org } = useAuth()
  const ses = useSessao()
  const sair = useSair()
  const nav = useNavigate()
  const executar = useExecutar()
  const data = useAppSelector((s) => s.data)
  const capaRef = useRef<HTMLInputElement>(null)
  const bkRef = useRef<HTMLInputElement>(null)
  const capaDe = useRef<string | null>(null)

  const sistemas = useMemo(
    () => [...data.sistemas].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [data.sistemas],
  )

  const { tiles, sem } = useMemo(() => {
    if (!ses.isDev) {
      const tiles = sistemas.map((s) => {
        const nm = data.modulos.filter((m) => m.sis === s.id).length
        const nf = data.ocorrencias.filter((f) => f.sis === s.id).length
        return { s, meta: plural(nm, 'módulo', 'módulos') + ' · ' + plural(nf, 'ocorrência', 'ocorrências') }
      })
      return { tiles, sem: [] as string[] }
    }
    const tiles: Tile[] = []
    const sem: string[] = []
    for (const s of sistemas) {
      let pend = 0
      let nl = 0
      for (const l of data.lotes)
        if (l.sis === s.id) {
          const st = loteStats(l, data.respostas)
          pend += st.pend
          if (st.pend) nl++
        }
      if (pend)
        tiles.push({
          s,
          meta: plural(pend, 'item aguardando você', 'itens aguardando você') + ' · ' + plural(nl, 'lote', 'lotes'),
        })
      else sem.push(s.nome)
    }
    return { tiles, sem }
  }, [ses.isDev, sistemas, data.modulos, data.ocorrencias, data.lotes, data.respostas])

  const abrir = (s: Sistema) => {
    nav(ses.isDev ? `/s/${s.id}/dev` : `/s/${s.id}/painel`)
    window.scrollTo(0, 0)
  }

  const pedirCapa = (e: MouseEvent, id: string) => {
    e.stopPropagation()
    capaDe.current = id
    capaRef.current?.click()
  }

  const onCapa = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const id = capaDe.current
    e.target.value = ''
    if (!file || !id) return
    try {
      const url = await imagemCapa(file)
      await executar(definirCapaSistema(ses.orgId, id, url), 'Capa atualizada')
    } catch (err) {
      toast.error((err as Error)?.message || 'Não foi possível usar essa imagem.')
    }
  }

  const baixarBackup = () => baixar(nomeBackup(), JSON.stringify(gerarBackup(data), null, 2), 'application/json')

  const onBackup = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    let b
    try {
      b = lerBackup(await file.text())
    } catch {
      toast.error('Arquivo de backup inválido')
      return
    }
    await executar(restaurarBackup(ses.orgId, b), 'Backup restaurado')
  }

  const titulo = ses.isDev
    ? tiles.length
      ? 'Onde há trabalho para você'
      : 'Nenhuma demanda para você agora'
    : 'Qual sistema você quer acessar?'
  const sub = ses.isDev
    ? tiles.length
      ? 'Só aparecem os sistemas com lotes aguardando sua resposta.'
      : 'Quando o QA enviar um lote, o sistema aparece aqui.'
    : 'Cada sistema tem seus próprios módulos, ocorrências, lotes e casos de teste.'

  return (
    <TelaCentro
      label="Sistemas"
      largura={1160}
      canto={
        <CantoConta
          nome={ses.nome}
          foto={ses.foto}
          texto={ses.nome + (ses.perfil ? ' · ' + PERFIL_LABEL[ses.perfil] : '')}
          onSair={() => void sair()}
        />
      }
    >
      <input type="file" accept="image/*" ref={capaRef} onChange={onCapa} className="hidden" />
      <input type="file" accept=".json,application/json" ref={bkRef} onChange={onBackup} className="hidden" />

      <div className="flex max-w-[680px] flex-col items-center">
        <CabecalhoEntrada
          eyebrow={('CENTRAL DE QA · ' + (org?.nome ?? '')).toUpperCase()}
          titulo={titulo}
          sub={sub}
          grande
        />
      </div>

      {!!tiles.length && (
        <div className="mt-14 flex flex-wrap justify-center gap-7">
          {tiles.map((t, i) => (
            <TileSistema
              key={t.s.id}
              t={t}
              atraso={-i * 1.2}
              podeCapa={ses.isQA}
              onAbrir={() => abrir(t.s)}
              onCapa={(e) => pedirCapa(e, t.s.id)}
              onRemoverCapa={(e) => {
                e.stopPropagation()
                void executar(definirCapaSistema(ses.orgId, t.s.id, ''), 'Capa removida')
              }}
            />
          ))}
        </div>
      )}

      {ses.isQA && !sistemas.length && (
        <div className="mt-11 flex flex-col items-center gap-3.5">
          <p className="m-0 text-base text-hero-text">
            {ses.isAdmin
              ? 'Nenhum sistema cadastrado ainda.'
              : 'O administrador da empresa ainda não cadastrou os sistemas.'}
          </p>
          {ses.isAdmin && (
            <button onClick={() => nav('/sistemas/gerenciar')} className={botaoBrandCls}>
              Cadastrar sistemas
            </button>
          )}
        </div>
      )}

      {ses.isDev && !!sem.length && !!tiles.length && (
        <p className="m-0 mt-11 text-[.95rem] text-hero-text">Sem demanda no momento: {listaE(sem)}.</p>
      )}

      {ses.isQA && (
        <div className="mt-12 flex flex-wrap justify-center gap-2.5">
          {ses.isAdmin && (
            <button
              onClick={() => nav('/sistemas/gerenciar')}
              className={cn(botaoBrandCls, 'rounded-lg px-3.5 py-[7px] text-[.88rem]')}
            >
              <Settings className="size-[15px]" aria-hidden />
              Gerenciar sistemas
            </button>
          )}
          <button onClick={baixarBackup} className={cn(botaoVidroCls, 'rounded-lg px-3.5 py-[7px] text-[.88rem]')}>
            Baixar backup
          </button>
          {ses.isAdmin && (
            <button
              onClick={() => bkRef.current?.click()}
              className={cn(botaoVidroCls, 'rounded-lg px-3.5 py-[7px] text-[.88rem]')}
            >
              Restaurar backup
            </button>
          )}
        </div>
      )}
    </TelaCentro>
  )
}

const iconeCls =
  'grid size-8 cursor-pointer place-items-center rounded-[9px] border-0 bg-[rgba(14,16,39,.6)] text-white backdrop-blur-[4px] hover:bg-[rgba(14,16,39,.85)]'

function TileSistema({
  t,
  atraso,
  podeCapa,
  onAbrir,
  onCapa,
  onRemoverCapa,
}: {
  t: Tile
  atraso: number
  podeCapa: boolean
  onAbrir: () => void
  onCapa: (e: MouseEvent) => void
  onRemoverCapa: (e: MouseEvent) => void
}) {
  const { s } = t
  const capaTxt = s.capa ? 'Trocar capa' : 'Inserir capa'
  return (
    <div
      className="relative w-[200px] max-w-full animate-cqa-float motion-reduce:animate-none"
      style={{ animationDelay: `${atraso}s` }}
    >
      <button
        onClick={onAbrir}
        className="group flex w-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-white/14 bg-navy-card p-0 text-left text-white shadow-[0_24px_48px_rgba(5,7,25,.5)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1.5 hover:scale-[1.03] hover:border-cyan hover:shadow-[0_30px_60px_rgba(5,7,25,.6),0_0_0_4px_rgba(143,240,242,.15)]"
      >
        <span
          className="relative grid h-[150px] w-full place-items-center overflow-hidden transition-[filter] duration-400 group-hover:brightness-108 group-hover:saturate-130"
          style={{ background: capaBg(s.capa, PALS[s.cor % PALS.length]) }}
        >
          <span
            aria-hidden
            className="absolute inset-0 z-[2] -translate-x-[110%] bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,.32)_50%,transparent_70%)] transition-transform duration-900 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:translate-x-[110%]"
          />
          {!s.capa && (
            <>
              <span className="absolute inset-0 cover-grid" aria-hidden />
              <span className="relative font-serif text-[2.4rem] font-bold text-white [text-shadow:0_4px_16px_rgba(8,10,30,.4)]">
                {s.ini}
              </span>
            </>
          )}
        </span>
        <span className="flex flex-col gap-0.5 px-[18px] pt-3.5 pb-[18px]">
          <span className="text-[1.15rem] leading-[1.3] font-semibold break-words">{s.nome}</span>
          <span className="text-[.9rem] text-hero-text">{t.meta}</span>
        </span>
      </button>
      {podeCapa && (
        <div className="absolute top-2.5 right-2.5 z-[3] flex gap-1.5">
          {s.capa && (
            <button onClick={onRemoverCapa} title="Remover capa" aria-label="Remover capa" className={iconeCls}>
              <X className="size-3.5" />
            </button>
          )}
          <button onClick={onCapa} title={capaTxt} aria-label={capaTxt} className={iconeCls}>
            <ImageIcon className="size-4" strokeWidth={1.8} />
          </button>
        </div>
      )}
    </div>
  )
}
