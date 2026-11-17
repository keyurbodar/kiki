import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded } from "../undecoded.ts";

export class PluginsGroup extends HttpApiGroup.make("plugins").add(
  HttpApiEndpoint.get("listThreadPlugins", "/orgs/:orgId/jams/:jamId/plugins", {
    params: { orgId: Schema.String, jamId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.get(
    "listInstallations",
    "/orgs/:orgId/plugin-installations",
    { params: { orgId: Schema.String }, success: Undecoded },
  ),
  HttpApiEndpoint.post("addInstallation", "/orgs/:orgId/plugin-installations", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get(
    "getInstallation",
    "/orgs/:orgId/plugin-installations/:installationId",
    {
      params: { orgId: Schema.String, installationId: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.patch(
    "patchInstallation",
    "/orgs/:orgId/plugin-installations/:installationId",
    {
      params: { orgId: Schema.String, installationId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.delete(
    "removeInstallation",
    "/orgs/:orgId/plugin-installations/:installationId",
    {
      params: { orgId: Schema.String, installationId: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post(
    "rollbackInstallation",
    "/orgs/:orgId/plugin-installations/:installationId/rollback",
    {
      params: { orgId: Schema.String, installationId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post(
    "cancelRollback",
    "/orgs/:orgId/plugin-installations/:installationId/rollback/cancel",
    {
      params: { orgId: Schema.String, installationId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post(
    "connectServer",
    "/orgs/:orgId/plugin-installations/:installationId/servers/:serverKey/connect",
    {
      params: {
        orgId: Schema.String,
        installationId: Schema.String,
        serverKey: Schema.String,
      },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.delete(
    "disconnectServer",
    "/orgs/:orgId/plugin-installations/:installationId/servers/:serverKey/connect",
    {
      params: {
        orgId: Schema.String,
        installationId: Schema.String,
        serverKey: Schema.String,
      },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post(
    "syncInstallation",
    "/orgs/:orgId/plugin-installations/:installationId/sync",
    {
      params: { orgId: Schema.String, installationId: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post(
    "updateInstallation",
    "/orgs/:orgId/plugin-installations/:installationId/update",
    {
      params: { orgId: Schema.String, installationId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get("getVersion", "/orgs/:orgId/plugin-versions/:versionId", {
    params: { orgId: Schema.String, versionId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.get(
    "getVersionIcon",
    "/orgs/:orgId/plugin-versions/:versionId/icon",
    {
      params: { orgId: Schema.String, versionId: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post(
    "fetchGitHubVersion",
    "/orgs/:orgId/plugin-versions/github",
    {
      params: { orgId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get("listMarketplace", "/orgs/:orgId/plugins", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
) {}
