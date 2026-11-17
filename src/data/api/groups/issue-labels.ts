import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { IssueLabelList } from "../schemas/issue.ts";
import { Undecoded } from "../undecoded.ts";

export class IssueLabelsGroup extends HttpApiGroup.make("issue-labels").add(
  HttpApiEndpoint.get("labels", "/orgs/:orgId/issue-labels", {
    params: { orgId: Schema.String },
    success: IssueLabelList,
  }),
  HttpApiEndpoint.post("createLabel", "/orgs/:orgId/issue-labels", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.patch("updateLabel", "/orgs/:orgId/issue-labels/:labelId", {
    params: { orgId: Schema.String, labelId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.delete("deleteLabel", "/orgs/:orgId/issue-labels/:labelId", {
    params: { orgId: Schema.String, labelId: Schema.String },
    success: Undecoded,
  }),
) {}
