"use server";

import { createSupabaseAdminClient } from '@/integrations/supabase/admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Locale } from '@/lib/i18n/config';

// Define a estrutura dos dados do usuário que vamos manipular
export type AdminUser = {
  id: string;
  email: string | undefined;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  role: 'user' | 'writer' | 'admin';
};

// Ação para buscar todos os usuários com suas informações de perfil
export async function getAdminUsers(): Promise<AdminUser[]> {
  const supabaseAdmin = createSupabaseAdminClient();

  // 1. Busca todos os usuários de auth.users
  const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  if (authError) {
    console.error("Erro ao buscar usuários da autenticação:", authError);
    return [];
  }

  // 2. Busca todos os perfis de public.profiles
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('*');
  if (profilesError) {
    console.error("Erro ao buscar perfis:", profilesError);
    return [];
  }

  // 3. Combina os dados
  const profilesMap = new Map(profiles.map(p => [p.id, p]));
  
  const combinedUsers: AdminUser[] = users.map(user => {
    const profile = profilesMap.get(user.id);
    return {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      first_name: profile?.first_name || null,
      last_name: profile?.last_name || null,
      role: profile?.role || 'user',
    };
  });

  return combinedUsers;
}

// Ação para atualizar a função de um usuário
const roleSchema = z.enum(['user', 'writer', 'admin']);
export async function updateUserRole(userId: string, role: 'user' | 'writer' | 'admin', lang: Locale) {
  const validatedRole = roleSchema.safeParse(role);
  if (!validatedRole.success) {
    return { success: false, message: 'Função inválida especificada.' };
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ role: validatedRole.data })
    .eq('id', userId);

  if (error) {
    console.error("Erro ao atualizar a função do usuário:", error);
    return { success: false, message: 'Falha ao atualizar a função do usuário.' };
  }

  revalidatePath(`/${lang}/admin/users`);
  return { success: true, message: 'Função do usuário atualizada com sucesso.' };
}

// Ação para convidar um novo usuário
const inviteSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
});
export async function inviteUserByEmail(formData: { email: string, firstName: string, lastName?: string }, lang: Locale) {
  const validation = inviteSchema.safeParse(formData);
  if (!validation.success) {
    return { success: false, message: 'Dados inválidos fornecidos.' };
  }

  const { email, firstName, lastName } = validation.data;
  const supabaseAdmin = createSupabaseAdminClient();

  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: {
      first_name: firstName,
      last_name: lastName || null,
    },
  });

  if (error) {
    console.error("Erro ao convidar usuário:", error);
    return { success: false, message: `Falha ao convidar usuário: ${error.message}` };
  }

  revalidatePath(`/${lang}/admin/users`);
  return { success: true, message: 'Convite enviado com sucesso.' };
}