import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/auth/AuthProvider'
import { ROLES, ROLE_LABEL } from '@/auth/roles'
import { Footer } from '@/components/Footer'
import { FloatCard, Hero, HeroLead, HeroTitle, Main } from '@/components/Hero'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { definirNivel } from '@/data/usuarios'
import { fmtData, initials } from '@/lib/format'
import { useAppSelector } from '@/store/hooks'
import type { Role } from '@/types'

const DESC: Record<Role, string> = {
  admin: 'Tudo do QA + gerencia usuários e níveis',
  qa: 'Cadastra módulos e ocorrências e gera lotes',
  dev: 'Vê os lotes e marca fixes como concluídos',
  pendente: 'Sem acesso (aguardando liberação)',
}

const badge: Record<Role, 'melhoria' | 'sucesso' | 'pendente' | 'erro'> = {
  admin: 'erro',
  qa: 'melhoria',
  dev: 'sucesso',
  pendente: 'pendente',
}

export default function Usuarios() {
  const { user } = useAuth()
  const nav = useNavigate()
  const usuarios = useAppSelector((s) => s.data.usuarios)
  const [salvando, setSalvando] = useState<string | null>(null)

  const ordem = (r: Role) => ROLES.indexOf(r)
  const lista = [...usuarios].sort((a, b) => (a.role === 'pendente' ? -1 : 0) - (b.role === 'pendente' ? -1 : 0) || ordem(a.role) - ordem(b.role) || a.email.localeCompare(b.email))
  const pendentes = usuarios.filter((u) => u.role === 'pendente').length

  const mudar = async (uid: string, role: Role) => {
    if (!user) return
    setSalvando(uid)
    try {
      await definirNivel(uid, role, user.uid)
      toast.success(`Nível alterado para ${ROLE_LABEL[role]}`)
    } catch (e) {
      toast.error('Não foi possível alterar o nível. ' + (e as Error).message)
    } finally {
      setSalvando(null)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Hero className="pt-11 pb-20">
        <HeroTitle size="md">Usuários e níveis</HeroTitle>
        <HeroLead>Defina quem é Administrador, QA ou Dev. Contas novas entram como Pendente até serem liberadas.</HeroLead>
      </Hero>
      <Main>
        <FloatCard className="-mt-[60px] flex flex-wrap gap-x-10 gap-y-4 px-7 py-[22px]">
          {ROLES.map((r) => (
            <div key={r} className="min-w-[150px]">
              <div className="font-serif text-[2rem] leading-none font-bold text-primary">
                {usuarios.filter((u) => u.role === r).length}
              </div>
              <div className="mt-1.5 font-semibold">{ROLE_LABEL[r]}</div>
              <div className="text-[.85rem] text-muted-foreground">{DESC[r]}</div>
            </div>
          ))}
        </FloatCard>

        <div className="mt-8 mb-3 flex items-center gap-3">
          <Button variant="outline" className="text-muted-foreground hover:border-primary hover:bg-card hover:text-primary" onClick={() => nav('/')}>
            <ArrowLeft /> Voltar
          </Button>
          {pendentes > 0 && (
            <Badge variant="pendente" className="h-auto px-3 py-1 text-[.85rem]">
              {pendentes} aguardando liberação
            </Badge>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Usuário</TableHead>
                <TableHead>Desde</TableHead>
                <TableHead>Nível atual</TableHead>
                <TableHead className="pr-4">Alterar nível</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((u) => {
                const eu = u.uid === user?.uid
                return (
                  <TableRow key={u.uid}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          {u.foto && <AvatarImage src={u.foto} alt="" />}
                          <AvatarFallback className="bg-accent text-xs font-semibold text-primary">{initials(u.nome || u.email)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate font-semibold">
                            {u.nome || '—'} {eu && <span className="font-normal text-muted-foreground">(você)</span>}
                          </div>
                          <div className="truncate text-[.85rem] text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{fmtData(u.criadoEm)}</TableCell>
                    <TableCell>
                      <Badge variant={badge[u.role]} className="h-auto px-2.5 py-0.5">
                        {ROLE_LABEL[u.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-4">
                      <Select value={u.role} onValueChange={(r) => mudar(u.uid, r as Role)} disabled={eu || salvando === u.uid}>
                        <SelectTrigger className="w-44 bg-background" aria-label={`Nível de ${u.email}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {ROLE_LABEL[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                )
              })}
              {!lista.length && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    Nenhum usuário ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <p className="mt-3 text-[.85rem] text-muted-foreground">
          Você não pode alterar o próprio nível. Para tirar o acesso de alguém, defina o nível como Pendente.
        </p>
      </Main>
      <Footer />
    </div>
  )
}
