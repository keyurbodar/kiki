import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class ReferralsGroup extends HttpApiGroup.make("referrals").add(
  HttpApiEndpoint.get("dashboard", "/referrals", { success: Undecoded }),
  HttpApiEndpoint.post("apply", "/referrals/apply", {
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("list", "/referrals/history", {
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("invite", "/referrals/invite", {
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("kickbacks", "/referrals/kickbacks", {
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("preview", "/referrals/preview", {
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("referee", "/referrals/referee", { success: Undecoded }),
  HttpApiEndpoint.post("track", "/referrals/track", {
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("transfers", "/referrals/transfers", {
    query: UndecodedQuery,
    success: Undecoded,
  }),
) {}
