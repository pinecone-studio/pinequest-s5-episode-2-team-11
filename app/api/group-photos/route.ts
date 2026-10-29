import { randomUUID } from "node:crypto";
import { authenticatePhotoRequest, isUuid, json, loadGroupAccess, notifyGroupPhotoMembers } from "./server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const PAGE_SIZE = 20;
const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function validImageHeader(bytes: Uint8Array, contentType: string) {
  if (contentType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (contentType === "image/png") return bytes.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10";
  if (contentType === "image/webp") {
    return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}

export async function GET(request: Request) {
  try {
    const auth = await authenticatePhotoRequest(request);
    if (auth.response) return auth.response;

    const url = new URL(request.url);
    const groupId = url.searchParams.get("groupId");
    const pageValue = Number(url.searchParams.get("page") ?? 0);
    if (!isUuid(groupId) || !Number.isSafeInteger(pageValue) || pageValue < 0 || pageValue > 10_000) {
      return json({ error: "Бүлэг эсвэл хуудасны дугаар буруу байна." }, 400);
    }

    const access = await loadGroupAccess(auth.admin, groupId, auth.user.id);
    if (!access?.permissions.canView) return json({ error: "Бүлэг олдсонгүй." }, 404);

    const from = pageValue * PAGE_SIZE;
    const { data: photos, error } = await auth.admin
      .from("group_photos")
      .select("id, group_id, uploader_id, storage_path, created_at")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, from + PAGE_SIZE);
    if (error) throw error;

    const uploaderIds = [...new Set((photos ?? []).map((photo: any) => photo.uploader_id))];
    const { data: profiles, error: profilesError } = uploaderIds.length
      ? await auth.admin
          .from("profiles")
          .select("id, display_name, avatar_look, avatar_skin, avatar_background")
          .in("id", uploaderIds)
      : { data: [], error: null };
    if (profilesError) throw profilesError;
    const profileById = new Map((profiles ?? []).map((profile: any) => [profile.id, profile]));
    const page = (photos ?? []).slice(0, PAGE_SIZE);

    return json({
      photos: page.map((photo: any) => ({
        id: photo.id,
        uploader_id: photo.uploader_id,
        created_at: photo.created_at,
        image_url: `/api/group-photos/image?photoId=${encodeURIComponent(photo.id)}`,
        uploader: profileById.get(photo.uploader_id) ?? { display_name: "Бүлгийн гишүүн" },
      })),
      hasMore: (photos ?? []).length > PAGE_SIZE,
    });
  } catch (error) {
    console.error("Group photo list failed:", error);
    return json({ error: "Зургуудыг ачаалж чадсангүй." }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authenticatePhotoRequest(request);
    if (auth.response) return auth.response;

    const form = await request.formData();
    const groupId = form.get("groupId");
    const file = form.get("photo");
    if (!isUuid(groupId) || !(file instanceof File)) return json({ error: "Бүлэг болон зураг сонгоно уу." }, 400);
    if (!MIME_EXTENSIONS[file.type] || file.size < 1 || file.size > MAX_FILE_SIZE) {
      return json({ error: "JPG, PNG эсвэл WebP зураг сонгоно уу (8 MB хүртэл)." }, 400);
    }

    const access = await loadGroupAccess(auth.admin, groupId, auth.user.id);
    if (!access?.permissions.canPost) return json({ error: "Бүлэг олдсонгүй." }, 404);

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!validImageHeader(bytes, file.type)) return json({ error: "Зургийн формат буруу байна." }, 400);

    const storagePath = `${groupId}/${randomUUID()}.${MIME_EXTENSIONS[file.type]}`;
    const { error: uploadError } = await auth.admin.storage.from("group-photos").upload(storagePath, bytes, {
      contentType: file.type,
      cacheControl: "0",
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data: photo, error: insertError } = await auth.admin
      .from("group_photos")
      .insert({ group_id: groupId, uploader_id: auth.user.id, storage_path: storagePath })
      .select("id, uploader_id, created_at")
      .single();
    if (insertError) {
      const { error: removeError } = await auth.admin.storage.from("group-photos").remove([storagePath]);
      if (removeError) console.error("Failed to clean up an unlinked group photo:", removeError);
      throw insertError;
    }

    let notificationWarning = null;
    try {
      await notifyGroupPhotoMembers(auth.admin, access.group, auth.user.id);
    } catch (error) {
      console.error("Photo posted, but group notifications failed:", error);
      notificationWarning = "Зураг нийтлэгдсэн ч гишүүдэд мэдэгдэл хүргэж чадсангүй.";
    }

    return json({
      photo: { ...photo, image_url: `/api/group-photos/image?photoId=${encodeURIComponent(photo.id)}` },
      notificationWarning,
    }, 201);
  } catch (error) {
    console.error("Group photo upload failed:", error);
    return json({ error: "Зураг нийтэлж чадсангүй." }, 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await authenticatePhotoRequest(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    const photoId = body?.photoId;
    if (!isUuid(photoId)) return json({ error: "Зургийн дугаар буруу байна." }, 400);

    const { data: photo, error: photoError } = await auth.admin
      .from("group_photos")
      .select("id, group_id, uploader_id, storage_path")
      .eq("id", photoId)
      .maybeSingle();
    if (photoError) throw photoError;
    if (!photo) return json({ error: "Зураг олдсонгүй." }, 404);

    const access = await loadGroupAccess(auth.admin, photo.group_id, auth.user.id);
    const canDelete = access?.permissions.canDeleteAny || photo.uploader_id === auth.user.id;
    if (!canDelete) return json({ error: "Зургийг устгах эрхгүй." }, 403);

    const { error: removeError } = await auth.admin.storage.from("group-photos").remove([photo.storage_path]);
    if (removeError) throw removeError;
    const { error: deleteError } = await auth.admin.from("group_photos").delete().eq("id", photo.id);
    if (deleteError) throw deleteError;

    return json({ deleted: true });
  } catch (error) {
    console.error("Group photo deletion failed:", error);
    return json({ error: "Зургийг устгаж чадсангүй." }, 500);
  }
}
