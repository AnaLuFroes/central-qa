// Prompts da Central de QA (os mesmos do protótipo).
import { TIPOS, type EntradaGherkin } from '@/lib/gherkin'
import { slug, tagList } from '@/lib/format'
import { REPRO } from '@/lib/status'
import type { Repro } from '@/types'

export function buildPromptCA(v: EntradaGherkin, sysN: string): string {
  const pt = v.lang !== 'en'
  const tags = ['@' + slug(sysN), '@' + slug(v.modulo || 'geral'), '@criterios'].join(' ')
  return [
    'Você é um analista de QA conduzindo o refinamento de uma funcionalidade. Escreva os CRITÉRIOS DE ACEITE em Gherkin declarativo.',
    pt
      ? 'Escreva em português: a primeira linha deve ser "# language: pt" e use Funcionalidade, Regra, Cenário, Dado, Quando, Então, E, Mas.'
      : 'Write in English using Feature, Rule, Scenario, Given, When, Then, And, But.',
    'Sistema: ' + sysN + '. Módulo: ' + (v.modulo || 'Geral') + '. Funcionalidade: ' + (v.nome.trim() || 'defina um nome curto') + '.',
    'Coloque estas tags na linha anterior à Funcionalidade: ' + tags,
    'Descreva regras de negócio e resultados esperados, sem cliques, botões, seletores ou detalhes de tela. Um cenário por regra. Nada de dados de exemplo inventados.',
    'Se o escopo deixar uma regra ambígua ou incompleta, adicione no fim um bloco de comentários começando com "# Dúvidas para o PO:" e uma pergunta por linha, também como comentário.',
    'Responda só com o conteúdo do arquivo .feature, sem cercas de código nem explicações.',
    '',
    'Escopo:',
    v.escopo.trim(),
  ].join('\n')
}

export function buildPrompt(v: EntradaGherkin, sysN: string, dict: string[]): string {
  const pt = v.lang !== 'en'
  const tipos =
    TIPOS.filter(([k]) => v.tipos[k])
      .map(([, l]) => l.toLowerCase())
      .join(', ') || 'caminho feliz'
  const tags = ['@' + slug(sysN), '@' + slug(v.modulo || 'geral'), '@' + (v.camada || 'e2e'), ...(v.caTag ? [v.caTag] : []), ...tagList(v.tags)].join(' ')
  return [
    'Você é um analista de QA. Gere casos de teste em Gherkin para uso com Cypress (cucumber preprocessor).',
    pt
      ? 'Escreva em português: a primeira linha deve ser "# language: pt" e use Funcionalidade, Contexto, Cenário, Esquema do Cenário, Exemplos, Dado, Quando, Então, E, Mas.'
      : 'Write in English using Feature, Background, Scenario, Scenario Outline, Examples, Given, When, Then, And, But.',
    'Sistema: ' + sysN + '. Módulo: ' + (v.modulo || 'Geral') + '. Funcionalidade: ' + (v.nome.trim() || 'defina um nome curto') + '.',
    'Cobertura desejada: ' + tipos + '.',
    'Coloque estas tags na linha anterior à Funcionalidade: ' + tags,
    'Use Contexto para pré-condições comuns e Esquema do Cenário com Exemplos quando houver variação de dados. Passos curtos, objetivos e verificáveis.',
    'Camada do teste: ' +
      (v.camada === 'api'
        ? 'API. Escreva passos de requisição e resposta (método, endpoint, status HTTP, campos do corpo), sem passos de tela.'
        : v.camada === 'manual'
          ? 'execução manual. Passos claros para uma pessoa seguir.'
          : 'E2E de tela. Passos de interação com a tela.'),
    ...(dict.length
      ? [
          'Reutilize exatamente estes passos já existentes no projeto sempre que servirem (troque só os valores entre aspas). Se precisar de um passo novo, adicione o comentário "# NOVO PASSO" na linha anterior a ele:',
          ...dict.map((x) => '- ' + x),
        ]
      : []),
    'Responda só com o conteúdo do arquivo .feature, sem cercas de código nem explicações.',
    '',
    v.caTxt ? 'Critérios de aceite aprovados (base dos casos):' : 'Escopo:',
    v.escopo.trim(),
  ].join('\n')
}

export interface EntradaOrganizarIA {
  sistema: string
  modulo: string
  amb: string
  massa: string
  repro: Repro | ''
  nPrints: number
  titulo: string
  descricao: string
}

export function buildPromptOrganizar(v: EntradaOrganizarIA): string {
  return [
    'Você é um analista de QA. Organize o registro abaixo no padrão de correção para o desenvolvedor.',
    'Responda apenas com JSON válido, sem cercas de código, neste formato:',
    '{"titulo":"verbo no infinitivo + o que corrigir","onde":"tela e elemento","passos":["passo"],"atual":"o que acontece hoje","esperado":["resultado esperado"],"tipo":"erro ou melhoria","prioridade":"alta, normal ou baixa","faltando":["pergunta curta"]}',
    'Não invente dados que não estão no registro. Se faltar algo que o dev precisa para reproduzir (perfil, dados, frequência, mensagem exata), liste em "faltando".',
    '',
    'Sistema: ' + v.sistema,
    'Módulo: ' + (v.modulo || 'não informado'),
    'Ambiente: ' + (v.amb || 'não informado'),
    'Perfil e dados: ' + (v.massa || 'não informado'),
    'Reprodução: ' + (v.repro ? REPRO[v.repro] : ''),
    'Prints anexados: ' + v.nPrints,
    'Título: ' + v.titulo,
    'Descrição: ' + v.descricao,
  ].join('\n')
}

export interface SaidaOrganizarIA {
  titulo?: string
  onde?: string
  passos?: string[]
  atual?: string
  esperado?: string[]
  tipo?: string
  prioridade?: string
  faltando?: string[]
}

/** Lê o primeiro objeto JSON da resposta, mesmo com texto ou cercas em volta. */
export function parseJsonLoose<T = unknown>(t: string): T | null {
  const x = String(t || '').replace(/```[a-z]*|```/g, '')
  const i = x.indexOf('{')
  const j = x.lastIndexOf('}')
  if (i < 0 || j < i) return null
  try {
    return JSON.parse(x.slice(i, j + 1)) as T
  } catch {
    return null
  }
}
