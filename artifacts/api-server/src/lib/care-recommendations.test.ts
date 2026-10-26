import { describe, it, expect } from "vitest";
import {
  addMonthsToDateString,
  addDaysToDateString,
  ageInYears,
  daysApart,
  VACCINE_RULES,
  SENIOR_SCREENING_AGE_YEARS,
} from "./care-recommendations";

describe("addMonthsToDateString", () => {
  it("adds whole months, same day of month", () => {
    expect(addMonthsToDateString("2025-03-15", 12)).toBe("2026-03-15");
  });

  it("rolls over the year boundary", () => {
    expect(addMonthsToDateString("2025-11-01", 12)).toBe("2026-11-01");
  });

  it("handles a leap-day source date landing on a non-leap year", () => {
    // 2024 is a leap year; 2025 is not. JS Date overflow pushes a
    // nonexistent Feb 29 forward into March rather than clamping to
    // Feb 28 — documenting the actual behavior here so a future change
    // to this function can't silently alter it without a test failing.
    expect(addMonthsToDateString("2024-02-29", 12)).toBe("2025-03-01");
  });
});

describe("addDaysToDateString", () => {
  it("adds days and rolls over a month boundary", () => {
    expect(addDaysToDateString(new Date("2026-01-25T00:00:00.000Z"), 10)).toBe("2026-02-04");
  });
});

describe("ageInYears", () => {
  it("computes a straightforward whole-years age", () => {
    const tenYearsAgo = new Date();
    tenYearsAgo.setUTCFullYear(tenYearsAgo.getUTCFullYear() - 10);
    const birthDate = tenYearsAgo.toISOString().slice(0, 10);
    expect(ageInYears(birthDate)).toBe(10);
  });

  it("doesn't count this year's birthday if it hasn't happened yet", () => {
    const now = new Date();
    // A birth date later this month than today, 5 years ago — the
    // birthday for this year hasn't occurred yet, so age is 4, not 5.
    const future = new Date(Date.UTC(now.getUTCFullYear() - 5, now.getUTCMonth(), now.getUTCDate() + 1));
    const birthDate = future.toISOString().slice(0, 10);
    expect(ageInYears(birthDate)).toBe(4);
  });

  it("counts the birthday on the exact day it occurs", () => {
    const now = new Date();
    const sevenYearsAgoToday = new Date(Date.UTC(now.getUTCFullYear() - 7, now.getUTCMonth(), now.getUTCDate()));
    const birthDate = sevenYearsAgoToday.toISOString().slice(0, 10);
    expect(ageInYears(birthDate)).toBe(7);
  });
});

describe("daysApart", () => {
  it("is symmetric and counts whole days", () => {
    expect(daysApart("2026-01-01", "2026-01-10")).toBe(9);
    expect(daysApart("2026-01-10", "2026-01-01")).toBe(9);
  });

  it("is zero for the same date", () => {
    expect(daysApart("2026-05-05", "2026-05-05")).toBe(0);
  });
});

describe("VACCINE_RULES", () => {
  it("every rule renews on a 12-month interval", () => {
    // Not a hard requirement of the engine, but true of every rule today —
    // a change here is worth a second look, not a silent pass.
    for (const rule of VACCINE_RULES) {
      expect(rule.intervalMonths).toBe(12);
    }
  });

  it("rabies applies to any species; DHPP and Bordetella are dog-only; FVRCP is cat-only", () => {
    const byKey = Object.fromEntries(VACCINE_RULES.map((r) => [r.key, r]));
    expect(byKey.rabies?.species).toBe("any");
    expect(byKey.dhpp?.species).toBe("dog");
    expect(byKey.bordetella?.species).toBe("dog");
    expect(byKey.fvrcp?.species).toBe("cat");
  });
});

describe("SENIOR_SCREENING_AGE_YEARS", () => {
  it("matches the PRD defaults — 7 for dogs, 10 for cats", () => {
    expect(SENIOR_SCREENING_AGE_YEARS.dog).toBe(7);
    expect(SENIOR_SCREENING_AGE_YEARS.cat).toBe(10);
  });
});
