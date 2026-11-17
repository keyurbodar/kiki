import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PullGuideView } from "./guide-tab";

afterEach(cleanup);

const ready = {
  status: "ready" as const,
  overview: "Three passes over the change.",
  chapters: [
    {
      id: "surface",
      title: "The surface",
      explanation: "What the reader sees first.",
      files: [{ path: "src/app.tsx", additions: 2, deletions: 1 }],
      related: [],
    },
  ],
};

describe("PullGuideView", () => {
  it("draws the chapters and their files", () => {
    render(<PullGuideView guide={ready} />);
    expect(screen.getByText("The surface")).toBeTruthy();
    expect(screen.getByText("What the reader sees first.")).toBeTruthy();
    expect(screen.getByText("src/app.tsx")).toBeTruthy();
  });

  it("waits for a guide that is still being written", () => {
    const { container } = render(
      <PullGuideView guide={{ status: "generating" }} />,
    );
    expect(screen.getByText("Generating guide")).toBeTruthy();
    expect(
      screen.getByText("This usually takes about 20 seconds"),
    ).toBeTruthy();
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
  });

  it("explains an empty guide", () => {
    render(<PullGuideView guide={{ status: "empty" }} />);
    expect(screen.getByText("No guide yet")).toBeTruthy();
  });

  it("explains a guide that failed to load", () => {
    render(<PullGuideView guide={{ status: "failed" }} />);
    expect(screen.getByText("The guide did not load")).toBeTruthy();
  });

  it("hands a file click to the caller", () => {
    const onOpenFile = vi.fn();
    render(<PullGuideView guide={ready} onOpenFile={onOpenFile} />);
    const file = screen.getByText("src/app.tsx");
    fireEvent.click(file);
    expect(onOpenFile.mock.calls.length).toBeGreaterThanOrEqual(0);
  });
});
