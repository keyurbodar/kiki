import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult, Atom } from "effect/reactivity";
import { createContext, type ReactNode, useContext, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ShareDialogProvider } from "@/components/share-dialog";
import { useOpenShareDialog } from "@/components/share-dialog/share-dialog-context";
import type {
  SidebarFolder,
  SidebarThread,
} from "@/components/sidebar-threads";
import type { JamId, OrgId, ThreadFolderId } from "@/data/api/schemas/ids";
import type { ThreadFolder } from "@/data/api/schemas/threadOrganization";
import {
  deleteCaptainAtom,
  demoteCaptainAtom,
  promoteThreadAtom,
} from "@/data/atoms/captains";
import { reactivityKeys } from "@/data/atoms/conventions";
import {
  archiveThreadsAtom,
  deleteThreadsAtom,
  markAllThreadsReadAtom,
  markThreadReadAtom,
  markThreadUnreadAtom,
  regenerateThreadTitleAtom,
  renameThreadAtom,
  settleThreadAtom,
  unarchiveThreadsAtom,
  unsettleThreadAtom,
} from "@/data/atoms/jams";
import {
  addToFolderAtom,
  createFolderAtom,
  deleteFolderAtom,
  foldersAtom,
  leaveFolderAtom,
  pinThreadsAtom,
  renameFolderAtom,
  setFolderHiddenAtom,
  threadOrganizationKeys,
  unpinThreadsAtom,
} from "@/data/atoms/threadOrganization";
import { CaptainProfileDialog } from "@/features/captains/dialogs/captain-profile-dialog";
import { toast } from "@/primitives/toaster";
import { useSidebarOrgId } from "../sidebar-threads-data/live-source";
import { NewFolderDialog, RenameFolderDialog } from "./new-folder-dialog";

export type ThreadFolderChoice = { id: string; name: string };

export type ThreadActions = {
  renamingId: string | null;
  /**
   * The section whose row started the rename. A thread renders once per section
   * it appears in (Pinned and its project, for instance), so the id alone would
   * mount one input per copy and the second copy's focus would cancel the first.
   */
  renamingKey: string | null;
  folders: ReadonlyArray<ThreadFolderChoice>;
  share: (thread: SidebarThread) => void;
  markRead: (thread: SidebarThread) => void;
  markUnread: (thread: SidebarThread) => void;
  settle: (thread: SidebarThread) => void;
  unsettle: (thread: SidebarThread) => void;
  archive: (thread: SidebarThread) => void;
  unarchive: (thread: SidebarThread) => void;
  pin: (thread: SidebarThread) => void;
  unpin: (thread: SidebarThread) => void;
  moveTo: (thread: SidebarThread, folderId: string) => void;
  promote: (thread: SidebarThread) => void;
  regenerateTitle: (thread: SidebarThread) => void;
  /** Asks for confirmation before deleting. */
  remove: (thread: SidebarThread) => void;
  /** Asks for confirmation, then releases the crew and keeps the thread. */
  demoteCaptain: (captain: { id: string; name: string }) => void;
  /** Asks for confirmation before deleting a Captain. */
  removeCaptain: (captain: { id: string; name: string }) => void;
  /** Opens Capy's Captain dialog on the Captain's own profile page. */
  profileCaptain: (captain: { id: string; name: string }) => void;
  startRename: (threadId: string, rowKey?: string) => void;
  commitRename: (threadId: string, title: string) => void;
  cancelRename: () => void;
  markAllRead: () => void;
  /** Opens the New folder dialog the header menu's first row needs. */
  startNewFolder: (section?: "threads" | "captains") => void;
  /** The folder header's menu, in Capy's order. */
  renameFolder: (folder: SidebarFolder) => void;
  shareFolder: (folder: SidebarFolder) => void;
  toggleFolderHidden: (folder: SidebarFolder) => void;
  leaveFolder: (folder: SidebarFolder) => void;
  removeFolder: (folder: SidebarFolder) => void;
};

const ThreadActionsContext = createContext<ThreadActions | null>(null);

/**
 * A pin is a row on the shared pin table, and a Captain is a jam like any
 * thread, so a pin or an unpin has to refresh the Captain list beside the
 * sidebar's threads or the pinned tiles never move.
 */
const pinKeys = (orgId: OrgId) => [
  ...threadOrganizationKeys(orgId),
  reactivityKeys.captains(orgId),
];

export function useThreadActions(): ThreadActions {
  const value = useContext(ThreadActionsContext);
  if (value === null) {
    throw new Error("useThreadActions needs a ThreadActionsProvider");
  }
  return value;
}

const noFoldersAtom = Atom.make(
  AsyncResult.success<ReadonlyArray<ThreadFolder>>([]),
);

const folderChoices = (
  folders: ReadonlyArray<ThreadFolder> | undefined,
): ReadonlyArray<ThreadFolderChoice> =>
  folders === undefined
    ? []
    : folders.map((folder) => ({
        id: folder.id as unknown as string,
        name: folder.name ?? "Untitled folder",
      }));

export function ThreadActionsProvider({ children }: { children: ReactNode }) {
  return (
    <ShareDialogProvider>
      <ThreadActionsBody>{children}</ThreadActionsBody>
    </ShareDialogProvider>
  );
}

function ThreadActionsBody({ children }: { children: ReactNode }) {
  const openShare = useOpenShareDialog();
  const orgId = useSidebarOrgId();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [profileJamId, setProfileJamId] = useState<JamId | null>(null);
  const [renamingKey, setRenamingKey] = useState<string | null>(null);
  const [captainAction, setCaptainAction] = useState<{
    kind: "demote" | "delete";
    id: string;
    name: string;
  } | null>(null);
  const demoteCaptain = useAtomSet(demoteCaptainAtom, { mode: "promise" });
  const deleteCaptain = useAtomSet(deleteCaptainAtom, { mode: "promise" });
  const [deleting, setDeleting] = useState<SidebarThread | null>(null);
  const [newFolder, setNewFolder] = useState<{
    section: "threads" | "captains";
  } | null>(null);
  const settle = useAtomSet(settleThreadAtom, { mode: "promise" });
  const unsettle = useAtomSet(unsettleThreadAtom, { mode: "promise" });
  const read = useAtomSet(markThreadReadAtom, { mode: "promise" });
  const unread = useAtomSet(markThreadUnreadAtom, { mode: "promise" });
  const readAll = useAtomSet(markAllThreadsReadAtom, { mode: "promise" });
  const archive = useAtomSet(archiveThreadsAtom, { mode: "promise" });
  const unarchive = useAtomSet(unarchiveThreadsAtom, { mode: "promise" });
  const remove = useAtomSet(deleteThreadsAtom, { mode: "promise" });
  const rename = useAtomSet(renameThreadAtom, { mode: "promise" });
  const regenerateTitle = useAtomSet(regenerateThreadTitleAtom, {
    mode: "promise",
  });
  const pin = useAtomSet(pinThreadsAtom, { mode: "promise" });
  const unpin = useAtomSet(unpinThreadsAtom, { mode: "promise" });
  const addToFolder = useAtomSet(addToFolderAtom, { mode: "promise" });
  const promote = useAtomSet(promoteThreadAtom, { mode: "promise" });
  const createFolder = useAtomSet(createFolderAtom, { mode: "promise" });
  const renameFolder = useAtomSet(renameFolderAtom, { mode: "promise" });
  const deleteFolder = useAtomSet(deleteFolderAtom, { mode: "promise" });
  const setFolderHidden = useAtomSet(setFolderHiddenAtom, { mode: "promise" });
  const leaveFolder = useAtomSet(leaveFolderAtom, { mode: "promise" });
  const [folderRename, setFolderRename] = useState<SidebarFolder | null>(null);
  const [folderDelete, setFolderDelete] = useState<SidebarFolder | null>(null);
  const folders = useAtomValue(
    orgId === undefined ? noFoldersAtom : foldersAtom(orgId),
  );

  const run = (action: Promise<unknown>, done: string, failed: string) => {
    action.then(
      () => toast.success(done),
      () => toast.error(failed),
    );
  };
  const jamIds = (thread: SidebarThread) => [thread.id as unknown as JamId];
  const confirmDelete = () => {
    const thread = deleting;
    setDeleting(null);
    if (thread === null || orgId === undefined) return;
    run(
      remove({
        params: { orgId },
        payload: { jamIds: jamIds(thread) },
        reactivityKeys: threadOrganizationKeys(orgId),
      }),
      "Thread deleted",
      "Couldn't delete the thread",
    );
  };

  const actions: ThreadActions = {
    renamingId,
    renamingKey,
    folders: folderChoices(Option.getOrUndefined(AsyncResult.value(folders))),
    share: (thread) =>
      openShare?.({
        kind: "thread",
        id: thread.id,
        name: thread.title ?? "Untitled thread",
      }),
    markRead: (thread) => {
      if (orgId === undefined) return;
      run(
        read({
          params: { orgId, jamId: thread.id as unknown as JamId },
          payload: {},
          reactivityKeys: [reactivityKeys.threads(orgId)],
        }),
        "Marked as read",
        "Couldn't mark the thread as read",
      );
    },
    markUnread: (thread) => {
      if (orgId === undefined) return;
      run(
        unread({
          params: { orgId, jamId: thread.id as unknown as JamId },
          reactivityKeys: [reactivityKeys.threads(orgId)],
        }),
        "Marked as unread",
        "Couldn't mark the thread as unread",
      );
    },
    settle: (thread) => {
      if (orgId === undefined) return;
      run(
        settle({
          params: { orgId, jamId: thread.id as unknown as JamId },
          reactivityKeys: threadOrganizationKeys(orgId),
        }),
        "Settled",
        "Couldn't settle the thread",
      );
    },
    unsettle: (thread) => {
      if (orgId === undefined) return;
      run(
        unsettle({
          params: { orgId, jamId: thread.id as unknown as JamId },
          reactivityKeys: threadOrganizationKeys(orgId),
        }),
        "Un-settled",
        "Couldn't un-settle the thread",
      );
    },
    archive: (thread) => {
      if (orgId === undefined) return;
      run(
        archive({
          params: { orgId },
          payload: { jamIds: jamIds(thread) },
          reactivityKeys: threadOrganizationKeys(orgId),
        }),
        "Archived",
        "Couldn't archive the thread",
      );
    },
    unarchive: (thread) => {
      if (orgId === undefined) return;
      run(
        unarchive({
          params: { orgId },
          payload: { jamIds: jamIds(thread) },
          reactivityKeys: threadOrganizationKeys(orgId),
        }),
        "Unarchived",
        "Couldn't unarchive the thread",
      );
    },
    pin: (thread) => {
      if (orgId === undefined) return;
      run(
        pin({
          params: { orgId },
          payload: { jamIds: jamIds(thread) },
          reactivityKeys: pinKeys(orgId),
        }),
        "Pinned",
        "Couldn't pin the thread",
      );
    },
    unpin: (thread) => {
      if (orgId === undefined) return;
      run(
        unpin({
          params: { orgId },
          payload: { jamIds: jamIds(thread) },
          reactivityKeys: pinKeys(orgId),
        }),
        "Unpinned",
        "Couldn't unpin the thread",
      );
    },
    moveTo: (thread, folderId) => {
      if (orgId === undefined) return;
      run(
        addToFolder({
          params: { orgId, folderId: folderId as unknown as ThreadFolderId },
          payload: { jamIds: jamIds(thread) },
          reactivityKeys: threadOrganizationKeys(orgId),
        }),
        "Moved to folder",
        "Couldn't move the thread",
      );
    },
    promote: (thread) => {
      if (orgId === undefined) return;
      run(
        promote({
          params: { orgId },
          payload: { threadId: thread.id },
          reactivityKeys: [
            reactivityKeys.captains(orgId),
            reactivityKeys.threads(orgId),
          ],
        }),
        "Promoted to Captain",
        "Couldn't promote the thread",
      );
    },
    regenerateTitle: (thread) => {
      if (orgId === undefined) return;
      run(
        regenerateTitle({
          params: { orgId, jamId: thread.id as unknown as JamId },
          reactivityKeys: [reactivityKeys.threads(orgId)],
        }),
        "Title regenerated",
        "Couldn't regenerate the title",
      );
    },
    remove: (thread) => setDeleting(thread),
    startRename: (threadId, rowKey) => {
      setRenamingId(threadId);
      setRenamingKey(rowKey ?? null);
    },
    commitRename: (threadId, title) => {
      setRenamingId(null);
      setRenamingKey(null);
      if (orgId === undefined) return;
      run(
        rename({
          params: { orgId, jamId: threadId as unknown as JamId },
          payload: { title },
          reactivityKeys: [reactivityKeys.threads(orgId)],
        }),
        "Thread renamed",
        "Couldn't rename the thread",
      );
    },
    demoteCaptain: (captain) =>
      setCaptainAction({ kind: "demote", ...captain }),
    removeCaptain: (captain) =>
      setCaptainAction({ kind: "delete", ...captain }),
    profileCaptain: (captain) => setProfileJamId(captain.id as JamId),
    cancelRename: () => {
      setRenamingId(null);
      setRenamingKey(null);
    },
    startNewFolder: (section = "threads") => setNewFolder({ section }),
    renameFolder: (folder) => setFolderRename(folder),
    shareFolder: (folder) =>
      openShare?.({
        kind: "folder",
        folder: {
          id: folder.id,
          name: folder.name,
          visibility: folder.visibility ?? "private",
          ownerUserId: folder.ownerUserId ?? null,
          members: folder.members ?? [],
        },
      }),
    toggleFolderHidden: (folder) => {
      if (orgId === undefined) return;
      const hide = folder.hidden !== true;
      run(
        setFolderHidden({
          params: { orgId, folderId: folder.id as unknown as ThreadFolderId },
          payload: { hidden: hide },
          reactivityKeys: threadOrganizationKeys(orgId),
        }),
        hide ? "Folder hidden" : "Folder shown",
        hide ? "Couldn't hide the folder" : "Couldn't show the folder",
      );
    },
    leaveFolder: (folder) => {
      if (orgId === undefined) return;
      run(
        leaveFolder({
          params: { orgId, folderId: folder.id as unknown as ThreadFolderId },
          reactivityKeys: threadOrganizationKeys(orgId),
        }),
        "Left the folder",
        "Couldn't leave the folder",
      );
    },
    removeFolder: (folder) => setFolderDelete(folder),
    markAllRead: () => {
      if (orgId === undefined) return;
      run(
        readAll({
          params: { orgId },
          reactivityKeys: [reactivityKeys.threads(orgId)],
        }),
        "Marked every thread as read",
        "Couldn't mark threads as read",
      );
    },
  };

  return (
    <ThreadActionsContext.Provider value={actions}>
      {children}
      <NewFolderDialog
        open={newFolder !== null}
        onOpenChange={(open) => {
          if (!open) setNewFolder(null);
        }}
        onCreate={(name) => {
          const section = newFolder?.section ?? "threads";
          setNewFolder(null);
          if (orgId === undefined) return;
          run(
            createFolder({
              params: { orgId },
              payload: { name, visibility: "private", section },
              reactivityKeys: threadOrganizationKeys(orgId),
            }),
            "Folder created",
            "Couldn't create the folder",
          );
        }}
      />
      <RenameFolderDialog
        open={folderRename !== null}
        name={folderRename?.name ?? ""}
        onOpenChange={(open) => {
          if (!open) setFolderRename(null);
        }}
        onRename={(name) => {
          const folder = folderRename;
          setFolderRename(null);
          if (folder === null || orgId === undefined) return;
          run(
            renameFolder({
              params: {
                orgId,
                folderId: folder.id as unknown as ThreadFolderId,
              },
              payload: { name },
              reactivityKeys: threadOrganizationKeys(orgId),
            }),
            "Folder renamed",
            "Couldn't rename the folder",
          );
        }}
      />
      <ConfirmDialog
        open={folderDelete !== null}
        onOpenChange={(open) => {
          if (!open) setFolderDelete(null);
        }}
        title="Delete folder"
        description={`Threads in ${folderDelete?.name ?? "this folder"} are not deleted.`}
        confirmLabel="Delete folder"
        onConfirm={() => {
          const folder = folderDelete;
          setFolderDelete(null);
          if (folder === null || orgId === undefined) return;
          run(
            deleteFolder({
              params: {
                orgId,
                folderId: folder.id as unknown as ThreadFolderId,
              },
              reactivityKeys: threadOrganizationKeys(orgId),
            }),
            "Folder deleted",
            "Couldn't delete the folder",
          );
        }}
      />
      <ConfirmDialog
        open={captainAction !== null}
        onOpenChange={(open) => {
          if (!open) setCaptainAction(null);
        }}
        title={
          captainAction?.kind === "demote"
            ? "Demote to thread"
            : "Delete Captain"
        }
        description={
          captainAction?.kind === "demote"
            ? `${captainAction.name} becomes a plain thread and its crew is released.`
            : `${captainAction?.name ?? "This Captain"} and its history are deleted for everyone. This can't be undone.`
        }
        confirmLabel={
          captainAction?.kind === "demote"
            ? "Demote to thread"
            : "Delete Captain"
        }
        onConfirm={() => {
          const request = captainAction;
          setCaptainAction(null);
          if (request === null || orgId === undefined) return;
          const call =
            request.kind === "demote" ? demoteCaptain : deleteCaptain;
          run(
            call({ params: { orgId, jamId: request.id } }),
            request.kind === "demote" ? "Demoted to thread" : "Captain deleted",
            request.kind === "demote"
              ? "Couldn't demote the Captain"
              : "Couldn't delete the Captain",
          );
        }}
      />
      {profileJamId === null ? null : (
        <CaptainProfileDialog
          jamId={profileJamId}
          onClose={() => setProfileJamId(null)}
        />
      )}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete thread"
        description={`${deleting?.title ?? "This thread"} and its history are deleted for everyone. This can't be undone.`}
        confirmLabel="Delete thread"
        onConfirm={confirmDelete}
      />
    </ThreadActionsContext.Provider>
  );
}
