import { createClient } from "@supabase/supabase-js";
import { groupPhotoPermissions } from "../../../lib/group-photo-access.js";

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };

export function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function createClients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) throw new Error("Supabase server configuration missing");

  return {
    auth: createClient(url, anonKey, clientOptions),
    admin: createClient(url, serviceKey, clientOptions),
  };
}

export async function authenticatePhotoRequest(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return { response: json({ error: "Нэвтрэх шаардлагатай." }, 401) };

  const { auth, admin } = createClients();
  const { data, error } = await auth.auth.getUser(token);
  if (error || !data.user) return { response: json({ error: "Нэвтрэх шаардлагатай." }, 401) };

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();
  if (profileError) throw profileError;
  if (profile?.role !== "daughter") return { response: json({ error: "Охидын бүлэгт хандах эрхгүй." }, 403) };

  return { user: data.user, admin };
}

export async function loadGroupAccess(admin: any, groupId: string, userId: string) {
  const { data, error } = await admin
    .from("friend_groups")
    .select("id, owner_id, name, emoji, friend_group_members(member_id)")
    .eq("id", groupId)
    .maybeSingle();
  if (error) throw error;

  const permissions = groupPhotoPermissions(data, userId);
  return data ? { group: data, permissions } : null;
}

export async function notifyGroupPhotoMembers(admin: any, group: any, uploaderId: string) {
  const memberIds = [
    ...new Set([
      group.owner_id,
      ...(group.friend_group_members ?? []).map((member: any) => member.member_id),
    ]),
  ]
    .filter((memberId) => memberId !== uploaderId)
    .sort()
    .slice(0, 50);
  if (!memberIds.length) return 0;

  const { data: recipients, error: profileError } = await admin
    .from("profiles")
    .select("id, family_id, role")
    .in("id", memberIds);
  if (profileError) throw profileError;

  const notifications = (recipients ?? [])
    .filter((recipient: any) => recipient.family_id && recipient.role === "daughter")
    .map((recipient: any) => ({
      family_id: recipient.family_id,
      sender_id: uploaderId,
      recipient_id: recipient.id,
      recipient_role: "daughter",
      kind: "info",
      text: `«${group.name}» бүлэгт шинэ зураг нийтлэгдлээ.`,
    }));
  if (!notifications.length) return 0;

  const { error } = await admin.from("notifications").insert(notifications);
  if (error) throw error;
  return notifications.length;
}

export const isUuid = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
