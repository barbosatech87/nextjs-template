"use server";

import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { createSupabaseAdminClient } from "@/integrations/supabase/admin";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from 'uuid';
import webpush from 'web-push';

// Configura o web-push com as chaves VAPID
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:seu-email-de-contato@exemplo.com', // Substitua por um e-mail de contato
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn("VAPID keys not configured. Push notifications will not work.");
}

function assert(condition: any, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

/**
 * Dispara o envio de notificações push para um novo post.
 * Não bloqueia a execução principal (roda em segundo plano).
 */
export function triggerNewPostNotification(postId: string, postTitle: string, postSlug: string, lang: string) {
  // Executa sem await para não bloquear a resposta da Server Action
  Promise.resolve().then(async () => {
    try {
      const supabaseAdmin = createSupabaseAdminClient();
      
      // 1. Busca todas as inscrições ativas
      const { data: subscriptions, error: subsError } = await supabaseAdmin
        .from('push_subscriptions')
        .select('subscription_data');

      if (subsError || !subscriptions || subscriptions.length === 0) {
        console.log("Nenhuma inscrição para notificar sobre o novo post.");
        return;
      }

      // 2. Cria um registro de broadcast para rastreamento
      const broadcastId = uuidv4();
      const notificationTitle = "Novo Post no PaxWord!";
      const notificationBody = postTitle;
      const postUrl = `/${lang}/blog/${postSlug}`;

      await supabaseAdmin.from("notification_broadcasts").insert({
        id: broadcastId,
        title: notificationTitle,
        body: notificationBody,
        sent_to_count: subscriptions.length,
        type: 'automatic', // Novo tipo
      });

      // 3. Prepara o payload da notificação
      const payload = JSON.stringify({
        title: notificationTitle,
        body: notificationBody,
        url: postUrl,
      });

      // 4. Envia as notificações
      const sendPromises = subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(sub.subscription_data as any, payload);
        } catch (error) {
          console.error("Erro ao enviar notificação:", error);
          // Se a inscrição expirou (erro 410), remove do banco
          if (error.statusCode === 410) {
            console.log("Removendo inscrição expirada:", sub.subscription_data.endpoint);
            await supabaseAdmin
              .from('push_subscriptions')
              .delete()
              .eq('subscription_data->>endpoint', sub.subscription_data.endpoint);
          }
        }
      });

      await Promise.all(sendPromises);
      console.log(`Notificações para o post "${postTitle}" enviadas para ${subscriptions.length} usuários.`);

    } catch (e) {
      console.error("Falha crítica no envio de notificações automáticas:", e);
    }
  });
}


/**
 * Envia uma notificação manual para todos os usuários.
 */
export async function sendNotificationToAll(title: string, body: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  assert(user, "Not authenticated");

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  assert(me?.role === "admin", "Not authorized");

  const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id");
  if (profilesError) throw new Error(profilesError.message);
  if (!profiles || profiles.length === 0) return { count: 0 };

  const broadcastId = uuidv4();
  
  const { error: broadcastError } = await supabase.from("notification_broadcasts").insert({
    id: broadcastId,
    author_id: user.id,
    title,
    body,
    sent_to_count: profiles.length,
    type: 'manual', // Tipo manual
  });
  if (broadcastError) throw new Error(`Failed to create broadcast record: ${broadcastError.message}`);

  const notificationRows = profiles.map((p) => ({
    user_id: p.id,
    title,
    body,
    broadcast_id: broadcastId,
  }));

  const { error: insertError } = await supabase.from("notifications").insert(notificationRows);
  if (insertError) {
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
  const supabase = await createSupabaseServerClient();
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
  const supabase = await createSupabaseServerClient();
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