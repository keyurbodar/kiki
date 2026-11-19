import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AsyncResult } from "effect/reactivity";
import { useEffect, useMemo, useRef, useState } from "react";
import { organizationsAtom } from "@/data/atoms/session.ts";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Input, InputGroup } from "@/primitives/input";
import { Label } from "@/primitives/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/primitives/popover";
import { Textarea } from "@/primitives/textarea";
import { toast } from "@/primitives/toaster";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  editMemoryAtom,
  forgetMemoryAtom,
  idleMemoryListAtom,
  idleMemoryReadAtom,
  memoryListAtom,
  memoryListKey,
  memoryReadAtom,
  memoryReadKey,
  restoreMemoryAtom,
} from "./atoms.ts";
import { memoryPageRow, memoryTopic } from "./decode.ts";
import {
  emptyStateCopy,
  forgetDescription,
  forgetTitle,
  memoryErrorCopy,
  plainSource,
  scopeLabel,
  sortMemories,
  whereLabel,
  whoLabel,
} from "./flow.ts";
import type {
  MemoryDraft,
  MemoryLocation,
  MemorySort,
  MemoryTopic,
} from "./types.ts";

const sortColumns = [
  ["title", "Title"],
  ["who", "Visible to"],
  ["where", "Where"],
  ["confirmed", "Confirmed"],
  ["source", "Source"],
] as const;

const skeletonRows = ["w-48", "w-36", "w-56", "w-40", "w-44"] as const;

function useOrgId() {
  const organizations = useAtomValue(organizationsAtom);
  return AsyncResult.isSuccess(organizations)
    ? organizations.value[0]?.id
    : undefined;
}

function MemoryTopBar({
  title,
  back,
  search,
  actions,
}: {
  title: string;
  back?: React.ReactNode;
  search?: {
    value: string;
    onValueChange: (value: string) => void;
  };
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex min-h-11 shrink-0 items-center gap-2 border-b-hairline border-border-1 bg-panel px-2">
      {back}
      <span className="mask-fade-r min-w-0 flex-1 truncate text-sm font-medium text-foreground">
        {title}
      </span>
      {search && (
        <Input
          aria-label="Search memories"
          placeholder="Search memories"
          value={search.value}
          onChange={(event) => search.onValueChange(event.target.value)}
          className="w-60"
        />
      )}
      {actions}
    </header>
  );
}

function IconButton({
  label,
  children,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            onClick={onClick}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

function ResponsiveButton({
  label,
  value,
  children,
  items,
}: {
  label: string;
  value?: string;
  children: React.ReactNode;
  items: readonly {
    label: string;
    onClick: () => void;
    checked?: boolean;
  }[];
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="sm" aria-label={label}>
            {children}
            {value !== undefined && <span className="ml-2">{value}</span>}
          </Button>
        }
      />
      <PopoverContent
        side="bottom"
        align="end"
        className="w-60 bg-panel p-1 text-sm"
      >
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            data-slot="responsive-menu-item"
            className="flex min-h-7 w-full items-center gap-2 px-2 text-left outline-none hover:bg-section focus-visible:outline-ring-inset"
            onClick={item.onClick}
          >
            {item.checked && <Icon name="checkmark-1" size="sm" />}
            {item.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function MemoryDetail({ topic, where }: { topic: MemoryTopic; where: string }) {
  const repositories =
    topic.repositories.length > 0 && !topic.repositories.includes("all")
      ? topic.repositories.join(", ")
      : undefined;
  const rows = [
    [
      "Visible to",
      <Icon key="who" name="brain" size="sm" />,
      scopeLabel(topic.scope),
      false,
    ],
    ["Where", <Icon key="where" name="folder-1" size="sm" />, where, true],
    [
      "Confirmed",
      <Icon key="confirmed" name="calendar-days" size="sm" />,
      topic.lastConfirmed ?? "Not recorded",
      false,
    ],
  ] as const;
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-medium text-balance text-foreground">
          {topic.title}
        </h1>
        <p className="text-sm text-muted-foreground-1">{topic.description}</p>
      </div>
      <div className="flex flex-col gap-1 text-xs text-foreground">
        {rows.map(([label, icon, value, truncate]) => (
          <div key={label} className="flex min-h-7 items-center gap-2">
            <span className="flex h-6 w-24 shrink-0 items-center gap-2 text-xs text-muted-foreground-2 [&_svg]:size-(--icon-xs) [&_svg]:text-icon-muted">
              {icon}
              {label}
            </span>
            <span className={truncate ? "truncate" : ""}>{value}</span>
          </div>
        ))}
        {repositories !== undefined && (
          <div className="flex min-h-7 items-center gap-2">
            <span className="flex h-6 w-24 shrink-0 items-center gap-2 text-xs text-muted-foreground-2 [&_svg]:size-(--icon-xs) [&_svg]:text-icon-muted">
              <Icon name="git" size="sm" /> Repositories
            </span>
            <span className="break-words">{repositories}</span>
          </div>
        )}
        {topic.statedBy !== null && (
          <div className="flex min-h-7 items-center gap-2">
            <span className="flex h-6 w-24 shrink-0 items-center gap-2 text-xs text-muted-foreground-2 [&_svg]:size-(--icon-xs) [&_svg]:text-icon-muted">
              <Icon name="user-settings" size="sm" /> Stated by
            </span>
            <span className="truncate">{topic.statedBy}</span>
          </div>
        )}
        {topic.source !== null && (
          <div className="flex min-h-7 items-center gap-2">
            <span className="flex h-6 w-24 shrink-0 items-center gap-2 text-xs text-muted-foreground-2 [&_svg]:size-(--icon-xs) [&_svg]:text-icon-muted">
              <Icon name="chain-link-2" size="sm" /> Source
            </span>
            <span className="truncate text-xs">
              {plainSource(topic.source)}
            </span>
          </div>
        )}
      </div>
      <p className="whitespace-pre-wrap text-sm text-foreground">
        {topic.body}
      </p>
    </div>
  );
}

function MemoryEditForm({
  draft,
  busy,
  onDraftChange,
  onSave,
  onCancel,
}: {
  draft: MemoryDraft;
  busy: boolean;
  onDraftChange: (draft: MemoryDraft) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const changed =
    draft.title !== draft.topic.title ||
    draft.description !== draft.topic.description ||
    draft.body !== draft.topic.body;
  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="memory-title">Title</Label>
        <Input
          id="memory-title"
          value={draft.title}
          maxLength={500}
          required
          disabled={busy}
          onChange={(event) =>
            onDraftChange({ ...draft, title: event.target.value })
          }
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="memory-description">When this applies</Label>
        <Textarea
          id="memory-description"
          value={draft.description}
          maxLength={4000}
          required
          disabled={busy}
          rows={2}
          onChange={(event) =>
            onDraftChange({ ...draft, description: event.target.value })
          }
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="memory-body">Memory</Label>
        <Textarea
          id="memory-body"
          value={draft.body}
          maxLength={65536}
          disabled={busy}
          rows={14}
          onChange={(event) =>
            onDraftChange({ ...draft, body: event.target.value })
          }
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={busy}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            !changed || !draft.title.trim() || !draft.description.trim()
          }
        >
          Save
        </Button>
      </div>
    </form>
  );
}

function ListEmptyState({
  query,
  page,
  filtered,
  onClearSearch,
  onClearFilters,
}: {
  query: string;
  page: { nextCursor: string | null; skipped: number };
  filtered: boolean;
  onClearSearch: () => void;
  onClearFilters: () => void;
}) {
  const { title, detail } = emptyStateCopy(query, page, filtered);
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      <h2 className="text-base font-medium">{title}</h2>
      <p className="text-sm text-muted-foreground-1">{detail}</p>
      {query !== "" ? (
        <Button variant="ghost" onClick={onClearSearch}>
          Clear search
        </Button>
      ) : filtered ? (
        <Button variant="ghost" onClick={onClearFilters}>
          Show all memories
        </Button>
      ) : null}
    </div>
  );
}

function ConfirmForgetDialog({
  topic,
  where,
  busy,
  onCancel,
  onConfirm,
}: {
  topic: MemoryTopic | undefined;
  where: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (topic === undefined) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={forgetTitle(topic)}
      data-slot="confirm-dialog"
      className="fixed inset-0 z-(--z-overlay) flex items-center justify-center bg-overlay"
    >
      <div className="flex w-full max-w-100 flex-col gap-4 rounded-(--radius-card) border border-border-1 bg-panel p-6 text-sm">
        <h2 className="text-lg font-medium text-foreground">
          {forgetTitle(topic)}
        </h2>
        <div className="flex flex-col gap-3 text-muted-foreground-1">
          <span>{forgetDescription(topic, where)}</span>
          <span>
            Existing conversations and retained versions may still contain it
          </span>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled={busy} onClick={onConfirm}>
            Forget
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MemoryPage({ search }: { search: MemoryLocation }) {
  const navigate = useNavigate();
  const orgId = useOrgId();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [projectQuery, setProjectQuery] = useState("");
  const [sort, setSort] = useState<MemorySort>({
    column: "confirmed",
    direction: "descending",
  });
  const [cursors, setCursors] = useState<readonly (string | undefined)[]>([
    undefined,
  ]);
  const [selected, setSelected] = useState<MemoryTopic>();
  const [draft, setDraft] = useState<MemoryDraft>();
  const [forgetting, setForgetting] = useState<MemoryTopic>();
  const [busy, setBusy] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const pendingNavigation = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(timer);
  }, [query]);

  const listAtom =
    orgId === undefined
      ? idleMemoryListAtom
      : memoryListAtom(
          memoryListKey(orgId, search, debouncedQuery, cursors.at(-1)),
        );
  const listResult = useAtomValue(listAtom);
  const list = AsyncResult.isSuccess(listResult)
    ? memoryPageRow(listResult.value)
    : undefined;
  const listError = AsyncResult.isFailure(listResult);
  const refreshList = useAtomRefresh(listAtom);
  const readAtom =
    orgId === undefined
      ? idleMemoryReadAtom
      : memoryReadAtom(
          memoryReadKey(orgId, selected?.volumeId ?? "", selected?.path ?? ""),
        );
  const readResult = useAtomValue(readAtom);
  const refreshRead = useAtomRefresh(readAtom);
  const edit = useAtomSet(editMemoryAtom, { mode: "promise" });
  const forget = useAtomSet(forgetMemoryAtom, { mode: "promise" });
  const restore = useAtomSet(restoreMemoryAtom, { mode: "promise" });

  const detail =
    AsyncResult.isSuccess(readResult) && search.volume === undefined
      ? memoryTopic(readResult.value)
      : selected;
  const readError = AsyncResult.isFailure(readResult);
  const detailLoading = AsyncResult.isWaiting(readResult);

  useEffect(() => {
    if (detail !== undefined && draft === undefined) {
      setDraft({
        topic: detail,
        title: detail.title,
        description: detail.description,
        body: detail.body,
      });
    }
  }, [detail, draft]);

  const changed =
    draft !== undefined &&
    (draft.title !== draft.topic.title ||
      draft.description !== draft.topic.description ||
      draft.body !== draft.topic.body);

  const projects = useMemo<readonly { id: string; name: string }[]>(
    () => [],
    [],
  );
  const items = list?.items ?? [];
  const ordered = sortMemories(items, sort);
  const isDetail = search.volume !== undefined;
  const empty =
    list !== undefined &&
    list.items.length === 0 &&
    list.nextCursor === null &&
    list.skipped === 0 &&
    cursors.length === 1 &&
    query.trim() === "" &&
    search.who === undefined &&
    search.where === undefined &&
    search.volume === undefined;

  const navigateSafely = (target: MemoryLocation) => {
    if (changed) {
      pendingNavigation.current = () =>
        void navigate({ to: "/memory", search: target });
      setDiscardOpen(true);
      return;
    }
    void navigate({ to: "/memory", search: target });
  };

  const save = () => {
    if (draft === undefined || orgId === undefined || busy) return;
    setBusy(true);
    edit({
      params: { orgId, volumeId: draft.topic.volumeId },
      payload: {
        path: draft.topic.path,
        expectedDigest: draft.topic.digest,
        title: draft.title,
        description: draft.description,
        body: draft.body,
      },
      reactivityKeys: [`volume:${orgId}`],
    })
      .then(() => {
        setDraft(undefined);
        toast.success("Memory updated");
      })
      .catch((error: unknown) => {
        const copy = memoryErrorCopy(error, "Could not update memory");
        toast.error(copy.message, { description: copy.description });
      })
      .finally(() => setBusy(false));
  };

  const confirmForget = () => {
    if (forgetting === undefined || orgId === undefined || busy) return;
    setBusy(true);
    forget({
      params: { orgId, volumeId: forgetting.volumeId },
      payload: { path: forgetting.path, expectedDigest: forgetting.digest },
      reactivityKeys: [`volume:${orgId}`],
    })
      .then((result) => {
        const forgotten = result as {
          volumeId: string;
          path: string;
          sourceVersionId: string;
          digest: string;
        };
        setForgetting(undefined);
        setSelected(undefined);
        setDraft(undefined);
        navigateSafely({ who: search.who, where: search.where });
        toast.success("Memory forgotten", {
          duration: 15000,
          action: {
            label: "Undo",
            onClick: () => {
              void restore({
                params: { orgId, volumeId: forgotten.volumeId },
                payload: {
                  path: forgotten.path,
                  sourceVersionId: forgotten.sourceVersionId,
                  expectedDigest: forgotten.digest,
                },
                reactivityKeys: [`volume:${orgId}`],
              })
                .then((restored) => {
                  const row = restored as { volumeId: string; path: string };
                  void navigate({
                    to: "/memory",
                    search: {
                      who: search.who,
                      where: search.where,
                      volume: row.volumeId,
                      file: row.path,
                    },
                  });
                  toast.success("Memory restored");
                })
                .catch(() => toast.error("Could not restore memory"));
            },
          },
        });
      })
      .catch(() => toast.error("Could not forget memory"))
      .finally(() => setBusy(false));
  };

  const detailBody =
    readError && selected !== undefined ? (
      <p className="flex items-center gap-3 text-sm text-muted-foreground-1">
        Could not refresh this memory, showing the last loaded version
        <Button variant="ghost" onClick={() => refreshRead()}>
          Reload
        </Button>
      </p>
    ) : detailLoading && selected === undefined ? (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <span className="h-5 w-56 rounded bg-secondary" />
          <span className="h-3 w-72 rounded bg-secondary" />
        </div>
      </div>
    ) : detail === undefined ? (
      <p className="text-sm text-muted-foreground-1">
        This memory is unavailable or you don’t have access
      </p>
    ) : draft !== undefined ? (
      <MemoryEditForm
        draft={draft}
        busy={busy}
        onDraftChange={setDraft}
        onSave={save}
        onCancel={() => setDraft(undefined)}
      />
    ) : (
      <MemoryDetail
        topic={detail}
        where={whereLabel(detail.projectId ?? undefined, projects)}
      />
    );

  const detailActions = (
    <>
      {detail?.canWrite === true && (
        <IconButton
          label="Edit"
          onClick={() =>
            detail !== undefined &&
            setDraft({
              topic: detail,
              title: detail.title,
              description: detail.description,
              body: detail.body,
            })
          }
        >
          <Icon name="pencil" size="sm" />
        </IconButton>
      )}
      {detail?.canWrite === true && (
        <ResponsiveButton
          label="Memory actions"
          items={[{ label: "Forget…", onClick: () => setForgetting(detail) }]}
        >
          <Icon name="x" size="sm" />
        </ResponsiveButton>
      )}
      <IconButton
        label="Close memory panel"
        onClick={() => navigateSafely({ who: search.who, where: search.where })}
      >
        <Icon name="x" size="sm" />
      </IconButton>
    </>
  );

  const displayItems = sortColumns.map(([column, label]) => ({
    label,
    checked: sort.column === column,
    onClick: () =>
      setSort((current) => ({
        column,
        direction:
          current.column === column
            ? current.direction === "ascending"
              ? "descending"
              : "ascending"
            : column === "confirmed"
              ? "descending"
              : "ascending",
      })),
  }));

  const visibleToItems = [
    {
      label: "All",
      checked: search.who === undefined,
      onClick: () => navigateSafely({ where: search.where }),
    },
    {
      label: "Only you",
      checked: search.who === "you",
      onClick: () => navigateSafely({ who: "you", where: search.where }),
    },
    {
      label: "Everyone",
      checked: search.who === "everyone",
      onClick: () =>
        navigateSafely({
          who: "everyone",
          where: search.where === "everywhere" ? undefined : search.where,
        }),
    },
  ];

  const whereItems = [
    {
      label: "All",
      checked: search.where === undefined,
      onClick: () => navigateSafely({ who: search.who }),
    },
    {
      label: "Everywhere",
      checked: search.where === "everywhere",
      onClick: () => navigateSafely({ who: "you", where: "everywhere" }),
    },
    ...projects.map((project) => ({
      label: project.name,
      checked: search.where === project.id,
      onClick: () => navigateSafely({ who: search.who, where: project.id }),
    })),
  ];

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <MemoryTopBar
        title={isDetail ? (detail?.title ?? "Memory") : "Memory"}
        back={
          isDetail ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Back to memories"
              onClick={() =>
                navigateSafely({ who: search.who, where: search.where })
              }
            >
              <Icon name="arrow-share-left" size="sm" />
            </Button>
          ) : undefined
        }
        search={
          isDetail
            ? undefined
            : {
                value: query,
                onValueChange: (value) => {
                  setQuery(value);
                  setCursors([undefined]);
                },
              }
        }
        actions={
          isDetail ? (
            detailActions
          ) : (
            <>
              <ResponsiveButton label="Display options" items={displayItems}>
                <Icon name="settings-slider-hor" size="sm" />
              </ResponsiveButton>
              <ResponsiveButton
                label="Visible to"
                value={whoLabel(search.who)}
                items={visibleToItems}
              >
                <Icon name="user-settings" size="sm" />
              </ResponsiveButton>
              <ResponsiveButton
                label="Where"
                value={whereLabel(search.where, projects)}
                items={whereItems}
              >
                <InputGroup className="w-full">
                  <Input
                    aria-label="Search projects"
                    placeholder="Search projects"
                    value={projectQuery}
                    onChange={(event) => setProjectQuery(event.target.value)}
                  />
                </InputGroup>
              </ResponsiveButton>
            </>
          )
        }
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {empty ? (
          <div className="flex min-h-0 flex-1 items-center justify-center p-8">
            <div className="flex w-full max-w-100 flex-col items-center gap-3 text-center">
              <h2 className="text-base font-medium">No memories yet</h2>
              <p className="text-sm text-muted-foreground-1">
                Tell Capy something you’d like it to remember
              </p>
              <Button
                variant="inverse"
                size="base"
                className="mt-2"
                render={<Link to="/new" />}
              >
                Start a thread
              </Button>
            </div>
          </div>
        ) : isDetail ? (
          <section
            aria-label="Memory detail"
            className="flex min-h-0 min-w-0 flex-1 flex-col"
          >
            <div className="flex min-h-0 flex-1 overflow-y-auto md:scroll-fade-y">
              <div className="flex flex-col gap-8 px-4 pt-8 pb-4">
                {detailBody}
              </div>
            </div>
          </section>
        ) : (
          <section
            aria-label="Memory library"
            className="@container/memories flex min-h-0 min-w-0 flex-1 flex-col"
          >
            <div className="flex min-h-0 flex-1 overflow-y-auto md:scroll-fade-y">
              {listError ? (
                <div className="flex flex-col items-start gap-3 px-6 py-6 text-sm">
                  <span>Could not load memories</span>
                  <Button variant="outline" onClick={() => refreshList()}>
                    Try again
                  </Button>
                </div>
              ) : list === undefined ? (
                <div className="flex flex-col divide-y-hairline divide-border-1 border-t-hairline border-border-1">
                  {skeletonRows.map((width) => (
                    <div
                      key={width}
                      className="flex flex-col gap-2 px-6 py-3.5"
                    >
                      <span className={`h-3 rounded bg-secondary ${width}`} />
                      <span className="h-3 w-64 rounded bg-secondary" />
                    </div>
                  ))}
                </div>
              ) : list.items.length === 0 ? (
                <ListEmptyState
                  query={debouncedQuery.trim()}
                  page={list}
                  filtered={
                    search.who !== undefined || search.where !== undefined
                  }
                  onClearSearch={() => setQuery("")}
                  onClearFilters={() => navigateSafely({})}
                />
              ) : (
                <div className="flex w-full flex-col px-6 py-4">
                  <div className="-mx-4 grid grid-cols-[minmax(0,3fr)_minmax(0,1fr)_6.5rem] text-xs text-muted-foreground-1 @xl/memories:grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1.2fr)_6.5rem] @4xl/memories:grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1.2fr)_6.5rem_minmax(0,1.4fr)]">
                    <div className="flex gap-2 px-4 py-2">
                      {sortColumns.map(([column, label]) => (
                        <button
                          key={column}
                          type="button"
                          data-slot="table-column-header"
                          onClick={() =>
                            setSort((current) => ({
                              column,
                              direction:
                                current.column === column
                                  ? current.direction === "ascending"
                                    ? "descending"
                                    : "ascending"
                                  : column === "confirmed"
                                    ? "descending"
                                    : "ascending",
                            }))
                          }
                          className="whitespace-nowrap outline-none focus-visible:outline-ring-inset"
                        >
                          {label}
                          {sort.column === column && (
                            <Icon
                              name="arrow-up-left"
                              size="sm"
                              className={
                                sort.direction === "ascending"
                                  ? "rotate-180"
                                  : ""
                              }
                            />
                          )}
                        </button>
                      ))}
                    </div>
                    {ordered.map((topic) => (
                      // biome-ignore lint/a11y/useSemanticElements: Capy's memory rows are buttons inside the table's subgrid
                      <button
                        key={`${topic.volumeId}:${topic.path}`}
                        type="button"
                        data-slot="table-row"
                        role="row"
                        aria-selected={
                          detail?.volumeId === topic.volumeId &&
                          detail.path === topic.path
                        }
                        onClick={() => {
                          setSelected(topic);
                          setDraft(undefined);
                          navigateSafely({
                            who: search.who,
                            where: search.where,
                            volume: topic.volumeId,
                            file: topic.path,
                          });
                        }}
                        className="col-span-full grid grid-cols-subgrid text-left outline-none select-none hover:bg-section focus-visible:outline-ring-inset"
                      >
                        <span className="truncate px-4 py-2 text-sm font-medium text-foreground">
                          {topic.title}
                        </span>
                        <span className="truncate px-4 py-2">
                          {scopeLabel(topic.scope)}
                        </span>
                        <span className="hidden truncate px-4 py-2 @xl/memories:block">
                          {whereLabel(topic.projectId ?? undefined, projects)}
                        </span>
                        <span className="truncate px-4 py-2 tabular-nums">
                          {topic.lastConfirmed ?? "Not recorded"}
                        </span>
                        <span className="hidden truncate px-4 py-2 @4xl/memories:block">
                          {topic.source === null
                            ? "Not recorded"
                            : plainSource(topic.source)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {list !== undefined &&
              (list.skipped > 0 ||
                list.nextCursor !== null ||
                cursors.length > 1) && (
                <p className="px-6 pt-2 text-xs text-muted-foreground-2">
                  {list.scanned} memories checked on this page
                  {list.skipped > 0 ? ` · ${list.skipped} unreadable` : ""}
                </p>
              )}
            {(cursors.length > 1 || list?.nextCursor != null) && (
              <div className="flex shrink-0 items-center justify-between px-6 py-3">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Previous page"
                  disabled={cursors.length === 1}
                  onClick={() => setCursors((current) => current.slice(0, -1))}
                >
                  <Icon name="arrow-share-left" size="sm" />
                </Button>
                <span className="text-xs text-muted-foreground-2">
                  Page {cursors.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Next page"
                  disabled={list?.nextCursor == null}
                  onClick={() =>
                    setCursors((current) => [
                      ...current,
                      list?.nextCursor ?? undefined,
                    ])
                  }
                >
                  <Icon name="chevron-right" size="sm" />
                </Button>
              </div>
            )}
          </section>
        )}
      </div>
      <ConfirmForgetDialog
        topic={forgetting}
        where={whereLabel(search.where, projects)}
        busy={busy}
        onCancel={() => setForgetting(undefined)}
        onConfirm={confirmForget}
      />
      {discardOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Discard unsaved changes?"
        >
          <h2>Discard unsaved changes?</h2>
          <p>Your changes to this memory haven’t been saved</p>
          <Button
            variant="ghost"
            onClick={() => {
              setDiscardOpen(false);
              setDraft(undefined);
              pendingNavigation.current?.();
            }}
          >
            Discard
          </Button>
          <Button variant="ghost" onClick={() => setDiscardOpen(false)}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
