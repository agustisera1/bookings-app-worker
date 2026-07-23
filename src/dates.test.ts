import { describe, expect, it } from "vitest";
import { formatDate, nightsBetween } from "./dates.js";

describe("formatDate", () => {
  it("formats a date as 'Weekday, Mon D, YYYY'", () => {
    const out = formatDate(new Date(2026, 7, 1));
    expect(out).toContain("Aug 1, 2026");
    expect(out).toMatch(/^\w{3}, /);
  });
});

describe("nightsBetween", () => {
  it("counts whole nights between two ISO dates", () => {
    expect(nightsBetween("2026-08-01", "2026-08-04")).toBe(3);
  });

  it("floors to at least one night for a same-day range", () => {
    expect(nightsBetween("2026-08-01", "2026-08-01")).toBe(1);
  });
});
