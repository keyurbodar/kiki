import { isoMinutesAgo, people } from "../fixtures/world.ts";

export const memberMfaExtensions: Readonly<Record<string, string>> = {
  [people.sam.id]: "Acme Security Keys",
};

export const memberAccessOverrides: Readonly<
  Record<string, { readonly removedAt: string | null; readonly role: string }>
> = {
  [people.casey.id]: { removedAt: null, role: "member" },
};

export const memberActivity = [
  {
    id: "act_member_owner",
    userId: people.alex.id,
    summary: "Granted owner access",
    createdAt: isoMinutesAgo(60),
  },
  {
    id: "act_member_role",
    userId: people.sam.id,
    summary: "Role changed to admin",
    createdAt: isoMinutesAgo(24 * 60),
  },
] as const;
