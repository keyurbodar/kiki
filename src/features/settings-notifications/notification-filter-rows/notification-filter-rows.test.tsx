import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CompletionRows, OriginRows } from "./notification-filter-rows";
import {
  completionKinds,
  enabledKindsSummary,
  isOriginOnByDefault,
} from "./notification-kinds";

afterEach(cleanup);

describe("enabledKindsSummary", () => {
  it("reads Off, all, or the enabled kinds", () => {
    expect(enabledKindsSummary([])).toBe("Off");
    expect(enabledKindsSummary(["Mentioned you", "Failed"])).toBe(
      "Enabled for all completions",
    );
    expect(enabledKindsSummary(["Failed"])).toBe("Enabled for failed");
    expect(enabledKindsSummary(["A", "B", "C", "D"])).toBe(
      "Enabled for a, b, 2 others",
    );
  });
});

describe("origins", () => {
  it("only web is on by default", () => {
    expect(isOriginOnByDefault("web")).toBe(true);
    expect(isOriginOnByDefault("slack")).toBe(false);
  });
});

describe("CompletionRows", () => {
  it("renders a labelled switch per kind and reports changes", () => {
    const onChange = vi.fn();
    render(
      <div>
        <CompletionRows
          kinds={completionKinds}
          rowId={(kind) => `row-${kind}`}
          checked={(kind) => kind === "mention"}
          onChange={onChange}
          ariaPrefix="Slack DM when"
        />
      </div>,
    );
    expect(screen.getByText("PR merged")).toBeTruthy();
    const failed = screen.getByRole("switch", { name: "Slack DM when failed" });
    fireEvent.click(failed);
    expect(onChange).toHaveBeenCalledWith("error", true);
    expect(document.getElementById("row-mention")).not.toBeNull();
  });
});

describe("OriginRows", () => {
  it("labels each origin switch", () => {
    render(
      <div>
        <OriginRows
          checked={(origin) => origin === "web"}
          onChange={() => {}}
          ariaPrefix="Notify for"
        />
      </div>,
    );
    expect(
      screen.getByRole("switch", { name: "Notify for threads from Linear" }),
    ).toBeTruthy();
    expect(screen.getAllByRole("switch")).toHaveLength(7);
  });
});
