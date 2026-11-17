import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive } from "./conventions.ts";

/** The public Explore index: every card for every kind, filtered by the screen. */
export const exploreIndexAtom = ApiClient.query("explorePublic", "listings", {
  query: {},
  timeToLive: queryTimeToLive,
});
