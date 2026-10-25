import { useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Camera } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/auth/AuthProvider'
import { PERFIL_COR, PERFIL_LABEL } from '@/auth/roles'
import { Voltar } from '@/components/AppHeader'
import { CartaoEscuro, Erro, inputEscuroCls, labelEscuroCls } from '@/components/qa'
import { botaoBrandCls, TelaCentro } from '@/components/Entrada'
import { atualizarMeuPerfil } from '@/data/membros'
import { imagemFoto } from '@/data/prints'
import { useExecutar, useSessao } from '@/hooks/useSessao'
import { iniPessoa } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useSair } from '@/store/SessionStore'
import AbaEquipe from '@/pages/conta/AbaEquipe'
import AbaIA from '@/pages/conta/AbaIA'

type Aba = 'perfil' | 'equipe' | 'ia'

const ABAS: { k: Aba; label: string; curto: string; sub: string }[] = [
  {
    k: 'perfil',
    label: 'Meu perfil',
    curto: 'Perfil',
    sub: 'Sua foto e seu nome aparecem para a equipe nos lotes, nas respostas e no histórico.',
  },
  {
    k: 'equipe',
    label: 'Equipe e perfis',
    curto: 'Equipe',
    sub: 'Defina o perfil de cada pessoa. O perfil decide o que ela vê ao entrar.',
  },
  {
    k: 'ia',
    label: 'Configuração de IA',
    curto: 'IA',
    sub: 'O provedor de IA que a empresa usa para gerar casos de teste e organizar ocorrências.',
  },
]

/** Minha conta: perfil, equipe (Admin) e configuração de IA (Admin e QA). */
export default function Conta() {
  const { org } = useAuth()
  const ses = useSessao()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const abas = ABAS.filter((a) => a.k === 'perfil' || (a.k === 'equipe' ? ses.isAdmin : ses.isQA))
  const pedida = params.get('aba')
  const aba = abas.find((a) => a.k === pedida) ?? abas[0]
  const ai = abas.indexOf(aba)
  const n = abas.length

  const temHistorico = ((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0
  const voltar = () => (temHistorico ? nav(-1) : nav('/sistemas'))

  return (
    <TelaCentro label="Minha conta" largura={860} topo>
      <div className="flex w-full flex-col text-left">
        <div className="self-start">
          <Voltar onClick={voltar}>{temHistorico ? 'Voltar' : 'Sistemas'}</Voltar>
        </div>
        <p className="m-0 mt-2 mb-3 font-mono text-[.8rem] tracking-[.14em] break-words text-cyan">
          {(ses.nome + ' · ' + (org?.nome ?? '')).toUpperCase()}
        </p>
        <h1 className="m-0 mb-2.5 w-fit max-w-full font-serif text-[clamp(2rem,4.4vw,2.8rem)] leading-[1.12] font-bold text-brand">
          Minha conta
        </h1>
        <p className="m-0 max-w-[62ch] text-[1.05rem] text-pretty text-hero-text">{aba.sub}</p>

        {n > 1 && (
          <div
            role="tablist"
            aria-label="Seções da conta"
            className="relative mt-[26px] grid self-start rounded-full border border-white/12 bg-white/5 p-1"
            style={{
              gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
              width: n === 2 ? 'min(420px, 100%)' : 'min(600px, 100%)',
            }}
          >
            <span
              aria-hidden
              className="absolute top-1 bottom-1 rounded-full bg-brand shadow-[0_6px_22px_rgba(143,240,242,.3)] transition-[left] duration-500 ease-mola"
              style={{ left: `calc(4px + ${ai} * (100% - 8px) / ${n})`, width: `calc((100% - 8px) / ${n})` }}
            />
            {abas.map((a) => {
              const on = a === aba
              return (
                <button
                  key={a.k}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setParams({ aba: a.k }, { replace: true })}
                  className={cn(
                    'relative z-[1] min-w-0 cursor-pointer truncate rounded-full border-0 bg-transparent px-3 py-[9px] text-[.92rem] font-semibold transition-colors duration-300',
                    on ? 'text-navy-deep' : 'text-hero-text hover:text-white',
                  )}
                >
                  <span className="sm:hidden">{a.curto}</span>
                  <span className="max-sm:hidden">{a.label}</span>
                </button>
              )
            })}
          </div>
        )}

        {aba.k === 'perfil' && <AbaPerfil />}
        {aba.k === 'equipe' && <AbaEquipe />}
        {aba.k === 'ia' && <AbaIA />}
      </div>
    </TelaCentro>
  )
}

function AbaPerfil() {
  const { membro, org } = useAuth()
  const ses = useSessao()
  const sair = useSair()
  const executar = useExecutar()
  const fotoRef = useRef<HTMLInputElement>(null)
  const nome = membro?.nome || ses.nome
  const foto = membro?.foto ?? ses.foto
  const perfil = membro?.perfil ?? ses.perfil ?? 'QA'
  const [draft, setDraft] = useState<string | null>(null)
  const [erro, setErro] = useState('')
  const valor = draft ?? nome
  const semMudanca = valor.trim() === nome

  const salvarNome = async () => {
    const n = valor.trim()
    if (!n) return setErro('O nome não pode ficar vazio.')
    if (n === nome) return
    const ok = await executar(
      atualizarMeuPerfil(ses.orgId, ses.email, { nome: n }).then(() => true),
      'Nome atualizado',
    )
    if (ok) setDraft(null)
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      void salvarNome()
    }
  }

  const onFoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const url = await imagemFoto(file)
      await executar(atualizarMeuPerfil(ses.orgId, ses.email, { foto: url }), 'Foto atualizada')
    } catch (err) {
      toast.error((err as Error)?.message || 'Não foi possível usar essa imagem.')
    }
  }

  const av = foto ? `center/cover no-repeat url("${foto}")` : `linear-gradient(135deg, ${PERFIL_COR[perfil]}, #B4C8F8)`

  return (
    <CartaoEscuro className="mt-6 flex flex-wrap items-start gap-7 p-[22px] sm:p-[26px]">
      <input type="file" accept="image/*" ref={fotoRef} onChange={onFoto} className="hidden" />
      <div className="mx-auto flex w-40 flex-none flex-col items-center gap-3 sm:mx-0">
        <button
          onClick={() => fotoRef.current?.click()}
          aria-label="Trocar foto"
          title="Trocar foto"
          className="group relative grid size-[132px] cursor-pointer place-items-center overflow-hidden rounded-full border-0 p-0 shadow-[0_0_0_4px_rgba(255,255,255,.08),0_18px_40px_rgba(5,7,25,.5)]"
          style={{ background: av }}
        >
          {!foto && <span className="font-serif text-[2.8rem] font-bold text-navy-deep">{iniPessoa(nome)}</span>}
          <span className="absolute inset-x-0 bottom-0 grid h-10 place-items-center bg-[rgba(14,16,39,.62)] text-white opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="size-[18px]" strokeWidth={1.8} />
          </span>
        </button>
        <button
          onClick={() => fotoRef.current?.click()}
          className="w-full cursor-pointer rounded-[10px] border border-white/16 bg-white/6 px-3.5 py-[9px] text-[.9rem] font-medium whitespace-nowrap text-[#E3E4F7] hover:bg-white/12"
        >
          {foto ? 'Trocar foto' : 'Enviar foto'}
        </button>
        {foto && (
          <button
            onClick={() => void executar(atualizarMeuPerfil(ses.orgId, ses.email, { foto: '' }), 'Foto removida')}
            className="cursor-pointer border-0 bg-transparent p-0 text-[.86rem] text-pink hover:underline"
          >
            Remover foto
          </button>
        )}
      </div>

      <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
        <div>
          <label htmlFor="me-nome" className={labelEscuroCls}>
            Nome
          </label>
          <div className="flex flex-wrap gap-2.5">
            <input
              id="me-nome"
              value={valor}
              onChange={(e) => {
                setDraft(e.target.value)
                setErro('')
              }}
              onKeyDown={onKey}
              className={cn(inputEscuroCls, 'w-auto flex-[1_1_220px]')}
            />
            <button
              onClick={salvarNome}
              disabled={semMudanca}
              className={cn(botaoBrandCls, 'text-[.95rem] whitespace-nowrap disabled:opacity-45')}
            >
              Salvar nome
            </button>
          </div>
          <Erro escuro>{erro}</Erro>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
          <div>
            <span className={labelEscuroCls}>E-mail</span>
            <span className="block truncate rounded-[10px] border border-dashed border-white/14 bg-white/3 px-3 py-2.5 text-[.98rem] text-white">
              {ses.email}
            </span>
          </div>
          <div>
            <span className={labelEscuroCls}>Perfil</span>
            <span
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-[9px] text-[.95rem] font-semibold text-navy-deep"
              style={{ background: PERFIL_COR[perfil] }}
            >
              {PERFIL_LABEL[perfil]}
            </span>
          </div>
        </div>
        <div>
          <span className={labelEscuroCls}>Empresa</span>
          <span className="text-[.98rem] text-white">{org?.nome}</span>
        </div>
        <p className="m-0 text-[.86rem] text-hero-text">
          {perfil === 'Admin'
            ? 'Como administrador, você gerencia os sistemas e os perfis da equipe na aba ao lado.'
            : 'Só o administrador da empresa pode mudar o seu perfil.'}
        </p>
        <div className="flex flex-wrap gap-2.5 border-t border-white/10 pt-3.5">
          <button
            onClick={() => void sair()}
            className="cursor-pointer rounded-[10px] border border-white/16 bg-white/6 px-3.5 py-[9px] text-[.9rem] font-medium whitespace-nowrap text-[#E3E4F7] transition-colors hover:border-pink hover:bg-[rgba(255,158,199,.14)] hover:text-white"
          >
            Sair da conta
          </button>
        </div>
      </div>
    </CartaoEscuro>
  )
}
