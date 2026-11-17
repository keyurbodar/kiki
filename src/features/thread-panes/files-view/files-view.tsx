import { type ReactNode, useDeferredValue, useState } from "react";
import {
  type FilesFilter,
  useFilesBrowserState,
} from "@/components/file-browser/browser-state";
import {
  type DriveLocation,
  driveLocationKey,
  FileHome,
  threadDriveLocations,
} from "@/components/file-home";
import {
  createPathMatcher,
  type PathMatch,
  SearchPath,
} from "@/components/file-search";
import { FileTree, folderPathsOf } from "@/components/file-tree";
import { FileEmpty } from "@/components/file-view/file-empty";
import type { TimelineRow } from "@/data/events";
import { cn } from "@/lib/cn";
import { Button } from "@/primitives/button";
import { FilesBand, filesSearchRowId } from "./files-band";
import { type FilesMachine, MachineGate } from "./machine-gate";
import {
  type FileMention,
  FilesSkeleton,
  RootBody,
  RootCount,
  RootNote,
  RootRow,
  RowActions,
  UploadsHome,
} from "./parts";
import {
  displayPath,
  type FileSourceValue,
  MACHINE_ROOT,
  type OpenTab,
  openMarks,
  SEARCH_LIMIT,
  type ThreadAttachment,
  type ThreadSource,
  threadSources,
  threadUploads,
  UPLOADS_ROOT,
} from "./thread-files";

const emptyRows: readonly TimelineRow[] = [];
const emptyTabs: readonly OpenTab[] = [];
const emptyIds: readonly string[] = [];

export type DriveListing = {
  paths?: readonly string[];
  failed?: boolean;
};

export type MachineFileTarget = {
  path: string;
  jamId?: string;
  machineId?: string;
};

export type FilesViewProps = {
  jamId: string;
  rootJamId?: string;
  projectId?: string | null;
  captainJamId?: string | null;
  userId?: string;
  rows?: readonly TimelineRow[];
  hasOlder?: boolean;
  loadingOlder?: boolean;
  onLoadOlder?: () => void;
  tabs?: readonly OpenTab[];
  previews?: readonly string[];
  activeId?: string;
  focus?: "search" | "drive";
  onFocus?: (focus: undefined) => void;
  machineId?: string;
  workspaceRoot?: string;
  devices?: ReadonlyArray<{ machineId: string; name: string }>;
  resolveDrive?: (location: string) => DriveLocation | undefined;
  drives?: (location: DriveLocation) => DriveListing | undefined;
  machine?: FilesMachine;
  onOpenMachineFile?: (target: MachineFileTarget) => void;
  onOpenDriveFile?: (location: DriveLocation, path: string) => void;
  onOpenAttachment?: (
    attachment: ThreadAttachment,
    siblings: readonly ThreadAttachment[],
  ) => void;
  onOpenDiffs?: () => void;
  onAddToChat?: (mention: FileMention) => void;
};

type ThreadRoot = {
  key: string;
  home: ReactNode;
  rank: number;
  files: { display: string; entry: ThreadSource }[];
};

type SearchGroup = {
  key: string;
  home: ReactNode;
  matches: PathMatch[];
  pending: boolean;
};

const noop = () => {};

function MachineHome({
  rootJamId,
  device,
}: {
  rootJamId: string;
  device?: string;
}) {
  return (
    <FileHome
      home={
        device === undefined
          ? { kind: "machine", jamId: rootJamId }
          : { kind: "device", name: device }
      }
    />
  );
}

export function FilesView({
  jamId,
  rootJamId = jamId,
  projectId = null,
  captainJamId,
  userId,
  rows = emptyRows,
  hasOlder = false,
  loadingOlder = false,
  onLoadOlder,
  tabs = emptyTabs,
  previews = emptyIds,
  activeId,
  focus,
  onFocus = noop,
  machineId,
  workspaceRoot,
  devices = [],
  resolveDrive = () => undefined,
  drives = () => undefined,
  machine = { state: "none" },
  onOpenMachineFile = noop,
  onOpenDriveFile = noop,
  onOpenAttachment = noop,
  onOpenDiffs,
  onAddToChat,
}: FilesViewProps) {
  const browser = useFilesBrowserState(rootJamId, userId);
  const filter: FilesFilter =
    browser.filter ?? (captainJamId === rootJamId ? "all" : "thread");
  const threadOnly = filter === "thread";
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const deferredQuery = useDeferredValue(query);
  const browsing = deferredQuery === "";

  const uploads = threadUploads(rows);
  const uploadPaths = uploads.map((upload) => upload.path);
  const locations = threadDriveLocations(captainJamId, projectId);
  const locationKeys = locations.map(driveLocationKey);
  const openTabs = { files: tabs, previews, activeId };

  const roots: ThreadRoot[] = [];
  for (const entry of threadSources(rows, jamId)) {
    const source = entry.source;
    const location =
      source.kind === "drive" ? resolveDrive(source.location) : undefined;
    const own = source.kind === "machine" && source.machineId === machineId;
    const device =
      source.kind === "machine" && !own
        ? devices.find((item) => item.machineId === source.machineId)
        : undefined;
    const driveIndex =
      location === undefined
        ? 10
        : locationKeys.indexOf(driveLocationKey(location));
    const rank =
      source.kind === "machine"
        ? own
          ? 20
          : 21
        : driveIndex === -1
          ? 9
          : driveIndex;
    const key =
      source.kind === "drive"
        ? location === undefined
          ? `folder:${source.location}`
          : driveLocationKey(location)
        : own
          ? MACHINE_ROOT
          : `machine:${source.machineId}`;
    const home =
      source.kind === "drive" ? (
        <FileHome
          home={
            location === undefined
              ? { kind: "folder", name: source.location }
              : { kind: "drive", location }
          }
        />
      ) : own ? (
        <MachineHome rootJamId={rootJamId} />
      ) : (
        <FileHome
          home={
            device === undefined
              ? { kind: "machine", jamId: entry.from }
              : { kind: "device", name: device.name }
          }
        />
      );
    const file = {
      display:
        source.kind === "drive"
          ? source.path.replace(/^\/+/, "")
          : displayPath(source.path, own ? workspaceRoot : undefined),
      entry,
    };
    const existing = roots.find((root) => root.key === key);
    if (existing === undefined) roots.push({ key, home, rank, files: [file] });
    else existing.files.push(file);
  }
  roots.sort((a, b) => a.rank - b.rank);

  const openSource = (entry: ThreadSource) => {
    const source: FileSourceValue = entry.source;
    if (source.kind === "machine") {
      onOpenMachineFile({
        path: source.path,
        jamId:
          entry.from === jamId || source.machineId === machineId
            ? undefined
            : entry.from,
        machineId: source.machineId,
      });
      return;
    }
    const location = resolveDrive(source.location);
    if (location === undefined)
      onOpenMachineFile({
        path: `~/.capy/drive/${source.location}/${source.path}`,
      });
    else onOpenDriveFile(location, source.path);
  };

  const machinePaths =
    machine.state === "awake" ? [...(machine.paths ?? [])] : [];
  const searchSources: {
    key: string;
    home: ReactNode;
    paths: readonly string[];
    pending: boolean;
  }[] = threadOnly
    ? [
        ...roots.map((root) => ({
          key: root.key,
          home: root.home,
          paths: root.files.map((file) => file.display),
          pending: false,
        })),
        {
          key: UPLOADS_ROOT,
          home: <UploadsHome />,
          paths: uploadPaths,
          pending: false,
        },
      ]
    : [
        ...locations.flatMap((location) => {
          const listing = drives(location);
          if (listing === undefined && location.kind !== "captain") return [];
          return [
            {
              key: driveLocationKey(location),
              home: <FileHome home={{ kind: "drive", location }} />,
              paths: listing?.paths ?? [],
              pending: listing === undefined,
            },
          ];
        }),
        {
          key: MACHINE_ROOT,
          home: <MachineHome rootJamId={rootJamId} />,
          paths: machinePaths,
          pending: machine.state === "loading",
        },
        {
          key: UPLOADS_ROOT,
          home: <UploadsHome />,
          paths: uploadPaths,
          pending: false,
        },
      ];

  let budget = SEARCH_LIMIT;
  const groups: SearchGroup[] = browsing
    ? []
    : searchSources.flatMap((source) => {
        if (budget <= 0) return [];
        const matches = createPathMatcher(source.paths)(deferredQuery, budget);
        budget -= matches.length;
        return matches.length === 0 && !source.pending
          ? []
          : [
              {
                key: source.key,
                home: source.home,
                matches,
                pending: source.pending,
              },
            ];
      });
  const flat = groups.flatMap((group) =>
    group.matches.map((match) => ({ key: group.key, path: match.path })),
  );
  const active = Math.min(highlighted, Math.max(0, flat.length - 1));

  const openResult = (key: string, path: string) => {
    if (key === UPLOADS_ROOT) {
      const upload = uploads.find((item) => item.path === path);
      if (upload !== undefined)
        onOpenAttachment(upload.attachment, upload.siblings);
      return;
    }
    if (threadOnly) {
      const file = roots
        .find((root) => root.key === key)
        ?.files.find((item) => item.display === path);
      if (file !== undefined) openSource(file.entry);
      return;
    }
    if (key === MACHINE_ROOT) {
      onOpenMachineFile({ path });
      return;
    }
    const location = locations.find((item) => driveLocationKey(item) === key);
    if (location !== undefined) onOpenDriveFile(location, path);
  };

  const uploadsOpen = threadOnly
    ? browser.isThreadOpen(UPLOADS_ROOT)
    : browser.isOpen(UPLOADS_ROOT);
  const toggle = (key: string) =>
    threadOnly
      ? browser.setThreadOpen(key, !browser.isThreadOpen(key))
      : browser.setOpen(key, !browser.isOpen(key));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <FilesBand
        query={query}
        onQueryChange={(next) => {
          setHighlighted(0);
          setQuery(next);
        }}
        count={flat.length}
        highlighted={active}
        onHighlight={setHighlighted}
        onOpenHighlighted={() => {
          const target = flat[active];
          if (target !== undefined) openResult(target.key, target.path);
        }}
        focus={focus}
        onFocus={onFocus}
        filter={filter}
        onFilter={browser.setFilter}
      />
      <div
        className={cn(
          "scroll-fade-y flex min-h-0 flex-1 flex-col overflow-y-auto pt-1.5 pb-3 [container-type:size]",
          !browsing && "hidden",
        )}
      >
        {threadOnly &&
          roots.map((root) => {
            const open = browser.isThreadOpen(root.key);
            const byDisplay = new Map(
              root.files.map((file) => [file.display, file.entry]),
            );
            return (
              <section key={root.key}>
                <RootRow
                  home={root.home}
                  open={open}
                  meta={<RootCount count={byDisplay.size} />}
                  onToggle={() => toggle(root.key)}
                />
                {open && (
                  <RootBody>
                    <FileTree
                      fit
                      paths={[...byDisplay.keys()]}
                      {...openMarks(
                        openTabs,
                        root.key,
                        (tab) =>
                          root.files.find(
                            (file) => file.entry.source.path === tab.path,
                          )?.display,
                      )}
                      initialExpansion="open"
                      filter=""
                      onOpen={(path) => {
                        const entry = byDisplay.get(path);
                        if (entry !== undefined) openSource(entry);
                      }}
                    />
                  </RootBody>
                )}
              </section>
            );
          })}
        {threadOnly &&
          roots.length === 0 &&
          uploads.length === 0 &&
          !hasOlder && (
            <FileEmpty
              line="No files in this thread yet"
              action={
                <Button
                  data-track-owner="features/thread/pane/files-view.tsx#FilesView:Button[Show all files]"
                  variant="ghost"
                  size="sm"
                  className="inline-flex h-7 items-center rounded px-2 text-sm font-medium text-foreground hover:bg-secondary"
                  onClick={() => browser.setFilter("all")}
                >
                  Show all files
                </Button>
              }
            />
          )}
        {!threadOnly &&
          locations.map((location) => {
            const key = driveLocationKey(location);
            return (
              <DriveRoot
                key={key}
                location={location}
                listing={drives(location)}
                open={browser.isOpen(key)}
                folders={browser.foldersOf(key)}
                onToggle={() => toggle(key)}
                onFolders={(folders) => browser.setFolders(key, folders)}
                marks={openMarks(openTabs, key)}
                onOpenFile={(path) => onOpenDriveFile(location, path)}
                onAddToChat={onAddToChat}
              />
            );
          })}
        {!threadOnly && (
          <section>
            <RootRow
              home={<MachineHome rootJamId={rootJamId} />}
              open={browser.isOpen(MACHINE_ROOT)}
              onToggle={() => toggle(MACHINE_ROOT)}
            />
            {browser.isOpen(MACHINE_ROOT) && (
              <MachineGate machine={machine} onOpenDiffs={onOpenDiffs}>
                {(awake) =>
                  awake.failed === true ? (
                    <FileEmpty
                      line="Files unavailable"
                      sub="The machine did not answer"
                      action={
                        awake.onRetry === undefined ? undefined : (
                          <Button
                            data-track-owner="features/thread/pane/files-view.tsx#CapturedFiles:RetryButton.1"
                            variant="ghost"
                            size="xs"
                            onClick={awake.onRetry}
                          >
                            Retry
                          </Button>
                        )
                      }
                    />
                  ) : awake.paths === undefined ? (
                    <FilesSkeleton />
                  ) : awake.paths.length === 0 ? (
                    <RootBody>
                      <RootNote>No files captured yet</RootNote>
                    </RootBody>
                  ) : (
                    <RootBody>
                      <FileTree
                        fit
                        paths={awake.paths}
                        truncated={awake.truncated}
                        {...openMarks(openTabs, MACHINE_ROOT)}
                        filter=""
                        collapsedPaths={[...folderPathsOf(awake.paths)].filter(
                          (folder) =>
                            !browser.foldersOf(MACHINE_ROOT).includes(folder),
                        )}
                        onCollapsedChange={(collapsed) => {
                          const closed = new Set(collapsed);
                          browser.setFolders(
                            MACHINE_ROOT,
                            [...folderPathsOf(awake.paths ?? [])].filter(
                              (folder) => !closed.has(folder),
                            ),
                          );
                        }}
                        onOpen={(path) => onOpenMachineFile({ path })}
                        contextMenu={(entry, close) => (
                          <RowActions
                            path={entry.path.replace(/\/+$/, "")}
                            directory={entry.kind === "directory"}
                            close={close}
                            onAddToChat={onAddToChat}
                          />
                        )}
                      />
                    </RootBody>
                  )
                }
              </MachineGate>
            )}
          </section>
        )}
        {(uploads.length > 0 || hasOlder) && (
          <section>
            <RootRow
              home={<UploadsHome />}
              open={uploadsOpen}
              meta={hasOlder ? undefined : <RootCount count={uploads.length} />}
              onToggle={() => toggle(UPLOADS_ROOT)}
            />
            {uploadsOpen && (
              <RootBody>
                {uploads.length > 0 && (
                  <FileTree
                    fit
                    paths={uploadPaths}
                    {...openMarks(openTabs, UPLOADS_ROOT)}
                    filter=""
                    onOpen={(path) => openResult(UPLOADS_ROOT, path)}
                  />
                )}
                {hasOlder && (
                  <Button
                    data-track-owner="features/thread/pane/files-view.tsx#FilesView:Button[Load older messages]"
                    variant="ghost"
                    size="xs"
                    className="ml-5"
                    disabled={loadingOlder}
                    onClick={onLoadOlder}
                  >
                    {loadingOlder
                      ? "Loading older messages"
                      : "Load older messages"}
                  </Button>
                )}
              </RootBody>
            )}
          </section>
        )}
      </div>
      {!browsing && (
        <div
          role="listbox"
          id="capy-files-search"
          aria-label="Matching files"
          className="scroll-fade-y min-h-0 flex-1 overflow-y-auto px-2 pt-1 pb-3"
        >
          {groups.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground-2">
              No results found
            </div>
          ) : (
            groups.map((group) => {
              const offset = flat.findIndex((item) => item.key === group.key);
              return (
                <fieldset
                  key={group.key}
                  aria-label={group.key}
                  className="m-0 min-w-0 border-0 p-0 pb-1"
                >
                  <div className="flex h-7 items-center gap-1.5 px-2 text-xs text-muted-foreground-2">
                    {group.home}
                  </div>
                  {group.matches.length === 0 ? (
                    <div className="px-2 pb-1 text-xs text-muted-foreground-3">
                      Searching
                    </div>
                  ) : (
                    group.matches.map((match, index) => {
                      const position = offset + index;
                      return (
                        <div
                          key={match.path}
                          data-track-owner="features/thread/pane/files-view.tsx#FilesView:div.1"
                          id={filesSearchRowId(position)}
                          role="option"
                          tabIndex={-1}
                          aria-selected={position === active}
                          data-highlighted={
                            position === active ? "" : undefined
                          }
                          className="relative flex h-(--h-menu-row) w-full min-w-0 cursor-pointer items-center gap-2 rounded px-2 text-left text-sm font-normal text-foreground outline-none select-none data-[highlighted]:bg-[var(--menu-row-highlight,var(--popover-hover))]"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            openResult(group.key, match.path);
                          }}
                          onMouseEnter={() => setHighlighted(position)}
                        >
                          <FileGlyph
                            name={match.path.split("/").at(-1) ?? match.path}
                          />
                          <SearchPath
                            path={match.path}
                            where={match.where}
                            ranges={match.ranges}
                          />
                        </div>
                      );
                    })
                  )}
                </fieldset>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function FileGlyph({ name }: { name: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      data-file-name={name}
      className="size-4 shrink-0 text-icon-muted"
    >
      <path
        d="M13 3H8C6.34315 3 5 4.34315 5 6V18C5 19.6569 6.34315 21 8 21H16C17.6569 21 19 19.6569 19 18V9M13 3L19 9M13 3V7C13 8.10457 13.8954 9 15 9H19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type DriveRootProps = {
  location: DriveLocation;
  listing: DriveListing | undefined;
  open: boolean;
  folders: readonly string[];
  onToggle: () => void;
  onFolders: (folders: readonly string[]) => void;
  marks: ReturnType<typeof openMarks>;
  onOpenFile: (path: string) => void;
  onAddToChat?: (mention: FileMention) => void;
};

function DriveRoot({
  location,
  listing,
  open,
  folders,
  onToggle,
  onFolders,
  marks,
  onOpenFile,
  onAddToChat,
}: DriveRootProps) {
  const paths = listing?.paths;
  const failed = listing?.failed === true;
  const settled = listing !== undefined;
  if (
    location.kind !== "captain" &&
    (paths?.length === 0 || (paths === undefined && !failed))
  )
    return null;
  const allFolders = [...folderPathsOf(paths ?? [])];
  return (
    <section>
      <RootRow
        home={<FileHome home={{ kind: "drive", location }} />}
        open={open}
        meta={
          paths === undefined ? undefined : <RootCount count={paths.length} />
        }
        onToggle={onToggle}
      />
      {open && (
        <RootBody>
          {failed ? (
            <RootNote>Drive unavailable</RootNote>
          ) : !settled ? (
            <FilesSkeleton />
          ) : paths === undefined || paths.length === 0 ? (
            <RootNote>No files yet</RootNote>
          ) : (
            <FileTree
              fit
              paths={paths}
              {...marks}
              filter=""
              collapsedPaths={allFolders.filter(
                (folder) => !folders.includes(folder),
              )}
              onCollapsedChange={(collapsed) => {
                const closed = new Set(collapsed);
                onFolders(allFolders.filter((folder) => !closed.has(folder)));
              }}
              onOpen={onOpenFile}
              contextMenu={(entry, close) => (
                <RowActions
                  path={entry.path.replace(/\/+$/, "")}
                  directory={entry.kind === "directory"}
                  close={close}
                  onAddToChat={onAddToChat}
                />
              )}
            />
          )}
        </RootBody>
      )}
    </section>
  );
}
