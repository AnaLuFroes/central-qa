export type Role = 'admin' | 'qa' | 'dev' | 'pendente'
export type Tipo = 'erro' | 'melhoria'
export type Prioridade = 'normal' | 'alta' | 'baixa'

/** Referência a um documento da coleção `prints` (a imagem em base64 fica lá). */
export interface Print {
  id: string
  nome: string
}

export interface Modulo {
  id: string
  nome: string
  emoji: string
  cor: number | null
  criadoEm: number
}

/** Conteúdo de uma ocorrência no "padrão de correção" que o dev lê. */
export interface CorpoFix {
  titulo: string
  tipo: Tipo
  prioridade: Prioridade
  onde: string
  passos: string[]
  atual: string
  erro: string
  esperado: string[]
  obs: string
  prints: Print[]
}

export interface Ocorrencia extends CorpoFix {
  id: string
  moduloId: string
  descricao: string
  loteId: string | null
  criadoPor: string
  criadoEm: number
  atualizadoEm: number
}

export interface ItemLote extends CorpoFix {
  key: string // fix-01, fix-02…
  ocorrenciaId: string
}

export interface SecaoLote {
  nome: string
  itens: ItemLote[]
}

export interface Lote {
  id: string
  titulo: string
  eyebrow: string
  intro: string
  criadoEm: number
  criadoPor: string
  total: number
  secoes: SecaoLote[]
}

/** loteId -> fixKey -> concluído */
export type Progresso = Record<string, Record<string, boolean>>

export interface Usuario {
  uid: string
  email: string
  nome: string
  foto: string
  role: Role
  criadoEm: number
}
