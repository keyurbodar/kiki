import { Field } from "@base-ui/react/field";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Input } from "@/primitives/input";
import { Label } from "./label";

afterEach(cleanup);

describe("Label", () => {
  it("labels a field control", () => {
    render(
      <Field.Root>
        <Label>Email</Label>
        <Input />
      </Field.Root>,
    );
    const input = screen.getByLabelText("Email");
    expect(input.dataset.slot).toBe("input");
    const label = screen.getByText("Email");
    expect(label.dataset.slot).toBe("label");
    expect(label.className).toContain("font-medium");
  });
});
