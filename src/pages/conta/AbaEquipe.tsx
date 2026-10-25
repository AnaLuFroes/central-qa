import { useMemo, useState, type KeyboardEvent } from 'react'
import { Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/auth/AuthProvider'
import { PERFIL_COR, PERFIL_DESC } from '@/auth/roles'
import { Avatar, CartaoEscuro, inputEscuroCls, labelEscuroCls } from '@/components/qa'
import { botaoBrandCls } from '@/components/Entrada'
import { adicionarMembro, definirPerfil, removerMembro } from '@/data/membros'
import { useArmar } from '@/hooks/useArmar'
import { useExecutar, useSessao } from '@/hooks/useSessao'
import { emailValido, nq, plural } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/store/hooks'
import type { Membro, Perfil } from '@/types'

const ORDEM: Perfil[] = ['QA', 'Dev', 'Admin']
const NOME: Record<Perfil, string> = { QA: 'QA', Dev: 'Dev', Admin: 'Administrador' }

/** Seletor de perfil em pílulas (QA · Dev · Admin). */
function Segmentado({ valor, onPick, trava }: { valor: Perfil; onPick: (p: Perfil) => void; trava?: string }) {
  return (
    <div role="radiogroup" className="inline-flex flex-none rounded-full border border-white/12 bg-white/6 p-[3px]">
      {ORDEM.map((k) => {
        const on = valor === k
        return (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={!!trava && !on}
            title={trava ?? 'Definir como ' + NOME[k]}
            onClick={() => !trava && !on && onPick(k)}
            className={cn(
              'rounded-full border-0 px-3.5 py-1.5 text-[.84rem] font-semibold transition-[background,color] duration-250',
              trava ? 'cursor-default' : 'cursor-pointer',
              trava && !on && 'opacity-35',
              on ? 'text-navy-deep' : 'bg-transparent text-hero-text',
            )}
            style={on ? { background: PERFIL_COR[k] } : undefined}
          >
            {k === 'Admin' ? 'Admin' : NOME[k]}
          </button>
        )
      })}
    </div>
  )
}

/** Equipe e perfis (só Admin): convites, perfis e remoção. */
export default function AbaEquipe() {
  const membros = useAppSelector((s) => s.data.membros)
  const todos = useMemo(
    () => [...membros].sort((a, b) => (a.nome || a.email).localeCompare(b.nome || b.email, 'pt-BR')),
    [membros],
  )
  const [q, setQ] = useState('')
  const t = nq(q.trim())
  const lista = todos.filter((u) => !t || nq(u.nome + ' ' + u.email).includes(t))

  return (
    <>
      <div className="mt-7 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
        {ORDEM.map((k) => (
          <div key={k} className="flex flex-col gap-1.5 rounded-2xl border border-white/12 bg-white/4 px-[18px] py-4">
            <span className="flex items-center justify-between gap-2.5">
              <span className="inline-flex items-center gap-2 font-semibold">
                <span className="size-2.5 rounded-full" style={{ background: PERFIL_COR[k] }} />
                {NOME[k]}
              </span>
              <span className="font-serif text-[1.6rem] leading-none font-bold" style={{ color: PERFIL_COR[k] }}>
                {todos.filter((u) => u.perfil === k).length}
              </span>
            </span>
            <span className="text-[.86rem] leading-normal text-hero-text">{PERFIL_DESC[k]}</span>
          </div>
        ))}
      </div>

      <NovaPessoa membros={todos} />

      <div className="mt-8 mb-3 flex flex-wrap items-center gap-3">
        <h2 className="m-0 font-serif text-[1.2rem] text-white">Pessoas da empresa</h2>
        <span className="font-mono text-[.8rem] text-hero-text">{plural(todos.length, 'pessoa', 'pessoas')}</span>
        <span className="flex-1" />
        <label className="flex flex-[1_1_220px] items-center gap-2 rounded-full border border-white/16 bg-white/6 px-3.5 py-1.5 text-hero-text sm:flex-[0_1_260px]">
          <Search className="size-[15px]" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar pessoa"
            aria-label="Buscar pessoa"
            className="w-full border-0 bg-transparent text-[.92rem] text-white outline-none placeholder:text-white/40"
          />
        </label>
      </div>
      <div className="w-full overflow-hidden rounded-[18px] border border-white/14 bg-navy-card text-left shadow-[0_24px_48px_rgba(5,7,25,.5)]">
        {!lista.length && <p className="m-0 p-[22px] text-hero-text">Ninguém encontrado.</p>}
        {lista.map((u) => (
          <LinhaPessoa key={u.email} u={u} />
        ))}
      </div>
      <p className="m-0 mx-0.5 mt-3.5 text-[.86rem] text-hero-text">
        As mudanças valem a partir do próximo acesso de cada pessoa. A conta responsável sempre continua como
        Administrador.
      </p>
      <p className="m-0 mx-0.5 mt-1.5 text-[.86rem] text-hero-text">
        A pessoa entra com esse e-mail (Google ou &quot;Primeiro acesso&quot; na tela de entrada).
      </p>
    </>
  )
}

function NovaPessoa({ membros }: { membros: Membro[] }) {
  const { orgId } = useSessao()
  const executar = useExecutar()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [perfil, setPerfil] = useState<Perfil>('QA')
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const add = async () => {
    const n = nome.trim()
    const em = email.trim().toLowerCase()
    if (!n || !em) return setErro('Informe nome e e-mail.')
    if (!emailValido(em)) return setErro('Informe um e-mail válido.')
    if (membros.some((u) => u.email === em)) return setErro('Essa pessoa já está na equipe.')
    setOcupado(true)
    const ok = await executar(
      adicionarMembro(orgId, n, em, perfil).then(() => true),
      `${n} foi adicionado como ${NOME[perfil]}`,
    )
    setOcupado(false)
    if (ok) {
      setNome('')
      setEmail('')
      setErro('')
    }
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      void add()
    }
  }

  return (
    <CartaoEscuro className="mt-6 px-[22px] py-5">
      <h2 className="m-0 mb-3.5 font-serif text-[1.2rem] text-white">Adicionar pessoa</h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] items-end gap-x-3.5 gap-y-3">
        <div>
          <label htmlFor="eq-nome" className={labelEscuroCls}>
            Nome
          </label>
          <input
            id="eq-nome"
            value={nome}
            onChange={(e) => {
              setNome(e.target.value)
              setErro('')
            }}
            onKeyDown={onKey}
            placeholder="Ex.: Bruno Lima"
            className={inputEscuroCls}
          />
        </div>
        <div>
          <label htmlFor="eq-email" className={labelEscuroCls}>
            E-mail
          </label>
          <input
            id="eq-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setErro('')
            }}
            onKeyDown={onKey}
            placeholder="bruno@empresa.com"
            className={inputEscuroCls}
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-[.86rem] font-semibold text-hero-text">Perfil</span>
        <Segmentado valor={perfil} onPick={setPerfil} />
        <span className="flex-1" />
        {erro && (
          <span role="alert" className="text-[.88rem] text-pink">
            {erro}
          </span>
        )}
        <button onClick={add} disabled={ocupado} className={cn(botaoBrandCls, 'text-[.95rem] whitespace-nowrap')}>
          Adicionar
        </button>
      </div>
    </CartaoEscuro>
  )
}

function LinhaPessoa({ u }: { u: Membro }) {
  const { org } = useAuth()
  const ses = useSessao()
  const executar = useExecutar()
  const { armado, armar } = useArmar()
  const dono = !!org && u.email === org.donoEmail.toLowerCase()
  const eu = u.email === ses.email.toLowerCase()
  const armed = armado(u.email)
  const semRemover = dono || eu
  const delTip = dono
    ? 'A conta responsável não pode ser removida'
    : eu
      ? 'Você não pode remover a sua própria conta'
      : armed
        ? 'Clique de novo para remover'
        : 'Remover ' + (u.nome || u.email)
  const trava = dono
    ? 'A conta responsável é sempre Administrador'
    : eu
      ? 'Peça a outro administrador para mudar o seu perfil'
      : undefined

  const remover = () => {
    if (semRemover) return
    armar(u.email, () => {
      removerMembro(ses.orgId, u.email)
        .then(() => toast(`${u.nome || u.email} foi removido da equipe`))
        .catch((e) => toast.error('Não foi possível remover. ' + ((e as Error)?.message ?? '')))
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3.5 border-b border-white/8 px-4 py-3.5 last:border-b-0 sm:px-5">
      <Avatar nome={u.nome || u.email} foto={u.foto} cor={PERFIL_COR[u.perfil]} size={42} />
      <span className="flex min-w-0 flex-[1_1_200px] flex-col leading-[1.35]">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-white">{u.nome || u.email}</span>
          {eu && (
            <span className="rounded-[5px] bg-cyan px-1.5 py-px font-mono text-[.68rem] tracking-[.08em] whitespace-nowrap text-navy-deep">
              VOCÊ
            </span>
          )}
          {dono && (
            <span className="rounded-[5px] border border-white/20 px-1.5 font-mono text-[.68rem] tracking-[.08em] whitespace-nowrap text-hero-text">
              RESPONSÁVEL PELA CONTA
            </span>
          )}
          {!u.uid && (
            <span
              title="Esta pessoa ainda não entrou na Central de QA"
              className="rounded-[5px] border border-[rgba(255,200,121,.4)] px-1.5 text-[.72rem] font-semibold whitespace-nowrap text-gold"
            >
              Convite pendente
            </span>
          )}
        </span>
        <span className="truncate text-[.86rem] text-hero-text">{u.email}</span>
      </span>
      <Segmentado
        valor={u.perfil}
        trava={trava}
        onPick={(p) => void executar(definirPerfil(ses.orgId, u.email, p), `${u.nome || u.email} agora é ${NOME[p]}`)}
      />
      <button
        onClick={remover}
        disabled={semRemover}
        title={delTip}
        aria-label={delTip}
        className={cn(
          'grid size-[34px] flex-none place-items-center rounded-[9px] border border-white/14 hover:border-pink',
          semRemover ? 'cursor-default opacity-35' : 'cursor-pointer',
          armed ? 'bg-[rgba(255,158,199,.2)] text-pink' : 'bg-transparent text-hero-text',
        )}
      >
        <Trash2 className="size-[15px]" />
      </button>
    </div>
  )
}
