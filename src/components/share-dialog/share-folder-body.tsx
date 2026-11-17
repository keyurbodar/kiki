import { useAtomSet } from "@effect/atom-react";
import { useEffect } from "react";
import { Button } from "@/primitives/button";
import { AccessRows } from "./access-rows";
import { appOrigin, CopyLinkButton } from "./copy-link-button";
import { PeopleField } from "./people-field";
import { PersonRow } from "./person-row";
import {
  type FolderSection,
  folderKeys,
  foldersAtom,
  readFolders,
  setFolderAccessAtom,
  shareFolderAtom,
  unshareFolderAtom,
  useActiveOrg,
  usePeople,
  useQueryValue,
  useViewer,
  type Visibility,
} from "./share-data";
import { SharePages } from "./share-pages";
import { useBusyRun } from "./use-busy-run";

export type ShareFolderBodyProps = {
  section: FolderSection;
  onOpenChange: (open: boolean) => void;
  onBusyChange: (busy: boolean) => void;
};

const stay = () => {};

export function ShareFolderBody({
  section,
  onOpenChange,
  onBusyChange,
}: ShareFolderBodyProps) {
  const orgId = useActiveOrg()?.id;
  const viewerId = useViewer()?.id;
  const folders = readFolders(
    useQueryValue(
      orgId === undefined
        ? undefined
        : foldersAtom(`${orgId}/${viewerId ?? ""}`),
    ),
  );
  const share = useAtomSet(shareFolderAtom, { mode: "promise" });
  const unshare = useAtomSet(unshareFolderAtom, { mode: "promise" });
  const setAccess = useAtomSet(setFolderAccessAtom, { mode: "promise" });
  const { nameOf, avatarOf } = usePeople();
  const folder = folders.find((entry) => entry.id === section.id) ?? section;
  const { busy, run } = useBusyRun();
  useEffect(() => onBusyChange(busy), [busy, onBusyChange]);
  const visibility = folder.visibility;
  const name = folder.name ?? "folder";
  const excluded = new Set([
    ...folder.members.map((member) => member.userId),
    ...(folder.ownerUserId === null ? [] : [folder.ownerUserId]),
  ]);
  const unowned = folder.ownerUserId === null;

  const toggle = (userId: string, add: boolean) => {
    if (orgId === undefined) return;
    const base = {
      params: { orgId, folderId: folder.id },
      reactivityKeys: folderKeys(orgId, viewerId),
    };
    const addPerson = () => share({ ...base, payload: { userIds: [userId] } });
    const removePerson = () =>
      unshare({ ...base, query: { userIds: [userId] } });
    void run({
      work: add ? addPerson : removePerson,
      success: add ? `${nameOf(userId)} added` : `${nameOf(userId)} removed`,
      failure: add ? "Could not share folder" : "Could not remove access",
      undo: add ? removePerson : addPerson,
    });
  };

  const changeVisibility = (next: Visibility) => {
    if (orgId === undefined || next === visibility) return;
    const base = {
      params: { orgId, folderId: folder.id },
      reactivityKeys: folderKeys(orgId, viewerId),
    };
    const claims = next === "private" && unowned;
    void run({
      work: () => setAccess({ ...base, payload: { visibility: next } }),
      success: claims ? "You now own this folder" : "Access updated",
      failure: "Could not change folder access",
      undo: claims
        ? undefined
        : () => setAccess({ ...base, payload: { visibility } }),
    });
  };

  const ownerRow =
    folder.ownerUserId === null ? null : (
      <PersonRow
        size="sm"
        name={nameOf(folder.ownerUserId)}
        imageUrl={avatarOf(folder.ownerUserId)}
        state="owner"
      />
    );

  return (
    <SharePages
      page="share"
      root="share"
      onBack={stay}
      pages={{
        share: {
          title: `Share ${name}`,
          body: (
            <>
              <AccessRows
                visibility={visibility}
                onChange={changeVisibility}
                disabled={busy}
                confirmPrivate={unowned}
              />
              {visibility === "shared" ? (
                ownerRow === null ? null : (
                  <ul>{ownerRow}</ul>
                )
              ) : (
                <PeopleField
                  excluded={excluded}
                  batchLimit={20}
                  disabled={false}
                  busy={busy}
                  autoFocus
                  onPick={(userId) => toggle(userId, true)}
                  description="People you add see this folder but need access to each thread"
                >
                  <ul className="flex flex-col divide-y-(length:--border-hairline) divide-border-1">
                    {ownerRow}
                    {folder.members.map((member) => (
                      <PersonRow
                        key={member.userId}
                        size="sm"
                        name={nameOf(member.userId)}
                        imageUrl={avatarOf(member.userId)}
                        state="named"
                        disabled={busy}
                        onRemove={() => toggle(member.userId, false)}
                      />
                    ))}
                  </ul>
                </PeopleField>
              )}
            </>
          ),
          footer: (
            <>
              <CopyLinkButton
                data-track-owner="shared/share-dialog.tsx#ShareFolderBody:CopyLinkButton.1"
                url={`${appOrigin()}/threads`}
                title={name}
              />
              <Button
                data-track-owner="shared/share-dialog.tsx#ShareFolderBody:Button[Done]"
                intent="accent"
                type="button"
                aria-busy={busy}
                disabled={busy}
                onClick={() => onOpenChange(false)}
              >
                Done
              </Button>
            </>
          ),
        },
      }}
    />
  );
}
