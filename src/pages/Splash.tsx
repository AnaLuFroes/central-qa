import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

const CHAVE = 'cqa-splash'

const jaViu = () => {
  try {
    return sessionStorage.getItem(CHAVE) === '1'
  } catch {
    return false
  }
}

const marcarVisto = () => {
  try {
    sessionStorage.setItem(CHAVE, '1')
  } catch {
    /* sem sessionStorage: a abertura volta a aparecer */
  }
}

/** Abertura animada: um clique leva à tela de entrada. Aparece uma vez por sessão do navegador. */
export default function Splash() {
  const nav = useNavigate()
  const [visto] = useState(jaViu)
  const [saindo, setSaindo] = useState(false)
  const t = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(t.current), [])

  if (visto) return <Navigate to="/entrar" replace />

  const entrar = () => {
    if (saindo) return
    setSaindo(true)
    marcarVisto()
    t.current = setTimeout(() => nav('/entrar', { replace: true }), 620)
  }

  return (
    <section
      data-screen-label="Abertura"
      onClick={entrar}
      className={cn(
        'relative flex min-h-screen cursor-pointer flex-col items-center justify-center overflow-hidden bg-auth px-5 py-12 text-center text-white transition-opacity duration-600',
        saindo && 'opacity-0',
      )}
    >
      <div className="pointer-events-none absolute inset-0 auth-grid" aria-hidden />
      <div
        className={cn(
          'relative grid aspect-square w-[360px] max-w-[86vw] place-items-center transition-transform duration-700 ease-[cubic-bezier(.6,-.25,.3,1)]',
          saindo && 'scale-130',
        )}
      >
        <span
          aria-hidden
          className="absolute inset-0 animate-cqa-ring rounded-full border border-[rgba(143,240,242,.45)]"
        />
        <span
          aria-hidden
          className="absolute inset-0 animate-cqa-ring rounded-full border border-[rgba(180,200,248,.4)] [animation-delay:1.2s]"
        />
        <span
          aria-hidden
          className="absolute inset-0 animate-cqa-ring rounded-full border border-[rgba(195,155,245,.4)] [animation-delay:2.4s]"
        />
        <span
          aria-hidden
          className="absolute inset-[19%] animate-cqa-spin rounded-full bg-[conic-gradient(from_0deg,#8FF0F2,#B4C8F8,#C39BF5,#8FF0F2)] opacity-55 blur-[34px]"
        />
        <button
          aria-label="Entrar na Central de QA"
          className="relative animate-cqa-in cursor-pointer rounded-[46px] border-0 bg-transparent p-0"
        >
          <span className="relative block size-[clamp(140px,46vw,184px)] animate-cqa-breath overflow-hidden rounded-[25%] shadow-[0_30px_70px_rgba(5,7,25,.6),0_0_0_1px_rgba(255,255,255,.1)]">
            <img src="/logo.png" alt="" className="block size-full" />
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 w-3/5 animate-cqa-shine bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.38),transparent)]"
            />
          </span>
        </button>
      </div>
      <h1 className="relative m-0 mt-2 mb-2.5 w-fit max-w-full animate-cqa-up font-serif text-[clamp(2.2rem,5vw,3.2rem)] leading-[1.1] font-bold text-brand [animation-delay:.5s]">
        Central de QA
      </h1>
      <p className="relative m-0 animate-cqa-up text-[1.05rem] text-hero-text [animation-delay:.75s]">
        Ocorrências, casos de teste e entregas ao dev em um só lugar.
      </p>
      <p className="relative m-0 mt-9 flex animate-cqa-up items-center gap-2.5 font-mono text-[.8rem] tracking-[.16em] text-cyan [animation-delay:1s]">
        <span className="animate-cqa-blink">CLIQUE NO LOGO PARA ENTRAR</span>
      </p>
    </section>
  )
}
