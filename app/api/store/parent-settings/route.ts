import { ageOnDate } from "../../../../lib/purchase-policy.js";
import { authenticateStoreRequest, isUuid, json, loadFamilyChild } from "../server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await authenticateStoreRequest(request);
    if (auth.response) return auth.response;
    if (auth.profile.role !== "mother" || !auth.profile.family_id) return json({ error: "Асран хамгаалагчийн эрх шаардлагатай." }, 403);

    const childId = new URL(request.url).searchParams.get("childId");
    if (!isUuid(childId)) return json({ error: "Хүүхдийн бүртгэл сонгоно уу." }, 400);
    const child = await loadFamilyChild(auth.admin, auth.profile, childId);
    if (!child) return json({ error: "Энэ хүүхдийн тохиргоонд хандах эрхгүй." }, 403);

    const [categoriesResult, rulesResult, settingsResult, attemptsResult] = await Promise.all([
      auth.admin.from("store_product_categories").select("id, label, parent_approval, minimum_age, maximum_age, always_blocked, default_weekly_limit").order("label"),
      auth.admin.from("child_purchase_category_rules").select("category_id, enabled, daily_limit_mnt, weekly_limit_mnt").eq("child_id", child.id),
      auth.admin.from("child_purchase_settings").select("daily_limit_mnt, weekly_limit_mnt").eq("child_id", child.id).maybeSingle(),
      auth.admin.from("child_purchase_attempts").select("id, sku, product_name, category_id, quantity, total_mnt, allowed, reason, created_at").eq("child_id", child.id).order("created_at", { ascending: false }).limit(100),
    ]);
    const queryError = [categoriesResult, rulesResult, settingsResult, attemptsResult].find((result) => result.error)?.error;
    if (queryError) throw queryError;

    const rules = new Map((rulesResult.data ?? []).map((rule: any) => [rule.category_id, rule]));
    return json({
      child: { id: child.id, name: child.display_name, birthDate: child.birth_date },
      limits: settingsResult.data ?? { daily_limit_mnt: 20000, weekly_limit_mnt: 80000 },
      categories: (categoriesResult.data ?? []).map((category: any) => ({
        ...category,
        rule: rules.get(category.id) ?? null,
      })),
      attempts: attemptsResult.data ?? [],
    });
  } catch (error) {
    console.error("Parent purchase settings load failed:", error);
    return json({ error: "Худалдан авалтын мэдээлэл ачаалж чадсангүй." }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authenticateStoreRequest(request);
    if (auth.response) return auth.response;
    if (auth.profile.role !== "mother" || !auth.profile.family_id) return json({ error: "Асран хамгаалагчийн эрх шаардлагатай." }, 403);

    const body = await request.json();
    if (!isUuid(body?.childId)) return json({ error: "Хүүхдийн бүртгэл сонгоно уу." }, 400);
    const child = await loadFamilyChild(auth.admin, auth.profile, body.childId);
    if (!child) return json({ error: "Энэ хүүхдийн тохиргоог өөрчлөх эрхгүй." }, 403);

    const dailyLimit = body.dailyLimitMnt;
    const weeklyLimit = body.weeklyLimitMnt;
    if (!Number.isSafeInteger(dailyLimit) || dailyLimit < 0 || dailyLimit > 10_000_000 ||
        !Number.isSafeInteger(weeklyLimit) || weeklyLimit < 0 || weeklyLimit > 50_000_000) {
      return json({ error: "Өдрийн эсвэл долоо хоногийн төсвийн дүн буруу байна." }, 400);
    }

    const { data: categories, error: categoriesError } = await auth.admin
      .from("store_product_categories")
      .select("id, parent_approval, minimum_age, maximum_age, always_blocked");
    if (categoriesError) throw categoriesError;
    const { data: existingRules, error: existingRulesError } = await auth.admin
      .from("child_purchase_category_rules")
      .select("category_id, enabled")
      .eq("child_id", child.id);
    if (existingRulesError) throw existingRulesError;
    const byId = new Map((categories ?? []).map((category: any) => [category.id, category]));
    const existingRuleById = new Map((existingRules ?? []).map((rule: any) => [rule.category_id, rule]));
    const age = ageOnDate(child.birth_date);
    const categoryLimits = body.categoryLimits ?? [];
    if (!Array.isArray(categoryLimits) || categoryLimits.length > categories?.length) {
      return json({ error: "Ангиллын төсвийн жагсаалт буруу байна." }, 400);
    }

    const upserts: any[] = [];
    const seenCategories = new Set<string>();
    for (const limit of categoryLimits) {
      const categoryId = limit?.categoryId;
      const category = byId.get(categoryId);
      if (!category || category.always_blocked || seenCategories.has(categoryId)) {
        return json({ error: "Хориглосон эсвэл танигдаагүй ангилалд тохиргоо хийж болохгүй." }, 400);
      }
      seenCategories.add(categoryId);
      const daily = limit.dailyLimitMnt;
      const weekly = limit.weeklyLimitMnt;
      if ((daily !== null && (!Number.isSafeInteger(daily) || daily < 0 || daily > 10_000_000)) ||
          (weekly !== null && (!Number.isSafeInteger(weekly) || weekly < 0 || weekly > 50_000_000))) {
        return json({ error: "Ангиллын өдрийн эсвэл долоо хоногийн төсөв буруу байна." }, 400);
      }
      upserts.push({
        child_id: child.id,
        category_id: categoryId,
        ...(category.parent_approval
          ? { enabled: existingRuleById.get(categoryId)?.enabled ?? false }
          : {}),
        daily_limit_mnt: daily,
        weekly_limit_mnt: weekly,
        updated_at: new Date().toISOString(),
      });
    }

    if (body.feminineHygieneEnabled !== undefined) {
      const category = byId.get("feminine_hygiene");
      if (typeof body.feminineHygieneEnabled !== "boolean" || !category?.parent_approval || category.always_blocked) {
        return json({ error: "Энэ ангиллыг тохируулах боломжгүй." }, 400);
      }
      if (body.feminineHygieneEnabled &&
          (age === null || age < (category.minimum_age ?? 11) || age > (category.maximum_age ?? 12))) {
        return json({ error: "Энэ сонголт зөвхөн 11–12 насанд нээлттэй." }, 400);
      }
      const existing = upserts.find((rule) => rule.category_id === "feminine_hygiene");
      if (existing) existing.enabled = body.feminineHygieneEnabled;
      else upserts.push({
        child_id: child.id,
        category_id: "feminine_hygiene",
        enabled: body.feminineHygieneEnabled,
        updated_at: new Date().toISOString(),
      });
    }

    const { error: settingsError } = await auth.admin.from("child_purchase_settings").upsert({
      child_id: child.id,
      parent_id: auth.profile.id,
      daily_limit_mnt: dailyLimit,
      weekly_limit_mnt: weeklyLimit,
      updated_at: new Date().toISOString(),
    });
    if (settingsError) throw settingsError;
    if (upserts.length) {
      const { error } = await auth.admin.from("child_purchase_category_rules").upsert(upserts, { onConflict: "child_id,category_id" });
      if (error) throw error;
    }
    return json({ saved: true });
  } catch (error) {
    console.error("Parent purchase settings update failed:", error);
    return json({ error: "Худалдан авалтын тохиргоог хадгалж чадсангүй." }, 500);
  }
}
