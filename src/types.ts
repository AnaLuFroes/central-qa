export type Perfil = 'Admin' | 'QA' | 'Dev'
export type StatusOrg = 'ativa' | 'suspensa'
export type Tipo = 'erro' | 'melhoria'
export type Prioridade = 'normal' | 'alta' | 'baixa'
export type Repro = 'sempre' | 'asvezes' | 'umavez'
/** Status gravado na ocorrência. O status exibido é derivado (ver `stOf`). */
export type StatusFix = '' | 'validado' | 'reaberto' | 'encerrado'
export type RespSt = 'corrigido' | 'naorep' | 'info' | 'esperado' | 'adiado'
export type CaSt = 'rascunho' | 'revisao' | 'aprovado'
export type Camada = 'api' | 'e2e' | 'manual'
export type ResSt = 'passou' | 'falhou' | 'bloqueado'

/** Empresa cliente da Central de QA. */
export interface Org {
  id: string
  nome: string
  status: StatusOrg
  donoUid: string
  donoEmail: string
  criadoEm: number
  aprovadoEm: number | null
}

/** Pessoa da empresa (convite ou vínculo). O id do documento é o e-mail em minúsculas. */
export interface Membro {
  email: string
  nome: string
  perfil: Perfil
  foto: string
  uid: string | null
  criadoEm: number
}

export interface Sistema {
  id: string
  nome: string
  ini: string
  cor: number
  capa: string
  seq: number
}

/** Referência a um documento da coleção `prints` (a imagem em base64 fica lá). */
export interface Print {
  id: string
  nome: string
}

export interface Modulo {
  id: string
  sis: string
  nome: string
  emoji: string
  cor: number | null
  criadoEm: number
}

/** Cenário de teste que originou a ocorrência (rodada que falhou). */
export interface CenarioRef {
  featId: string
  feat: string
  titulo: string
  ca: string
}

export interface EventoHist {
  ev: 'validado' | 'reaberto' | 'encerrado'
  em: number
  loteId: string | null
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

/** Contexto do teste que acompanha a ocorrência até o dev. */
export interface ContextoFix {
  cod: string
  modulo: string
  amb: string
  repro: Repro | ''
  massa: string
  cenario: CenarioRef | null
  assunto: string
}

export interface Ocorrencia extends CorpoFix, ContextoFix {
  id: string
  sis: string
  descricao: string
  loteId: string | null
  status: StatusFix
  hist: EventoHist[]
  regFeatId: string | null
  regEm: number | null
  criadoPor: string
  criadoEm: number
  atualizadoEm: number
}

/** Cópia da ocorrência no momento do envio. */
export interface ItemLote extends CorpoFix, ContextoFix {
  key: string // fix-01, fix-02…
  ocorrenciaId: string
}

export interface SecaoLote {
  nome: string
  itens: ItemLote[]
}

export interface Lote {
  id: string
  sis: string
  titulo: string
  eyebrow: string
  intro: string
  criadoEm: number
  criadoPor: string
  total: number
  secoes: SecaoLote[]
}

export interface MsgThread {
  by: 'dev' | 'qa'
  st: RespSt | null
  pr: string
  txt: string
  em: number
  nome: string
}

/** Resposta do dev a um item do lote, com a conversa entre dev e QA. */
export interface Resposta {
  id: string // `${loteId}__${key}`
  loteId: string
  key: string
  sis: string
  st: RespSt | null
  pr: string
  com: string
  em: number | null
  thread: MsgThread[]
}

/** loteId -> key -> resposta */
export type Respostas = Record<string, Record<string, Resposta>>

export interface Feature {
  id: string
  tipo: 'ca' | 'casos'
  sis: string
  modulo: string
  nome: string
  lang: 'pt' | 'en'
  gherkin: string
  criadoEm: number
  // critérios de aceite
  caSt: CaSt
  caCod: string
  aprovEm: number | null
  // casos de teste
  caId: string | null
  camada: Camada
}

export interface ItemRodada {
  key: string // c1, c2…
  featId: string
  featNome: string
  modulo: string
  titulo: string
  outline: boolean
  bg: string[]
  lines: string[]
}

export interface ResultadoItem {
  st?: ResSt
  fixId?: string
}

export interface Rodada {
  id: string
  sis: string
  nome: string
  amb: string
  criadoEm: number
  itens: ItemRodada[]
  res: Record<string, ResultadoItem>
}

export type ProvedorIA = 'anthropic' | 'openai' | 'google' | 'compat'

export interface ConfigIA {
  provedor: ProvedorIA
  modelo: string
  apiKey: string
  baseURL: string
  atualizadoPor: string
  em: number | null
}
