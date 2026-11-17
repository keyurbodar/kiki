import "./diff-surface.css";
import { useAtom, useAtomValue } from "@effect/atom-react";
import type {
  DiffLineAnnotation,
  FileDiffContentsLoader,
  FileDiffMetadata,
  SelectedLineRange,
} from "@pierre/diffs";
import {
  CodeView,
  type CodeViewDiffItem,
  type CodeViewHandle,
  type CodeViewScrollTarget,
  FileDiff,
  useVirtualizer,
  useWorkerPool,
  WorkerPoolContextProvider,
} from "@pierre/diffs/react";
import {
  Component,
  type ComponentProps,
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Button } from "@/primitives/button";
import { cardVariants } from "@/primitives/card";
import { Icon } from "@/primitives/icon";
import { SkeletonPulse } from "@/primitives/skeleton-panel";
import {
  diffCategoryForPath,
  diffExpandedCategoriesAtom,
  diffHiddenCategoriesAtom,
} from "./diff-categories";
import {
  useDiffLineHeight,
  useDiffThemeType,
  useIsClient,
  useScrollbarGutter,
} from "./diff-environment";
import {
  ArrowRightIcon,
  ChevronDownSmallIcon,
  ChevronRightSmallIcon,
} from "./diff-icons";
import {
  changeLabel,
  collapsedGroupIds,
  countChanges,
  DIFF_METRICS,
  DIFF_MINIMAL_METRICS,
  DIFF_RECOVERY_ATTEMPTS,
  DIFF_SKELETON_FILE_LIMIT,
  DIFF_SKELETON_MAX_ROWS,
  DIFF_SKELETON_WIDTHS,
  type DiffBinaryInfo,
  type DiffGroup,
  type DiffGroupCategory,
  type DiffJoin,
  type DiffSource,
  estimateLines,
  formatBytes,
  getTopFile,
  groupLeaders,
  groupsByFile,
  isFileCollapsed,
  itemVersion,
  joinedPositions,
  orderFiles,
  parsePatch,
  splitPath,
  toggleInSet,
} from "./diff-surface-model";
import {
  buildDiffOptions,
  DIFF_HIGHLIGHTER_OPTIONS,
  type DiffOverflow,
  type DiffStyle,
  type DiffVariant,
  diffWorkerPoolOptions,
} from "./diff-surface-options";

const cx = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

const noop = () => {};

const categoryLabel = (category: DiffGroupCategory | undefined) =>
  category === "database"
    ? "Database"
    : category === "tests"
      ? "Tests"
      : "Generated";

export type DiffSelectedLines = { file: string; range: SelectedLineRange };

export type DiffSurfaceHandle<A = unknown> = CodeViewHandle<A, undefined>;

export type DiffSurfaceProps<A = unknown> = Omit<
  ComponentProps<"div">,
  "children"
> & {
  patch?: string;
  fileDiffs?: FileDiffMetadata[];
  loadDiffFiles?: FileDiffContentsLoader;
  diffStyle?: DiffStyle;
  variant?: DiffVariant;
  overflow?: DiffOverflow;
  defaultCollapsed?: Iterable<string>;
  collapsedFiles?: ReadonlySet<string>;
  onFileCollapsedChange?: (name: string, collapsed: boolean) => void;
  generatedFiles?: ReadonlySet<string>;
  binaryFiles?: ReadonlyMap<string, DiffBinaryInfo>;
  expandUnchanged?: boolean;
  errorHref?: string;
  fileHeader?: FileDiffMetadata;
  disableWorker?: boolean;
  workerPoolAttached?: boolean;
  itemCards?: boolean;
  groups?: readonly DiffGroup[];
  codeViewRef?: Ref<DiffSurfaceHandle<A> | null>;
  renderFooter?: () => ReactNode;
  onScrollContainer?: (element: HTMLDivElement | null) => void;
  onPostRender?: () => void;
  annotations?: Readonly<
    Record<string, readonly DiffLineAnnotation<A>[] | undefined>
  >;
  renderAnnotation?: (annotation: DiffLineAnnotation<A>) => ReactNode;
  renderFileHeaderActions?: (fileDiff: FileDiffMetadata) => ReactNode;
  renderFileHeaderTrailing?: (fileDiff: FileDiffMetadata) => ReactNode;
  onGutterRange?: (file: string, range: SelectedLineRange) => void;
  selectedLines?: DiffSelectedLines | null;
  fileVersions?: Readonly<Record<string, number>>;
};

export function DiffSurface<A = unknown>({
  patch,
  fileDiffs,
  loadDiffFiles,
  diffStyle: diffStyleProp,
  variant: variantProp,
  overflow: overflowProp,
  defaultCollapsed,
  collapsedFiles,
  onFileCollapsedChange,
  generatedFiles,
  binaryFiles,
  expandUnchanged: expandUnchangedProp,
  errorHref,
  fileHeader,
  disableWorker: disableWorkerProp,
  workerPoolAttached: workerPoolAttachedProp,
  itemCards: itemCardsProp,
  groups,
  codeViewRef,
  renderFooter,
  onScrollContainer,
  onPostRender,
  annotations,
  renderAnnotation,
  renderFileHeaderActions,
  renderFileHeaderTrailing,
  onGutterRange,
  selectedLines,
  fileVersions,
  className,
  ...props
}: DiffSurfaceProps<A>) {
  const diffStyle = diffStyleProp ?? "unified";
  const variant = variantProp ?? "default";
  const overflow = overflowProp ?? "wrap";
  const expandUnchanged = expandUnchangedProp ?? false;
  const disableWorker = disableWorkerProp ?? false;
  const workerPoolAttached = workerPoolAttachedProp ?? false;
  const itemCards = itemCardsProp ?? false;
  const hidden = useAtomValue(diffHiddenCategoriesAtom);
  const [expanded, setExpanded] = useAtom(diffExpandedCategoriesAtom);
  const isClient = useIsClient();
  const [attempt, setAttempt] = useState(0);
  const handleRef = useRef<DiffSurfaceHandle<A> | null>(null);
  const restoreRef = useRef<{ id: string; offset: number } | undefined>(
    undefined,
  );
  const [handle, setHandle] = useState<DiffSurfaceHandle<A> | null>(null);
  const pendingScrollRef = useRef<CodeViewScrollTarget | null>(null);
  const themeType = useDiffThemeType();
  const lineHeight = useDiffLineHeight();
  const scrollbarGutter = useScrollbarGutter();
  const virtualizer = useVirtualizer();
  const [ownCollapsed, setOwnCollapsed] = useState<ReadonlySet<string>>(
    () => new Set(defaultCollapsed),
  );
  const collapsed = collapsedFiles ?? ownCollapsed;

  const attachHandle = useCallback((next: DiffSurfaceHandle<A> | null) => {
    const restore = restoreRef.current;
    if (next === null) {
      restoreRef.current = getTopFile(handleRef.current) ?? restore;
    } else if (restore !== undefined) {
      restoreRef.current = undefined;
      if (next.getItem(restore.id) !== undefined) {
        next.scrollTo({
          type: "item",
          id: restore.id,
          align: "start",
          offset: -restore.offset,
          behavior: "instant",
        });
      }
    }
    handleRef.current = next;
    setHandle(next);
  }, []);

  useEffect(() => {
    if (handle === null || selectedLines === undefined) return;
    if (selectedLines === null) handle.clearSelectedLines();
    else
      handle.setSelectedLines({
        id: selectedLines.file,
        range: selectedLines.range,
      });
  }, [handle, selectedLines]);

  const source: DiffSource =
    fileDiffs === undefined
      ? parsePatch(patch ?? "")
      : { kind: "files", files: fileDiffs };
  const fileGroups = groupsByFile(groups, itemCards);
  const collapsedGroups = collapsedGroupIds(groups, expanded, hidden);

  useImperativeHandle<DiffSurfaceHandle<A> | null, DiffSurfaceHandle<A> | null>(
    codeViewRef,
    () =>
      handle === null
        ? null
        : {
            ...handle,
            scrollTo: (target: CodeViewScrollTarget) => {
              const group =
                "id" in target ? fileGroups.get(target.id) : undefined;
              const category = group?.category;
              if (
                category !== undefined &&
                group !== undefined &&
                collapsedGroups.has(group.id)
              ) {
                pendingScrollRef.current = target;
                setExpanded((current) => ({ ...current, [category]: true }));
                return;
              }
              pendingScrollRef.current = null;
              handle.scrollTo(target);
            },
          },
    [handle, fileGroups, collapsedGroups, setExpanded],
  );

  useEffect(() => {
    const target = pendingScrollRef.current;
    if (target === null || handle === null) return;
    const group = "id" in target ? fileGroups.get(target.id) : undefined;
    if (group !== undefined && collapsedGroups.has(group.id)) return;
    const frame = requestAnimationFrame(() => {
      if (pendingScrollRef.current !== target) return;
      pendingScrollRef.current = null;
      handle.scrollTo(target);
    });
    return () => cancelAnimationFrame(frame);
  }, [handle, fileGroups, collapsedGroups]);

  const display: DiffSource =
    itemCards && source.kind === "files" && groups !== undefined
      ? {
          kind: "files",
          files: orderFiles(
            source.files,
            groups,
            fileGroups,
            collapsedGroups,
            hidden,
          ),
        }
      : source;
  const displayFiles = display.kind === "files" ? display.files : [];

  const toggleFile = (name: string) => {
    if (collapsedFiles === undefined)
      setOwnCollapsed((current) => toggleInSet(current, name));
    else onFileCollapsedChange?.(name, !collapsedFiles.has(name));
  };

  const joins = joinedPositions(displayFiles, groups, itemCards);
  const leaders = groupLeaders(displayFiles, groups);

  const items: CodeViewDiffItem<A>[] = displayFiles.map((fileDiff) => {
    const group = fileGroups.get(fileDiff.name);
    const groupCollapsed = group !== undefined && collapsedGroups.has(group.id);
    const itemCollapsed =
      groupCollapsed ||
      isFileCollapsed({
        name: fileDiff.name,
        binary: binaryFiles?.has(fileDiff.name) ?? false,
        annotationCount: annotations?.[fileDiff.name]?.length ?? 0,
        variant,
        collapsedFiles: collapsed,
      });
    const join = joins.get(fileDiff.name);
    return {
      id: fileDiff.name,
      type: "diff",
      fileDiff,
      annotations: groupCollapsed ? [] : annotations?.[fileDiff.name]?.slice(),
      collapsed: itemCollapsed,
      gapBefore: join === "middle" || join === "end" ? 0 : undefined,
      version: itemVersion({
        collapsed: itemCollapsed,
        join,
        groupCollapsed,
        categoryHidden: group?.category !== undefined && hidden[group.category],
        fileVersion: fileVersions?.[fileDiff.name] ?? 0,
      }),
    };
  });

  const reviewing = selectedLines != null;
  const viewOptions = {
    ...buildDiffOptions({
      themeType,
      diffStyle,
      overflow,
      variant,
      expandUnchanged,
      itemCards,
      lineHeight,
      scrollbarGutter,
      errorHref,
      reviewRangeSide: reviewing
        ? (selectedLines.range.side ?? "additions")
        : undefined,
    }),
    loadDiffFiles,
    onPostRender: (
      _node: unknown,
      _instance: unknown,
      _phase: unknown,
      context: { item: { id: string }; element?: HTMLElement | null },
    ) => {
      const join = joins.get(context.item.id);
      if (join === undefined)
        context.element?.removeAttribute("data-diff-joined");
      else context.element?.setAttribute("data-diff-joined", join);
      onPostRender?.();
    },
    preferredHighlighter: disableWorker ? ("shiki-js" as const) : undefined,
    ...(onGutterRange === undefined
      ? {}
      : {
          lineHoverHighlight: "number" as const,
          enableLineSelection: true,
          enableGutterUtility: !reviewing,
          onGutterUtilityClick: (
            range: SelectedLineRange,
            context: { item: { id: string } },
          ) => onGutterRange(context.item.id, range),
        }),
  };

  const lastFileName = displayFiles.at(-1)?.name;

  const renderHeader = (item: CodeViewDiffItem<A>) => {
    if (item.type !== "diff" || variant === "minimal") return null;
    const leader = leaders.get(item.fileDiff.name);
    const category = leader?.group.category;
    const join = joins.get(item.fileDiff.name);
    const group = fileGroups.get(item.fileDiff.name);
    const groupCollapsed = group !== undefined && collapsedGroups.has(group.id);
    return (
      <>
        {leader !== undefined && category !== undefined && (
          <DiffGroupHeader
            group={leader.group}
            count={leader.count}
            hidden={hidden[category]}
            expanded={!groupCollapsed}
            onToggle={() =>
              setExpanded({ ...expanded, [category]: groupCollapsed })
            }
          />
        )}
        {!groupCollapsed && (
          <DiffFileHeader
            fileDiff={item.fileDiff}
            collapsed={item.collapsed === true}
            atCardEdge={
              itemCards
                ? join === undefined || join === "end"
                : item.fileDiff.name === lastFileName
            }
            joined={join}
            generated={generatedFiles?.has(item.fileDiff.name) ?? false}
            category={group?.category}
            onToggle={variant === "default" ? toggleFile : undefined}
            renderActions={renderFileHeaderActions}
            renderTrailing={renderFileHeaderTrailing}
            binary={binaryFiles?.get(item.fileDiff.name)}
          />
        )}
      </>
    );
  };

  const surfaceClass = itemCards
    ? cx("flex min-h-0 flex-col diff-surface", className)
    : variant === "minimal"
      ? cx("diff-surface", className)
      : cx(cardVariants(), "diff-surface", className);
  const metrics = variant === "minimal" ? DIFF_MINIMAL_METRICS : DIFF_METRICS;

  const renderSkeleton = () => (
    <SkeletonPulse
      {...props}
      data-slot="diff-surface"
      label="Loading diff"
      className={cx(surfaceClass, itemCards && "overflow-y-auto")}
    >
      <div
        className={cx(
          "flex flex-col",
          itemCards && "mx-auto w-full max-w-(--diff-card-max) gap-3 p-3",
        )}
      >
        {displayFiles
          .slice(0, DIFF_SKELETON_FILE_LIMIT)
          .map((fileDiff, index, shown) => {
            const leader = leaders.get(fileDiff.name);
            const category = leader?.group.category;
            if (
              leader !== undefined &&
              collapsedGroups.has(leader.group.id) &&
              category !== undefined
            ) {
              return (
                <div key={fileDiff.name} className={cardVariants()}>
                  <DiffGroupHeader
                    group={leader.group}
                    count={leader.count}
                    hidden={hidden[category]}
                    expanded={false}
                    onToggle={() =>
                      setExpanded({ ...expanded, [category]: true })
                    }
                  />
                </div>
              );
            }
            const fileCollapsed = isFileCollapsed({
              name: fileDiff.name,
              binary: binaryFiles?.has(fileDiff.name) ?? false,
              annotationCount: annotations?.[fileDiff.name]?.length ?? 0,
              variant,
              collapsedFiles: collapsed,
            });
            const estimate = estimateLines(
              fileDiff,
              diffStyle === "split",
              loadDiffFiles !== undefined,
            );
            const bodyHeight = fileCollapsed
              ? 0
              : estimate.lines * lineHeight +
                (variant === "minimal"
                  ? 0
                  : estimate.separators * DIFF_METRICS.hunkSeparatorHeight);
            return (
              <div
                key={fileDiff.name}
                className={cx("flex flex-col", itemCards && cardVariants())}
                style={{ height: metrics.diffHeaderHeight + bodyHeight }}
              >
                {variant !== "minimal" && (
                  <DiffFileHeader
                    fileDiff={fileDiff}
                    collapsed={fileCollapsed}
                    atCardEdge={itemCards || index === shown.length - 1}
                    generated={generatedFiles?.has(fileDiff.name) ?? false}
                    placeholder={variant === "default"}
                    renderActions={renderFileHeaderActions}
                    renderTrailing={renderFileHeaderTrailing}
                    binary={binaryFiles?.get(fileDiff.name)}
                  />
                )}
                {bodyHeight > 0 && (
                  <DiffLoadingBody height={bodyHeight} grouped />
                )}
              </div>
            );
          })}
      </div>
    </SkeletonPulse>
  );

  if (!isClient) return renderSkeleton();

  if (display.kind === "raw") {
    return (
      <div {...props} data-slot="diff-surface" className={surfaceClass}>
        {fileHeader !== undefined && variant !== "minimal" && (
          <DiffFileHeader
            fileDiff={fileHeader}
            collapsed={false}
            atCardEdge={false}
            generated={generatedFiles?.has(fileHeader.name) ?? false}
            renderActions={renderFileHeaderActions}
          />
        )}
        <div className="min-h-9 shrink-0 border-b-hairline border-border-1 bg-card px-3 py-2 text-sm break-words text-muted-foreground-2">
          {display.reason}
          {errorHref !== undefined && (
            <>
              {", "}
              <a
                href={errorHref}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                view on GitHub
              </a>
            </>
          )}
        </div>
        <pre className="min-h-0 flex-1 overflow-auto p-3 font-mono text-code-block leading-[1.5] text-foreground">
          {display.text}
        </pre>
      </div>
    );
  }

  const errorView = (
    <div {...props} data-slot="diff-surface" className={surfaceClass}>
      {patch === undefined ? (
        <div className="min-h-9 shrink-0 border-b-hairline border-border-1 bg-card px-3 py-2 text-sm break-words text-muted-foreground-2">
          Could not render this diff
        </div>
      ) : (
        <pre className="min-h-0 flex-1 overflow-auto p-3 font-mono text-code-block leading-[1.5] text-foreground">
          {patch}
        </pre>
      )}
    </div>
  );

  const single = items.length === 1 && !itemCards ? items[0] : undefined;
  const {
    stickyHeaders,
    itemMetrics: _itemMetrics,
    layout: _layout,
    onGutterUtilityClick: _onGutterUtilityClick,
    onPostRender: _onPostRender,
    ...fileOptions
  } = viewOptions as typeof viewOptions & { onGutterUtilityClick?: unknown };

  const view =
    virtualizer !== undefined && single !== undefined ? (
      <FileDiff<A>
        key={`${diffStyle}:${overflow}`}
        className="min-h-0 flex-1"
        fileDiff={single.fileDiff}
        options={{
          ...fileOptions,
          stickyHeader: stickyHeaders,
          collapsed: single.collapsed,
          onGutterUtilityClick:
            onGutterRange === undefined
              ? undefined
              : (range) => onGutterRange(single.id, range),
        }}
        metrics={{ ...DIFF_METRICS, hunkLineCount: 64, lineHeight }}
        lineAnnotations={single.annotations}
        selectedLines={
          selectedLines === undefined
            ? undefined
            : selectedLines !== null && selectedLines.file === single.id
              ? selectedLines.range
              : null
        }
        renderAnnotation={renderAnnotation}
        renderCustomHeader={() => renderHeader(single)}
        disableWorkerPool={disableWorker}
      />
    ) : (
      <CodeView<A>
        key={`${diffStyle}:${overflow}`}
        ref={attachHandle}
        containerRef={(element) => onScrollContainer?.(element)}
        className="min-h-0 flex-1"
        items={items}
        options={viewOptions}
        renderCustomHeader={(item) =>
          item.type === "diff" ? renderHeader(item) : null
        }
        renderAnnotation={
          renderAnnotation === undefined
            ? undefined
            : (...args) => renderAnnotation(args[0] as DiffLineAnnotation<A>)
        }
        renderCodeViewFooter={renderFooter}
        disableWorkerPool={disableWorker}
      />
    );

  const gated = (
    <DiffWorkerGate skip={disableWorker} fallback={renderSkeleton}>
      <div {...props} data-slot="diff-surface" className={surfaceClass}>
        {view}
      </div>
    </DiffWorkerGate>
  );

  return (
    <DiffErrorBoundary
      key={attempt}
      fallback={
        attempt < DIFF_RECOVERY_ATTEMPTS ? (
          <DiffRecovery
            skeleton={renderSkeleton}
            onRecover={() => setAttempt((count) => count + 1)}
          />
        ) : (
          errorView
        )
      }
    >
      {disableWorker || workerPoolAttached ? (
        gated
      ) : (
        <DiffWorkerPool>{gated}</DiffWorkerPool>
      )}
    </DiffErrorBoundary>
  );
}

export type DiffFileHeaderProps = {
  fileDiff: FileDiffMetadata;
  collapsed: boolean;
  atCardEdge: boolean;
  joined?: DiffJoin;
  generated: boolean;
  category?: DiffGroupCategory;
  onToggle?: (name: string) => void;
  renderActions?: (fileDiff: FileDiffMetadata) => ReactNode;
  renderTrailing?: (fileDiff: FileDiffMetadata) => ReactNode;
  placeholder?: boolean;
  binary?: DiffBinaryInfo;
};

export function DiffFileHeader({
  fileDiff,
  collapsed,
  atCardEdge,
  joined,
  generated,
  category,
  onToggle,
  renderActions,
  renderTrailing,
  placeholder,
  binary,
}: DiffFileHeaderProps) {
  const hidden = useAtomValue(diffHiddenCategoriesAtom);
  const resolvedCategory =
    category ??
    diffCategoryForPath(fileDiff.name) ??
    (generated ? "generated" : undefined);
  const muted = resolvedCategory !== undefined && hidden[resolvedCategory];
  const { additions, deletions } = countChanges(fileDiff);
  const showToggle =
    binary === undefined && (onToggle !== undefined || placeholder === true);
  const change = changeLabel(fileDiff);
  const [base, directory] = splitPath(fileDiff.name);
  const title = fileDiff.prevName
    ? `${fileDiff.prevName} → ${fileDiff.name}`
    : fileDiff.name;
  return (
    <div
      data-slot="diff-file-header"
      className={cx(
        "@container/file-header flex h-9 items-center gap-1.5 border-border-1 bg-card pr-3",
        (joined === "middle" || joined === "end") && "border-t-hairline",
        collapsed && (atCardEdge || joined !== undefined)
          ? undefined
          : "border-b-hairline",
        showToggle ? "pl-1.5" : "pl-3",
        muted && "text-muted-foreground-3 [&_span]:text-muted-foreground-3",
      )}
    >
      {showToggle && (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={collapsed ? "Expand file" : "Collapse file"}
          onClick={
            onToggle === undefined ? undefined : () => onToggle(fileDiff.name)
          }
          tabIndex={onToggle === undefined ? -1 : undefined}
          disabled={onToggle === undefined}
        >
          {collapsed ? (
            <ChevronRightSmallIcon className="size-(--icon-base)" />
          ) : (
            <ChevronDownSmallIcon className="size-(--icon-base)" />
          )}
        </Button>
      )}
      <Icon name="file-text" size={null} className="size-4 text-icon-muted" />
      <span className="flex min-w-0 items-center gap-2 text-sm" title={title}>
        {fileDiff.prevName ? (
          <>
            <span className="truncate text-muted-foreground-2">
              {fileDiff.prevName}
            </span>
            <ArrowRightIcon className="size-(--icon-xs) shrink-0 text-icon-muted" />
            <span className="truncate text-foreground">{fileDiff.name}</span>
          </>
        ) : (
          <>
            <span className="max-w-full shrink-0 truncate text-foreground">
              {base}
            </span>
            {directory && (
              <span className="truncate text-muted-foreground-2 @max-md/file-header:hidden">
                {directory}
              </span>
            )}
          </>
        )}
      </span>
      <span className="ml-auto flex shrink-0 items-center gap-3 text-sm">
        {renderActions?.(fileDiff)}
        {generated && (
          <span className="text-muted-foreground-2">generated</span>
        )}
        {change && (
          <span className="text-muted-foreground-2 @max-md/file-header:hidden">
            {change}
          </span>
        )}
        {binary === undefined ? (
          (additions > 0 || deletions > 0) && (
            <span className="flex items-center gap-1 font-medium tabular-nums">
              {additions > 0 && (
                <span className="text-diff-add">+{additions}</span>
              )}
              {deletions > 0 && (
                <span className="text-diff-del">−{deletions}</span>
              )}
            </span>
          )
        ) : (
          <DiffBinarySize {...binary} />
        )}
        {renderTrailing?.(fileDiff)}
      </span>
    </div>
  );
}

export type DiffGroupHeaderProps = {
  group: DiffGroup;
  count: number;
  hidden: boolean;
  expanded: boolean;
  onToggle: () => void;
};

export function DiffGroupHeader({
  group,
  count,
  hidden,
  expanded,
  onToggle,
}: DiffGroupHeaderProps) {
  return (
    <section
      data-diff-group={group.id}
      className={cx(
        "flex h-9 items-center gap-1.5 border-border-1 bg-card pr-3 pl-1.5 text-sm",
        expanded && "border-b-hairline",
        hidden ? "text-muted-foreground-3" : "text-foreground",
      )}
    >
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={`${expanded ? "Collapse" : "Expand"} ${group.category}`}
        aria-expanded={expanded}
        onClick={onToggle}
      >
        {expanded ? (
          <ChevronDownSmallIcon className="size-(--icon-base)" />
        ) : (
          <ChevronRightSmallIcon className="size-(--icon-base)" />
        )}
      </Button>
      <h2 className="min-w-0 truncate text-sm font-medium">
        {categoryLabel(group.category)}
        <span className="font-normal">
          {" · "}
          {count} {count === 1 ? "file" : "files"}
        </span>
      </h2>
      <span className="ml-auto flex shrink-0 items-center gap-1 tabular-nums">
        {(group.additions ?? 0) > 0 && (
          <span className={hidden ? undefined : "text-diff-add"}>
            +{group.additions}
          </span>
        )}
        {(group.deletions ?? 0) > 0 && (
          <span className={hidden ? undefined : "text-diff-del"}>
            −{group.deletions}
          </span>
        )}
      </span>
    </section>
  );
}

export function DiffBinarySize({ oldSizeBytes, newSizeBytes }: DiffBinaryInfo) {
  const size = newSizeBytes ?? oldSizeBytes;
  if (size === undefined) return null;
  const delta =
    oldSizeBytes === undefined || newSizeBytes === undefined
      ? undefined
      : newSizeBytes - oldSizeBytes;
  const title =
    oldSizeBytes !== undefined && newSizeBytes !== undefined
      ? `${oldSizeBytes.toLocaleString()} → ${newSizeBytes.toLocaleString()} bytes`
      : `${size.toLocaleString()} bytes`;
  return (
    <span
      className="flex shrink-0 items-center gap-1.5 text-muted-foreground-2 tabular-nums"
      title={title}
    >
      <span>{formatBytes(size)}</span>
      {delta !== undefined && delta !== 0 && (
        <span className="text-muted-foreground-3">
          ({delta > 0 ? "+" : "−"}
          {formatBytes(Math.abs(delta))})
        </span>
      )}
    </span>
  );
}

export type DiffLoadingBodyProps = {
  height: number;
  className?: string;
  grouped?: boolean;
};

export function DiffLoadingBody({
  height,
  className,
  grouped,
}: DiffLoadingBodyProps) {
  const lineHeight = useDiffLineHeight();
  const rows = Math.max(
    1,
    Math.min(DIFF_SKELETON_MAX_ROWS, Math.floor(height / lineHeight)),
  );
  const body = (
    <div
      className={cx("overflow-hidden px-3 py-1", className)}
      style={{ height }}
    >
      {Array.from({ length: rows }, (_, row) => row).map((row) => (
        <div
          key={row}
          className="flex items-center gap-3"
          style={{ height: lineHeight }}
        >
          <span className="h-2 w-5 shrink-0 rounded bg-secondary" />
          <span
            className="h-2 rounded bg-secondary"
            style={{
              width: `${DIFF_SKELETON_WIDTHS[row % DIFF_SKELETON_WIDTHS.length]}%`,
            }}
          />
        </div>
      ))}
    </div>
  );
  return grouped === true ? (
    body
  ) : (
    <SkeletonPulse label="Loading diff">{body}</SkeletonPulse>
  );
}

function DiffWorkerPool({ children }: { children: ReactNode }) {
  const pool = useWorkerPool();
  if (pool !== undefined) return children;
  return (
    <WorkerPoolContextProvider
      poolOptions={diffWorkerPoolOptions(navigator.hardwareConcurrency)}
      highlighterOptions={DIFF_HIGHLIGHTER_OPTIONS}
    >
      {children}
    </WorkerPoolContextProvider>
  );
}

function DiffWorkerGate({
  skip,
  fallback,
  children,
}: {
  skip: boolean;
  fallback: () => ReactNode;
  children: ReactNode;
}) {
  const pool = useWorkerPool();
  useEffect(() => {
    if (!skip) pool?.initialize().catch(noop);
  }, [pool, skip]);
  const ready = useSyncExternalStore(
    (onChange) =>
      skip || pool === undefined ? noop : pool.subscribeToStatChanges(onChange),
    () => {
      if (skip || pool === undefined) return true;
      const stats = pool.getStats();
      return stats.managerState === "initialized" || stats.workersFailed;
    },
    () => false,
  );
  return ready ? children : fallback();
}

function DiffRecovery({
  skeleton,
  onRecover,
}: {
  skeleton: () => ReactNode;
  onRecover: () => void;
}) {
  useEffect(() => {
    const frame = requestAnimationFrame(onRecover);
    return () => cancelAnimationFrame(frame);
  }, [onRecover]);
  return skeleton();
}

class DiffErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
