import { ageOnDate, evaluateChildPurchase } from "../../../../lib/purchase-policy.js";
import { authenticateStoreRequest, json } from "../server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function catalogSetupError(error: unknown) {
  if (!error || typeof error !== "object") return null;
  const databaseError = error as { code?: string; message?: string };
  if (["42P01", "42703", "PGRST204", "PGRST205"].includes(databaseError.code ?? "")) {
    return json({
      error: "Дэлгүүрийн өгөгдлийн санг тохируулаагүй байна. Supabase SQL Editor дээр child-purchase-restrictions-migration.sql-ийг ажиллуулаад дахин оролдоно уу.",
    }, 503);
  }
  if (databaseError.message === "Supabase server configuration missing") {
    return json({
      error: "Дэлгүүрийн серверийн тохиргоо дутуу байна. Supabase URL, anon key болон service role key-г серверийн орчинд тохируулна уу.",
    }, 503);
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const auth = await authenticateStoreRequest(request);
    if (auth.response) return auth.response;
    if (auth.profile.role !== "daughter") return json({ error: "Дэлгүүр хүүхдийн бүртгэлд нээлттэй." }, 403);
    if (!auth.profile.birth_date) return json({ products: [], error: "Төрсөн өдрийн мэдээллээ асран хамгаалагчаар шинэчлүүлнэ үү." });

    const [categoriesResult, productsResult, rulesResult, settingsResult, spendingResult] = await Promise.all([
      auth.admin.from("store_product_categories").select("id, label, enabled_by_default, parent_approval, minimum_age, always_blocked, default_weekly_limit"),
      auth.admin.from("store_products").select("id, sku, merchant, name, price_mnt, category_id, image_url, emoji").eq("active", true).order("merchant").order("name"),
      auth.admin.from("child_purchase_category_rules").select("category_id, enabled, daily_limit_mnt, weekly_limit_mnt").eq("child_id", auth.profile.id),
      auth.admin.from("child_purchase_settings").select("daily_limit_mnt, weekly_limit_mnt").eq("child_id", auth.profile.id).maybeSingle(),
      auth.admin.from("child_purchase_attempts").select("category_id, total_mnt, created_at").eq("child_id", auth.profile.id).eq("allowed", true).gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
    ]);
    const queryError = [categoriesResult, productsResult, rulesResult, settingsResult, spendingResult].find((result) => result.error)?.error;
    if (queryError) throw queryError;

    const categories = new Map((categoriesResult.data ?? []).map((category: any) => [category.id, category]));
    const rules = new Map((rulesResult.data ?? []).map((rule: any) => [rule.category_id, rule]));
    const settings = settingsResult.data ?? { daily_limit_mnt: 20000, weekly_limit_mnt: 80000 };
    const now = new Date();
    const localDateParts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Ulaanbaatar",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
    const localDate = Object.fromEntries(localDateParts.map((part) => [part.type, part.value]));
    const todayStart = new Date(`${localDate.year}-${localDate.month}-${localDate.day}T00:00:00+08:00`);
    const policyNow = new Date(Date.now() + 8 * 60 * 60 * 1000);
    const weeklySpent = (spendingResult.data ?? []).reduce((total: number, row: any) => total + row.total_mnt, 0);
    const dailySpent = (spendingResult.data ?? []).reduce((total: number, row: any) => (
      new Date(row.created_at) >= todayStart ? total + row.total_mnt : total
    ), 0);
    const categoryWeeklySpent = new Map<string, number>();
    const categoryDailySpent = new Map<string, number>();
    for (const row of spendingResult.data ?? []) {
      if (row.category_id) {
        categoryWeeklySpent.set(row.category_id, (categoryWeeklySpent.get(row.category_id) ?? 0) + row.total_mnt);
        if (new Date(row.created_at) >= todayStart) {
          categoryDailySpent.set(row.category_id, (categoryDailySpent.get(row.category_id) ?? 0) + row.total_mnt);
        }
      }
    }

    const age = ageOnDate(auth.profile.birth_date, policyNow);
    const products = (productsResult.data ?? []).filter((product: any) => {
      const category = categories.get(product.category_id);
      const rule = rules.get(product.category_id);
      return evaluateChildPurchase({
        birthDate: auth.profile.birth_date,
        category,
        categorySetting: rule,
        categoryDailyCap: rule?.daily_limit_mnt,
        categoryDailySpent: categoryDailySpent.get(product.category_id) ?? 0,
        categoryWeeklyCap: rule?.weekly_limit_mnt ?? category?.default_weekly_limit,
        categoryWeeklySpent: categoryWeeklySpent.get(product.category_id) ?? 0,
        purchaseTotal: product.price_mnt,
        totalDailyLimit: settings.daily_limit_mnt,
        totalWeeklyLimit: settings.weekly_limit_mnt,
        totalDailySpent: dailySpent,
        totalWeeklySpent: weeklySpent,
        now: policyNow,
      }).allowed;
    });

    const sweets = categories.get("sweets");
    const sweetsRule = rules.get("sweets");
    const sweetsCap = sweetsRule?.weekly_limit_mnt ?? sweets?.default_weekly_limit ?? 10000;
    const sweetsSpent = categoryWeeklySpent.get("sweets") ?? 0;
    return json({
      age,
      products,
      budget: {
        dailyLimitMnt: settings.daily_limit_mnt,
        dailySpentMnt: dailySpent,
        weeklyLimitMnt: settings.weekly_limit_mnt,
        weeklySpentMnt: weeklySpent,
        sweetsWeeklyLimitMnt: sweetsCap,
        sweetsWeeklySpentMnt: sweetsSpent,
      },
    });
  } catch (error) {
    console.error("Child store catalog failed:", error);
    const setupResponse = catalogSetupError(error);
    if (setupResponse) return setupResponse;
    return json({ error: "Дэлгүүрийн бараа ачаалж чадсангүй." }, 500);
  }
}
