import { isoMinutesAgo, people } from "../fixtures/world.ts";

export const memberMfaExtensions: Readonly<Record<string, string>> = {
  [people.sam.id]: "Acme Security Keys",
};

/**
 * How each member proves who they are. The viewer (Alex) holds a trusted
 * passkey, which is what unlocks the org's two-step controls.
 */
export const memberProtection: Readonly<
  Record<
    string,
    {
      readonly mfaEnabled: boolean;
      readonly passkeyTrusted: boolean;
      readonly enterpriseSso: boolean;
    }
  >
> = {
  [people.alex.id]: {
    mfaEnabled: true,
    passkeyTrusted: true,
    enterpriseSso: false,
  },
  [people.sam.id]: {
    mfaEnabled: true,
    passkeyTrusted: true,
    enterpriseSso: true,
  },
  [people.priya.id]: {
    mfaEnabled: false,
    passkeyTrusted: false,
    enterpriseSso: true,
  },
  [people.jordan.id]: {
    mfaEnabled: false,
    passkeyTrusted: false,
    enterpriseSso: false,
  },
  [people.casey.id]: {
    mfaEnabled: false,
    passkeyTrusted: false,
    enterpriseSso: false,
  },
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
