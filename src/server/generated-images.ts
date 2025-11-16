import { createSupabaseServerClient } from "@/integrations/supabase/server";

export type GeneratedImageData = {
  id: string;
  prompt: string;
  image_url: string;
  created_at: string;
};

export async function getGeneratedImagesForServer(): Promise<GeneratedImageData[]> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('generated_images')
    .select('id, prompt, image_url, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error("Error fetching generated images (SSR):", error);
    return [];
  }

  return data;
}