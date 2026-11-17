import { describe, expect, it } from "vitest";
import { cardVariants } from "./card.tsx";

describe("card variants", () => {
  it("paints Capy's default surface, hairline border and radius", () => {
    const classes = cardVariants({});
    expect(classes).toContain("flex flex-col overflow-clip");
    expect(classes).toContain("bg-card");
    expect(classes).toContain("rounded-(--radius-card)");
    expect(classes).toContain("border-[0.03125rem]");
    expect(classes).toContain("border-(--card-hairline)");
    expect(classes).toContain("shadow-card");
  });

  it("adds the hover and focus treatment for the interactive variant", () => {
    const classes = cardVariants({ variant: "interactive" });
    expect(classes).toContain("hover:bg-card-hover");
    expect(classes).toContain("focus-visible:outline-ring-inset");
    expect(classes).toContain("cursor-pointer");
  });

  it("keeps the panel variant square and borderless below md", () => {
    const classes = cardVariants({ variant: "panel" });
    expect(classes).toContain("bg-panel");
    expect(classes).toContain("md:rounded-(--radius-panel)");
    expect(classes).toContain("md:border-[0.03125rem]");
    expect(classes).not.toContain(" bg-card");
  });

  it("drops the surface for ghost and divides rows", () => {
    expect(cardVariants({ variant: "ghost" })).toContain("bg-transparent");
    expect(cardVariants({ rows: true })).toContain(
      "divide-y-[0.03125rem] divide-border-1",
    );
  });
});
