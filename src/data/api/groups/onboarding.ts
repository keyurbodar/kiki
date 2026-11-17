import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { InferredMethod } from "../annotations.ts";
import { Undecoded } from "../undecoded.ts";

export class OnboardingGroup extends HttpApiGroup.make("onboarding").add(
  HttpApiEndpoint.get("status", "/orgs/:orgId/onboarding", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.put("dismiss", "/orgs/:orgId/onboarding/dismissal", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.delete("restore", "/orgs/:orgId/onboarding/dismissal", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.put("skip", "/orgs/:orgId/onboarding/skips/:step", {
    params: { orgId: Schema.String, step: Schema.String },
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.delete("unskip", "/orgs/:orgId/onboarding/skips/:step", {
    params: { orgId: Schema.String, step: Schema.String },
    success: Undecoded,
  }).annotate(InferredMethod, true),
) {}
