import { useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/auth/AuthProvider'
import { useHome } from '@/auth/RequireRole'
import { CartaoEscuro, Erro, inputEscuroCls, labelEscuroCls } from '@/components/qa'
import {
  botaoBrandCls,
  botaoVidroCls,
  CabecalhoEntrada,
  GoogleIcon,
  linkCianoCls,
  TelaCentro,
} from '@/components/Entrada'
import { erroAuth } from '@/lib/erroAuth'
import { emailValido } from '@/lib/format'
import { cn } from '@/lib/utils'

type Modo = 'entrar' | 'primeiro'

/** Tela de entrada: e-mail e senha, Google, recuperação de senha e primeiro acesso de quem foi convidado. */
export default function Entrar() {
  const { user, entrarComEmail, entrarComGoogle, criarConta, esqueciSenha } = useAuth()
  const home = useHome()
  const nav = useNavigate()
  const [modo, setModo] = useState<Modo>('entrar')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)

  if (user) return <Navigate to={home} replace />

  const run = async (fn: () => Promise<unknown>, prefixo?: string) => {
    setErro('')
    setOcupado(true)
    try {
      await fn()
    } catch (e) {
      setErro(erroAuth(e, prefixo))
    } finally {
      setOcupado(false)
    }
  }

  const enviar = () => {
    if (ocupado) return
    const em = email.trim().toLowerCase()
    if (modo === 'primeiro') {
      if (!nome.trim() || !em || !senha) return setErro('Preencha todos os campos.')
      if (!emailValido(em)) return setErro('Informe um e-mail válido.')
      if (senha.length < 6) return setErro('A senha precisa ter pelo menos 6 caracteres.')
      void run(() => criarConta(nome.trim(), em, senha), 'Não foi possível criar a conta.')
      return
    }
    if (!em || !senha) return setErro('Informe e-mail e senha.')
    void run(() => entrarComEmail(em, senha))
  }

  const esqueci = () => {
    const em = email.trim().toLowerCase()
    if (!emailValido(em)) return setErro('Digite o seu e-mail acima para receber o link de nova senha.')
    void run(async () => {
      await esqueciSenha(em)
      toast(`Enviamos um link para criar uma nova senha em ${em}.`)
    }, 'Não foi possível enviar o e-mail.')
  }

  const trocarModo = (m: Modo) => {
    setModo(m)
    setErro('')
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      enviar()
    }
  }

  const mudar = (f: (v: string) => void) => (e: ChangeEvent<HTMLInputElement>) => {
    f(e.target.value)
    setErro('')
  }
  const primeiro = modo === 'primeiro'

  return (
    <TelaCentro label="Entrar">
      <CabecalhoEntrada
        titulo="Central de QA"
        sub={
          primeiro
            ? 'Para quem foi adicionado à equipe por uma empresa: crie a sua senha com o mesmo e-mail. É o responsável pela empresa? Use “Criar conta da empresa”, abaixo.'
            : 'Entre com a sua conta. O QA vê o processo completo; o dev vê os lotes enviados para ele.'
        }
      />
      <CartaoEscuro className="w-full">
        <button
          type="button"
          disabled={ocupado}
          onClick={() => run(entrarComGoogle)}
          className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-[10px] border border-white/18 bg-white px-4 py-2.5 text-[.96rem] font-semibold text-navy-deep transition hover:brightness-95 disabled:opacity-60"
        >
          <GoogleIcon /> Continuar com Google
        </button>
        <div className="my-4 flex items-center gap-3 text-[.8rem] text-hero-text">
          <span className="h-px flex-1 bg-white/14" />
          ou com e-mail
          <span className="h-px flex-1 bg-white/14" />
        </div>

        {primeiro && (
          <>
            <label htmlFor="lg-nome" className={labelEscuroCls}>
              Seu nome
            </label>
            <input
              id="lg-nome"
              autoComplete="name"
              value={nome}
              onChange={mudar(setNome)}
              onKeyDown={onKey}
              placeholder="Ex.: Marina Souza"
              className={cn(inputEscuroCls, 'mb-3.5')}
            />
          </>
        )}
        <label htmlFor="lg-email" className={labelEscuroCls}>
          E-mail
        </label>
        <input
          id="lg-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={mudar(setEmail)}
          onKeyDown={onKey}
          placeholder="voce@empresa.com"
          className={inputEscuroCls}
        />
        <div className="mt-3.5 mb-1.5 flex items-baseline justify-between gap-3">
          <label htmlFor="lg-senha" className={cn(labelEscuroCls, 'mb-0')}>
            {primeiro ? 'Crie uma senha' : 'Senha'}
          </label>
          {!primeiro && (
            <button
              type="button"
              onClick={esqueci}
              disabled={ocupado}
              className="cursor-pointer text-[.82rem] text-hero-text hover:text-white hover:underline"
            >
              Esqueci minha senha
            </button>
          )}
        </div>
        <input
          id="lg-senha"
          type="password"
          autoComplete={primeiro ? 'new-password' : 'current-password'}
          value={senha}
          onChange={mudar(setSenha)}
          onKeyDown={onKey}
          className={inputEscuroCls}
        />
        <Erro escuro>{erro}</Erro>
        <button onClick={enviar} disabled={ocupado} className={cn(botaoBrandCls, 'mt-[18px] w-full')}>
          {ocupado ? 'Aguarde…' : primeiro ? 'Criar minha senha e entrar' : 'Entrar'}
        </button>
      </CartaoEscuro>

      {primeiro ? (
        <button onClick={() => trocarModo('entrar')} className={cn(botaoVidroCls, 'mt-[18px] border-0 bg-transparent')}>
          Já tenho senha · Entrar
        </button>
      ) : (
        <p className="m-0 mt-[18px] text-[.92rem] text-hero-text">
          Primeiro acesso?{' '}
          <button onClick={() => trocarModo('primeiro')} className={linkCianoCls}>
            Fui convidado pela minha empresa
          </button>
        </p>
      )}
      <p className="m-0 mt-3 text-[.92rem] text-hero-text">
        Sua empresa ainda não usa a Central de QA?{' '}
        <button onClick={() => nav('/cadastro')} className={linkCianoCls}>
          Criar conta da empresa
        </button>
      </p>
    </TelaCentro>
  )
}
