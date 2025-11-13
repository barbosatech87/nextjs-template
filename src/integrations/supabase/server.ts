import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createSupabaseServerClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // A função `cookies()` do Next.js retorna um objeto somente leitura
            // em Server Components, mas um objeto gravável em Server Actions.
            // A asserção de tipo `as any` contorna o erro de compilação,
            // e o bloco try/catch lida com o erro em tempo de execução
            // quando chamado em um contexto somente leitura.
            (cookieStore as any).set({ name, value, ...options })
          } catch (error) {
            // O método `set` foi chamado de um Server Component.
            // Isso pode ser ignorado se você tiver um middleware
            // atualizando as sessões do usuário.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            // O mesmo que acima para o `remove`.
            (cookieStore as any).set({ name, value: '', ...options })
          } catch (error) {
            // O método `delete` foi chamado de um Server Component.
            // Isso pode ser ignorado se você tiver um middleware
            // atualizando as sessões do usuário.
          }
        },
      },
    }
  )
}