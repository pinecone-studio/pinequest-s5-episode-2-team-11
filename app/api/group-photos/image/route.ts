import { authenticatePhotoRequest, isUuid, json, loadGroupAccess } from "../server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await authenticatePhotoRequest(request);
    if (auth.response) return auth.response;

    const photoId = new URL(request.url).searchParams.get("photoId");
    if (!isUuid(photoId)) return json({ error: "Зургийн дугаар буруу байна." }, 400);

    const { data: photo, error } = await auth.admin
      .from("group_photos")
      .select("group_id, storage_path")
      .eq("id", photoId)
      .maybeSingle();
    if (error) throw error;
    if (!photo) return json({ error: "Зураг олдсонгүй." }, 404);

    const access = await loadGroupAccess(auth.admin, photo.group_id, auth.user.id);
    if (!access?.permissions.canView) return json({ error: "Зураг олдсонгүй." }, 404);

    const { data: file, error: fileError } = await auth.admin.storage.from("group-photos").download(photo.storage_path);
    if (fileError) throw fileError;

    return new Response(file.stream(), {
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "Content-Length": String(file.size),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Group photo access failed:", error);
    return json({ error: "Зураг ачаалж чадсангүй." }, 500);
  }
}
