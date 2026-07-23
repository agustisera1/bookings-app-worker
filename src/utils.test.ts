import { describe, expect, it } from "vitest";
import { formatAddress, formatMoney } from "./utils.js";

describe("formatMoney", () => {
  it("formats a number as USD", () => {
    expect(formatMoney(1000)).toContain("1,000.00");
    expect(formatMoney(1000).startsWith("$")).toBe(true);
  });
});

describe("formatAddress", () => {
  it("joins the present parts with commas", () => {
    expect(formatAddress({ address: "Av 1", city: "BA", country: "AR" })).toBe("Av 1, BA, AR");
  });

  it("skips empty or missing parts", () => {
    expect(formatAddress({ city: "BA" })).toBe("BA");
    expect(formatAddress({ address: "", city: "BA", country: undefined })).toBe("BA");
    expect(formatAddress({})).toBe("");
  });
});
