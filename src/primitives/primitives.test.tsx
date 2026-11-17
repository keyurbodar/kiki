import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Badge } from "@/primitives/badge";
import { Button, buttonVariants } from "@/primitives/button";
import { Card, CardTitle } from "@/primitives/card";
import { Checkbox } from "@/primitives/checkbox";
import { Switch } from "@/primitives/switch";

afterEach(cleanup);

describe("primitive contract", () => {
  it("renders Capy's data-slot names", () => {
    render(
      <>
        <Button>Run</Button>
        <Badge>3</Badge>
        <Card>
          <CardTitle>Title</CardTitle>
        </Card>
        <Checkbox aria-label="pick" />
        <Switch aria-label="toggle" />
      </>,
    );
    expect(screen.getByText("Run").dataset.slot).toBe("button");
    expect(screen.getByText("3").dataset.slot).toBe("badge");
    expect(screen.getByText("Title").dataset.slot).toBe("card-title");
    expect(screen.getByLabelText("pick").dataset.slot).toBe("checkbox");
    expect(screen.getByLabelText("toggle").dataset.slot).toBe("switch");
  });

  it("accepts every Button variant key from the bundle", () => {
    expect(() =>
      buttonVariants({
        variant: "segmented",
        intent: "lime",
        size: "icon-sm-narrow",
        shape: "segment-end",
      }),
    ).not.toThrow();
  });

  it("lets Button render as another element", () => {
    render(<Button render={<a href="/new">New</a>} />);
    expect(screen.getByText("New").tagName).toBe("A");
    expect(screen.getByText("New").dataset.slot).toBe("button");
  });
});
