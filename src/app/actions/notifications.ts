"use server";

import { createSupabaseServerClient } from "@/integrations/supabase/server";

function assert(condition: any, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export async function createNotificationForUser(
  userId: string,
  title: string,
  body: string,
  metadata?: Record<string, unknown>
) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw new Error(authError.message);
  assert(user, "Not authenticated");

  // Permitir: o próprio usuário ou admin
  let isAdmin = false;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  isAdmin = profile?.role === "admin";

  assert(isAdmin || user.id === userId, "Not authorized");

  const { data, error } = await supabase
    .from("notifications")
    .insert({ user_id: userId, title, body, metadata: metadata ?? null })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return { id: data.id as string };
}

export async function sendNotificationToAll(
  title: string,
  body: string,
  metadata?: Record<string, unknown>
) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw new Error(authError.message);
  assert(user, "Not authenticated");

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  assert(me?.role === "admin", "Not authorized");

  // Obter todos os usuários (ids dos perfis)
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id");
  if (profilesError) throw new Error(profilesError.message);

  const rows =
    profiles?.map((p) => ({
      user_id: p.id,
      title,
      body,
      metadata: metadata ?? null,
    })) ?? [];

  if (rows.length === 0) return { count: 0 };

  const { error: insertError } = await supabase.from("notifications").insert(rows);
  if (insertError) throw new Error(insertError.message);

  return { count: rows.length };
}