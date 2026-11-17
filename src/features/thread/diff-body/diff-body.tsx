import { cx } from "class-variance-authority";
import { useEffect, useRef, useState } from "react";
import { DiffCards } from "@/components/diff-cards";
import {
  type DiffSelection,
  DiffSelectionToolbar,
} from "@/components/diff-selection-toolbar";
import { useDiffPreferences } from "@/lib/diff-preferences";
import { Button } from "@/primitives/button";
import { DiffSurface } from "@/primitives/diff-surface";

const collapsedHeight = 352;

export type DiffCardProps = {
  patch: string;
  path: string;
  additions?: number;
  deletions?: number;
  openDiff?: () => void;
  expandable?: boolean;
  initiallyOpen?: boolean;
};

/** Read the first hunk's new-file start line for "open at line" actions. */
export function diffStartLine(patch: string): number | undefined {
  const match = patch.match(/^@@ -\d+(?:,\d+)? \+(\d+)/m);
  if (match === null || match[1] === "0") return undefined;
  return Number(match[1]);
}

export function DiffBodyCard({
  patch,
  path,
  additions,
  deletions,
  openDiff,
  expandable = true,
  initiallyOpen = false,
}: DiffCardProps) {
  const { preferences } = useDiffPreferences();
  const [open, setOpen] = useState(initiallyOpen);
  const [toggleable, setToggleable] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<DiffSelection>();

  useEffect(() => {
    const element = bodyRef.current;
    if (element === null) return;
    const measure = () => setToggleable(element.scrollHeight > collapsedHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const readSelection = () => {
      const element = bodyRef.current;
      const current = window.getSelection();
      const text = current?.toString() ?? "";
      const range = current?.rangeCount ? current.getRangeAt(0) : undefined;
      if (
        text.length === 0 ||
        range === undefined ||
        element === null ||
        !element.contains(range.startContainer) ||
        !element.contains(range.endContainer)
      ) {
        setSelection(undefined);
        return;
      }
      const rect = range.getBoundingClientRect();
      setSelection({
        text,
        rect: { top: rect.top, height: rect.height },
        focus: { x: rect.right },
      });
    };
    document.addEventListener("selectionchange", readSelection);
    return () => document.removeEventListener("selectionchange", readSelection);
  }, []);

  const dimmed = !open && toggleable && (expandable || openDiff !== undefined);
  const clipped = !dimmed && !toggleable;
  const showToggle = dimmed || open;
  const toggle = (next: boolean) => {
    setOpen(next);
    setSelection(undefined);
  };
  const label = path.slice(path.lastIndexOf("/") + 1);
  return (
    <div data-slot="diff-card" className="flex flex-col gap-2">
      <div
        ref={bodyRef}
        data-diff-card-scroll={dimmed ? "" : undefined}
        className={cx(
          "relative w-full transition-[height] motion-reduce:transition-none",
          open ? "max-h-none" : "max-h-88",
          clipped &&
            "overflow-clip rounded-(--radius-card) [overflow-clip-margin:var(--spacing-hairline)]",
          dimmed && "overflow-y-auto rounded-(--radius-card)",
        )}
      >
        <DiffSurface
          data-slot="diff-body"
          patch={patch}
          diffStyle={preferences.diffStyle}
          overflow={preferences.diffWrap ? "wrap" : "scroll"}
          variant="minimal"
          className="rounded-(--radius-card)"
          style={open ? undefined : { maxHeight: collapsedHeight }}
        />
        {dimmed ? (
          <>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
            <div className="absolute inset-x-0 bottom-2 flex justify-center">
              <Button
                variant="solid"
                size="sm"
                data-diff-card-toggle
                onClick={() => toggle(true)}
              >
                {expandable ? "View full diff" : "Open in Diff"}
              </Button>
            </div>
          </>
        ) : null}
      </div>
      {showToggle ? (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="solid"
            size="sm"
            data-diff-card-toggle
            onClick={() => toggle(false)}
          >
            Collapse
          </Button>
          {openDiff !== undefined ? (
            <Button variant="link" size="auto-xs" onClick={openDiff}>
              Open in Diff
            </Button>
          ) : null}
        </div>
      ) : null}
      {selection !== undefined ? (
        <DiffSelectionToolbar
          selection={selection}
          onComment={() => setSelection(undefined)}
          commentAction={{
            label: "Comment",
            run: () => setSelection(undefined),
          }}
        />
      ) : null}
      <span className="sr-only">
        {label} +{additions ?? 0} -{deletions ?? 0}
      </span>
    </div>
  );
}

export function DiffBody({
  patches,
  openDiff,
}: {
  patches: ReadonlyArray<DiffCardProps>;
  openDiff?: (path: string) => void;
}) {
  return (
    <DiffCards data-slot="diff-cards" className="flex flex-col gap-2">
      {patches.map((patch) => (
        <DiffBodyCard
          key={patch.path}
          {...patch}
          openDiff={
            openDiff === undefined ? undefined : () => openDiff(patch.path)
          }
        />
      ))}
    </DiffCards>
  );
}
