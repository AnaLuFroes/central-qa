import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { onSnapshot, orderBy, query } from 'firebase/firestore'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/auth/AuthProvider'
import { botaoBrandCls, botaoVidroCls, CabecalhoEntrada, CantoConta, TelaCentro } from '@/components/Entrada'
import { definirStatusOrg, fromOrg, orgsCol } from '@/data/orgs'
import { useArmar } from '@/hooks/useArmar'
import { fmtData, nq, plural } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useSair } from '@/store/SessionStore'
import type { Org, StatusOrg } from '@/types'

type Filtro = StatusOrg | 'todas'

const FILTROS: [Filtro, string][] = [
  ['pendente', 'Pendentes'],
  ['ativa', 'Ativas'],
  ['suspensa', 'Suspensas'],
  ['todas', 'Todas'],
]

const ST: Record<StatusOrg, [string, string, string]> = {
  pendente: ['Pendente', '#FFC879', 'rgba(255,200,121,.14)'],
  ativa: ['Ativa', '#7BE0B8', 'rgba(123,224,184,.14)'],
  suspensa: ['Suspensa', '#FF9EC7', 'rgba(255,158,199,.14)'],
}

/** Administração da plataforma: aprovar, suspender e reativar empresas. */
export default function Empresas() {
  const { user, situacao } = useAuth()
  const sair = useSair()
  const nav = useNavigate()
  const [orgs, setOrgs] = useState<Org[] | null>(null)
  const [erro, setErro] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('pendente')
  const [q, setQ] = useState('')

  useEffect(
    () =>
      onSnapshot(
        query(orgsCol, orderBy('criadoEm', 'desc')),
        (s) => {
          setOrgs(s.docs.map(fromOrg))
          setErro('')
        },
        (e) => {
          console.error(e)
          setErro('Não foi possível carregar as empresas.')
          setOrgs([])
        },
      ),
    [],
  )

  const lista = orgs ?? []
  const conta = (f: Filtro) => (f === 'todas' ? lista.length : lista.filter((o) => o.status === f).length)
  const vis = useMemo(() => {
    const t = nq(q.trim())
    return (orgs ?? []).filter(
      (o) => (filtro === 'todas' || o.status === filtro) && (!t || nq(o.nome + ' ' + o.donoEmail).includes(t)),
    )
  }, [orgs, filtro, q])

  return (
    <TelaCentro
      label="Empresas"
      largura={980}
      topo
      canto={
        <CantoConta
          nome=""
          texto=""
          conta={false}
          onSair={() => void sair()}
          extra={
            situacao === 'ok' && (
              <button
                onClick={() => nav('/sistemas')}
                className={cn(botaoVidroCls, 'rounded-lg px-3 py-[5px] text-[.85rem]')}
              >
                Minha empresa
              </button>
            )
          }
        />
      }
    >
      <CabecalhoEntrada
        eyebrow="CENTRAL DE QA · PLATAFORMA"
        titulo="Empresas"
        sub="Aprove as empresas novas e suspenda ou reative o acesso de cada uma."
      />

      <div className="flex w-full flex-wrap items-center gap-2.5">
        <div role="tablist" aria-label="Status" className="flex flex-wrap gap-2">
          {FILTROS.map(([k, l]) => {
            const on = filtro === k
            return (
              <button
                key={k}
                role="tab"
                aria-selected={on}
                onClick={() => setFiltro(k)}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-1.5 text-[.88rem] font-semibold transition-colors',
                  on
                    ? 'border-transparent bg-brand text-navy-deep'
                    : 'border-white/16 bg-white/4 text-hero-text hover:border-cyan hover:text-white',
                )}
              >
                {l}
                <span
                  className={cn('rounded-full px-1.5 font-mono text-[.7rem]', on ? 'bg-navy-deep/12' : 'bg-white/10')}
                >
                  {conta(k)}
                </span>
              </button>
            )
          })}
        </div>
        <span className="flex-1" />
        <label className="flex flex-[0_1_280px] items-center gap-2 rounded-full border border-white/16 bg-white/6 px-3.5 py-1.5 text-hero-text">
          <Search className="size-[15px]" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome ou e-mail"
            aria-label="Buscar empresa"
            className="w-full border-0 bg-transparent text-[.92rem] text-white outline-none placeholder:text-white/40"
          />
        </label>
      </div>

      <div className="mt-5 w-full overflow-hidden rounded-[18px] border border-white/14 bg-navy-card text-left shadow-[0_24px_48px_rgba(5,7,25,.5)]">
        {orgs === null ? (
          <p className="m-0 p-[22px] text-hero-text">Carregando…</p>
        ) : erro ? (
          <p role="alert" className="m-0 p-[22px] text-pink">
            {erro}
          </p>
        ) : !vis.length ? (
          <p className="m-0 p-[22px] text-hero-text">
            {lista.length ? 'Nenhuma empresa encontrada.' : 'Nenhuma empresa cadastrada ainda.'}
          </p>
        ) : (
          vis.map((o) => <LinhaEmpresa key={o.id} o={o} uid={user?.uid ?? ''} />)
        )}
      </div>
      {!!lista.length && (
        <p className="m-0 mt-3.5 self-start text-[.86rem] text-hero-text">
          {plural(lista.length, 'empresa', 'empresas')} na plataforma.
        </p>
      )}
    </TelaCentro>
  )
}

function LinhaEmpresa({ o, uid }: { o: Org; uid: string }) {
  const { armado, armar } = useArmar()
  const [ocupado, setOcupado] = useState(false)
  const st = ST[o.status]

  const mudar = async (status: StatusOrg, msg: string) => {
    setOcupado(true)
    try {
      await definirStatusOrg(o.id, status, uid)
      toast(msg)
    } catch (e) {
      console.error(e)
      toast.error('Não foi possível alterar o status. ' + ((e as Error)?.message ?? ''))
    } finally {
      setOcupado(false)
    }
  }

  const k = 'susp-' + o.id
  return (
    <div className="flex flex-wrap items-center gap-3.5 border-b border-white/8 px-5 py-3.5 last:border-b-0">
      <span className="flex min-w-0 flex-[1_1_240px] flex-col leading-[1.35]">
        <span className="font-semibold break-words text-white">{o.nome || '(sem nome)'}</span>
        <span className="truncate text-[.86rem] text-hero-text">{o.donoEmail}</span>
        <span className="font-mono text-[.74rem] text-white/50">
          Criada em {o.criadoEm ? fmtData(o.criadoEm) : '—'}
        </span>
      </span>
      <span
        className="rounded-full px-2.5 py-0.5 text-[.78rem] font-semibold whitespace-nowrap"
        style={{ color: st[1], background: st[2] }}
      >
        {st[0]}
      </span>
      <span className="flex flex-wrap gap-2">
        {o.status === 'pendente' && (
          <button
            disabled={ocupado}
            onClick={() => mudar('ativa', `${o.nome} aprovada`)}
            className={cn(botaoBrandCls, 'px-3.5 py-1.5 text-[.88rem]')}
          >
            Aprovar
          </button>
        )}
        {o.status === 'ativa' && (
          <button
            disabled={ocupado}
            onClick={() => armar(k, () => void mudar('suspensa', `${o.nome} suspensa`))}
            className={cn(
              botaoVidroCls,
              'px-3.5 py-1.5 text-[.88rem]',
              armado(k) && 'border-pink bg-[rgba(255,158,199,.14)] text-white',
            )}
          >
            {armado(k) ? 'Clique de novo para confirmar' : 'Suspender'}
          </button>
        )}
        {o.status === 'suspensa' && (
          <button
            disabled={ocupado}
            onClick={() => mudar('ativa', `${o.nome} reativada`)}
            className={cn(botaoVidroCls, 'px-3.5 py-1.5 text-[.88rem]')}
          >
            Reativar
          </button>
        )}
      </span>
    </div>
  )
}
