export type ShareMember = {
  readonly userId: string;
  readonly kind: "human" | "service";
};

export type ShareProject = {
  readonly id: string;
  readonly name: string;
  readonly visibility: "org" | "private";
  readonly ownerUserId: string | null;
  readonly members: ReadonlyArray<ShareMember>;
  readonly viewerRole: "owner" | "member" | "none";
};

export type SharePerson = {
  readonly id: string;
  readonly name: string;
  readonly imageUrl: string | null;
  readonly service: boolean;
};

export const accessCopy = {
  org: {
    label: "Shared",
    description: "Everyone in the organization can see this project",
  },
  private: {
    label: "Private",
    description: "Only specific people",
  },
} as const;

export const canManageSharing = (project: ShareProject) =>
  project.viewerRole === "owner" || project.ownerUserId === null;

export const memberState = (
  project: ShareProject,
  userId: string,
): "owner" | "named" | "candidate" => {
  if (project.ownerUserId === userId) return "owner";
  if (project.members.some((member) => member.userId === userId))
    return "named";
  return "candidate";
};

export const nameOf = (
  people: ReadonlyArray<SharePerson>,
  id: string,
): string => people.find((person) => person.id === id)?.name ?? id;

/** People who could be added: not the owner, not already a member, matching the query. */
export const pendingCandidates = (
  project: ShareProject,
  people: ReadonlyArray<SharePerson>,
  query: string,
): ReadonlyArray<SharePerson> => {
  const taken = new Set(
    [
      ...(project.ownerUserId === null ? [] : [project.ownerUserId]),
      ...project.members.map((member) => member.userId),
    ].filter(Boolean),
  );
  const term = query.trim().toLowerCase();
  return people
    .filter((person) => !taken.has(person.id))
    .filter(
      (person) => term === "" || person.name.toLowerCase().includes(term),
    );
};
