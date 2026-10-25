import { useState, type ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Building2, MailCheck, PauseCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/auth/AuthProvider'
import { CartaoEscuro, Erro } from '@/components/qa'
import { botaoBrandCls, botaoVidroCls, CabecalhoEntrada, TelaCentro } from '@/components/Entrada'
import { erroAuth } from '@/lib/erroAuth'
import { useSair } from '@/store/SessionStore'

/** Explica por que a pessoa ainda não entrou: e-mail a verificar, sem empresa ou empresa suspensa. */
export default function Aguardando() {
  const { user, org, situacao, superAdmin, reenviarVerificacao, conferirVerificacao } = useAuth()
  const sair = useSair()
  const nav = useNavigate()
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')

  if (situacao === 'ok') return <Navigate to="/sistemas" replace />

  const email = user?.email ?? ''
  const run = async (fn: () => Promise<void>) => {
    setErro('')
    setOcupado(true)
    try {
      await fn()
    } catch (e) {
      setErro(erroAuth(e, 'Não foi possível concluir.'))
    } finally {
      setOcupado(false)
    }
  }

  const reenviar = () =>
    run(async () => {
      await reenviarVerificacao()
      toast(`E-mail de verificação reenviado para ${email}`)
    })
  const conferir = () =>
    run(async () => {
      if (!(await conferirVerificacao()))
        toast('Ainda não recebemos a confirmação. Abra o link do e-mail e tente de novo.')
    })

  let icone: ReactNode
  let titulo: string
  let texto: ReactNode
  let acoes: ReactNode = null
  if (situacao === 'verificar') {
    icone = <MailCheck />
    titulo = 'Confirme o seu e-mail'
    texto = (
      <>
        Enviamos um e-mail de verificação para <b className="text-white">{email}</b>. Abra o link da mensagem (confira
        também o spam) e depois volte aqui.
      </>
    )
    acoes = (
      <>
        <button onClick={reenviar} disabled={ocupado} className={botaoVidroCls}>
          Reenviar e-mail
        </button>
        <button onClick={conferir} disabled={ocupado} className={botaoBrandCls}>
          Já verifiquei
        </button>
      </>
    )
  } else if (situacao === 'suspensa') {
    icone = <PauseCircle />
    titulo = 'Acesso suspenso'
    texto = (
      <>
        O acesso da empresa <b className="text-white">{org?.nome}</b> à Central de QA está suspenso. Fale com o
        responsável pela conta da empresa ou com a equipe da Central de QA.
      </>
    )
  } else {
    icone = <Building2 />
    titulo = 'Sua conta ainda não está ligada a uma empresa'
    texto = (
      <>
        <b className="text-white">É o responsável pela empresa?</b> Crie a conta da empresa: você entra como
        administrador e cadastra os sistemas e a equipe.
        <span className="mt-3 block">
          <b className="text-white">Foi convidado?</b> Peça ao administrador da sua empresa para adicionar{' '}
          <b className="text-white">{email}</b> em <b className="text-white">Minha conta › Equipe</b> e entre de novo.
        </span>
      </>
    )
    acoes = (
      <button onClick={() => nav('/cadastro')} className={botaoBrandCls}>
        Criar conta da empresa
      </button>
    )
  }

  return (
    <TelaCentro label="Aguardando" largura={480}>
      <CabecalhoEntrada eyebrow="CENTRAL DE QA" titulo={titulo} />
      <CartaoEscuro className="mt-5 w-full">
        <div className="flex items-start gap-3.5">
          <span className="grid size-10 flex-none place-items-center rounded-xl bg-[rgba(143,240,242,.1)] text-cyan [&_svg]:size-5">
            {icone}
          </span>
          <p className="m-0 text-[.96rem] leading-relaxed text-pretty text-hero-text">{texto}</p>
        </div>
        <Erro escuro>{erro}</Erro>
        {acoes && <div className="mt-[18px] flex flex-wrap justify-end gap-2.5">{acoes}</div>}
      </CartaoEscuro>

      <div className="mt-[18px] flex flex-wrap items-center justify-center gap-2.5">
        {superAdmin && (
          <button onClick={() => nav('/plataforma/empresas')} className={botaoBrandCls}>
            Empresas da plataforma
          </button>
        )}
        <button onClick={() => void sair()} className={botaoVidroCls}>
          Sair
        </button>
      </div>
    </TelaCentro>
  )
}
