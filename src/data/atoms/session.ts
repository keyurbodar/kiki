import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive, reactivityKeys } from "./conventions.ts";

export const currentUserAtom = ApiClient.query("users", "getCurrent", {
  reactivityKeys: [reactivityKeys.currentUser],
  timeToLive: queryTimeToLive,
});

export const organizationsAtom = ApiClient.query("organizations", "list", {
  reactivityKeys: [reactivityKeys.organizations],
  timeToLive: queryTimeToLive,
});
