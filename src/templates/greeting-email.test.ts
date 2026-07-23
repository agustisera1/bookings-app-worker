import { describe, expect, it } from "vitest";
import { greetingEmailHtml } from "./greeting-email.js";

describe("greetingEmailHtml", () => {
  it("greets the user by the local part of their email", () => {
    const html = greetingEmailHtml({
      processorKey: "greet-user",
      email: "john.smith@example.com",
    });
    expect(html).toContain("Hi john.smith,");
    expect(html).toContain("Welcome Aboard");
  });
});
