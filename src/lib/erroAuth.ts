// Mensagens em português para os erros do Firebase Auth.
const ERROS: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/email-already-in-use': 'Já existe uma conta com este e-mail. Use "Entrar" ou "Esqueci minha senha".',
  'auth/weak-password': 'A senha precisa ter ao menos 6 caracteres.',
  'auth/invalid-email': 'E-mail inválido.',
  'auth/missing-email': 'Informe o e-mail.',
  'auth/missing-password': 'Informe a senha.',
  'auth/popup-closed-by-user': 'Login cancelado.',
  'auth/cancelled-popup-request': 'Login cancelado.',
  'auth/popup-blocked': 'O navegador bloqueou a janela do Google. Libere pop-ups e tente de novo.',
  'auth/user-disabled': 'Esta conta foi desativada.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
  'auth/network-request-failed': 'Sem conexão. Confira a internet e tente de novo.',
}

/** Mensagem em português para um erro do Firebase Auth. */
export function erroAuth(e: unknown, prefixo = 'Não foi possível entrar.'): string {
  const code = (e as { code?: string })?.code ?? ''
  return ERROS[code] ?? `${prefixo} ${(e as Error)?.message ?? ''}`.trim()
}
