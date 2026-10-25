import { describe, expect, it } from 'vitest'
import {
  blocoRegressao,
  buildItens,
  countScen,
  genLocal,
  genLocalCA,
  hl,
  marcarRegressao,
  nomeDaFeature,
  ocorrenciaDaFalha,
  parseScen,
  stepDict,
} from './gherkin'
import type { Feature } from '@/types'

const G = [
  '# language: pt',
  '@so5 @login @e2e @CA-01',
  'Funcionalidade: Login',
  '',
  '  Contexto:',
  '    Dado que estou na tela de login',
  '',
  '  Cenário: Login válido',
  '    Quando informo o e-mail "ana@x.com" e a senha "1"',
  '    Então devo ver a tela inicial',
  '',
  '  Esquema do Cenário: Inválido',
  '    Quando informo o e-mail "<email>"',
  '    Então devo ver a mensagem "<msg>"',
  '',
  '    Exemplos:',
  '      | email | msg |',
].join('\n')

const feat = { id: 'ft1', nome: 'Login', modulo: 'Telas de Login', gherkin: G } as Feature

describe('parseScen', () => {
  it('lê cenários com o contexto', () => {
    const cs = parseScen(G)
    expect(cs.map((c) => c.titulo)).toEqual(['Login válido', 'Inválido'])
    expect(cs[1].outline).toBe(true)
    expect(cs[0].bg).toEqual(['    Dado que estou na tela de login'])
    expect(countScen(G)).toBe(2)
  })
  it('numera os itens da rodada', () => {
    const its = buildItens(['ft1'], [feat])
    expect(its.map((i) => i.key)).toEqual(['c1', 'c2'])
    expect(its[0].featNome).toBe('Login')
  })
})

describe('stepDict', () => {
  it('normaliza valores e ordena por uso', () => {
    const d = stepDict([feat, feat])
    expect(d).toContain('informo o e-mail "<valor>" e a senha "<valor>"')
    expect(d).toContain('devo ver a mensagem "<valor>"')
  })
})

describe('hl', () => {
  it('colore palavras-chave, tags e comentários', () => {
    const ls = hl(G)
    expect(ls[0].toks[0].c).toBe('#8A8FB8')
    expect(ls[1].toks[0].c).toBe('#FFB38A')
    expect(ls[2].toks[1]).toMatchObject({ t: 'Funcionalidade:', w: 600 })
    expect(ls[8].toks.some((t) => t.t === '"ana@x.com"')).toBe(true)
  })
})

describe('geradores locais', () => {
  const v = {
    modulo: 'Login',
    nome: 'Bloqueio',
    escopo: 'A conta bloqueia após 5 tentativas. O usuário vê o tempo restante.',
    camada: 'e2e' as const,
    tipos: { feliz: true, neg: true, lim: false, perm: false },
    lang: 'pt' as const,
    tags: 'smoke',
  }
  it('gera critérios com um cenário por regra', () => {
    const t = genLocalCA(v, 'SO5')
    expect(countScen(t)).toBe(2)
    expect(t).toContain('@so5 @login @criterios')
    expect(nomeDaFeature(t)).toBe('Bloqueio')
  })
  it('gera casos com as tags pedidas', () => {
    const t = genLocal({ ...v, caTag: '@CA-02' }, 'SO5')
    expect(t).toContain('@so5 @login @e2e @CA-02 @smoke')
    expect(countScen(t)).toBe(3)
  })
})

describe('regressão', () => {
  it('marca o cenário de origem', () => {
    const t = marcarRegressao(G, 'Login válido', 'SO5-001')!
    expect(t.split('\n')[7].trim()).toBe('@regressao @bug-SO5-001')
    expect(marcarRegressao(G, 'Não existe', 'X')).toBeNull()
  })
  it('escreve o cenário a partir da ocorrência', () => {
    const b = blocoRegressao(
      { cod: 'SO5-002', id: 'f', titulo: 'Corrigir login', atual: 'Erro 401.', passos: ['Abra a tela', 'Clique em entrar'], esperado: ['> Bem-vindo', 'Entrar sem erro'] },
      'Login',
    )
    expect(b).toContain('@regressao @bug-SO5-002')
    expect(b).toContain('Quando abra a tela')
    expect(b).toContain('E clique em entrar')
    expect(b).toContain('Então entrar sem erro')
    expect(b).not.toContain('Bem-vindo')
  })
  it('monta a ocorrência da falha separando os passos do resultado', () => {
    const it0 = buildItens(['ft1'], [feat])[0]
    const o = ocorrenciaDaFalha(it0, 'develop · 1a2b', feat, undefined)
    expect(o.passos[0]).toBe('Dado que estou na tela de login')
    expect(o.esperado).toEqual(['Então devo ver a tela inicial'])
    expect(o.cenario.ca).toBe('CA-01')
  })
})
