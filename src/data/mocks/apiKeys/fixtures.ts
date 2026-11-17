import { isoMinutesAgo } from "../fixtures/world.ts";

export const apiKeyDefaults = {
  prefix: "capy_sk_mock",
  lastUsedAt: null,
} as const;

export const apiKeyActivity = [
  {
    id: "act_key_ci_rotate",
    keyId: "key_sample_ci",
    summary: "Key created by Sam Rivera",
    createdAt: isoMinutesAgo(40 * 24 * 60),
  },
] as const;
