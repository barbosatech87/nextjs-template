import { ImageResponse } from 'next/og';
import { BookOpen } from 'lucide-react';

// Tamanho padrão para o ícone
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Este componente gera o ícone dinamicamente.
// Usaremos o ícone BookOpen (livro aberto) como o novo favicon.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: 'black',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '8px',
        }}
      >
        {/* Usando o ícone BookOpen do Lucide-React */}
        <BookOpen width={24} height={24} />
      </div>
    ),
    {
      ...size,
    }
  );
}