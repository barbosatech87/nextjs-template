import { PostForm } from '@/components/admin/blog/post-form';
import { getPostById } from '@/app/actions/blog';
import { Locale } from '@/lib/i18n/config';
import { getGeneratedImages } from '@/app/actions/image-generation';

interface EditPostPageProps {
  params: { lang: Locale; postId: string };
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { lang, postId } = params;
  const post = await getPostById(postId);
  
  // Buscar imagens geradas para a galeria
  const initialImages = await getGeneratedImages();

  if (!post) {
    return <div>Post não encontrado.</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {lang === 'pt' ? 'Editar Post' : 'Edit Post'}
      </h1>
      <PostForm 
        lang={lang} 
        initialData={post} 
        isEditing={true} 
        postId={postId} 
        initialImages={initialImages} // Propriedade obrigatória adicionada
      />
    </div>
  );
}