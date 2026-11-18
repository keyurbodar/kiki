import { useCallback, useRef, useState } from "react";
import { cx } from "@/components/view-toolbar";
import type { PullSection } from "@/features/pulls/pulls-page/model";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/primitives/collapsible";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/primitives/context-menu";
import { MenuItem } from "@/primitives/menu";
import { PullRow } from "./pull-row";
import { CheckGlyph, ChevronDownGlyph } from "./pull-row/pull-icons";

function SectionHeader({
  section,
  open,
  onToggle,
}: {
  section: PullSection;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <CollapsibleTrigger
      data-track-owner="features/pulls/pulls-list.tsx#PullsList:CollapsibleTrigger.1"
      tone="section"
      block
      showChevron={false}
      onClick={onToggle}
    >
      <span className="flex w-4 shrink-0 items-center justify-center">
        <ChevronDownGlyph
          className={cx(
            "size-(--icon-xs) shrink-0 text-muted-foreground-3 transition-transform duration-100",
            open ? "rotate-0" : "-rotate-90",
          )}
        />
      </span>
      {section.label}
      {section.showCount ? (
        <span className="font-normal text-muted-foreground-2 tabular-nums">
          {section.members.length}
        </span>
      ) : null}
    </CollapsibleTrigger>
  );
}

/** Sectioned pull request list (Capy's PullsList). */
export function PullsList({
  sections,
  now,
  selectedId,
  collapsed,
  onToggleSection,
  loading,
  emptyText,
  pinned = [],
  onTogglePin,
}: {
  sections: ReadonlyArray<PullSection>;
  now: number;
  selectedId?: string;
  collapsed: ReadonlyArray<string>;
  onToggleSection: (id: string) => void;
  loading?: boolean;
  emptyText: string;
  /** Ids in the page's pinned section; the row menu offers Pin or Unpin. */
  pinned?: ReadonlyArray<string>;
  onTogglePin?: (id: string) => void;
}) {
  const [checked, setChecked] = useState<ReadonlyArray<string>>([]);
  const selectionMode = checked.length > 0;
  const longestCode = Math.max(
    3,
    ...sections.flatMap((section) =>
      section.members.map((pull) => 1 + String(pull.number).length),
    ),
  );
  const observerRef = useRef<ResizeObserver | null>(null);
  const attachList = useCallback((root: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (root === null) return;
    const measure = () => {
      root.style.setProperty("--pull-code-width", "max-content");
      let widest = 0;
      for (const cell of root.querySelectorAll("[data-pull-code-measure]")) {
        widest = Math.max(widest, cell.getBoundingClientRect().width);
      }
      if (widest > 0) {
        root.style.setProperty("--pull-code-width", `${Math.ceil(widest)}px`);
      }
    };
    measure();
    observerRef.current = new ResizeObserver(measure);
    observerRef.current.observe(root);
  }, []);
  if (sections.length === 0) {
    return loading === true ? (
      <div
        className="flex flex-col px-2 pt-1"
        role="status"
        aria-label="Loading pull requests"
      >
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex h-11 items-center gap-2 px-2">
            <span className="size-3 shrink-0 rounded-full bg-section" />
            <span className="h-2.5 flex-1 rounded bg-section" />
          </div>
        ))}
      </div>
    ) : (
      <div className="flex flex-1 items-center justify-center py-16 text-sm font-normal text-muted-foreground-2">
        {emptyText}
      </div>
    );
  }
  return (
    <div
      ref={attachList}
      className="@container/list flex flex-col px-2 pt-1"
      style={{ "--pull-code-width": `${longestCode + 1}ch` } as never}
    >
      {sections.map((section, index) => {
        const open = !collapsed.includes(section.id);
        return (
          <div key={section.id} className={cx(index > 0 && "mt-0.5")}>
            <Collapsible open={open}>
              <ContextMenu>
                <ContextMenuTrigger className="block">
                  <SectionHeader
                    section={section}
                    open={open}
                    onToggle={() => onToggleSection(section.id)}
                  />
                </ContextMenuTrigger>
                <ContextMenuContent className="w-52">
                  <MenuItem onClick={() => onToggleSection(section.id)}>
                    <span className="flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted">
                      <ChevronDownGlyph />
                    </span>
                    {open ? "Collapse" : "Expand"}
                  </MenuItem>
                  {section.members.length === 0 ? null : (
                    <MenuItem
                      onClick={() =>
                        setChecked((current) => [
                          ...new Set([
                            ...current,
                            ...section.members.map((pull) => pull.id),
                          ]),
                        ])
                      }
                    >
                      <span className="flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted">
                        <CheckGlyph />
                      </span>
                      Select all
                    </MenuItem>
                  )}
                </ContextMenuContent>
              </ContextMenu>
              <CollapsiblePanel className="-m-0.5 p-0.5">
                {section.members.length === 0 ? (
                  <div className="flex h-11 items-center pl-10 text-sm font-normal text-muted-foreground-3">
                    No pull requests
                  </div>
                ) : (
                  <ul className="flex flex-col pt-1">
                    {section.members.map((pull, at) => (
                      <li
                        key={pull.id}
                        className="-m-0.5 p-0.5"
                        aria-posinset={at + 1}
                        aria-setsize={section.members.length}
                      >
                        <PullRow
                          pull={pull}
                          now={now}
                          pinned={pinned.includes(pull.id)}
                          onTogglePin={onTogglePin}
                          selected={selectedId === pull.id}
                          checked={checked.includes(pull.id)}
                          selectionMode={selectionMode}
                          onCheck={() =>
                            setChecked((current) =>
                              current.includes(pull.id)
                                ? current.filter((id) => id !== pull.id)
                                : [...current, pull.id],
                            )
                          }
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </CollapsiblePanel>
            </Collapsible>
          </div>
        );
      })}
    </div>
  );
}
