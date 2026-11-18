import { Link, useNavigate } from "@tanstack/react-router";
import { DateTime } from "effect";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AppTopBar } from "@/components/app-top-bar";
import type { VolumeVersionRow } from "@/data/api/schemas/drive";
import type { DriveScopeQuery } from "@/data/atoms/drive";
import { formatRelativeTime } from "@/features/drive/lib/format";
import {
  type DriveMount,
  mountScope,
  mountTrail,
} from "@/features/drive/lib/mount";
import {
  buildUpload,
  DropOverlay,
  instructionsPath,
  instructionsTemplate,
  NewFileDialog,
  NewSkillDialog,
  pathCollisions,
  skillFilePath,
  skillNameOf,
  skillTemplate,
  type UploadChange,
  type UploadFile,
  uploadedMessage,
  useFileDrop,
  useVolumeWriter,
  VolumeAddMenu,
} from "@/features/drive/volume-authoring";
import { VolumeHistory } from "@/features/drive/volume-history";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import {
  cleanDraft,
  discardDraft,
  editorStateKey,
  type FileDraft,
  type LoadedFile,
  markDirty,
  parentDirectory,
  settleSave,
  sha256Hex,
} from "./draft";
import { clearDraftText, draftText } from "./draft-text";
import { DriveConfirmDialog } from "./drive-confirm-dialog";
import { PaneMessage } from "./pane-message";
import { type DriveEntry, useDriveListing } from "./use-drive-listing";
import { useDriveSession } from "./use-drive-session";
import { useDriveTrailNames } from "./use-drive-trail-names";
import { LoadedVolumeFile } from "./viewer-chrome";

export interface DriveDetailPageProps {
  readonly mount: DriveMount;
  /** A file to open, from the route's search params. */
  readonly file?: string;
}

const emptySub = (mount: DriveMount) =>
  mount.kind === "automation"
    ? "Add files by hand or let Capy write state here between runs"
    : mount.kind === "captain"
      ? "Crew threads leave files here as they work"
      : "Add a skill or instructions by hand, or ask Capy in a thread";

const toQuery = (scope: ReturnType<typeof mountScope>): DriveScopeQuery =>
  Object.fromEntries(
    Object.entries(scope).filter(([, value]) => value !== null),
  ) as DriveScopeQuery;

/** One drive scope: its files, the open file, authoring, uploads and history. */
export function DriveDetailPage({ mount, file }: DriveDetailPageProps) {
  const navigate = useNavigate();
  const session = useDriveSession();
  const { names } = useDriveTrailNames(mount);
  const scope =
    mount.kind === "directory" &&
    mount.scope === "personal" &&
    session.userId === undefined
      ? undefined
      : mount.kind === "project" &&
          mount.scope === "personal" &&
          session.userId === undefined
        ? undefined
        : toQuery(mountScope(mount, session.userId));
  const trail = mountTrail(mount, names, true);
  /** A Captain's drive is writable too: Capy offers Add, New skill and drop on it. */
  const writable = true;
  const { listing, failed } = useDriveListing(session.orgId, scope);
  const [reloads, setReloads] = useState(0);
  const entries = listing?.entries ?? [];
  const paths = new Set(entries.map((entry) => entry.path));
  const skillNames = new Set(
    entries.flatMap((entry) => skillNameOf(entry.path) ?? []),
  );

  const [selected, setSelected] = useState<string | undefined>(file);
  const [browse, setBrowse] = useState("");
  const [filter, setFilter] = useState("");
  const [draft, setDraft] = useState<FileDraft>(cleanDraft);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState(false);
  const [newFile, setNewFile] = useState(false);
  const [pending, setPending] = useState<() => void>();
  const [deleting, setDeleting] = useState<{ path: string; count: number }>();
  const [restoring, setRestoring] = useState<VolumeVersionRow>();
  const [replacing, setReplacing] = useState<{
    count: number;
    replaced: Array<string>;
    changes: ReadonlyArray<UploadChange>;
  }>();

  const dirty = draft.state === "dirty";
  const dirtyPath = dirty ? draft.path : undefined;
  const directory = selected === undefined ? browse : parentDirectory(selected);
  const stateKey = editorStateKey(
    session.orgId,
    scope,
    selected,
    draft.session,
  );
  const main = listing?.main;

  useEffect(() => {
    if (file === undefined) return;
    setSelected(file);
    void navigate({ to: ".", search: {}, replace: true });
  }, [file, navigate]);

  useEffect(() => {
    if (!dirty) return;
    const guard = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);

  const listed = entries.find((entry) => entry.path === selected);
  const orphaned = listed === undefined && dirty && draft.path === selected;
  const entry: DriveEntry | undefined =
    listed ??
    (orphaned && main !== undefined && draft.state === "dirty"
      ? {
          path: draft.path,
          mode: 420,
          sizeBytes: draft.loaded.sizeBytes,
          sha256: draft.loaded.sha256,
          volume: main,
          versionId: draft.loaded.versionId,
        }
      : undefined);

  useEffect(() => {
    if (!orphaned) return;
    toast.warning("This file was removed by another writer", {
      description: "Saving recreates it from your draft",
    });
  }, [orphaned]);

  const writer = useVolumeWriter({
    orgId: session.orgId,
    scope,
    headDigest: main?.headDigest ?? null,
    onDriveFull: () => {
      setNewSkill(false);
      setNewFile(false);
    },
    onReload: () => setReloads(reloads + 1),
  });

  const guard = (action: () => void) =>
    dirty ? setPending(() => action) : action();
  const open = (path: string) =>
    path !== selected && guard(() => setSelected(path));
  const openDirectory = (path: string) =>
    guard(() => {
      setSelected(undefined);
      setBrowse(path);
    });
  const close = () => guard(() => setSelected(undefined));
  const discard = useCallback(() => {
    clearDraftText(stateKey);
    setDraft(discardDraft);
  }, [stateKey]);

  const createSkill = (name: string, description: string) => {
    const path = skillFilePath(name);
    return writer
      .put(
        [{ path, content: skillTemplate(name, description) }],
        "Skill created",
        "Could not create skill",
      )
      .then((created) => {
        if (created) setSelected(path);
        return created;
      });
  };
  const createFile = (path: string) =>
    writer
      .put([{ path, content: "" }], "File created", "Could not create file")
      .then((created) => {
        if (created) setSelected(path);
        return created;
      });
  const addInstructions = () =>
    void writer
      .put(
        [{ path: instructionsPath, content: instructionsTemplate }],
        "Instructions added",
        "Could not add instructions",
      )
      .then((added) => added && setSelected(instructionsPath));

  const save = useCallback(() => {
    if (draft.state !== "dirty" || saving) return;
    const { path, session: editing, loaded, supersedes } = draft;
    const content = draftText(stateKey);
    if (content === undefined) {
      toast.error("Could not save file");
      return;
    }
    setSaving(true);
    writer
      .put([{ path, content }], "Saved", "Could not save file")
      .then((saved) => (saved ? sha256Hex(content) : undefined))
      .then((sha256) => {
        if (sha256 === undefined) return;
        setDraft((current) =>
          settleSave(current, {
            session: editing,
            path,
            loaded,
            supersedes,
            sha256,
            editedSince: draftText(stateKey) !== content,
          }),
        );
      })
      .catch(() => toast.error("Could not save file"))
      .finally(() => setSaving(false));
  }, [draft, saving, stateKey, writer]);

  const uploads = (files: Array<UploadFile>) => {
    if (files.length === 0) return;
    void buildUpload(files, directory).then((upload) => {
      if (upload === undefined) {
        toast.error("Upload is over 32 MB", {
          description: "Split it into smaller uploads",
        });
        return;
      }
      const replaced = new Set(
        upload.changes.flatMap((change) => pathCollisions(paths, change.path)),
      );
      if (replaced.size > 0) {
        setReplacing({
          count: files.length,
          replaced: [...replaced],
          changes: upload.changes,
        });
        return;
      }
      void writer.put(
        upload.changes,
        uploadedMessage(files.length, upload),
        "Could not upload",
      );
    });
  };
  const drop = useFileDrop(uploads);

  const confirmDelete = () => {
    if (deleting === undefined) return;
    const target = deleting;
    void writer
      .put(
        [{ path: target.path, delete: true }],
        target.count === 1 ? "File deleted" : `${target.count} files deleted`,
        "Could not delete",
      )
      .then((deleted) => {
        if (
          deleted &&
          (selected === target.path || selected?.startsWith(`${target.path}/`))
        ) {
          discard();
          setSelected(undefined);
        }
      });
  };

  const heads = new Set(
    (listing?.volumes ?? []).flatMap((volume) => volume.headVersionId ?? []),
  );
  const onRestore = writable ? setRestoring : undefined;
  const startActions = writable && (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => guard(() => setNewSkill(true))}
      >
        <Icon name="sparkle" />
        New skill
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => guard(addInstructions)}
      >
        <Icon name="book" />
        Add instructions
      </Button>
      <VolumeAddMenu
        hasInstructions={false}
        only="uploads"
        onNewFile={() => guard(() => setNewFile(true))}
        onNewSkill={() => guard(() => setNewSkill(true))}
        onAddInstructions={() => guard(addInstructions)}
        onUploads={uploads}
        trigger={
          <Button variant="outline" size="sm">
            <Icon name="import" />
            Upload
          </Button>
        }
      />
    </>
  );
  const emptyActions = (
    <span className="flex flex-wrap items-center justify-center gap-1.5">
      {startActions}
      {main?.headVersionId != null && session.orgId !== undefined && (
        <VolumeHistory
          orgId={session.orgId}
          volumeId={main.id}
          heads={new Set([main.headVersionId])}
          onRestore={onRestore}
          isAdmin={session.isAdmin}
          trigger={
            <Button variant="ghost" size="sm">
              <Icon name="history" />
              History
            </Button>
          }
        />
      )}
    </span>
  );

  const body = () => {
    if (listing === undefined) {
      return failed ? (
        <PaneMessage
          line="Capy Drive unavailable"
          action={
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setReloads(reloads + 1)}
            >
              Retry
            </Button>
          }
        />
      ) : (
        <PaneMessage line="Loading Capy Drive" />
      );
    }
    if (listing.entries.length === 0 && entry === undefined) {
      return (
        <PaneMessage
          line="No files yet"
          sub={emptySub(mount)}
          action={emptyActions}
        />
      );
    }
    const needle = filter.trim().toLowerCase();
    const shown = entries
      .filter(
        (candidate) => browse === "" || candidate.path.startsWith(`${browse}/`),
      )
      .filter(
        (candidate) =>
          needle === "" || candidate.path.toLowerCase().includes(needle),
      )
      .sort((a, b) => a.path.localeCompare(b.path));
    return (
      <>
        <aside
          className={`flex min-h-0 w-full flex-col border-r-(length:--border-width-hairline) border-border-1 md:w-72 ${selected === undefined ? "" : "max-md:hidden"}`}
        >
          <div className="flex h-9 shrink-0 items-center gap-1 px-2">
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-muted-foreground-2">
              {browse === "" ? "Files" : `${browse}/`}
            </span>
            {writable && (
              <VolumeAddMenu
                hasInstructions={paths.has(instructionsPath)}
                onNewFile={() => guard(() => setNewFile(true))}
                onNewSkill={() => guard(() => setNewSkill(true))}
                onAddInstructions={() => guard(addInstructions)}
                onUploads={uploads}
              />
            )}
            {main !== undefined && session.orgId !== undefined && (
              <VolumeHistory
                orgId={session.orgId}
                volumeId={main.id}
                heads={heads}
                onRestore={onRestore}
                isAdmin={session.isAdmin}
              />
            )}
          </div>
          <ul className="flex min-h-0 flex-1 flex-col overflow-y-auto p-1">
            <li>
              <Input
                icon={<Icon name="magnifying-glass" />}
                size="sm"
                aria-label="Filter names and paths"
                placeholder="Filter names and paths"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              />
            </li>
            {shown.length === 0 && needle !== "" && (
              <li className="kiki-pane-empty text-xs font-normal text-muted-foreground-2">
                No files match
              </li>
            )}
            {shown.map((candidate) => (
              <li key={candidate.path} className="group flex items-center">
                <button
                  type="button"
                  data-selected={candidate.path === selected || undefined}
                  className="flex min-h-7 min-w-0 flex-1 items-center gap-2 rounded px-2 text-left text-sm text-foreground outline-none hover:bg-secondary focus-visible:outline-ring-inset data-[selected]:bg-secondary"
                  onClick={() => open(candidate.path)}
                >
                  <span className="min-w-0 flex-1 truncate">
                    {candidate.path}
                  </span>
                  {skillNameOf(candidate.path) !== undefined && (
                    <span className="shrink-0 text-xs text-muted-foreground-3">
                      Skill
                    </span>
                  )}
                </button>
                {writable && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Delete file"
                    className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                    onClick={() =>
                      setDeleting({ path: candidate.path, count: 1 })
                    }
                  >
                    <Icon name="trash-can" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </aside>
        <div
          className={`flex min-h-0 min-w-0 flex-1 ${selected === undefined ? "max-md:hidden" : ""}`}
        >
          {selected === undefined ? (
            <PaneMessage line="Select a file" />
          ) : entry === undefined || session.orgId === undefined ? (
            <PaneMessage
              line="File not found"
              sub={selected}
              action={
                <Button variant="ghost" size="xs" onClick={close}>
                  Browse files
                </Button>
              }
            />
          ) : (
            <LoadedVolumeFile
              key={`${entry.path}:${reloads}`}
              orgId={session.orgId}
              entry={entry}
              draft={draft}
              stateKey={stateKey}
              saving={saving}
              writable={writable}
              onDirty={(loaded: LoadedFile) =>
                setDraft((current) => markDirty(current, loaded))
              }
              onSave={save}
              onDiscard={discard}
              onDelete={
                writable
                  ? () => setDeleting({ path: entry.path, count: 1 })
                  : undefined
              }
              onBack={close}
              onCrumb={openDirectory}
            />
          )}
        </div>
      </>
    );
  };

  const deletingFile =
    deleting !== undefined && deleting.count === 1 && paths.has(deleting.path);
  return (
    <>
      <div className="flex h-full min-h-0 flex-col">
        <AppTopBar
          title={
            <span className="flex min-w-0 items-center gap-1.5">
              {trail.crumbs.map((crumb) => (
                <span key={crumb.label} className="contents">
                  {crumb.route === undefined ? (
                    <Link
                      to="/drive"
                      className="focus-gutter min-w-0 truncate rounded font-medium text-muted-foreground-2 transition-colors duration-100 outline-none hover:text-foreground focus-visible:outline-ring-inset"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <Link
                      {...crumb.route}
                      className="focus-gutter min-w-0 truncate rounded font-medium text-muted-foreground-2 transition-colors duration-100 outline-none hover:text-foreground focus-visible:outline-ring-inset"
                    >
                      {crumb.label}
                    </Link>
                  )}
                  <Icon
                    name="chevron-right-small"
                    aria-hidden
                    className="size-(--icon-sm) shrink-0 text-muted-foreground-3"
                  />
                </span>
              ))}
              <span className="min-w-0 truncate">{trail.title}</span>
            </span>
          }
        />
        {writer.driveFull !== undefined && (
          <div className="px-4 pt-3">
            <div className="rounded-(--radius-card) border-hairline border-border-2 bg-card p-3 text-sm text-foreground">
              This change was not saved
            </div>
          </div>
        )}
        <div
          className="relative flex min-h-0 flex-1"
          {...(writable ? drop.handlers : {})}
        >
          {writable && drop.over && <DropOverlay directory={directory} />}
          {body()}
        </div>
      </div>
      <NewSkillDialog
        open={newSkill}
        onOpenChange={setNewSkill}
        existing={skillNames}
        onCreate={createSkill}
      />
      <NewFileDialog
        open={newFile}
        onOpenChange={setNewFile}
        directory={directory}
        existing={paths}
        onCreate={createFile}
      />
      <DriveConfirmDialog
        open={deleting !== undefined}
        onOpenChange={(next) => !next && setDeleting(undefined)}
        title={deletingFile ? "Delete file" : "Delete folder"}
        description={
          deleting === undefined
            ? ""
            : deletingFile
              ? deleting.path
              : `${deleting.path}/ and its ${deleting.count} ${deleting.count === 1 ? "file" : "files"}`
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
      <DriveConfirmDialog
        open={restoring !== undefined}
        onOpenChange={(next) => !next && setRestoring(undefined)}
        title="Restore version"
        description={
          restoring === undefined
            ? ""
            : `Files return to the ${restoring.fileCount} ${restoring.fileCount === 1 ? "file" : "files"} from ${formatRelativeTime(DateTime.toEpochMillis(restoring.createdAt))} as a new version`
        }
        confirmLabel="Restore"
        intent="accent"
        onConfirm={() => {
          const volume = listing?.volumes.find(
            (candidate) => candidate.id === restoring?.volumeId,
          );
          if (restoring !== undefined && volume?.headDigest != null) {
            void writer.restore(
              restoring.volumeId,
              restoring.id,
              volume.headDigest,
            );
          }
        }}
      />
      <DriveConfirmDialog
        open={pending !== undefined}
        onOpenChange={(next) => !next && setPending(undefined)}
        title="Discard changes"
        description={dirtyPath ?? ""}
        confirmLabel="Discard"
        onConfirm={() => {
          const next = pending;
          setPending(undefined);
          discard();
          next?.();
        }}
      />
      <DriveConfirmDialog
        open={replacing !== undefined}
        onOpenChange={(next) => !next && setReplacing(undefined)}
        title="Replace existing files"
        description={
          replacing === undefined
            ? ""
            : `${replacing.replaced.length} existing ${replacing.replaced.length === 1 ? "path" : "paths"} will be replaced: ${replacing.replaced.join(", ")}`
        }
        confirmLabel="Replace"
        onConfirm={() => {
          if (replacing === undefined) return;
          void writer.put(
            replacing.changes,
            `${replacing.count} ${replacing.count === 1 ? "file" : "files"} uploaded`,
            "Could not upload",
          );
        }}
      />
    </>
  );
}
