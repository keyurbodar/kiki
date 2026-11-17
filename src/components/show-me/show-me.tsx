import {
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  ChevronDownSmallGlyph,
  ChevronRightSmallGlyph,
  cx,
} from "@/components/review-mode";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { Icon } from "@/primitives/icon";
import {
  type Box,
  capitalize,
  type FlowLayout,
  type FlowNode,
  groupHeads,
  type LandSide,
  layoutFlow,
  nodeCaption,
  type ShowMeChapter,
  type ShowMeFlowView,
  type ShowMeLine,
  type ShowMeListView,
  type ShowMeView,
  shapeNames,
  signCounts,
  splitField,
  treePrefix,
} from "./model";

type Handlers = {
  readonly chapterOf: (path: string) => ShowMeChapter | undefined;
  readonly onOpenFile: (path: string) => void;
  readonly onLand: (path: string, line: number, side: LandSide) => void;
  readonly onHint: (chapterId: string | null) => void;
};

export type ShowMeCardProps = Handlers & {
  readonly views: ReadonlyArray<ShowMeView>;
  readonly compact?: boolean;
};

const hairlineCard =
  "shadow-[0_0_0_var(--border-width-hairline)_var(--border-2),var(--sh-plate)]";
const hairlineInset =
  "shadow-[inset_0_0_0_var(--border-width-hairline)_var(--border-2)]";
const rowHover =
  "cursor-pointer outline-none transition-shadow duration-100 hover:shadow-[inset_0_0_0_100vmax_var(--secondary)] focus-visible:outline-ring-inset";

function entryTarget(
  entry: Pick<ShowMeLine, "path" | "line" | "sign">,
  { chapterOf, onOpenFile, onLand, onHint }: Handlers,
) {
  const path = entry.path;
  const chapter =
    path === null || entry.sign === "same" ? undefined : chapterOf(path);
  if (path === null) return { chapter, props: undefined };
  const props: ComponentProps<"button"> = {
    type: "button",
    title: `${path}${entry.line === null ? "" : `:${entry.line}`}${chapter === undefined ? "" : ` · chapter ${chapter.number}`}`,
    onPointerEnter: () => onHint(chapter?.id ?? null),
    onPointerLeave: () => onHint(null),
    onFocus: () => onHint(chapter?.id ?? null),
    onBlur: () => onHint(null),
    onClick: () => {
      onHint(null);
      if (entry.line === null) onOpenFile(path);
      else
        onLand(
          path,
          entry.line,
          entry.sign === "removed" ? "deletions" : "additions",
        );
    },
  };
  return { chapter, props };
}

function TargetRow({
  target,
  className,
  style,
  trackOwner,
  children,
}: {
  readonly target: ComponentProps<"button"> | undefined;
  readonly className: string;
  readonly style?: CSSProperties;
  readonly trackOwner?: string;
  readonly children: ReactNode;
}) {
  return target === undefined ? (
    <div className={className} style={style}>
      {children}
    </div>
  ) : (
    <button
      data-track-owner={trackOwner}
      {...target}
      className={className}
      style={style}
    >
      {children}
    </button>
  );
}

function ChapterChip({
  chapter,
}: {
  readonly chapter: ShowMeChapter | undefined;
}) {
  if (chapter === undefined) return null;
  return (
    <span
      className={cx(
        "flex h-4 shrink-0 items-center rounded-sm bg-card px-1 text-2xs text-muted-foreground-2 tabular-nums",
        hairlineInset,
      )}
    >
      {chapter.number}
    </span>
  );
}

export function ShowMeCard({
  views,
  compact = false,
  ...handlers
}: ShowMeCardProps) {
  const [open, setOpen] = useState(true);
  const { added, removed } = signCounts(views);
  return (
    <Card
      className="shrink-0"
      data-show-me={views.map((view) => view.shape).join(" ")}
    >
      <div
        className={cx(
          "@container/show-me flex h-9 items-center gap-1.5 bg-card pr-3 pl-1.5 text-sm transition-shadow duration-200",
          open && "shadow-[0_var(--border-width-hairline)_0_var(--border-1)]",
        )}
      >
        <Button
          data-track-owner="shared/pull-view/show-me.tsx#ShowMeCard:Button.1"
          variant="ghost"
          size="icon-xs"
          aria-label={
            open ? "Collapse before / after" : "Expand before / after"
          }
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <ChevronDownSmallGlyph /> : <ChevronRightSmallGlyph />}
        </Button>
        <span className="text-foreground">Before / after</span>
        <span className="ml-auto flex shrink-0 items-center gap-1 font-medium tabular-nums">
          {added > 0 && <span className="text-diff-add">+{added}</span>}
          {removed > 0 && <span className="text-diff-del">−{removed}</span>}
        </span>
      </div>
      <div
        className={cx(
          "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          {views.map((view, index) => (
            <div
              key={`${view.shape}:${view.title}`}
              className={cx(
                "pb-1.5",
                index > 0 &&
                  "shadow-[inset_0_var(--border-width-hairline)_0_var(--border-1)]",
              )}
            >
              <div className="flex h-9 items-end pr-3 pb-2 pl-3.75 text-xs">
                <span className="truncate text-muted-foreground">
                  {capitalize(view.title)}
                </span>
              </div>
              {view.shape === "flow" ? (
                <FlowView view={view} {...handlers} />
              ) : view.shape === "data_shape" ? (
                <DataShapeList view={view} {...handlers} />
              ) : (
                <LineList
                  lines={view.lines}
                  tree={view.shape === "file_tree"}
                  label={`Before / after, ${shapeNames[view.shape]}: ${view.title}`}
                  compact={compact}
                  {...handlers}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function DataShapeList({
  view,
  ...handlers
}: Handlers & { readonly view: ShowMeListView }) {
  const heads = groupHeads(view.lines);
  return (
    <ul
      aria-label={`Before / after, ${shapeNames.data_shape}: ${view.title}`}
      className="grid grid-cols-[repeat(auto-fill,minmax(18.75rem,1fr))] items-start gap-3 px-3.75 pt-1 pb-2"
    >
      {heads.map((head, group) => {
        const line = view.lines[head];
        if (line === undefined) return null;
        const fields = view.lines
          .slice(head + 1, heads[group + 1] ?? view.lines.length)
          .map((field, offset) => ({ field, at: head + 1 + offset }));
        const target = entryTarget(line, handlers);
        return (
          <li
            key={head}
            className={cx("overflow-hidden rounded-lg bg-card", hairlineCard)}
          >
            <TargetRow
              target={target.props}
              className={cx(
                "group/row flex h-8 w-full items-center gap-2 bg-secondary pr-2.5 pl-3 text-left shadow-[0_var(--border-width-hairline)_0_var(--border-1)] outline-none focus-visible:outline-ring-inset",
                target.props !== undefined && rowHover,
              )}
            >
              {line.sign !== "same" && (
                <span
                  className={cx(
                    "shrink-0 font-mono text-xs",
                    line.sign === "added" ? "text-diff-add" : "text-diff-del",
                  )}
                >
                  {line.sign === "added" ? "+" : "−"}
                </span>
              )}
              <span className="truncate font-mono text-xs font-medium text-foreground">
                {line.text}
              </span>
              {line.note !== null && (
                <span className="truncate text-2xs text-muted-foreground-2">
                  {line.note}
                </span>
              )}
              <span className="min-w-0 flex-1" />
              <ChapterChip chapter={target.chapter} />
            </TargetRow>
            {fields.map(({ field, at }) => {
              const { name, type } = splitField(field.text);
              const fieldTarget = entryTarget(field, handlers);
              return (
                <TargetRow
                  key={at}
                  target={fieldTarget.props}
                  className={cx(
                    "group/row flex min-h-7 w-full items-center gap-2 pr-2.5 text-left shadow-[inset_0_var(--border-width-hairline)_0_var(--border-1)] outline-none first:shadow-none focus-visible:outline-ring-inset",
                    field.sign === "added" && "bg-(--diff-add-wash)",
                    field.sign === "removed" && "bg-(--diff-del-wash)",
                    fieldTarget.props !== undefined &&
                      "cursor-pointer transition-[filter] duration-100 hover:brightness-110",
                  )}
                  style={{
                    paddingLeft: `calc(var(--spacing) * ${3 + Math.max(0, field.depth - 1) * 3.5})`,
                  }}
                >
                  <span
                    className={cx(
                      "w-2.5 shrink-0 font-mono text-xs",
                      field.sign === "added" && "text-diff-add",
                      field.sign === "removed" && "text-diff-del",
                    )}
                  >
                    {field.sign === "added"
                      ? "+"
                      : field.sign === "removed"
                        ? "−"
                        : ""}
                  </span>
                  <span className="flex min-w-0 flex-col py-1">
                    <span className="truncate font-mono text-xs text-foreground">
                      {name}
                    </span>
                    {field.note !== null && (
                      <span className="truncate text-2xs text-muted-foreground-2">
                        {field.note}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1" />
                  {type !== null && (
                    <span className="shrink-0 font-mono text-2xs text-muted-foreground">
                      {type}
                    </span>
                  )}
                  <ChapterChip chapter={fieldTarget.chapter} />
                </TargetRow>
              );
            })}
          </li>
        );
      })}
    </ul>
  );
}

function LineList({
  lines,
  tree,
  label,
  compact,
  ...handlers
}: Handlers & {
  readonly lines: ReadonlyArray<ShowMeLine>;
  readonly tree: boolean;
  readonly label: string;
  readonly compact: boolean;
}) {
  return (
    <div className={cx(compact && "mask-fade-r overflow-x-auto")}>
      <ul className="flex w-max min-w-full flex-col" aria-label={label}>
        {lines.map((line, index) => {
          const prefix = tree
            ? treePrefix(lines, index)
            : "  ".repeat(Math.max(0, line.depth));
          const target = entryTarget(line, handlers);
          const where =
            line.path === null
              ? null
              : `${line.path.split("/").at(-1)}${line.line === null ? "" : ` ${line.line}`}`;
          const rowClass = cx(
            "group/row flex h-5 w-full min-w-0 items-center text-left",
            line.sign === "added" && "bg-(--diff-add-wash)",
            line.sign === "removed" && "bg-(--diff-del-wash)",
            target.props !== undefined && rowHover,
          );
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: lines have no id and keep their order
            <li key={`${index}:${line.text}`} className="contents">
              <TargetRow
                target={target.props}
                trackOwner="shared/pull-view/show-me.tsx#ShowMeCard:button.1"
                className={rowClass}
              >
                <span
                  aria-hidden
                  className={cx(
                    "w-0.75 shrink-0 self-stretch",
                    line.sign === "added" && "bg-diff-add",
                    line.sign === "removed" && "bg-diff-del",
                  )}
                />
                <span
                  aria-hidden
                  className={cx(
                    "w-7 shrink-0 pl-3 font-mono text-code-block select-none",
                    line.sign === "added" && "text-diff-add",
                    line.sign === "removed" && "text-diff-del",
                  )}
                >
                  {line.sign === "added"
                    ? "+"
                    : line.sign === "removed"
                      ? "−"
                      : ""}
                </span>
                <span className="shrink-0 font-mono text-code-block whitespace-pre text-foreground">
                  {prefix}
                  {line.text}
                </span>
                {line.note !== null && !compact ? (
                  <span className="min-w-0 truncate pl-3 text-xs text-muted-foreground-2">
                    {line.note}
                  </span>
                ) : null}
                <span className="min-w-0 flex-1" />
                {where !== null && !compact && (
                  <span className="hidden shrink-0 pl-3 font-mono text-2xs whitespace-nowrap text-muted-foreground-2 tabular-nums group-hover/row:inline group-focus-visible/row:inline">
                    {where}
                  </span>
                )}
                {target.chapter !== undefined && (
                  <span className="mr-3 ml-2 grid h-4 shrink-0 items-center justify-items-end">
                    <span
                      className={cx(
                        "col-start-1 row-start-1 flex h-4 items-center rounded-sm px-1 text-2xs text-muted-foreground-2 tabular-nums transition-opacity duration-100 group-hover/row:opacity-0 group-focus-visible/row:opacity-0",
                        hairlineInset,
                      )}
                    >
                      {target.chapter.number}
                    </span>
                    <span className="col-start-1 row-start-1 text-2xs whitespace-nowrap text-foreground opacity-0 transition-opacity duration-100 group-hover/row:opacity-100 group-focus-visible/row:opacity-100">
                      Chapter {target.chapter.number} →
                    </span>
                  </span>
                )}
                {target.chapter === undefined && where !== null && !compact && (
                  <span className="w-3 shrink-0" />
                )}
              </TargetRow>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export type FlowViewProps = Handlers & { readonly view: ShowMeFlowView };

export function FlowView({ view, ...handlers }: FlowViewProps) {
  const canvas = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<FlowLayout | null>(null);

  useLayoutEffect(() => {
    const root = canvas.current;
    if (root === null) return;
    let frame = 0;
    const measure = () => {
      const sizes = new Map<string, Box>();
      for (const element of root.querySelectorAll<HTMLElement>(
        "[data-flow-node]",
      )) {
        const id = element.dataset.flowNode;
        if (id !== undefined)
          sizes.set(id, { w: element.offsetWidth, h: element.offsetHeight });
      }
      setLayout(layoutFlow(view, sizes));
    };
    const schedule = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measure);
    };
    measure();
    const observer = new ResizeObserver(schedule);
    for (const element of root.querySelectorAll("[data-flow-node]"))
      observer.observe(element);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [view]);

  return (
    <div className="scrollbar-hide overflow-x-auto overflow-y-hidden overscroll-x-none px-3.75 pb-2">
      <div
        ref={canvas}
        className="relative"
        style={{
          width: layout?.width,
          height: layout?.height ?? 0,
          visibility: layout === null ? "hidden" : undefined,
        }}
      >
        {layout !== null && (
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 size-full overflow-visible fill-none stroke-muted-foreground-3"
          >
            {layout.edges.map((edge, index) =>
              edge === null ? null : (
                <g key={`${view.edges[index]?.from}>${view.edges[index]?.to}`}>
                  <path d={edge.d} />
                  <path d={edge.head} />
                </g>
              ),
            )}
          </svg>
        )}
        {view.edges.map((edge, index) => {
          const at = layout?.edges[index]?.labelAt;
          return edge.label === null ? null : (
            <span
              key={`${edge.from}>${edge.to}`}
              aria-hidden
              data-flow-label={index}
              className={cx(
                "absolute flex h-4 -translate-x-1/2 -translate-y-1/2 items-center rounded-full bg-card px-1.5 text-2xs whitespace-nowrap text-muted-foreground",
                hairlineInset,
              )}
              style={at === undefined ? undefined : { left: at[0], top: at[1] }}
            >
              {edge.label}
            </span>
          );
        })}
        <ul
          className="contents"
          aria-label={`Before / after, flow: ${view.title}`}
        >
          {view.nodes.map((node) => (
            <li key={node.id} className="contents">
              <FlowNodeBox
                node={node}
                box={layout?.boxes.get(node.id)}
                {...handlers}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function FlowNodeBox({
  node,
  box,
  ...handlers
}: Handlers & {
  readonly node: FlowNode;
  readonly box: { x: number; y: number } | undefined;
}) {
  const target = entryTarget(node, handlers);
  const caption = nodeCaption(node);
  const className = cx(
    "group/node absolute top-0 left-0 flex w-max max-w-80 items-center gap-2.5 rounded-lg bg-card py-2 pr-2.5 pl-3 text-left outline-none focus-visible:outline-ring",
    hairlineCard,
    node.sign === "added" &&
      "shadow-[0_0_0_var(--border-width-hairline)_var(--diff-add),var(--sh-plate)]",
    node.sign === "removed" &&
      "shadow-[0_0_0_var(--border-width-hairline)_var(--diff-del),var(--sh-plate)]",
    target.props !== undefined &&
      "cursor-pointer transition-[filter] duration-100 hover:brightness-110",
  );
  const style = box === undefined ? undefined : { left: box.x, top: box.y };
  const content = (
    <>
      {node.decision && (
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
          <Icon name="arrow-split-right" size="sm" />
        </span>
      )}
      <span className="flex min-w-0 flex-col gap-0.5">
        {caption !== null && (
          <span className="flex min-w-0 items-center gap-1.5 text-2xs leading-none text-muted-foreground-2">
            {node.sign !== "same" && (
              <span
                className={cx(
                  "size-1.5 shrink-0 rounded-full",
                  node.sign === "added" ? "bg-diff-add" : "bg-diff-del",
                )}
              />
            )}
            <span className="truncate">{caption}</span>
          </span>
        )}
        <span
          data-flow-code
          className={cx(
            "min-w-0 truncate text-xs leading-snug text-foreground",
            node.decision ? "font-medium" : "font-mono",
            node.sign === "removed" &&
              "text-muted-foreground line-through decoration-diff-del/60",
          )}
        >
          {node.decision ? capitalize(node.text) : node.text}
        </span>
      </span>
      {target.chapter !== undefined && (
        <span className="self-start">
          <ChapterChip chapter={target.chapter} />
        </span>
      )}
    </>
  );
  if (target.props === undefined)
    return (
      <div
        data-flow-node={node.id}
        className={className}
        style={style}
        title={node.text}
      >
        {content}
      </div>
    );
  return (
    <button
      data-track-owner="shared/pull-view/show-me.tsx#FlowView:button.1"
      data-flow-node={node.id}
      {...target.props}
      title={`${node.text}\n${target.props.title}`}
      className={className}
      style={style}
    >
      {content}
    </button>
  );
}
