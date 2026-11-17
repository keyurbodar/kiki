import { Atom } from "effect/reactivity";

export const invitationsDialogOpenAtom = Atom.make(false).pipe(Atom.keepAlive);

export const projectCountLabel = (count: number) =>
  count === 0
    ? "no projects yet"
    : `${count} ${count === 1 ? "project" : "projects"}`;

export type OrganizationsState = {
  readonly organizations: ReadonlyArray<unknown> | undefined;
  readonly failed: boolean;
  readonly waiting: boolean;
};

export function shouldOpenInvitations({
  organizations,
  failed,
  waiting,
}: OrganizationsState): boolean {
  if (organizations === undefined) return failed;
  return !waiting && organizations.length > 0;
}

export const acceptingKey = {
  invite: (id: string) => `invite:${id}`,
  domain: (orgId: string) => `domain:${orgId}`,
};
