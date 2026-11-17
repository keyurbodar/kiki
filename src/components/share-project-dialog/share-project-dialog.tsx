import { cx } from "class-variance-authority";
import { useState } from "react";
import { Button } from "@/primitives/button";
import { CopyField } from "@/primitives/copy-field";
import { Dialog, DialogContent, DialogOverlay } from "@/primitives/dialog";
import { DialogPages } from "@/primitives/dialog-pages";
import { Icon } from "@/primitives/icon";
import {
  accessCopy,
  canManageSharing,
  memberState,
  nameOf,
  pendingCandidates,
  type SharePerson,
  type ShareProject,
} from "./members";

export type ShareProjectDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly project: ShareProject;
  readonly people: ReadonlyArray<SharePerson>;
  readonly link: string;
  readonly busy?: boolean;
  readonly created?: boolean;
  readonly onSetAccess?: (visibility: "org" | "private") => Promise<unknown>;
  readonly onAddMember?: (userId: string) => Promise<unknown>;
  readonly onRemoveMember?: (userId: string) => Promise<unknown>;
  readonly onTransferOwnership?: (userId: string) => Promise<unknown>;
  readonly onCopyLink?: () => void;
};

export function ShareProjectDialog({
  open,
  onOpenChange,
  project,
  people,
  link,
  busy = false,
  created = false,
  onSetAccess,
  onAddMember,
  onRemoveMember,
  onTransferOwnership,
  onCopyLink,
}: ShareProjectDialogProps) {
  const [page, setPage] = useState<"share" | "transfer">("share");
  const [transferTo, setTransferTo] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [working, setWorking] = useState(false);

  const manage = canManageSharing(project);
  const visibility = project.visibility === "private" ? "private" : "org";
  const owner = project.ownerUserId;
  const candidates = pendingCandidates(project, people, query);
  const transferable = people.filter(
    (person) =>
      person.id !== owner &&
      !project.members.some((m) => m.userId === person.id),
  );

  const run = (work: () => Promise<unknown>, done?: () => void) => {
    setWorking(true);
    work()
      .then(() => done?.())
      .catch(() => undefined)
      .finally(() => setWorking(false));
  };

  const close = () => {
    if (working) return;
    setTransferTo(null);
    setPage("share");
    onOpenChange(false);
  };

  const memberRow = (person: SharePerson) => (
    <li
      key={person.id}
      className="flex min-h-8 items-center gap-2 py-1.5 text-sm text-foreground"
    >
      <span className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary text-2xs text-muted-foreground-1">
        {person.imageUrl === null ? (
          person.name.slice(0, 1).toUpperCase()
        ) : (
          <img src={person.imageUrl} alt="" className="size-full" />
        )}
      </span>
      <span className="min-w-0 flex-1 truncate">{person.name}</span>
      {person.service && (
        <span className="text-2xs text-muted-foreground-3">Service user</span>
      )}
      {memberState(project, person.id) === "owner" ? (
        <span className="text-2xs text-muted-foreground-2">Owner</span>
      ) : null}
      {memberState(project, person.id) === "named" &&
        manage &&
        onRemoveMember !== undefined && (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy || working}
            onClick={() => run(() => onRemoveMember(person.id))}
          >
            Remove
          </Button>
        )}
      {memberState(project, person.id) === "owner" &&
        project.viewerRole === "owner" &&
        !created &&
        onTransferOwnership !== undefined && (
          <Button variant="ghost" size="sm" onClick={() => setPage("transfer")}>
            Transfer
          </Button>
        )}
    </li>
  );

  const sharedList = (
    <ul className="flex flex-col divide-y-hairline divide-border-1">
      {owner === null ? null : memberRow(peopleByName(people, owner))}
      {project.members
        .filter((member) => member.userId !== owner)
        .map((member) => memberRow(peopleByName(people, member.userId)))}
    </ul>
  );

  const accessRow = (
    <div className="flex flex-col gap-1">
      {/* biome-ignore lint/a11y/useSemanticElements: two toggle buttons with the current access marked, not a form fieldset */}
      <div
        role="group"
        aria-label="Project access"
        className="flex items-center gap-1"
      >
        {(["org", "private"] as const).map((option) => (
          <Button
            key={option}
            variant="ghost"
            size="sm"
            data-selected={visibility === option || undefined}
            disabled={!manage || busy || working || onSetAccess === undefined}
            onClick={() =>
              run(() => onSetAccess?.(option) ?? Promise.resolve())
            }
          >
            {accessCopy[option].label}
          </Button>
        ))}
      </div>
      <span className="text-xs text-muted-foreground-2">
        {visibility === "private"
          ? accessCopy.private.description
          : accessCopy.org.description}
      </span>
    </div>
  );

  const addPeople = (
    <div className="flex flex-col gap-1.5">
      <div className="flex min-h-(--h-control-base) w-full items-center rounded border-[0.03125rem] border-border-2 bg-input px-1.5 py-1 focus-within:outline-ring-inset">
        <input
          value={query}
          readOnly={busy || working}
          placeholder="Add people or service users"
          aria-label="Add people or service users"
          className="min-w-24 flex-1 bg-transparent text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground-3 selection:bg-primary-20"
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <span className="text-xs text-muted-foreground-2">
        People you add see every thread, repository, and setting in this project
      </span>
    </div>
  );

  const candidateList = (
    <ul className="flex max-h-40 flex-col gap-px overflow-y-auto">
      {candidates.length === 0 ? (
        <li className="flex h-7 items-center px-2 text-2xs text-muted-foreground-3">
          No people match
        </li>
      ) : (
        candidates.map((person) => (
          <li key={person.id}>
            <button
              type="button"
              disabled={busy || working}
              className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm text-foreground outline-none select-none hover:bg-secondary focus-visible:outline-ring-inset"
              onClick={() =>
                run(
                  () => onAddMember?.(person.id) ?? Promise.resolve(),
                  () => setQuery(""),
                )
              }
            >
              <span className="grid size-5 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary text-2xs text-muted-foreground-1">
                {person.imageUrl === null ? (
                  person.name.slice(0, 1).toUpperCase()
                ) : (
                  <img src={person.imageUrl} alt="" className="size-full" />
                )}
              </span>
              <span className="min-w-0 flex-1 truncate">{person.name}</span>
              {person.service && (
                <span className="text-2xs text-muted-foreground-3">
                  Service user
                </span>
              )}
            </button>
          </li>
        ))
      )}
    </ul>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
    >
      <DialogOverlay />
      <DialogContent className="max-w-md">
        <DialogPages
          page={page}
          root="share"
          onBack={() => {
            setTransferTo(null);
            setPage("share");
          }}
          pages={{
            share: {
              title: `Share ${project.name}`,
              body: (
                <div className="flex flex-col divide-y-hairline divide-border-1">
                  <div className="flex flex-col gap-2 pb-2">
                    {accessRow}
                    {visibility === "org" && owner !== null ? (
                      <ul>{memberRow(peopleByName(people, owner))}</ul>
                    ) : null}
                    {visibility === "private" ? (
                      <div className="flex flex-col gap-3">
                        {manage ? addPeople : null}
                        {query.trim() === "" ? sharedList : candidateList}
                      </div>
                    ) : null}
                  </div>
                </div>
              ),
              footer: (
                <>
                  <CopyLinkButton
                    url={link}
                    title={project.name}
                    onCopy={onCopyLink}
                  />
                  <Button
                    intent="accent"
                    type="button"
                    disabled={busy || working}
                    loading={working}
                    loadingLabel="Updating"
                    onClick={close}
                  >
                    Done
                  </Button>
                </>
              ),
            },
            transfer: {
              title: "Transfer ownership",
              body: (
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-foreground">
                    {project.name}
                  </span>
                  <span className="text-xs text-muted-foreground-2">
                    New owners can change access and delete the project
                  </span>
                  <ul className="flex max-h-40 flex-col gap-px overflow-y-auto">
                    {transferable.map((person) => (
                      <li key={person.id}>
                        <button
                          type="button"
                          data-selected={transferTo === person.id || undefined}
                          className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm text-foreground outline-none select-none hover:bg-secondary focus-visible:outline-ring-inset data-[selected]:bg-secondary"
                          onClick={() => setTransferTo(person.id)}
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {person.name}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ),
              footer: (
                <>
                  <Button variant="ghost" type="button" onClick={close}>
                    Cancel
                  </Button>
                  <Button
                    intent="accent"
                    type="button"
                    disabled={
                      transferTo === null ||
                      busy ||
                      working ||
                      onTransferOwnership === undefined
                    }
                    onClick={() =>
                      run(
                        () =>
                          onTransferOwnership?.(transferTo ?? "") ??
                          Promise.resolve(),
                        close,
                      )
                    }
                  >
                    Transfer
                  </Button>
                </>
              ),
            },
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function peopleByName(
  people: ReadonlyArray<SharePerson>,
  id: string,
): SharePerson {
  return (
    people.find((person) => person.id === id) ?? {
      id,
      name: nameOf(people, id),
      imageUrl: null,
      service: false,
    }
  );
}

function CopyLinkButton({
  url,
  title,
  onCopy,
}: {
  readonly url: string;
  readonly title: string;
  readonly onCopy?: () => void;
}) {
  return (
    <div className={cx("flex min-w-0 flex-1 items-center gap-1")}>
      <CopyField value={url} label={`Copy link to ${title}`} />
      <Button variant="ghost" size="sm" type="button" onClick={onCopy}>
        <Icon name="share-os" className="size-(--icon-sm)" />
        Copy link
      </Button>
    </div>
  );
}
