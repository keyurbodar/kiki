import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Input } from "@/primitives/input";
import { Label } from "./label";

afterEach(cleanup);

describe("Label", () => {
  it("labels the control named by htmlFor", () => {
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <Input id="email" />
      </>,
    );
    const input = screen.getByLabelText("Email");
    expect(input.id).toBe("email");
    expect(input.dataset.slot).toBe("input");
  });

  it("renders a label slot without a field context", () => {
    render(<Label>Standalone</Label>);
    const label = screen.getByText("Standalone");
    expect(label.tagName).toBe("LABEL");
    expect(label.dataset.slot).toBe("label");
    expect(label.className).toContain("font-medium");
    expect(label.className).toContain("text-foreground");
  });

  it("keeps Capy's single label style for both tones", () => {
    render(
      <>
        <Label tone="muted">Muted</Label>
        <Label tone="strong">Strong</Label>
      </>,
    );
    expect(screen.getByText("Muted").className).toBe(
      screen.getByText("Strong").className,
    );
  });
});
