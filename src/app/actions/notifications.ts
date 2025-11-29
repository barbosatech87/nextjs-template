"use server";

import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { createSupabaseAdminClient } from "@/integrations/supabase/admin";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from 'uuid';
import webpush from 'web-push';
import { i18n } from "@/lib/i18n/config";

// Configura o web-push com as chaves VAPID
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:contato@paxword.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn("VAPID keys not configured. Push notifications will not work.");
}

function assert(condition: any, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const notificationTitles = {
  pt: "Novo Post no PaxWord!",
  en: "New Post on PaxWord!",
  es: "¡Nuevo Post en PaxWord!",
};

/**
 * Dispara o envio de notificações push para um novo post, respeitando o idioma.
 */
export async function triggerNewPostNotification(postId: string, postTitle: string, postSlug: string, originalLang: string) {
  Promise.resolve().then(async () => {
    try {
      const supabaseAdmin = createSupabaseAdminClient();
      
      // 1. Busca todas as inscrições ativas com seu idioma
      const { data: subscriptions, error: subsError } = await supabaseAdmin
        .from('push_subscriptions')
        .select('subscription_data, language_code');

      if (subsError || !subscriptions || subscriptions.length === 0) {
        console.log("Nenhuma inscrição para notificar.");
        return;
      }

      // 2. Busca todas as traduções disponíveis para o post
      const { data: translations } = await supabaseAdmin
        .from('blog_post_translations')
        .select('language_code, translated_title')
        .eq('post_id', postId);

      const translationsMap = new Map(translations?.map(t => [t.language_code, t]));

      // 3. Agrupa as inscrições por idioma
      const subsByLang: Record<string, any[]> = {};
      for (const sub of subscriptions) {
        const lang = sub.language_code || i18n.defaultLocale;
        if (!subsByLang[lang]) subsByLang[lang] = [];
        subsByLang[lang].push(sub.subscription_data);
      }

      // 4. Cria um único registro de broadcast
      const broadcastId = uuidv4();
      await supabaseAdmin.from("notification_broadcasts").insert({
        id: broadcastId,
        title: notificationTitles[originalLang as keyof typeof notificationTitles] || notificationTitles.pt,
        body: postTitle,
        sent_to_count: subscriptions.length,
        type: 'automatic',
      });

      // 5. Envia notificações para cada grupo de idioma
      for (const langCode of Object.keys(subsByLang)) {
        const translation = translationsMap.get(langCode);
        const notificationBody = translation ? translation.translated_title : postTitle;
        const notificationTitle = notificationTitles[langCode as keyof typeof notificationTitles] || notificationTitles.pt;
        const url = `/${langCode}/blog/${postSlug}`;

        const payload = JSON.stringify({
          title: notificationTitle,
          body: notificationBody,
          url: url,
        });

        const subs = subsByLang[langCode];
        const sendPromises = subs.map(async (sub) => {
          try {
            await webpush.sendNotification(sub, payload);
          } catch (error) {
            console.error(`Erro ao enviar notificação para ${sub.endpoint}:`, error);
            if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode === 410) {
              const endpoint = sub?.endpoint;
              if (endpoint) {
                console.log("Removendo inscrição expirada:", endpoint);
                await supabaseAdmin.from('push_subscriptions').delete().eq('subscription_data->>endpoint', endpoint);
              }
            }
          }
        });
        await Promise.all(sendPromises);
        console.log(`Notificações enviadas para ${subs.length} usuários em '${langCode}'.`);
      }

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