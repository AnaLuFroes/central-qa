import { describe, expect, it } from 'vitest'
import { agruparPorAssunto, assuntoOf } from './assuntos'
import { parseJsonLoose } from './ia/prompts'
import { autoIni, slug } from './format'

describe('assuntoOf', () => {
  it('pontua mais o título', () => {
    expect(assuntoOf({ titulo: 'Botão salvar duplicado' })).toBe('acoes')
    expect(assuntoOf({ titulo: 'Campo de e-mail aceita maiúsculas' })).toBe('form')
    expect(assuntoOf({ titulo: 'Algo estranho' })).toBe('geral')
    expect(assuntoOf({ titulo: 'x', assunto: 'dados' })).toBe('dados')
  })
  it('agrupa e marca o primeiro de cada grupo', () => {
    const g = agruparPorAssunto([{ titulo: 'Total errado' }, { titulo: 'Botão salvar' }, { titulo: 'Soma do rodapé' }], true, ['item', 'itens'])
    expect(g.map((x) => x.assunto.key)).toEqual(['acoes', 'dados', 'dados'])
    expect(g.map((x) => x.head)).toEqual([true, true, false])
    expect(g[1].grpTxt).toBe('2 itens · separado pelo conteúdo')
  })
})

describe('utilitários', () => {
  it('lê JSON solto', () => {
    expect(parseJsonLoose('```json\n{"a":1}\n```')).toEqual({ a: 1 })
    expect(parseJsonLoose('nada')).toBeNull()
  })
  it('gera sigla e slug', () => {
    expect(autoIni('Portal do Cliente')).toBe('PDC')
    expect(autoIni('Cotagri')).toBe('COT')
    expect(slug('Telas de Login')).toBe('telas-de-login')
  })
})
