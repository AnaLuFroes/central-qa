import { NavLink } from 'react-router-dom'
import { Hero, HeroLead, HeroTitle } from '@/components/Hero'
import { cn } from '@/lib/utils'

const TABS: [string, string][] = [
  ['/', 'Módulos'],
  ['/lotes', 'Lotes enviados'],
]

/** Cabeçalho do app do QA: título, descrição e abas Módulos / Lotes enviados. */
export function AppHero() {
  return (
    <Hero className="pt-11 pb-20">
      <HeroTitle>Central de QA</HeroTitle>
      <HeroLead className="text-[1.15rem] leading-[1.65]">
        Cadastre erros e melhorias, organize no padrão de correção e envie ao dev só o que ele precisa ver.
      </HeroLead>
      <nav role="tablist" className="mt-7 flex flex-wrap gap-1.5">
        {TABS.map(([to, label]) => (
          <NavLink
            key={to}
            to={to}
            end
            role="tab"
            className={({ isActive }) =>
              cn(
                'rounded-lg border px-5 py-[9px] text-[1.05rem] no-underline',
                isActive
                  ? 'border-transparent bg-brand-bar font-semibold text-navy-deep'
                  : 'border-white/20 bg-white/5 font-medium text-[#E3E4F7] hover:bg-white/12',
              )
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </Hero>
  )
}
