import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive, reactivityKeys } from "./conventions.ts";

/**
 * The signed-in account the Profile page edits: name, emails and picture. It
 * shares the current user's reactivity key, so a write here refreshes this card
 * and the sidebar's user chip together.
 */
export const accountAtom = ApiClient.query("users", "getAccount", {
  reactivityKeys: [reactivityKeys.currentUser],
  timeToLive: queryTimeToLive,
});

export const updateAccountNameAtom = ApiClient.mutation(
  "users",
  "updateAccountName",
);

export const updateAccountImageAtom = ApiClient.mutation(
  "users",
  "updateAccountImage",
);

export const deleteAccountAtom = ApiClient.mutation("users", "deleteAccount");
