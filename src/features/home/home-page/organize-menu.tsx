import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";
import {
  MENU_CHECK,
  MENU_LEADING,
  MENU_MESSAGE,
} from "@/components/composer/menu-surface";
import type { OrgId } from "@/data/api/schemas/ids";
import type {
  ThreadFolder,
  ThreadTag,
  ThreadTagColor,
} from "@/data/api/schemas/threadOrganization";
import { idleAtom } from "@/data/atoms/idle";
import { foldersAtom, tagsAtom } from "@/data/atoms/threadOrganization";
import { Icon } from "@/primitives/icon";
import { MenuSearchRow, menuSearchInputClassName } from "@/primitives/menu";
import {
  ResponsiveMenuItem,
  ResponsiveMenuSub,
} from "@/primitives/responsive-menu";

/** What `/new`'s menu holds for a thread that does not exist yet. */
export type OrganizeDraft = {
  pinned: boolean;
  folderIds: string[];
  tagIds: string[];
};

export const emptyOrganizeDraft: OrganizeDraft = {
  pinned: false,
  folderIds: [],
  tagIds: [],
};

/** Whether the draft organizes the thread at all, which the trigger's dot reports. */
export const organizeDraftActive = (draft: OrganizeDraft) =>
  draft.pinned || draft.folderIds.length > 0 || draft.tagIds.length > 0;

const toggle = (ids: readonly string[], id: string) =>
  ids.includes(id) ? ids.filter((candidate) => candidate !== id) : [...ids, id];

/** The submenu's trailing value: the one name, or how many are picked. */
const selectedLabel = (
  ids: readonly string[],
  nameOf: (id: string) => string | undefined,
) => {
  if (ids.length === 0) return undefined;
  const first = ids[0];
  const name = first === undefined ? undefined : nameOf(first);
  return ids.length === 1 ? (name ?? "1 selected") : `${ids.length} selected`;
};

/** Capy's tag colors are its intent vocabulary under the tag names. */
const tagSwatch: Record<ThreadTagColor, string> = {
  default: "bg-muted-foreground-3",
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  blue: "bg-info",
  purple: "bg-purple",
  pink: "bg-pink",
  orange: "bg-orange",
  lime: "bg-lime",
};

const idleFolders = idleAtom<ReadonlyArray<ThreadFolder>>();
const idleTags = idleAtom<ReadonlyArray<ThreadTag>>();

const keepTypeaheadOut = (event: {
  key: string;
  stopPropagation: () => void;
}) => {
  if (event.key !== "Escape") event.stopPropagation();
};

const FilterMessage = ({ children }: { children: string }) => (
  <div className={MENU_MESSAGE}>{children}</div>
);

export type OrganizeMenuItemsProps = {
  orgId?: OrgId;
  draft: OrganizeDraft;
  onChange: (update: (draft: OrganizeDraft) => OrganizeDraft) => void;
};

/**
 * Capy's organize section for a draft thread: pin, the folders it lands in and
 * the tags it carries. The picks ride on the jam once `POST …/jams` returns it.
 */
export function OrganizeMenuItems({
  orgId,
  draft,
  onChange,
}: OrganizeMenuItemsProps) {
  const folders = AsyncResult.getOrElse(
    useAtomValue(orgId === undefined ? idleFolders : foldersAtom(orgId)),
    () => [],
  ).filter(
    (folder) =>
      folder.systemKind === null &&
      folder.section === "threads" &&
      !folder.hidden,
  );
  const tags = AsyncResult.getOrElse(
    useAtomValue(orgId === undefined ? idleTags : tagsAtom(orgId)),
    () => [],
  ).filter((tag) => !tag.deleted);
  const [folderQuery, setFolderQuery] = useState("");
  const [tagQuery, setTagQuery] = useState("");

  const shownFolders = folders.filter((folder) =>
    (folder.name ?? "")
      .toLowerCase()
      .includes(folderQuery.trim().toLowerCase()),
  );
  const shownTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(tagQuery.trim().toLowerCase()),
  );
  const folderName = (id: string) =>
    folders.find((folder) => folder.id === id)?.name ?? undefined;
  const tagName = (id: string) => tags.find((tag) => tag.id === id)?.name;

  return (
    <>
      <ResponsiveMenuItem
        closeOnClick={false}
        onClick={() =>
          onChange((current) => ({ ...current, pinned: !current.pinned }))
        }
      >
        <span className={MENU_LEADING}>
          <Icon name="pin" />
        </span>
        Pin
        {draft.pinned ? (
          <Icon name="checkmark-1" className={`ml-auto ${MENU_CHECK}`} />
        ) : null}
      </ResponsiveMenuItem>
      <ResponsiveMenuSub
        icon={<Icon name="folder-1" />}
        label="Folder"
        value={selectedLabel(draft.folderIds, folderName)}
        contentClassName="w-48"
      >
        {folders.length === 0 ? (
          <FilterMessage>No folders yet</FilterMessage>
        ) : (
          <>
            <MenuSearchRow pickOnEnter>
              <input
                className={menuSearchInputClassName}
                aria-label="Search folders"
                placeholder="Search folders"
                value={folderQuery}
                onChange={(event) => setFolderQuery(event.target.value)}
                onKeyDown={keepTypeaheadOut}
              />
            </MenuSearchRow>
            {shownFolders.length === 0 ? (
              <FilterMessage>No folders match</FilterMessage>
            ) : null}
            {shownFolders.map((folder) => (
              <ResponsiveMenuItem
                key={folder.id}
                closeOnClick={false}
                onClick={() =>
                  onChange((current) => ({
                    ...current,
                    folderIds: toggle(current.folderIds, folder.id),
                  }))
                }
              >
                <span className={MENU_LEADING}>
                  <Icon
                    name={
                      folder.visibility === "shared"
                        ? "folder-shared"
                        : "folder-1"
                    }
                  />
                </span>
                <span className="min-w-0 truncate">
                  {folder.name ?? "Untitled folder"}
                </span>
                {draft.folderIds.includes(folder.id) ? (
                  <Icon
                    name="checkmark-1"
                    className={`ml-auto ${MENU_CHECK}`}
                  />
                ) : null}
              </ResponsiveMenuItem>
            ))}
          </>
        )}
      </ResponsiveMenuSub>
      <ResponsiveMenuSub
        icon={<Icon name="tag" />}
        label="Tags"
        value={selectedLabel(draft.tagIds, tagName)}
        contentClassName="w-52"
      >
        {tags.length === 0 ? (
          <FilterMessage>No tags yet</FilterMessage>
        ) : (
          <>
            <MenuSearchRow pickOnEnter>
              <input
                className={menuSearchInputClassName}
                aria-label="Search tags"
                placeholder="Search tags"
                value={tagQuery}
                onChange={(event) => setTagQuery(event.target.value)}
                onKeyDown={keepTypeaheadOut}
              />
            </MenuSearchRow>
            {shownTags.length === 0 ? (
              <FilterMessage>No tags match</FilterMessage>
            ) : null}
            {shownTags.map((tag) => (
              <ResponsiveMenuItem
                key={tag.id}
                closeOnClick={false}
                onClick={() =>
                  onChange((current) => ({
                    ...current,
                    tagIds: toggle(current.tagIds, tag.id),
                  }))
                }
              >
                <span className={MENU_LEADING}>
                  <span
                    aria-hidden
                    className={`size-2 rounded-full ${tagSwatch[tag.color]}`}
                  />
                </span>
                <span className="min-w-0 truncate">{tag.name}</span>
                {draft.tagIds.includes(tag.id) ? (
                  <Icon
                    name="checkmark-1"
                    className={`ml-auto ${MENU_CHECK}`}
                  />
                ) : null}
              </ResponsiveMenuItem>
            ))}
          </>
        )}
      </ResponsiveMenuSub>
    </>
  );
}
