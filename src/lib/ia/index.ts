// Chamadas de IA feitas direto do navegador, com o provedor e a chave cadastrados pela empresa
// em Minha conta › Configuração de IA. Cada SDK só é baixado quando o provedor é usado.
import type { ConfigIA, ProvedorIA } from '@/types'

export const PROVEDORES: { id: ProvedorIA; nome: string; modelo: string; sugestoes: string[]; ajuda: string }[] = [
  {
    id: 'anthropic',
    nome: 'Anthropic (Claude)',
    modelo: 'claude-opus-5-5',
    sugestoes: ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5', 'claude-fable-5-1'],
    ajuda: 'Crie a chave em console.anthropic.com › API keys.',
  },
  {
    id: 'openai',
    nome: 'OpenAI',
    modelo: '',
    sugestoes: [],
    ajuda: 'Crie a chave em platform.openai.com › API keys e informe o modelo que a empresa usa.',
  },
  {
    id: 'google',
    nome: 'Google Gemini',
    modelo: '',
    sugestoes: [],
    ajuda: 'Crie a chave em aistudio.google.com › Get API key e informe o modelo que a empresa usa.',
  },
  {
    id: 'compat',
    nome: 'Compatível com OpenAI',
    modelo: '',
    sugestoes: [],
    ajuda: 'Para OpenRouter, Groq, Azure OpenAI, Ollama e outros serviços com a API da OpenAI. Informe a URL base.',
  },
]

export const provedorNome = (p: ProvedorIA) => PROVEDORES.find((x) => x.id === p)?.nome ?? p

export const iaConfigurada = (c: ConfigIA | null | undefined): c is ConfigIA =>
  !!c && !!c.modelo.trim() && (!!c.apiKey.trim() || (c.provedor === 'compat' && !!c.baseURL.trim()))

export class ErroIA extends Error {}

// Modelos Claude que aceitam o fallback automático do servidor quando a resposta é recusada.
const CLAUDE_COM_FALLBACK = ['claude-opus-5-5', 'claude-opus-5', 'claude-sonnet-5-5', 'claude-fable-5-1']

async function viaAnthropic(c: ConfigIA, prompt: string, maxTokens: number): Promise<string> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey: c.apiKey, dangerouslyAllowBrowser: true })
  const fallback = CLAUDE_COM_FALLBACK.includes(c.modelo)
  const res = await client.beta.messages.create({
    model: c.modelo,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
    ...(fallback ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
  })
  if (res.stop_reason === 'refusal') throw new ErroIA('O modelo recusou o pedido.')
  return res.content
    .filter((b) => b.type === 'text')
    .map((b) => (b.type === 'text' ? b.text : ''))
    .join('')
}

async function viaOpenAI(c: ConfigIA, prompt: string, maxTokens: number): Promise<string> {
  const { default: OpenAI } = await import('openai')
  const client = new OpenAI({
    apiKey: c.apiKey || 'sem-chave',
    baseURL: c.provedor === 'compat' ? c.baseURL.trim() : undefined,
    dangerouslyAllowBrowser: true,
  })
  const res = await client.chat.completions.create({
    model: c.modelo,
    max_completion_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })
  return res.choices[0]?.message?.content ?? ''
}

async function viaGoogle(c: ConfigIA, prompt: string, maxTokens: number): Promise<string> {
  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey: c.apiKey })
  const res = await ai.models.generateContent({ model: c.modelo, contents: prompt, config: { maxOutputTokens: maxTokens } })
  return res.text ?? ''
}

/** Envia o prompt ao provedor configurado e devolve o texto da resposta. */
export async function completar(c: ConfigIA, prompt: string, maxTokens = 16000): Promise<string> {
  const out =
    c.provedor === 'anthropic'
      ? await viaAnthropic(c, prompt, maxTokens)
      : c.provedor === 'google'
        ? await viaGoogle(c, prompt, maxTokens)
        : await viaOpenAI(c, prompt, maxTokens)
  if (!out.trim()) throw new ErroIA('A IA não devolveu texto.')
  return out
}

/** Pede uma resposta curta para conferir chave, modelo e endereço. */
export async function testarIA(c: ConfigIA): Promise<string> {
  return completar(c, 'Responda apenas com a palavra OK.', 1024)
}

/** Mensagem curta para o usuário a partir de um erro do provedor. */
export function erroIA(e: unknown): string {
  const status = (e as { status?: number })?.status
  if (status === 401 || status === 403) return 'Chave recusada pelo provedor.'
  if (status === 404) return 'Modelo ou endereço não encontrado.'
  if (status === 429) return 'Limite de uso do provedor atingido. Tente de novo em instantes.'
  if (e instanceof ErroIA) return e.message
  if (e instanceof TypeError) return 'Não foi possível conectar ao provedor (rede ou CORS).'
  return (e as Error)?.message || 'Erro ao chamar a IA.'
}
