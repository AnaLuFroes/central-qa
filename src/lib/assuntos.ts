// Assuntos detectados automaticamente pelo texto da ocorrência (portado do protótipo).
import { nq, plural } from './format'

export interface Assunto {
  key: string
  nome: string
  ini: string
  cor: string
  palavras: string[]
}

const A = (key: string, nome: string, ini: string, cor: string, palavras: string[]): Assunto => ({ key, nome, ini, cor, palavras })

export const ASSUNTOS: Assunto[] = [
  A('texto', 'Textos e conteúdo', 'Aa', '#8FF0F2', ['texto', 'mensage', 'titulo', 'título', 'label', 'rotulo', 'ortograf', 'escrit', 'tradu', 'copy', 'frase', 'palavra', 'legenda', 'placeholder', 'aviso', 'acento', 'nomenclatura', 'redacao']),
  A('timeline', 'Timeline e histórico', 'TL', '#C39BF5', ['timeline', 'linha do tempo', 'historico', 'cronolog', 'evento', 'feed', 'atividade']),
  A('form', 'Formulários e validação', 'FM', '#7BE0B8', ['campo', 'formulario', 'validac', 'obrigator', 'senha', 'e-mail', 'email', 'mascara', 'login', 'cadastr', 'input']),
  A('acoes', 'Botões e ações', 'BT', '#FFC879', ['botao', 'clica', 'clicar', 'clique', 'acao', 'link', 'menu', 'aba ', 'aprovar', 'salvar', 'enviar']),
  A('visual', 'Layout e visual', 'UI', '#FF9EC7', ['cor ', 'cores', 'layout', 'alinh', 'espac', 'fonte', 'icone', 'imagem', 'responsiv', 'visual', 'margem', 'tamanho', 'etiqueta', 'sobrep', 'cortad', 'duplicad', 'amarelo', 'cinza']),
  A('dados', 'Dados e cálculos', 'DD', '#9FB7FF', ['total', 'soma', 'calculo', 'valor', 'arredond', 'filtro', 'relatorio', 'tabela', 'registro', 'periodo', 'rodape', 'coluna', 'export', 'casas']),
  A('perf', 'Erros e desempenho', 'ER', '#FFB38A', ['travad', 'trava ', 'lento', 'lentid', 'carregamento', 'timeout', 'typeerror', 'exception', 'crash', 'null', 'undefined']),
  A('geral', 'Geral', 'GE', '#B4C8F8', []),
]

export const A_MAP: Record<string, Assunto> = Object.fromEntries(ASSUNTOS.map((a) => [a.key, a]))
export const A_ORD: Record<string, number> = Object.fromEntries(ASSUNTOS.map((a, i) => [a.key, i]))

export interface TextoAssunto {
  assunto?: string
  titulo: string
  onde?: string
  atual?: string
  descricao?: string
  erro?: string
  passos?: string[]
  esperado?: string[]
}

/** Assunto escolhido à mão ou o de maior pontuação: +3 por palavra no título, +1 no restante. */
export function assuntoOf(f: TextoAssunto): string {
  if (f.assunto && A_MAP[f.assunto]) return f.assunto
  const t = nq(f.titulo) + ' '
  const o = nq([f.onde, f.atual, f.descricao, f.erro, (f.passos || []).join(' '), (f.esperado || []).join(' ')].join(' ')) + ' '
  let best = 'geral'
  let bs = 0
  for (const a of ASSUNTOS) {
    let sc = 0
    for (const k of a.palavras) {
      if (t.includes(k)) sc += 3
      if (o.includes(k)) sc += 1
    }
    if (sc > bs) {
      bs = sc
      best = a.key
    }
  }
  return best
}

export interface ItemAgrupado<T> {
  item: T
  assunto: Assunto
  /** primeiro item do grupo (mostra o cabeçalho do assunto) */
  head: boolean
  first: boolean
  grpTxt: string
}

/** Ordena por assunto e marca o primeiro item de cada grupo. Sem `agrupar`, mantém a ordem. */
export function agruparPorAssunto<T extends TextoAssunto>(arr: T[], agrupar: boolean, unidade: [string, string]): ItemAgrupado<T>[] {
  const ls = agrupar ? arr.slice().sort((a, b) => A_ORD[assuntoOf(a)] - A_ORD[assuntoOf(b)]) : arr
  const cnt: Record<string, number> = {}
  for (const f of ls) {
    const k = assuntoOf(f)
    cnt[k] = (cnt[k] || 0) + 1
  }
  let prev: string | null = null
  let first = true
  return ls.map((item) => {
    const k = assuntoOf(item)
    const head = agrupar && k !== prev
    const r = { item, assunto: A_MAP[k], head, first: head && first, grpTxt: plural(cnt[k], unidade[0], unidade[1]) + ' · separado pelo conteúdo' }
    if (head) {
      prev = k
      first = false
    }
    return r
  })
}
