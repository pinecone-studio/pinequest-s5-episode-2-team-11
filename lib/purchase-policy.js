function mongoliaDate(now) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ulaanbaatar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const fields = Object.fromEntries(parts.map((part) => [part.type, Number(part.value)]));
  return new Date(Date.UTC(fields.year, fields.month - 1, fields.day));
}

export function ageOnDate(birthDate, today = mongoliaDate(new Date())) {
  if (typeof birthDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const [year, month, day] = birthDate.split("-").map(Number);
  const born = new Date(Date.UTC(year, month - 1, day));
  if (
    born.getUTCFullYear() !== year ||
    born.getUTCMonth() !== month - 1 ||
    born.getUTCDate() !== day
  ) return null;

  let age = today.getUTCFullYear() - year;
  const birthdayPassed =
    today.getUTCMonth() > month - 1 ||
    (today.getUTCMonth() === month - 1 && today.getUTCDate() >= day);
  if (!birthdayPassed) age -= 1;
  return age;
}

export function evaluateChildPurchase({
  birthDate,
  category,
  categorySetting = null,
  categoryDailyCap = null,
  categoryDailySpent = 0,
  categoryWeeklyCap = null,
  categoryWeeklySpent = 0,
  purchaseTotal,
  totalDailyLimit = null,
  totalWeeklyLimit = null,
  totalDailySpent = 0,
  totalWeeklySpent = 0,
  now = new Date(),
}) {
  const age = ageOnDate(birthDate, now);
  if (age === null) return { allowed: false, reason: "birthdate_missing" };
  if (age < 0) return { allowed: false, reason: "birthdate_invalid", age };
  if (age < 8) return { allowed: false, reason: "age_restricted", age };

  if (!category || category.always_blocked) {
    return { allowed: false, reason: category ? "category_restricted" : "category_unknown", age };
  }
  if (category.parent_approval) {
    if (age < (category.minimum_age ?? category.min_age ?? 0) ||
        age > (category.maximum_age ?? 12)) {
      return { allowed: false, reason: "age_restricted", age };
    }
    if (!categorySetting?.enabled) {
      return { allowed: false, reason: "parent_approval_required", age };
    }
  } else if (!category.enabled_default) {
    return { allowed: false, reason: "category_not_enabled", age };
  }

  if (
    Number.isFinite(categoryDailyCap) &&
    categoryDailySpent + purchaseTotal > categoryDailyCap
  ) {
    return { allowed: false, reason: "category_daily_limit", age };
  }
  if (
    Number.isFinite(categoryWeeklyCap) &&
    categoryWeeklySpent + purchaseTotal > categoryWeeklyCap
  ) {
    return { allowed: false, reason: "category_weekly_limit", age };
  }
  if (
    Number.isFinite(totalDailyLimit) &&
    totalDailySpent + purchaseTotal > totalDailyLimit
  ) {
    return { allowed: false, reason: "daily_limit", age };
  }
  if (
    Number.isFinite(totalWeeklyLimit) &&
    totalWeeklySpent + purchaseTotal > totalWeeklyLimit
  ) {
    return { allowed: false, reason: "weekly_limit", age };
  }

  return { allowed: true, reason: null, age };
}

export const PURCHASE_BLOCK_MESSAGES = {
  birthdate_missing: "Таны төрсөн өдрийн мэдээлэл байхгүй тул энэ барааг авах боломжгүй байна.",
  birthdate_invalid: "Төрсөн өдрийн мэдээлэл буруу тул энэ барааг авах боломжгүй байна.",
  category_unknown: "Энэ барааны ангилал тодорхойгүй тул авах боломжгүй байна.",
  category_restricted: "Энэ бараа таны бүртгэлд тохирохгүй тул авах боломжгүй байна.",
  age_restricted: "Энэ барааг таны насанд авах боломжгүй байна.",
  parent_approval_required: "Энэ барааг авахын тулд асран хамгаалагчийн зөвшөөрөл хэрэгтэй.",
  category_not_enabled: "Энэ барааны ангиллыг авах боломжгүй байна.",
  category_weekly_limit: "Энэ ангиллын долоо хоногийн төсөв хүрэлцэхгүй байна.",
  category_daily_limit: "Энэ ангиллын өдрийн төсөв хүрэлцэхгүй байна.",
  daily_limit: "Өдрийн худалдан авалтын хязгаарт хүрсэн байна.",
  weekly_limit: "Долоо хоногийн худалдан авалтын хязгаарт хүрсэн байна.",
};
