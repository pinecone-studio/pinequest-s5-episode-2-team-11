import { authenticateStoreRequest, json } from "../../server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CSV_COLUMNS = ["sku", "merchant", "name", "price_mnt", "category_id", "emoji", "image_url"];

class CatalogInputError extends Error {}

function parseCsvRow(line: string) {
  const cells: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      cells.push(value.trim());
      value = "";
    } else {
      value += character;
    }
  }
  if (quoted) throw new CatalogInputError("CSV-ийн хашилт буруу байна.");
  cells.push(value.trim());
  return cells;
}

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const headers = parseCsvRow(lines[0]).map((header) => header.toLowerCase());
  if (headers.length !== CSV_COLUMNS.length || headers.some((header, index) => header !== CSV_COLUMNS[index])) {
    throw new CatalogInputError(`CSV баганын дараалал: ${CSV_COLUMNS.join(", ")}`);
  }
  return lines.slice(1).map((line) => {
    const cells = parseCsvRow(line);
    if (cells.length !== headers.length) throw new CatalogInputError("CSV мөрийн баганын тоо зөрүүтэй байна.");
    return Object.fromEntries(headers.map((header, index) => [header, cells[index]]));
  });
}

export async function POST(request: Request) {
  try {
    const auth = await authenticateStoreRequest(request);
    if (auth.response) return auth.response;

    const adminIds = new Set((process.env.STORE_CATALOG_ADMIN_USER_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean));
    if (!adminIds.size || !adminIds.has(auth.user.id)) {
      return json({ error: "Барааны каталог засах админы эрх шаардлагатай." }, 403);
    }

    const contentType = request.headers.get("content-type") ?? "";
    let rows: any[];
    if (contentType.includes("text/csv")) {
      rows = parseCsv(await request.text());
    } else {
      const body = await request.json();
      rows = Array.isArray(body?.products) ? body.products : [];
    }
    if (!rows.length || rows.length > 500) return json({ error: "1–500 барааны мөр оруулна уу." }, 400);

    const { data: categories, error: categoryError } = await auth.admin
      .from("store_product_categories")
      .select("id, always_blocked");
    if (categoryError) throw categoryError;
    const categoryMap = new Map((categories ?? []).map((category: any) => [category.id, category]));
    const products = rows.map((row) => {
      const sku = typeof row.sku === "string" ? row.sku.trim() : "";
      const merchant = typeof row.merchant === "string" ? row.merchant.trim() : "";
      const name = typeof row.name === "string" ? row.name.trim() : "";
      const price = typeof row.price_mnt === "string" ? Number(row.price_mnt) : row.price_mnt;
      const categoryId = typeof row.category_id === "string" ? row.category_id.trim() : null;
      if (!sku || !merchant || !name || sku.length > 100 || merchant.length > 100 || name.length > 200 ||
          !Number.isSafeInteger(price) || price < 0 || !categoryId || !categoryMap.has(categoryId)) {
        throw new CatalogInputError("SKU, дэлгүүр, нэр, бүхэл үнэ, whitelist ангилал шаардлагатай.");
      }
      return {
        sku,
        merchant,
        name,
        price_mnt: price,
        category_id: categoryId,
        emoji: typeof row.emoji === "string" && row.emoji.length <= 8 ? row.emoji : "🛍️",
        image_url: typeof row.image_url === "string" && row.image_url.startsWith("https://") ? row.image_url : null,
        active: true,
        updated_at: new Date().toISOString(),
      };
    });

    const { error } = await auth.admin.from("store_products").upsert(products, { onConflict: "sku" });
    if (error) throw error;
    return json({ imported: products.length });
  } catch (error) {
    if (error instanceof CatalogInputError) {
      return json({ error: error.message }, 400);
    }
    console.error("Store product catalog import failed:", error);
    return json({ error: "Барааны каталог импортолж чадсангүй." }, 500);
  }
}
