"use server";

import { createSupabaseServerClient } from "@/integrations/supabase/server";

// Helper para verificar se o usuário é admin
async function checkAdmin() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'writer') {
    throw new Error("Acesso negado.");
  }
}

export type DashboardStats = {
  publishedPosts: number;
  draftPosts: number;
  totalUsers: number;
  totalPages: number;
  recentDrafts: { id: string; title: string; updated_at: string }[];
  recentUsers: { id: string; first_name: string | null; last_name: string | null; role: string }[];
};

export async function getDashboardStats(): Promise<DashboardStats | null> {
  try {
    await checkAdmin();
    const supabase = createSupabaseServerClient();

    const [
      publishedPostsCount,
      draftPostsCount,
      totalUsersCount,
      totalPagesCount,
      recentDraftsData,
      recentUsersData
    ] = await Promise.all([
      supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('pages').select('id', { count: 'exact', head: true }),
      supabase.from('blog_posts').select('id, title, updated_at').eq('status', 'draft').order('updated_at', { ascending: false }).limit(5),
      supabase.from('profiles').select('id, first_name, last_name, role').order('updated_at', { ascending: false }).limit(5)
    ]);

    return {
      publishedPosts: publishedPostsCount.count ?? 0,
      draftPosts: draftPostsCount.count ?? 0,
      totalUsers: totalUsersCount.count ?? 0,
      totalPages: totalPagesCount.count ?? 0,
      recentDrafts: recentDraftsData.data || [],
      recentUsers: recentUsersData.data || [],
    };

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return null;
  }
}