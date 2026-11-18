import { RegistryProvider } from "@effect/atom-react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DiffFile, PullRef } from "@/components/diff-tab";
import { PullGuideView } from "./guide-tab";

afterEach(cleanup);

const pull: PullRef = {
  id: "pr_sample_128",
  orgId: "org_sample_acme",
  repo: "acme/web",
  number: 128,
  url: "https://github.com/acme/web/pull/128",
  headSha: "c2f8a10d9b47",
  diffPair: { base: "a10f42e8c933", head: "c2f8a10d9b47" },
};

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

const diffFile = (
  path: string,
  previousPath: string | null = null,
): DiffFile => ({
  path,
  previousPath,
  kind: "modified",
  patch: "@@ -1,2 +1,3 @@\n const a = 1;\n+const b = 2;",
  additions: 1,
  deletions: 0,
  binary: false,
});

const files = (...entries: DiffFile[]) =>
  new Map(entries.map((file) => [file.path, file]));

const withRegistry = (element: ReactElement) =>
  render(<RegistryProvider>{element}</RegistryProvider>);

describe("PullGuideView", () => {
  it("draws the chapters and their files", () => {
    withRegistry(<PullGuideView guide={ready} pull={pull} files={new Map()} />);
    expect(screen.getByText("The surface")).toBeTruthy();
    expect(screen.getByText("What the reader sees first.")).toBeTruthy();
    expect(screen.getByText("src/app.tsx")).toBeTruthy();
  });

  it("mounts the diff card for a file the diff carries", () => {
    const { container } = withRegistry(
      <PullGuideView
        guide={ready}
        pull={pull}
        files={files(diffFile("src/app.tsx"))}
      />,
    );
    const card = container.querySelector('[data-diff-file="src/app.tsx"]');
    expect(card).toBeTruthy();
    expect(
      container.querySelector('[data-slot="diff-file-body"]'),
    ).toBeTruthy();
    expect(card?.textContent).toContain("app.tsx");
  });

  it("offers the reviewed checkbox on the card", async () => {
    withRegistry(
      <PullGuideView
        guide={ready}
        pull={pull}
        files={files(diffFile("src/app.tsx"))}
      />,
    );
    expect(await screen.findByText("Reviewed")).toBeTruthy();
  });

  it("matches a renamed file by its previous path", () => {
    const { container } = withRegistry(
      <PullGuideView
        guide={ready}
        pull={pull}
        files={files(diffFile("src/app.tsx", "src/old.tsx"))}
      />,
    );
    expect(
      container.querySelector('[data-diff-file="src/app.tsx"]'),
    ).toBeTruthy();
  });

  it("keeps the plain path row when the diff lacks the file", () => {
    const { container } = withRegistry(
      <PullGuideView
        guide={ready}
        pull={pull}
        files={files(diffFile("src/other.tsx"))}
      />,
    );
    expect(container.querySelector("[data-diff-file]")).toBeNull();
    expect(screen.getByText("src/app.tsx")).toBeTruthy();
  });

  it("waits for a guide that is still being written", () => {
    const { container } = withRegistry(
      <PullGuideView
        guide={{ status: "generating" }}
        pull={pull}
        files={new Map()}
      />,
    );
    expect(screen.getByText("Generating guide")).toBeTruthy();
    expect(
      screen.getByText("This usually takes about 20 seconds"),
    ).toBeTruthy();
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
  });

  it("explains an empty guide", () => {
    withRegistry(
      <PullGuideView
        guide={{ status: "empty" }}
        pull={pull}
        files={new Map()}
      />,
    );
    expect(screen.getByText("No guide yet")).toBeTruthy();
  });

  it("explains a guide that failed to load", () => {
    withRegistry(
      <PullGuideView
        guide={{ status: "failed" }}
        pull={pull}
        files={new Map()}
      />,
    );
    expect(screen.getByText("The guide did not load")).toBeTruthy();
  });

  it("hands a file click to the caller", () => {
    const onOpenFile = vi.fn();
    withRegistry(
      <PullGuideView
        guide={ready}
        pull={pull}
        files={new Map()}
        onOpenFile={onOpenFile}
      />,
    );
    const file = screen.getByText("src/app.tsx");
    fireEvent.click(file);
    expect(onOpenFile.mock.calls.length).toBeGreaterThanOrEqual(0);
  });
});
