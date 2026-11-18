import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult, Atom } from "effect/reactivity";
import { createContext, type ReactNode, useContext, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ShareDialogProvider } from "@/components/share-dialog";
import { useOpenShareDialog } from "@/components/share-dialog/share-dialog-context";
import type { SidebarThread } from "@/components/sidebar-threads";
import type { JamId, ThreadFolderId } from "@/data/api/schemas/ids";
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
  foldersAtom,
  pinThreadsAtom,
  threadOrganizationKeys,
  unpinThreadsAtom,
} from "@/data/atoms/threadOrganization";
import { useSidebarOrgId } from "../sidebar-threads-data/live-source";
import { NewFolderDialog } from "./new-folder-dialog";

export type ThreadFolderChoice = { id: string; name: string };

export type ThreadActions = {
  renamingId: string | null;
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
  startRename: (threadId: string) => void;
  commitRename: (threadId: string, title: string) => void;
  cancelRename: () => void;
  markAllRead: () => void;
  /** Opens the New folder dialog the header menu's first row needs. */
  startNewFolder: (section?: "threads" | "captains") => void;
};

const ThreadActionsContext = createContext<ThreadActions | null>(null);

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
          reactivityKeys: threadOrganizationKeys(orgId),
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
          reactivityKeys: threadOrganizationKeys(orgId),
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
    startRename: (threadId) => setRenamingId(threadId),
    commitRename: (threadId, title) => {
      setRenamingId(null);
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
    cancelRename: () => setRenamingId(null),
    startNewFolder: (section = "threads") => setNewFolder({ section }),
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
