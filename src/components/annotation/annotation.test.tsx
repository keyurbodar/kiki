import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AnnotateToggle,
  AnnotationIndex,
  AnnotationPanel,
  AnnotationPin,
  AnnotationRegion,
  AnnotationRow,
  AnnotationSend,
} from "./annotation";

afterEach(cleanup);

describe("AnnotationPin", () => {
  it("renders a passive span when there is no open handler", () => {
    const { container } = render(<AnnotationPin n={2} x="10%" y={20} />);
    const pin = container.querySelector('[data-slot="annotation-pin"]');
    expect(pin?.tagName).toBe("SPAN");
    expect(pin?.getAttribute("data-active")).toBeNull();
    expect(pin?.textContent).toBe("2");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders a labelled button when openable and reports clicks", () => {
    const onOpen = vi.fn();
    const { container, rerender } = render(
      <AnnotationPin n={2} x={10} y={20} onOpen={onOpen} />,
    );
    const pin = screen.getByRole("button", { name: "Comment 2" });
    expect(container.querySelector('[data-slot="annotation-pin"]')).toBe(pin);
    expect(pin.getAttribute("data-active")).toBeNull();
    fireEvent.click(pin);
    expect(onOpen).toHaveBeenCalledTimes(1);

    rerender(
      <AnnotationPin n={4} x={10} y={20} active onOpen={onOpen} label="Pin" />,
    );
    const active = screen.getByRole("button", { name: "Pin 4" });
    expect(active.getAttribute("data-active")).toBe("");
  });
});

describe("AnnotationRegion and AnnotationIndex", () => {
  it("expose their slot and active state", () => {
    const { container } = render(
      <>
        <AnnotationRegion />
        <AnnotationRegion active />
        <AnnotationIndex n={3} />
        <AnnotationIndex n={4} active />
      </>,
    );
    const regions = container.querySelectorAll(
      '[data-slot="annotation-region"]',
    );
    expect(regions).toHaveLength(2);
    expect(regions[0]?.hasAttribute("data-active")).toBe(false);
    expect(regions[1]?.hasAttribute("data-active")).toBe(true);
    const indices = container.querySelectorAll(
      '[data-slot="annotation-index"]',
    );
    expect([...indices].map((index) => index.textContent)).toEqual(["3", "4"]);
    expect(indices[0]?.hasAttribute("data-active")).toBe(false);
    expect(indices[1]?.hasAttribute("data-active")).toBe(true);
  });
});

describe("AnnotationRow", () => {
  it("selects and removes a comment with labelled buttons", () => {
    const onSelect = vi.fn();
    const onRemove = vi.fn();
    const { container } = render(
      <AnnotationRow
        n={3}
        note="Check the corner"
        meta="shot.png at 1:05"
        selectLabel="Edit comment"
        onSelect={onSelect}
        onRemove={onRemove}
      />,
    );
    expect(
      container.querySelector('[data-slot="annotation-row"]'),
    ).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Edit comment 3" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Remove comment 3" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(screen.getByText("shot.png at 1:05")).toBeTruthy();
  });

  it("does not add a select button without a handler", () => {
    render(<AnnotationRow n={1} note="plain" />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("plain")).toBeTruthy();
  });
});

describe("AnnotationPanel", () => {
  it("renders its labelled section and hides an empty count", () => {
    const { container, rerender } = render(<AnnotationPanel count={0} />);
    const panel = screen.getByRole("region", { name: "Comments" });
    expect(container.querySelector('[data-slot="annotation-panel"]')).toBe(
      panel,
    );
    expect(panel.textContent).not.toContain("0");
    expect(screen.queryByRole("button")).toBeNull();

    rerender(<AnnotationPanel count={2} footer={<span>Footer</span>} />);
    expect(panel.textContent).toContain("2");
    expect(screen.getByText("Footer")).toBeTruthy();
  });

  it("calls onHide from the labelled button", () => {
    const onHide = vi.fn();
    render(<AnnotationPanel count={1} onHide={onHide} />);
    fireEvent.click(screen.getByRole("button", { name: "Hide comments" }));
    expect(onHide).toHaveBeenCalledTimes(1);
  });
});

describe("AnnotationSend and AnnotateToggle", () => {
  it("pluralises the send label and forwards the click", () => {
    const onSend = vi.fn();
    const { rerender } = render(<AnnotationSend count={1} onSend={onSend} />);
    expect(screen.getByRole("button").textContent).toBe("Send 1 comment");
    fireEvent.click(screen.getByRole("button"));
    expect(onSend).toHaveBeenCalledTimes(1);
    rerender(<AnnotationSend count={2} onSend={onSend} />);
    expect(screen.getByRole("button").textContent).toBe("Send 2 comments");
  });

  it("reflects the annotation toggle state", () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <AnnotateToggle on={false} hint="Annotate" onToggle={onToggle} />,
    );
    const toggle = screen.getByRole("button", { name: "Annotate" });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(toggle);
    expect(onToggle).toHaveBeenCalledTimes(1);
    rerender(<AnnotateToggle on hint="Annotate" onToggle={onToggle} />);
    const done = screen.getByRole("button", { name: "Done" });
    expect(done.getAttribute("aria-pressed")).toBe("true");
  });
});
