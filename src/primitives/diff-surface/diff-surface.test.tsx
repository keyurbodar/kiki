import { RegistryProvider } from "@effect/atom-react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DiffBinarySize,
  DiffFileHeader,
  DiffGroupHeader,
  DiffLoadingBody,
  DiffSurface,
} from "./diff-surface";
import { SAMPLE_PATCH } from "./diff-surface.fixtures";
import { parsePatch } from "./diff-surface-model";
import { buildDiffOptions } from "./diff-surface-options";
import { diffSurfaceCSS } from "./diff-surface-styles";

afterEach(cleanup);

const wrap = (node: ReactNode) =>
  render(<RegistryProvider>{node}</RegistryProvider>);

const sampleFile = (index: number) => {
  const source = parsePatch(SAMPLE_PATCH);
  if (source.kind !== "files" || source.files[index] === undefined)
    throw new Error("bad fixture");
  return source.files[index];
};

describe("DiffFileHeader", () => {
  it("shows the base name, directory and change counts", () => {
    wrap(
      <DiffFileHeader
        fileDiff={sampleFile(0)}
        collapsed={false}
        atCardEdge={false}
        generated={false}
      />,
    );
    expect(screen.getByText("main.ts").className).toContain("text-foreground");
    expect(screen.getByText("src/app/").className).toContain(
      "@max-md/file-header:hidden",
    );
    expect(screen.getByText("+2").className).toBe("text-diff-add");
    expect(screen.getByText("−1").className).toBe("text-diff-del");
    expect(screen.getByTitle("src/app/main.ts")).toBeTruthy();
  });

  it("labels new files and toggles collapse", () => {
    const onToggle = vi.fn();
    wrap(
      <DiffFileHeader
        fileDiff={sampleFile(1)}
        collapsed
        atCardEdge
        generated
        onToggle={onToggle}
      />,
    );
    expect(screen.getByText("added")).toBeTruthy();
    expect(screen.getByText("generated")).toBeTruthy();
    const header = screen
      .getByText("README.md")
      .closest("[data-slot=diff-file-header]");
    expect(header?.className).toContain("pl-1.5");
    expect(header?.className).not.toContain("border-b-hairline");
    fireEvent.click(screen.getByRole("button", { name: "Expand file" }));
    expect(onToggle).toHaveBeenCalledWith("README.md");
  });

  it("disables the placeholder toggle and mutes hidden categories", () => {
    wrap(
      <DiffFileHeader
        fileDiff={sampleFile(0)}
        collapsed={false}
        atCardEdge={false}
        generated={false}
        category="tests"
        placeholder
      />,
    );
    const button = screen.getByRole("button", {
      name: "Collapse file",
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.closest("[data-slot=diff-file-header]")?.className).toContain(
      "text-muted-foreground-3",
    );
  });
});

it("renders a group header with its count and toggle", () => {
  const onToggle = vi.fn();
  wrap(
    <DiffGroupHeader
      group={{
        id: "g",
        category: "tests",
        filePaths: ["a", "b"],
        additions: 3,
        deletions: 1,
      }}
      count={2}
      hidden={false}
      expanded={false}
      onToggle={onToggle}
    />,
  );
  expect(screen.getByRole("heading").textContent).toBe("Tests · 2 files");
  const button = screen.getByRole("button", { name: "Expand tests" });
  expect(button.getAttribute("aria-expanded")).toBe("false");
  fireEvent.click(button);
  expect(onToggle).toHaveBeenCalledOnce();
  expect(screen.getByText("+3").className).toBe("text-diff-add");
});

it("shows binary sizes with the delta", () => {
  render(<DiffBinarySize oldSizeBytes={1024} newSizeBytes={2048} />);
  expect(screen.getByTitle("1,024 → 2,048 bytes").textContent).toBe(
    "2.0 KB(+1.0 KB)",
  );
});

it("renders skeleton rows inside a labelled loading region", () => {
  render(<DiffLoadingBody height={78} />);
  expect(screen.getByRole("status").textContent).toBe("Loading diff");
});

describe("DiffSurface", () => {
  it("falls back to raw text with the reason and source link", () => {
    wrap(
      <DiffSurface
        patch="not a patch"
        errorHref="https://example.com/pr"
        disableWorker
      />,
    );
    expect(
      screen.getByText(/Unsupported patch format, showing raw text/),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "view on GitHub" }).getAttribute("href"),
    ).toBe("https://example.com/pr");
    expect(screen.getByText("not a patch").tagName).toBe("PRE");
    const root = screen
      .getByText("not a patch")
      .closest("[data-slot=diff-surface]");
    expect(root?.className).toContain("diff-surface");
  });
});

describe("options", () => {
  it("builds Capy's default and minimal CodeView options", () => {
    const base = {
      themeType: "dark" as const,
      diffStyle: "split" as const,
      overflow: "wrap" as const,
      expandUnchanged: false,
      itemCards: true,
      lineHeight: 16,
      scrollbarGutter: 8,
      errorHref: undefined,
      reviewRangeSide: undefined,
    };
    const full = buildDiffOptions({ ...base, variant: "default" });
    expect(full).toMatchObject({
      theme: { light: "capy-light", dark: "capy-dark" },
      lineDiffType: "word-alt",
      stickyHeaders: true,
      hunkSeparators: undefined,
      itemMetrics: {
        diffHeaderHeight: 36,
        hunkSeparatorHeight: 24,
        lineHeight: 16,
        paddingBottom: 8,
      },
      layout: { paddingTop: 12, paddingBottom: 12, gap: 12 },
    });
    const minimal = buildDiffOptions({
      ...base,
      variant: "minimal",
      itemCards: false,
    });
    expect(minimal).toMatchObject({
      stickyHeaders: false,
      hunkSeparators: "simple",
      itemMetrics: { diffHeaderHeight: 0 },
      layout: { gap: 0 },
    });
    expect(minimal.unsafeCSS).toContain("[data-separator] {\n  display: none;");
  });

  it("renders a diff error with the source link", () => {
    const { renderError } = buildDiffOptions({
      themeType: "light",
      diffStyle: "unified",
      overflow: "wrap",
      variant: "default",
      expandUnchanged: false,
      itemCards: false,
      lineHeight: 16,
      scrollbarGutter: 0,
      errorHref: "https://example.com",
      reviewRangeSide: undefined,
    });
    const element = renderError(new Error("boom"), { name: "a.ts" });
    expect(element.textContent).toBe(
      "Could not render this diff, view on GitHuba.ts\nboom",
    );
  });

  it("adds review-range rules for the reviewed side only", () => {
    expect(diffSurfaceCSS("default", undefined)).not.toContain(
      "--review-range-top",
    );
    const css = diffSurfaceCSS("default", "additions");
    expect(css).toContain("--review-range-top");
    expect(css).toContain("[data-deletions] [data-line][data-selected-line]");
  });
});
