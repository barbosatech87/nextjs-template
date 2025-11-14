"use server";

import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from 'uuid';

function assert(condition: any, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// --- Funções para Notificações Individuais (se necessário no futuro) ---
export async function createNotificationForUser(
  userId: string,
  title: string,
  body: string,
  metadata?: Record<string, unknown>
) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  assert(user, "Not authenticated");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  assert(profile?.role === "admin" || user.id === userId, "Not authorized");

  const { data, error } = await supabase
    .from("notifications")
    .insert({ user_id: userId, title, body, metadata: metadata ?? null })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return { id: data.id as string };
}

// --- Funções para Envios em Massa (Broadcasts) ---

/**
 * Envia uma notificação para todos os usuários e registra o envio.
 */
export async function sendNotificationToAll(title: string, body: string) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  assert(user, "Not authenticated");

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  assert(me?.role === "admin", "Not authorized");

  const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id");
  if (profilesError) throw new Error(profilesError.message);
  if (!profiles || profiles.length === 0) return { count: 0 };

  const broadcastId = uuidv4();
  
  // 1. Insere o registro do envio
  const { error: broadcastError } = await supabase.from("notification_broadcasts").insert({
    id: broadcastId,
    author_id: user.id,
    title,
    body,
    sent_to_count: profiles.length,
  });
  if (broadcastError) throw new Error(`Failed to create broadcast record: ${broadcastError.message}`);

  // 2. Insere as notificações individuais
  const notificationRows = profiles.map((p) => ({
    user_id: p.id,
    title,
    body,
    broadcast_id: broadcastId,
  }));

  const { error: insertError } = await supabase.from("notifications").insert(notificationRows);
  if (insertError) {
    // Tenta reverter o registro do broadcast em caso de falha
    await supabase.from("notification_broadcasts").delete().eq("id", broadcastId);
    throw new Error(`Failed to insert notifications: ${insertError.message}`);
  }

  revalidatePath('/admin/notifications');
  return { count: notificationRows.length };
}

/**
 * Busca todos os envios de notificação para a listagem no painel de admin.
 */
export async function getNotificationBroadcasts() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("notification_broadcasts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching notification broadcasts:", error);
    return [];
  }
  return data;
}

/**
 * Deleta um envio de notificação e todas as notificações individuais associadas.
 */
export async function deleteNotificationBroadcast(broadcastId: string) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  assert(user, "Not authenticated");

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  assert(me?.role === "admin", "Not authorized");

  const { error } = await supabase.from("notification_broadcasts").delete().eq("id", broadcastId);

  if (error) {
    console.error("Error deleting broadcast:", error);
    return { success: false, message: error.message };
  }

  revalidatePath('/admin/notifications');
  return { success: true };
}