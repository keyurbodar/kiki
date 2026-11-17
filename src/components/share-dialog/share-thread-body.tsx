import { useAtomSet } from "@effect/atom-react";
import { type ReactNode, useEffect, useState } from "react";
import { OrgId } from "@/data/api/schemas/ids";
import { projectsAtom } from "@/data/atoms/projects";
import { Button } from "@/primitives/button";
import { AccessRows } from "./access-rows";
import { appOrigin, CopyLinkButton } from "./copy-link-button";
import { GlobeIcon, LockIcon } from "./icons";
import { PeopleField } from "./people-field";
import { PersonAvatar } from "./person-avatar";
import { type ListedPerson, PeopleList } from "./person-row";
import {
  accessRequestKeys,
  declineThreadAccessRequestAtom,
  inviteThreadMembersAtom,
  readAccessRequests,
  readThreadShare,
  removeThreadMembersAtom,
  setThreadAccessAtom,
  setThreadOwnerAtom,
  threadAccessKeys,
  threadAccessRequestsAtom,
  threadKeys,
  threadShareAtom,
  useActiveOrg,
  usePeople,
  useQueryValue,
  useViewer,
  type Visibility,
} from "./share-data";
import { useOpenShareDialog } from "./share-dialog-context";
import { SharePages } from "./share-pages";
import { TransferPicker } from "./transfer-picker";
import { useBusyRun } from "./use-busy-run";

export type ShareThreadBodyProps = {
  id: string;
  name: string;
  onOpenChange: (open: boolean) => void;
  onBusyChange: (busy: boolean) => void;
};

export function ShareThreadBody({
  id,
  name,
  onOpenChange,
  onBusyChange,
}: ShareThreadBodyProps) {
  const org = useActiveOrg();
  const orgId = org?.id;
  const viewer = useViewer();
  const rawThread = useQueryValue(
    orgId === undefined ? undefined : threadShareAtom(`${orgId}/${id}`),
  );
  const thread = readThreadShare(rawThread);
  const projects = useQueryValue(
    orgId === undefined ? undefined : projectsAtom(OrgId.make(orgId)),
  );
  const project = projects?.find(
    (candidate) =>
      candidate.id === thread?.projectId && candidate.visibility === "private",
  );
  const bound =
    project === undefined
      ? undefined
      : new Set<string>([
          ...(project.ownerUserId === null ? [] : [project.ownerUserId]),
          ...project.members.map((member) => member.userId),
        ]);
  const { nameOf, avatarOf, members: orgMembers } = usePeople();
  const invite = useAtomSet(inviteThreadMembersAtom, { mode: "promise" });
  const remove = useAtomSet(removeThreadMembersAtom, { mode: "promise" });
  const setAccess = useAtomSet(setThreadAccessAtom, { mode: "promise" });
  const setOwner = useAtomSet(setThreadOwnerAtom, { mode: "promise" });
  const decline = useAtomSet(declineThreadAccessRequestAtom, {
    mode: "promise",
  });
  const [page, setPage] = useState<"share" | "people" | "transfer">("share");
  const [transferTo, setTransferTo] = useState<string | null>(null);
  const { busy, run } = useBusyRun();
  useEffect(() => onBusyChange(busy), [busy, onBusyChange]);
  const openShare = useOpenShareDialog();
  const captain = thread?.captain;
  const captainThread = readThreadShare(
    useQueryValue(
      orgId === undefined || captain === undefined
        ? undefined
        : threadShareAtom(`${orgId}/${captain.jamId}`),
    ),
  );
  const membership = thread?.membership;
  const ownerId = thread?.userId ?? viewer?.id ?? "";
  const isOwner = membership !== undefined && membership.viewerRole === "owner";
  const others = (membership?.members ?? []).filter(
    (member) => member.userId !== ownerId,
  );
  const visibility: Visibility =
    thread?.personal === true ? "private" : "shared";
  const loadRequests =
    isOwner && visibility === "private" && captain === undefined;
  const requests = readAccessRequests(
    useQueryValue(
      orgId === undefined || !loadRequests
        ? undefined
        : threadAccessRequestsAtom(`${orgId}/${id}`),
    ),
  );
  const [pending, setPending] = useState<ReadonlyArray<string>>([]);
  const listed = others.filter(
    (member) => member.subscribed || visibility === "private",
  );
  const people: ReadonlyArray<ListedPerson> = listed.map((member) => ({
    userId: member.userId,
    state: member.subscribed ? "named" : "unsubscribed",
  }));
  const excluded = new Set([ownerId, ...listed.map((member) => member.userId)]);
  const showAccess =
    captain === undefined &&
    (org?.personalThreadsEnabled === true || visibility === "private");
  const canAdd =
    isOwner || (membership !== undefined && visibility === "shared");
  const keys = orgId === undefined ? [] : threadKeys(orgId, id, viewer?.id);
  const transferExcluded =
    visibility === "private"
      ? new Set(
          orgMembers
            .map((member) => member.userId)
            .filter(
              (userId) => !others.some((member) => member.userId === userId),
            ),
        ).add(ownerId)
      : new Set([ownerId]);

  const toggle = (userId: string, add: boolean) => {
    if (orgId === undefined) return;
    const params = { orgId, jamId: id };
    const invitePeople = (extra: Record<string, unknown> = {}) =>
      invite({
        params,
        payload: { userIds: [userId], ...extra },
        reactivityKeys: keys,
      });
    const removePeople = (extra: Record<string, string> = {}) =>
      remove({
        params,
        query: { userIds: [userId], ...extra },
        reactivityKeys: keys,
      });
    void run({
      work: () => (add ? invitePeople() : removePeople()),
      success: add ? `${nameOf(userId)} added` : `${nameOf(userId)} removed`,
      failure: add ? "Could not add person" : "Could not remove person",
      undo: () =>
        add
          ? removePeople({ undoInvite: "true" })
          : invitePeople({ restore: true }),
    });
  };

  const changeVisibility = (next: Visibility) => {
    if (orgId === undefined || next === visibility) return;
    const base = {
      params: { orgId, jamId: id },
      reactivityKeys: threadAccessKeys(orgId, id, viewer?.id),
    };
    void run({
      work: () =>
        setAccess({ ...base, payload: { personal: next === "private" } }),
      success: "Access updated",
      failure: "Could not change thread access",
      undo: () =>
        setAccess({ ...base, payload: { personal: visibility === "private" } }),
    });
  };

  const transfer = () => {
    if (orgId === undefined || transferTo === null) return;
    const userId = transferTo;
    void run({
      work: () =>
        setOwner({
          params: { orgId, jamId: id },
          payload: { userId },
          reactivityKeys: keys,
        }),
      success: "Ownership transferred",
      failure: "Could not transfer ownership",
    }).then((ok) => {
      if (ok) onOpenChange(false);
    });
  };

  const back = () => {
    if (busy) return;
    setTransferTo(null);
    setPage("share");
  };

  const answer = (userId: string, approve: boolean) => {
    if (orgId === undefined) return;
    const params = { orgId, jamId: id };
    setPending((current) => [...current, userId]);
    void run({
      work: () =>
        approve
          ? invite({
              params,
              payload: { userIds: [userId] },
              reactivityKeys: [...keys, ...accessRequestKeys(id)],
            })
          : decline({
              params: { ...params, userId },
              reactivityKeys: accessRequestKeys(id),
            }),
      success: approve ? `${nameOf(userId)} added` : "Request declined",
      failure: approve ? "Could not share" : "Could not decline",
      undo: approve
        ? () =>
            remove({
              params,
              query: { userIds: [userId] },
              reactivityKeys: keys,
            })
        : undefined,
    }).finally(() =>
      setPending((current) => current.filter((entry) => entry !== userId)),
    );
  };

  const captainBlock =
    captain === undefined ? null : (
      <div className="flex flex-col gap-1.5 pb-3">
        <span className="text-2xs text-muted-foreground-2">Access</span>
        <div className="flex h-8 w-full items-center gap-2 rounded bg-secondary px-2 text-xs text-foreground">
          <span className="flex size-4 items-center justify-center text-muted-foreground-2">
            {captainThread?.personal === true ? (
              <LockIcon className="size-3.5" />
            ) : (
              <GlobeIcon className="size-3.5" />
            )}
          </span>
          <span className="min-w-0 flex-1 truncate">{`Same as ${captain.name}`}</span>
          {openShare === null ? null : (
            <Button
              data-track-owner="shared/share-dialog.tsx#ShareThreadBody:Button.1"
              variant="bare"
              size="auto-sm"
              className="-m-1 p-1"
              type="button"
              onClick={() =>
                openShare({
                  kind: "thread",
                  id: captain.jamId,
                  name: captain.name,
                })
              }
            >
              {captainThread?.membership?.viewerRole === "owner"
                ? "Manage"
                : "View"}
            </Button>
          )}
        </div>
        {captainThread === undefined ? null : captainThread.personal ? (
          <PeopleList
            ownerUserId={captainThread.userId ?? ""}
            people={(captainThread.membership?.members ?? [])
              .filter((member) => member.userId !== captainThread.userId)
              .map((member) => ({ userId: member.userId, state: "named" }))}
            limit={8}
            onMore={
              openShare === null
                ? undefined
                : () =>
                    openShare({
                      kind: "thread",
                      id: captain.jamId,
                      name: captain.name,
                    })
            }
          />
        ) : (
          <span className="text-2xs text-muted-foreground-3">
            {org === undefined
              ? "Everyone in organization"
              : `Everyone at ${org.name}`}
          </span>
        )}
      </div>
    );

  const peopleList = (limit: number | undefined) => (
    <PeopleList
      ownerUserId={ownerId}
      people={people}
      limit={limit}
      onMore={() => setPage("people")}
      onToggle={isOwner ? (person) => toggle(person.userId, false) : undefined}
      disabled={busy}
      onTransfer={isOwner ? () => setPage("transfer") : undefined}
    />
  );

  const withField = (children: ReactNode, autoFocus: boolean) =>
    canAdd ? (
      <PeopleField
        excluded={excluded}
        batchLimit={20}
        disabled={false}
        busy={busy}
        autoFocus={autoFocus}
        bound={bound}
        placeholder={
          visibility === "private" ? "Share with people" : "Add subscriber"
        }
        onPick={(userId) => toggle(userId, true)}
        description={
          visibility === "private"
            ? thread?.crewCount === undefined
              ? "People you share with see everything the thread's agent sees, including your personal memory and drive"
              : "People you share with see this Captain, its crew, and its drive"
            : "Subscribers see this in their sidebar and get its notifications"
        }
      >
        {children}
      </PeopleField>
    ) : (
      children
    );

  const requested =
    requests.length === 0 ? null : (
      <div className="flex flex-col gap-1.5">
        <span className="text-2xs text-muted-foreground-2">Requested</span>
        <ul className="flex flex-col divide-y-(length:--border-hairline) divide-border-1">
          {requests.map((request) => (
            <li
              key={request.userId}
              className="flex min-h-11 items-center gap-3 text-sm"
            >
              <PersonAvatar
                src={avatarOf(request.userId)}
                name={nameOf(request.userId)}
                size="sm"
              />
              <span className="min-w-0 flex-1 truncate">
                {nameOf(request.userId)}
              </span>
              <Button
                data-track-owner="shared/share-dialog.tsx#ShareThreadBody:Button[Decline]"
                variant="bare"
                size="auto-sm"
                className="-m-1 p-1"
                type="button"
                disabled={busy || pending.includes(request.userId)}
                onClick={() => answer(request.userId, false)}
              >
                Decline
              </Button>
              <Button
                data-track-owner="shared/share-dialog.tsx#ShareThreadBody:Button[Approve]"
                variant="bare"
                size="auto-sm"
                className="-m-1 p-1"
                type="button"
                disabled={busy || pending.includes(request.userId)}
                onClick={() => answer(request.userId, true)}
              >
                Approve
              </Button>
            </li>
          ))}
        </ul>
      </div>
    );

  const peopleSection = (limit: number) => (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground-2">
        {visibility === "private" ? "People" : "Subscribers"}
      </span>
      {visibility === "private"
        ? peopleList(limit)
        : withField(peopleList(limit), true)}
    </div>
  );

  return (
    <SharePages
      page={page}
      root="share"
      onBack={back}
      pages={{
        share: {
          title: `Share ${name}`,
          body:
            membership === undefined ? (
              <div className="min-h-24" />
            ) : (
              <div className="flex flex-col gap-3">
                {captainBlock}
                {captainBlock === null ? (
                  <div className="flex flex-col gap-3">
                    {showAccess ? (
                      <AccessRows
                        visibility={visibility}
                        onChange={isOwner ? changeVisibility : undefined}
                        disabled={busy}
                        sharedLabel={
                          project === undefined
                            ? undefined
                            : `Everyone in ${project.name}`
                        }
                      />
                    ) : null}
                    {showAccess && visibility === "shared" && !isOwner ? (
                      <span className="text-2xs text-muted-foreground-3">{`Owned by ${nameOf(ownerId)}`}</span>
                    ) : null}
                    {showAccess && visibility === "private" && isOwner
                      ? withField(null, true)
                      : null}
                    {visibility === "private" ? requested : null}
                    {peopleSection(8)}
                  </div>
                ) : null}
              </div>
            ),
          footer: (
            <>
              <CopyLinkButton
                data-track-owner="shared/share-dialog.tsx#ShareThreadBody:CopyLinkButton.1"
                url={`${appOrigin()}/thread/${id}`}
                title={name}
              />
              <Button
                data-track-owner="shared/share-dialog.tsx#ShareThreadBody:Button[Done]"
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
        people: {
          title: visibility === "private" ? "People" : "Subscribers",
          body: withField(peopleList(undefined), false),
          footer: (
            <Button
              data-track-owner="shared/share-dialog.tsx#ShareThreadBody:Button[Done].2"
              variant="ghost"
              type="button"
              onClick={back}
            >
              Done
            </Button>
          ),
        },
        transfer: {
          title: "Transfer ownership",
          body: (
            <TransferPicker
              name={name}
              transferTo={transferTo}
              excluded={transferExcluded}
              onPick={setTransferTo}
            />
          ),
          footer: (
            <>
              <Button
                data-track-owner="shared/share-dialog.tsx#ShareThreadBody:Button[Cancel]"
                variant="ghost"
                type="button"
                onClick={back}
              >
                Cancel
              </Button>
              {transferTo === null ? null : (
                <Button
                  data-track-owner="shared/share-dialog.tsx#ShareThreadBody:Button[Transfer]"
                  intent="accent"
                  type="button"
                  disabled={busy}
                  onClick={transfer}
                >
                  Transfer
                </Button>
              )}
            </>
          ),
        },
      }}
    />
  );
}
