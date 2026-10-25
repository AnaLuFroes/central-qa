// Gherkin: realce, leitura de cenários, geradores locais e regressão (portado do protótipo).
import { zipSync, strToU8 } from 'fflate'
import type { Camada, Feature, ItemRodada, Ocorrencia } from '@/types'
import { pad, slug, tagList } from './format'

export const TIPOS: [TipoCobertura, string][] = [
  ['feliz', 'Caminho feliz'],
  ['neg', 'Validações e erros'],
  ['lim', 'Valores-limite'],
  ['perm', 'Permissões'],
]
export type TipoCobertura = 'feliz' | 'neg' | 'lim' | 'perm'

const SCEN_RE = /^\s*(Cenário|Cenario|Esquema do Cenário|Esquema do Cenario|Scenario Outline|Scenario):/
export const countScen = (t: string) => String(t || '').split('\n').filter((l) => SCEN_RE.test(l)).length

const KW_BLOCK =
  /^(\s*)(Funcionalidade:|Feature:|Contexto:|Background:|Esquema do Cenário:|Esquema do Cenario:|Scenario Outline:|Cenário:|Cenario:|Scenario:|Exemplos:|Examples:|Regra:|Rule:)(.*)$/
export const KW_STEP = /^(\s*)(Dado|Dada|Dados|Quando|Então|Entao|E|Mas|Given|When|Then|And|But|\*)(\s.*|)$/

export interface Token {
  t: string
  c: string
  w: number
}
export interface LinhaHl {
  n: number
  toks: Token[]
}

function inl(text: string, base: string): Token[] {
  const out: Token[] = []
  String(text)
    .split(/("[^"]*"|<[^>]+>)/)
    .forEach((p) => {
      if (!p) return
      if (p[0] === '"') out.push({ t: p, c: '#A6F0B4', w: 400 })
      else if (p[0] === '<') out.push({ t: p, c: '#FFC879', w: 400 })
      else out.push({ t: p, c: base, w: 400 })
    })
  return out
}

/** Realce de sintaxe para o visualizador escuro de Gherkin. */
export function hl(txt: string): LinhaHl[] {
  return String(txt || '')
    .split('\n')
    .map((l, i) => {
      const tr = l.trim()
      let m: RegExpMatchArray | null = null
      let toks: Token[]
      if (tr.startsWith('#')) toks = [{ t: l, c: '#8A8FB8', w: 400 }]
      else if (tr.startsWith('@')) toks = [{ t: l, c: '#FFB38A', w: 500 }]
      else if (tr.startsWith('|')) toks = [{ t: l, c: '#B4C8F8', w: 400 }]
      else if ((m = l.match(KW_BLOCK))) toks = [{ t: m[1], c: '#E3E4F7', w: 400 }, { t: m[2], c: '#C39BF5', w: 600 }, ...inl(m[3], '#FFFFFF')]
      else if ((m = l.match(KW_STEP))) toks = [{ t: m[1], c: '#E3E4F7', w: 400 }, { t: m[2], c: '#8FF0F2', w: 600 }, ...inl(m[3], '#E3E4F7')]
      else toks = inl(l, '#CFD1EE')
      return { n: i + 1, toks }
    })
}

export const isThen = (l: string) => /^\s*(Então|Entao|Then)(\s|$)/.test(l)

export interface Cenario {
  titulo: string
  outline: boolean
  lines: string[]
  bg: string[]
}

/** Cenários de um arquivo .feature, cada um com os passos do Contexto. */
export function parseScen(txt: string): Cenario[] {
  const out: Omit<Cenario, 'bg'>[] = []
  let cur: Omit<Cenario, 'bg'> | null = null
  const bg: string[] = []
  let inBg = false
  String(txt || '')
    .split('\n')
    .forEach((l) => {
      const tr = l.trim()
      if (/^(Contexto|Background):/.test(tr)) {
        inBg = true
        cur = null
        return
      }
      const m = tr.match(/^(Cenário|Cenario|Esquema do Cenário|Esquema do Cenario|Scenario Outline|Scenario):\s*(.*)$/)
      if (m) {
        inBg = false
        cur = { titulo: m[2] || 'Cenário', outline: /Esquema|Outline/.test(m[1]), lines: [] }
        out.push(cur)
        return
      }
      if (/^(Funcionalidade|Feature):/.test(tr) || tr.startsWith('#') || tr.startsWith('@')) return
      if (inBg) {
        if (tr && /^\S/.test(tr) && l.startsWith('    ')) bg.push(l)
        return
      }
      if (cur) cur.lines.push(l)
    })
  for (const sc of out) while (sc.lines.length && !sc.lines[sc.lines.length - 1].trim()) sc.lines.pop()
  return out.map((sc) => ({ ...sc, bg: bg.slice() }))
}

/** Itens de uma rodada: um por cenário das funcionalidades escolhidas, numerados c1, c2… */
export function buildItens(ids: string[], feats: Feature[]): ItemRodada[] {
  let n = 0
  const out: ItemRodada[] = []
  for (const id of ids) {
    const f = feats.find((x) => x.id === id)
    if (!f) continue
    for (const sc of parseScen(f.gherkin))
      out.push({ key: 'c' + ++n, featId: f.id, featNome: f.nome, modulo: f.modulo, titulo: sc.titulo, outline: sc.outline, bg: sc.bg, lines: sc.lines })
  }
  return out
}

/** Os 60 passos mais usados no sistema, com os valores entre aspas trocados por "<valor>". */
export function stepDict(feats: Pick<Feature, 'gherkin'>[]): string[] {
  const seen = new Map<string, number>()
  for (const f of feats)
    for (const l of String(f.gherkin || '').split('\n')) {
      const m = l.trim().match(/^(Dado|Dada|Dados|Quando|Então|Entao|E|Mas|Given|When|Then|And|But)\s+(.+)$/)
      if (!m) continue
      const t = m[2].replace(/"[^"]*"/g, '"<valor>"').replace(/<[^>]+>/g, '<valor>')
      seen.set(t, (seen.get(t) ?? 0) + 1)
    }
  return [...seen.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t)
    .slice(0, 60)
}

export interface EntradaGherkin {
  modulo: string
  nome: string
  escopo: string
  camada: Camada
  tipos: Record<TipoCobertura, boolean>
  lang: 'pt' | 'en'
  tags: string
  /** os casos partem de critérios de aceite aprovados */
  caTxt?: boolean
  /** tag do critério, ex.: @CA-01 */
  caTag?: string
}

const lf = (x: string) => x.charAt(0).toLowerCase() + x.slice(1)
const frases = (t: string, max: number) =>
  t
    .split(/\n+|\.\s+/)
    .map((x) => x.trim().replace(/[.;]+$/, ''))
    .filter((x) => x.length > 3)
    .slice(0, max)

/** Rascunho de critérios de aceite sem IA: um cenário por frase do escopo. */
export function genLocalCA(v: EntradaGherkin, sysN: string): string {
  const pt = v.lang !== 'en'
  const mod = v.modulo.trim() || 'Geral'
  const nome = v.nome.trim() || mod
  const regras = frases(v.escopo, 8)
  const L: string[] = []
  if (pt) L.push('# language: pt')
  L.push(['@' + slug(sysN), '@' + slug(mod), '@criterios'].join(' '))
  L.push((pt ? 'Funcionalidade: ' : 'Feature: ') + nome)
  ;(regras.length ? regras : [nome]).forEach((r, i) => {
    L.push(
      '',
      '  ' + (pt ? 'Cenário: ' : 'Scenario: ') + 'CA-' + pad(i + 1) + ' ' + r,
      '    ' + (pt ? 'Dado o contexto descrito no escopo' : 'Given the context described in the scope'),
      '    ' + (pt ? 'Quando a regra se aplica' : 'When the rule applies'),
      '    ' + (pt ? 'Então o sistema deve garantir que ' : 'Then the system should ensure that ') + lf(r),
    )
  })
  L.push('', '# Dúvidas para o PO:', '# - Revise cada critério: este rascunho foi gerado sem IA, a partir das frases do escopo.')
  return L.join('\n')
}

/** Rascunho de casos de teste sem IA, a partir dos critérios ou do escopo. */
export function genLocal(v: EntradaGherkin, sysN: string): string {
  const pt = v.lang !== 'en'
  const K = pt
    ? { f: 'Funcionalidade', c: 'Contexto', s: 'Cenário', g: 'Dado', w: 'Quando', t: 'Então', a: 'E' }
    : { f: 'Feature', c: 'Background', s: 'Scenario', g: 'Given', w: 'When', t: 'Then', a: 'And' }
  const mod = v.modulo.trim() || 'Geral'
  const nome = v.nome.trim() || mod
  const caTit = String(v.escopo)
    .split('\n')
    .map((l) => l.trim().match(/^(?:Cenário|Cenario|Scenario):\s*(?:CA-\d+\s+)?(.+)$/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => m[1])
  const regras = caTit.length ? caTit.slice(0, 8) : frases(v.escopo, 6)
  const L: string[] = []
  if (pt) L.push('# language: pt')
  L.push(['@' + slug(sysN), '@' + slug(mod), '@' + (v.camada || 'e2e'), ...(v.caTag ? [v.caTag] : []), ...tagList(v.tags)].join(' '))
  L.push(K.f + ': ' + nome, '', '  ' + K.c + ':', '    ' + K.g + (pt ? ' que estou na tela "' + mod + '"' : ' I am on the "' + mod + '" screen'))
  const sc = (t: string, steps: string[]) => {
    L.push('', '  ' + K.s + ': ' + t)
    steps.forEach((x) => L.push('    ' + x))
  }
  if (v.tipos.feliz)
    (regras.length ? regras : [nome]).forEach((r) =>
      sc(
        r,
        pt
          ? [K.w + ' executo o fluxo descrito', K.t + ' o sistema deve garantir que ' + lf(r)]
          : [K.w + ' I run the described flow', K.t + ' the system should ensure that ' + lf(r)],
      ),
    )
  if (v.tipos.neg)
    sc(
      pt ? 'Campos obrigatórios em branco ou inválidos' : 'Missing or invalid required fields',
      pt
        ? [K.w + ' deixo um campo obrigatório em branco', K.a + ' confirmo a ação', K.t + ' devo ver uma mensagem de validação', K.a + ' a ação não deve ser concluída']
        : [K.w + ' I leave a required field empty', K.a + ' I confirm the action', K.t + ' I should see a validation message', K.a + ' the action should not be completed'],
    )
  if (v.tipos.lim)
    sc(
      pt ? 'Valores no limite permitido' : 'Boundary values',
      pt
        ? [K.w + ' informo valores no limite mínimo e máximo', K.t + ' o sistema deve aceitar os valores dentro do limite', K.a + ' recusar os valores fora do limite']
        : [K.w + ' I enter minimum and maximum boundary values', K.t + ' the system should accept values within the limit', K.a + ' reject values outside the limit'],
    )
  if (v.tipos.perm)
    sc(
      pt ? 'Usuário sem permissão' : 'User without permission',
      pt
        ? [K.g + ' que estou logado com um perfil sem permissão', K.w + ' tento acessar "' + mod + '"', K.t + ' devo ver a mensagem de acesso negado']
        : [K.g + ' I am logged in with a profile without permission', K.w + ' I try to access "' + mod + '"', K.t + ' I should see the access denied message'],
    )
  return L.join('\n')
}

/** Nome da funcionalidade na linha "Funcionalidade:" do Gherkin. */
export const nomeDaFeature = (g: string) => g.match(/^\s*(?:Funcionalidade|Feature):\s*(.+)$/m)?.[1].trim() ?? ''

export const featPath = (f: Pick<Feature, 'camada' | 'modulo' | 'nome'>, sysN: string) =>
  'cypress/e2e/' + (f.camada || 'e2e') + '/' + slug(sysN) + '/' + slug(f.modulo) + '/' + (slug(f.nome) || 'funcionalidade') + '.feature'

/** Zip com os .feature (sem os critérios de aceite), um arquivo por funcionalidade. */
export function zipFeatures(fs: Feature[], sysN: string): Blob | null {
  const casos = fs.filter((f) => f.tipo !== 'ca')
  if (!casos.length) return null
  const used: Record<string, number> = {}
  const files: Record<string, Uint8Array> = {}
  for (const f of casos) {
    let p = featPath(f, sysN).replace(/\.feature$/, '')
    if (used[p]) p += '-' + ++used[p]
    else used[p] = 1
    files[p + '.feature'] = strToU8(f.gherkin.replace(/\s*$/, '') + '\n')
  }
  return new Blob([zipSync(files) as Uint8Array<ArrayBuffer>], { type: 'application/zip' })
}

/** Dados de uma ocorrência nova a partir de um cenário que falhou na rodada. */
export function ocorrenciaDaFalha(it: ItemRodada, amb: string, feat: Feature | undefined, ca: Feature | undefined) {
  const steps = [...(it.bg || []), ...it.lines].map((l) => l.trim()).filter((l) => l && !l.startsWith('|'))
  const k = steps.findIndex(isThen)
  const tg = (String(feat?.gherkin || '').match(/@CA-\d+/) || [])[0]
  return {
    titulo: 'Falha no cenário: ' + it.titulo,
    modulo: it.modulo,
    tipo: 'erro' as const,
    prioridade: 'normal' as const,
    onde: it.modulo + ', funcionalidade “' + it.featNome + '”.',
    passos: k < 0 ? steps : steps.slice(0, k),
    esperado: k < 0 ? [] : steps.slice(k),
    amb,
    cenario: { featId: it.featId, feat: it.featNome, titulo: it.titulo, ca: tg ? tg.slice(1) : ca ? ca.nome : '' },
  }
}

/**
 * Marca o cenário de origem com @regressao @bug-COD. Devolve o Gherkin novo,
 * ou null se o cenário não for encontrado.
 */
export function marcarRegressao(gherkin: string, tituloCenario: string, cod: string): string | null {
  const tagBug = '@bug-' + cod
  const L = gherkin.split('\n')
  const i = L.findIndex((l) => {
    const m = l.trim().match(/^(Cenário|Cenario|Esquema do Cenário|Esquema do Cenario|Scenario Outline|Scenario):\s*(.*)$/)
    return !!m && m[2].trim() === tituloCenario.trim()
  })
  if (i < 0) return null
  const ind = (L[i].match(/^\s*/) || [''])[0]
  if (i > 0 && L[i - 1].trim().startsWith('@')) {
    const have = L[i - 1]
    L[i - 1] = have + (have.includes('@regressao') ? '' : ' @regressao') + (have.includes(tagBug) ? '' : ' ' + tagBug)
  } else L.splice(i, 0, ind + '@regressao ' + tagBug)
  return L.join('\n')
}

/** Bloco de cenário de regressão escrito a partir da ocorrência validada. */
export function blocoRegressao(f: Pick<Ocorrencia, 'cod' | 'id' | 'titulo' | 'atual' | 'passos' | 'esperado'>, mod: string): string {
  const clean = (x: string) => String(x).trim().replace(/[.;]+$/, '')
  const step = (kw: string, x: string, i: number) => {
    const t = clean(x)
    return KW_STEP.test(t) ? t : (i === 0 ? kw : 'E') + ' ' + lf(t)
  }
  const L = ['  @regressao @bug-' + (f.cod || f.id), '  Cenário: ' + f.titulo]
  if (f.atual) L.push('    # Antes da correção: ' + clean(f.atual))
  L.push('    Dado que estou na tela "' + mod + '"')
  f.passos.forEach((p, i) => L.push('    ' + step('Quando', p, i)))
  const esp = f.esperado.filter((e) => !e.startsWith('>'))
  ;(esp.length ? esp : ['o comportamento corrigido deve se manter']).forEach((e, i) => L.push('    ' + step('Então', e, i)))
  return L.join('\n')
}

export const nomeRegressao = (mod: string) => 'Regressão — ' + mod

export const featureRegressao = (sysN: string, mod: string, bloco: string) =>
  ['# language: pt', '@' + slug(sysN) + ' @' + slug(mod) + ' @e2e @regressao', 'Funcionalidade: ' + nomeRegressao(mod), '  Cenários criados a partir de bugs validados.', '', bloco].join('\n')

/** Remove cercas de código que a IA às vezes devolve. */
export const semCercas = (t: string) =>
  String(t || '')
    .replace(/^\s*```[a-zA-Z]*\s*\n?/, '')
    .replace(/\n?```\s*$/, '')
    .trim()
