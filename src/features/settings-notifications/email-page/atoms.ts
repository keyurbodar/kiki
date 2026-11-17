import { Atom } from "effect/reactivity";
import { ApiClient } from "@/data/client/ApiClient";

export const emailPreferencesKey = (userId: string) =>
  `email_preferences:${userId}`;

export const emailPreferencesAtom = Atom.family((userId: string) =>
  ApiClient.query("emailPreferences", "get", {
    reactivityKeys: [emailPreferencesKey(userId)],
  }),
);

export const setEmailProgramAtom = ApiClient.mutation(
  "emailPreferences",
  "setProgram",
);

export const setEmailNoticeAtom = ApiClient.mutation(
  "emailPreferences",
  "setNotice",
);

export const setEmailMarketingAtom = ApiClient.mutation(
  "emailPreferences",
  "setMarketing",
);
