import { LogOut, ShieldCheck, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { ROLE_LABEL } from '@/auth/roles'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { initials } from '@/lib/format'
import { useSair } from '@/store/SessionStore'

export function UserMenu() {
  const { user, role } = useAuth()
  const sair = useSair()
  const nav = useNavigate()
  if (!user) return null
  const nome = user.displayName || user.email || 'Usuário'
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="mt-4 rounded-full ring-2 ring-white/20 transition hover:ring-white/40 focus-visible:ring-[#8FF0F2] focus-visible:outline-none"
        aria-label="Menu do usuário"
      >
        <Avatar className="size-9">
          {user.photoURL && <AvatarImage src={user.photoURL} alt="" />}
          <AvatarFallback className="bg-white/10 text-xs font-semibold text-white">{initials(nome)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate font-semibold text-foreground">{nome}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
          {role && (
            <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[0.72rem] font-semibold text-primary">
              <ShieldCheck className="size-3" />
              {ROLE_LABEL[role]}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {role === 'admin' && (
          <DropdownMenuItem onSelect={() => nav('/admin/usuarios')}>
            <Users /> Usuários e níveis
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => sair().then(() => nav('/login'))}>
          <LogOut /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
