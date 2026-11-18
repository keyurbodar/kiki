import { describe, expect, it } from "vitest";
import { pageTitle } from "./page-title";

describe("pageTitle", () => {
  it("names the page then the product, as Capy does", () => {
    expect(pageTitle("Issues")).toBe("Issues | Capy");
    expect(pageTitle("Pull requests")).toBe("Pull requests | Capy");
    expect(pageTitle("Page not found")).toBe("Page not found | Capy");
  });
});
