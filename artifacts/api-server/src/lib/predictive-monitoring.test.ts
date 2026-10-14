import { describe, it, expect } from "vitest";
import {
  checkLowScale,
  checkDiarrhea,
  checkVomitingSameDaySevere,
  checkVomitingRecurring,
  checkLimping,
  confidenceFromRatio,
  confidenceFromCount,
  type Entry,
} from "./predictive-monitoring";

// Every threshold exercised here is cited against real veterinary guidance
// in docs/PRD.md §7e, not assumed — these tests exist to catch a future
// change accidentally loosening or tightening one of those numbers, not to
// re-derive them.

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY_MS);

function entry(overrides: Partial<Entry> & { loggedAt: Date }): Entry {
  return {
    id: 0,
    petId: 1,
    appetite: null,
    energy: null,
    stoolQuality: null,
    vomiting: null,
    limping: null,
    behaviorNote: null,
    note: null,
    ...overrides,
  } as Entry;
}

describe("confidenceFromRatio", () => {
  it("is high at or above 0.85", () => {
    expect(confidenceFromRatio(85, 100)).toBe("high");
    expect(confidenceFromRatio(3, 3)).toBe("high");
  });
  it("is medium from 0.6 up to (but not including) 0.85", () => {
    expect(confidenceFromRatio(60, 100)).toBe("medium");
    expect(confidenceFromRatio(84, 100)).toBe("medium");
  });
  it("is low below 0.6", () => {
    expect(confidenceFromRatio(59, 100)).toBe("low");
    expect(confidenceFromRatio(0, 100)).toBe("low");
  });
  it("is low when nothing was considered, not a division error", () => {
    expect(confidenceFromRatio(0, 0)).toBe("low");
  });
});

describe("confidenceFromCount", () => {
  it("is high at or above the high threshold", () => {
    expect(confidenceFromCount(3, 2, 3)).toBe("high");
    expect(confidenceFromCount(5, 2, 3)).toBe("high");
  });
  it("is medium at or above the medium threshold, below high", () => {
    expect(confidenceFromCount(2, 2, 3)).toBe("medium");
  });
  it("is low below the medium threshold", () => {
    expect(confidenceFromCount(1, 2, 3)).toBe("low");
  });
});

describe("checkLowScale (energy/appetite pattern)", () => {
  // VCA: recurring low energy/appetite — flagged at 3 of the last 4
  // entries, within a 7-day window.
  it("flags 3 of the last 4 entries low, within the window", () => {
    const entries = [
      entry({ loggedAt: daysAgo(1), energy: "low" }),
      entry({ loggedAt: daysAgo(2), energy: "low" }),
      entry({ loggedAt: daysAgo(3), energy: "normal" }),
      entry({ loggedAt: daysAgo(4), energy: "low" }),
    ];
    const match = checkLowScale(entries, "energy", 7, 4, 3);
    expect(match).not.toBeNull();
    expect(match!.reasoning.signal).toBe("low_energy");
    expect(match!.reasoning.value).toContain("3 of the last 4");
  });

  it("does not flag only 2 of the last 4 entries low", () => {
    const entries = [
      entry({ loggedAt: daysAgo(1), energy: "low" }),
      entry({ loggedAt: daysAgo(2), energy: "normal" }),
      entry({ loggedAt: daysAgo(3), energy: "normal" }),
      entry({ loggedAt: daysAgo(4), energy: "low" }),
    ];
    expect(checkLowScale(entries, "energy", 7, 4, 3)).toBeNull();
  });

  it("ignores entries outside the 7-day window", () => {
    const entries = [
      entry({ loggedAt: daysAgo(1), energy: "low" }),
      entry({ loggedAt: daysAgo(2), energy: "low" }),
      // Outside the window — must not count toward the "last 4", even
      // though including it would reach the needed-3 threshold.
      entry({ loggedAt: daysAgo(30), energy: "low" }),
    ];
    expect(checkLowScale(entries, "energy", 7, 4, 3)).toBeNull();
  });

  it("does not let an entry with the field left blank occupy a slot in the last-N window", () => {
    // An owner logging just "limping today" with energy left unset must
    // not crowd out the entries that actually recorded energy.
    const entries = [
      entry({ loggedAt: daysAgo(1), energy: "low" }),
      entry({ loggedAt: daysAgo(2), energy: null, limping: true }),
      entry({ loggedAt: daysAgo(3), energy: "low" }),
      entry({ loggedAt: daysAgo(4), energy: "low" }),
      entry({ loggedAt: daysAgo(5), energy: "normal" }),
    ];
    const match = checkLowScale(entries, "energy", 7, 4, 3);
    expect(match).not.toBeNull();
    // Should be "3 of the last 4" energy-bearing entries, not diluted by
    // the blank one.
    expect(match!.reasoning.value).toContain("3 of the last 4");
  });

  it("works the same way for appetite", () => {
    const entries = [
      entry({ loggedAt: daysAgo(1), appetite: "low" }),
      entry({ loggedAt: daysAgo(2), appetite: "low" }),
      entry({ loggedAt: daysAgo(3), appetite: "low" }),
      entry({ loggedAt: daysAgo(4), appetite: "normal" }),
    ];
    const match = checkLowScale(entries, "appetite", 7, 4, 3);
    expect(match).not.toBeNull();
    expect(match!.reasoning.signal).toBe("low_appetite");
  });
});

describe("checkDiarrhea", () => {
  // 2 of the last 3 entries, within 5 days. Soft stool alone must not
  // count — only the literal "diarrhea" value is specific enough.
  it("flags 2 of the last 3 entries as diarrhea", () => {
    const entries = [
      entry({ loggedAt: daysAgo(1), stoolQuality: "diarrhea" }),
      entry({ loggedAt: daysAgo(2), stoolQuality: "normal" }),
      entry({ loggedAt: daysAgo(3), stoolQuality: "diarrhea" }),
    ];
    expect(checkDiarrhea(entries)).not.toBeNull();
  });

  it("does not flag soft stool as diarrhea", () => {
    const entries = [
      entry({ loggedAt: daysAgo(1), stoolQuality: "soft" }),
      entry({ loggedAt: daysAgo(2), stoolQuality: "soft" }),
      entry({ loggedAt: daysAgo(3), stoolQuality: "soft" }),
    ];
    expect(checkDiarrhea(entries)).toBeNull();
  });

  it("does not flag a single diarrhea entry", () => {
    const entries = [
      entry({ loggedAt: daysAgo(1), stoolQuality: "diarrhea" }),
      entry({ loggedAt: daysAgo(2), stoolQuality: "normal" }),
    ];
    expect(checkDiarrhea(entries)).toBeNull();
  });

  it("ignores entries outside the 5-day window", () => {
    const entries = [
      entry({ loggedAt: daysAgo(1), stoolQuality: "diarrhea" }),
      entry({ loggedAt: daysAgo(6), stoolQuality: "diarrhea" }),
    ];
    expect(checkDiarrhea(entries)).toBeNull();
  });
});

describe("checkVomitingSameDaySevere", () => {
  // Merck: "more than two episodes in a 24-hour period" is the severe
  // threshold — modeled here as 2+ on the same calendar day.
  it("flags 2+ vomiting entries logged on the same day", () => {
    const sameDay = daysAgo(1);
    const entries = [
      entry({ loggedAt: sameDay, vomiting: true }),
      entry({ loggedAt: new Date(sameDay.getTime() + 60 * 60 * 1000), vomiting: true }),
    ];
    const match = checkVomitingSameDaySevere(entries);
    expect(match).not.toBeNull();
    expect(match!.confidence).toBe("medium");
  });

  it("is high confidence at 3+ same-day episodes", () => {
    const sameDay = daysAgo(1);
    const entries = [
      entry({ loggedAt: sameDay, vomiting: true }),
      entry({ loggedAt: new Date(sameDay.getTime() + 1 * 60 * 60 * 1000), vomiting: true }),
      entry({ loggedAt: new Date(sameDay.getTime() + 2 * 60 * 60 * 1000), vomiting: true }),
    ];
    expect(checkVomitingSameDaySevere(entries)!.confidence).toBe("high");
  });

  it("does not flag one vomiting episode per day across several days", () => {
    const entries = [
      entry({ loggedAt: daysAgo(1), vomiting: true }),
      entry({ loggedAt: daysAgo(2), vomiting: true }),
      entry({ loggedAt: daysAgo(3), vomiting: true }),
    ];
    expect(checkVomitingSameDaySevere(entries)).toBeNull();
  });
});

describe("checkVomitingRecurring", () => {
  // VCA: "vomiting even once a week may indicate a disease" — modeled as
  // 2+ separate days within a 7-day window (not same-day frequency).
  it("flags vomiting logged on 2 separate days", () => {
    const entries = [
      entry({ loggedAt: daysAgo(1), vomiting: true }),
      entry({ loggedAt: daysAgo(4), vomiting: true }),
    ];
    expect(checkVomitingRecurring(entries)).not.toBeNull();
  });

  it("does not flag multiple same-day episodes as recurring across days", () => {
    const sameDay = daysAgo(1);
    const entries = [
      entry({ loggedAt: sameDay, vomiting: true }),
      entry({ loggedAt: new Date(sameDay.getTime() + 60 * 60 * 1000), vomiting: true }),
      entry({ loggedAt: new Date(sameDay.getTime() + 2 * 60 * 60 * 1000), vomiting: true }),
    ];
    // Three episodes, but all on the same calendar day — zero distinct
    // additional days, so this is the same-day check's job, not this one.
    expect(checkVomitingRecurring(entries)).toBeNull();
  });

  it("ignores vomiting outside the 7-day window", () => {
    const entries = [
      entry({ loggedAt: daysAgo(1), vomiting: true }),
      entry({ loggedAt: daysAgo(10), vomiting: true }),
    ];
    expect(checkVomitingRecurring(entries)).toBeNull();
  });
});

describe("checkLimping", () => {
  // VCA: lameness persisting more than a day warrants a look — modeled
  // as 2+ entries within a 4-day window.
  it("flags 2+ limping entries within 4 days", () => {
    const entries = [
      entry({ loggedAt: daysAgo(1), limping: true }),
      entry({ loggedAt: daysAgo(3), limping: true }),
    ];
    expect(checkLimping(entries)).not.toBeNull();
  });

  it("does not flag a single limping entry", () => {
    const entries = [entry({ loggedAt: daysAgo(1), limping: true })];
    expect(checkLimping(entries)).toBeNull();
  });

  it("ignores a limping entry just outside the 4-day window", () => {
    const entries = [
      entry({ loggedAt: daysAgo(1), limping: true }),
      entry({ loggedAt: daysAgo(5), limping: true }),
    ];
    expect(checkLimping(entries)).toBeNull();
  });
});
