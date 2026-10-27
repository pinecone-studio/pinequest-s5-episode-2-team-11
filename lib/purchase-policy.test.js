import { describe, expect, it } from "bun:test";
import { ageOnDate, evaluateChildPurchase } from "./purchase-policy.js";

const today = new Date("2026-10-27T12:00:00Z");
const hygiene = { key: "personal_hygiene", enabled_default: true, always_blocked: false, parent_approval: false };
const medicine = { key: "medicine", enabled_default: false, always_blocked: true, parent_approval: false };
const feminineHygiene = { key: "feminine_hygiene", enabled_default: false, always_blocked: false, parent_approval: true, min_age: 11 };

describe("child purchase policy", () => {
  it("derives age from the birthdate", () => {
    expect(ageOnDate("2015-10-27", today)).toBe(11);
    expect(ageOnDate("2015-10-28", today)).toBe(10);
    expect(ageOnDate("not-a-date", today)).toBeNull();
  });

  it("allows a whitelisted personal hygiene item such as toothpaste", () => {
    expect(evaluateChildPurchase({
      birthDate: "2015-10-27",
      category: hygiene,
      purchaseTotal: 5000,
      now: today,
    }).allowed).toBe(true);
  });

  it("blocks pharmacy medicine by SKU category", () => {
    expect(evaluateChildPurchase({
      birthDate: "2015-10-27",
      category: medicine,
      categorySetting: { enabled: true },
      purchaseTotal: 5000,
      now: today,
    })).toMatchObject({ allowed: false, reason: "category_restricted" });
  });

  it("blocks an uncategorized SKU", () => {
    expect(evaluateChildPurchase({
      birthDate: "2015-10-27",
      category: null,
      purchaseTotal: 5000,
      now: today,
    })).toMatchObject({ allowed: false, reason: "category_unknown" });
  });

  it("enforces the sweets weekly cap", () => {
    expect(evaluateChildPurchase({
      birthDate: "2015-10-27",
      category: { ...hygiene, key: "sweets" },
      categoryWeeklyCap: 10_000,
      categoryWeeklySpent: 8_000,
      purchaseTotal: 2_500,
      now: today,
    })).toMatchObject({ allowed: false, reason: "category_weekly_limit" });
  });

  it("blocks a direct checkout request for a restricted SKU even if the UI is bypassed", () => {
    const submittedSku = {
      sku: "DEMO-MONOS-MEDICINE-001",
      category: medicine,
      purchaseTotal: 15900,
    };
    expect(evaluateChildPurchase({
      birthDate: "2015-10-27",
      category: submittedSku.category,
      purchaseTotal: submittedSku.purchaseTotal,
      now: today,
    })).toMatchObject({ allowed: false, reason: "category_restricted" });
  });

  it("blocks feminine hygiene for age 9 and age 11 until a parent enables it", () => {
    const purchase = (birthDate, enabled) => evaluateChildPurchase({
      birthDate,
      category: feminineHygiene,
      categorySetting: { enabled },
      purchaseTotal: 5000,
      now: today,
    });
    expect(purchase("2017-10-27", true)).toMatchObject({ allowed: false, reason: "age_restricted" });
    expect(purchase("2015-10-27", false)).toMatchObject({ allowed: false, reason: "parent_approval_required" });
    expect(purchase("2015-10-27", true).allowed).toBe(true);
    expect(purchase("2013-10-27", true)).toMatchObject({ allowed: false, reason: "age_restricted" });
  });

  it("fails closed for missing or future birthdates and children younger than eight", () => {
    expect(evaluateChildPurchase({ birthDate: null, category: hygiene, purchaseTotal: 100, now: today }))
      .toMatchObject({ allowed: false, reason: "birthdate_missing" });
    expect(evaluateChildPurchase({ birthDate: "2027-01-01", category: hygiene, purchaseTotal: 100, now: today }))
      .toMatchObject({ allowed: false, reason: "birthdate_invalid" });
    expect(evaluateChildPurchase({ birthDate: "2020-10-27", category: hygiene, purchaseTotal: 100, now: today }))
      .toMatchObject({ allowed: false, reason: "age_restricted" });
  });

  it("keeps total daily and weekly spending limits enforced", () => {
    const base = {
      birthDate: "2015-10-27",
      category: hygiene,
      purchaseTotal: 1000,
      now: today,
    };
    expect(evaluateChildPurchase({ ...base, totalDailyLimit: 5000, totalDailySpent: 4500 }))
      .toMatchObject({ allowed: false, reason: "daily_limit" });
    expect(evaluateChildPurchase({ ...base, totalWeeklyLimit: 5000, totalWeeklySpent: 4500 }))
      .toMatchObject({ allowed: false, reason: "weekly_limit" });
  });
});
