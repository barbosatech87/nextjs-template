# AI Development Rules

Este projeto usa **Next.js (App Router)** com **TypeScript**, **TailwindCSS** e **Shadcn/UI**.

## Regras principais

1. **Framework**
   - Sempre usar Next.js App Router (`src/app/`).
   - Não usar `react-router-dom`, `vite` ou qualquer configuração de Vite.

2. **UI**
   - Usar componentes do diretório `src/components/ui/` (Shadcn/UI).
   - Se precisar de algo novo, criar em `src/components/` seguindo o padrão Shadcn (Radix + Tailwind).
   - Não adicionar bibliotecas externas de UI sem necessidade.

3. **Estilo**
   - Exclusivamente TailwindCSS.
   - `globals.css` só para estilos globais e diretivas do Tailwind.

4. **Formulários**
   - Usar `react-hook-form` + `zod` para validação.

5. **Ícones**
   - Usar apenas `lucide-react`.

6. **Estado**
   - Usar `useState`, `useReducer` e Context API.
   - Não usar Redux ou outras libs sem discussão.

7. **API & Data**
   - Usar rotas de API do Next.js (`src/app/api/`) ou Server Actions.
   - Usar `fetch` nativo.

8. **Notificações**
   - Usar `Sonner` (`src/components/ui/sonner.tsx`).

9. **Charts**
   - Usar `recharts`.

10. **Hooks & Utils**
    - Hooks em `src/hooks/`.
    - Funções utilitárias em `src/lib/utils.ts`.

11. **TypeScript**
    - Todo código deve ser em TypeScript.
    - Evitar `any`.

## Proibições
- Não usar `react-router-dom`, `vite`, `styled-components`, `emotion`.
- Não usar bibliotecas de UI externas além do Shadcn/UI.