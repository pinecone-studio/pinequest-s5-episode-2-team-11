import { PURCHASE_BLOCK_MESSAGES } from "../../../../lib/purchase-policy.js";
import { authenticateStoreRequest, isUuid, json } from "../server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const auth = await authenticateStoreRequest(request);
    if (auth.response) return auth.response;
    if (auth.profile.role !== "daughter") return json({ error: "Энэ үйлдэл хүүхдийн бүртгэлд нээлттэй." }, 403);

    const body = await request.json();
    if (!isUuid(body?.productId) || !Number.isInteger(body?.quantity) || body.quantity < 1 || body.quantity > 10) {
      return json({ error: "Бараа эсвэл тоо ширхэг буруу байна." }, 400);
    }

    const { data, error } = await auth.admin.rpc("record_child_store_purchase", {
      p_child_id: auth.profile.id,
      p_product_id: body.productId,
      p_quantity: body.quantity,
    });
    if (error) throw error;
    if (!data?.allowed) {
      const message = PURCHASE_BLOCK_MESSAGES[data?.reason] ?? "Энэ барааг авах боломжгүй байна.";
      return json({ error: message, reason: data?.reason }, 403);
    }
    return json({
      purchase: data,
      message: "Худалдан авалтын хүсэлт амжилттай бүртгэгдлээ.",
    }, 201);
  } catch (error) {
    console.error("Child store checkout failed:", error);
    return json({ error: "Худалдан авалтыг бүртгэж чадсангүй." }, 500);
  }
}
