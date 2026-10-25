import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'

type Tema = 'light' | 'dark'
const ThemeContext = createContext<{ tema: Tema; alternar: () => void } | null>(null)

/** Telas que ficam sempre no visual fixo (marinho/claro), como no protótipo. */
const FIXAS = [/^\/$/, /^\/entrar/, /^\/cadastro/, /^\/aguardando/, /^\/sistemas/, /^\/conta/, /^\/plataforma/]
export const telaFixa = (path: string) => FIXAS.some((r) => r.test(path))

function lerTema(): Tema {
  try {
    return localStorage.getItem('cqa-theme') === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(lerTema)
  const { pathname } = useLocation()
  const efetivo = telaFixa(pathname) ? 'light' : tema

  useEffect(() => {
    document.documentElement.dataset.theme = efetivo
  }, [efetivo])

  const alternar = () =>
    setTema((t) => {
      const n = t === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem('cqa-theme', n)
      } catch {
        /* navegação privada: vale só nesta aba */
      }
      return n
    })

  return <ThemeContext.Provider value={{ tema, alternar }}>{children}</ThemeContext.Provider>
}

export function useTema() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTema fora do ThemeProvider')
  return ctx
}

/** Botão flutuante do tema (canto inferior direito). */
export function ThemeToggle() {
  const { tema, alternar } = useTema()
  const { pathname } = useLocation()
  if (telaFixa(pathname)) return null
  const lbl = tema === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'
  return (
    <button
      onClick={alternar}
      aria-label={lbl}
      title={lbl}
      className="fixed right-5 bottom-5 z-10 grid size-[46px] place-items-center rounded-full border border-q-line bg-q-card text-q-ink shadow-[0_8px_22px_rgba(17,20,48,.16)] transition hover:scale-[1.07] hover:-rotate-[18deg]"
    >
      {tema === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  )
}
