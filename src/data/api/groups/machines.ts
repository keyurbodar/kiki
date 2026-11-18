import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/http-api";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class MachinesGroup extends HttpApiGroup.make("machines").add(
  HttpApiEndpoint.get(
    "previewHandoff",
    "/machines/:machineId/ports/:port/handoff",
    {
      error: HttpApiError.NotFoundNoContent,
      params: { machineId: Schema.String, port: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get("list", "/orgs/:orgId/jams/:jamId/machines", {
    params: { orgId: Schema.String, jamId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post(
    "connect",
    "/orgs/:orgId/jams/:jamId/machines/:machineId/connect",
    {
      error: HttpApiError.NotFoundNoContent,
      params: {
        orgId: Schema.String,
        jamId: Schema.String,
        machineId: Schema.String,
      },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post(
    "extend",
    "/orgs/:orgId/jams/:jamId/machines/:machineId/extend",
    {
      error: HttpApiError.NotFoundNoContent,
      params: {
        orgId: Schema.String,
        jamId: Schema.String,
        machineId: Schema.String,
      },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get(
    "metrics",
    "/orgs/:orgId/jams/:jamId/machines/:machineId/metrics",
    {
      error: HttpApiError.NotFoundNoContent,
      params: {
        orgId: Schema.String,
        jamId: Schema.String,
        machineId: Schema.String,
      },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.delete(
    "removePhone",
    "/orgs/:orgId/jams/:jamId/machines/:machineId/phone",
    {
      error: HttpApiError.NotFoundNoContent,
      params: {
        orgId: Schema.String,
        jamId: Schema.String,
        machineId: Schema.String,
      },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post(
    "pressPhone",
    "/orgs/:orgId/jams/:jamId/machines/:machineId/phone/press",
    {
      error: HttpApiError.NotFoundNoContent,
      params: {
        orgId: Schema.String,
        jamId: Schema.String,
        machineId: Schema.String,
      },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post(
    "sleepPhone",
    "/orgs/:orgId/jams/:jamId/machines/:machineId/phone/sleep",
    {
      error: HttpApiError.NotFoundNoContent,
      params: {
        orgId: Schema.String,
        jamId: Schema.String,
        machineId: Schema.String,
      },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get(
    "phoneStream",
    "/orgs/:orgId/jams/:jamId/machines/:machineId/phone/stream",
    {
      error: HttpApiError.NotFoundNoContent,
      params: {
        orgId: Schema.String,
        jamId: Schema.String,
        machineId: Schema.String,
      },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get(
    "ports",
    "/orgs/:orgId/jams/:jamId/machines/:machineId/ports",
    {
      error: HttpApiError.NotFoundNoContent,
      params: {
        orgId: Schema.String,
        jamId: Schema.String,
        machineId: Schema.String,
      },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post(
    "openPort",
    "/orgs/:orgId/jams/:jamId/machines/:machineId/ports/:port/open",
    {
      error: HttpApiError.NotFoundNoContent,
      params: {
        orgId: Schema.String,
        jamId: Schema.String,
        machineId: Schema.String,
        port: Schema.String,
      },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post(
    "reserve",
    "/orgs/:orgId/jams/:jamId/machines/:machineId/reserve",
    {
      error: HttpApiError.NotFoundNoContent,
      params: {
        orgId: Schema.String,
        jamId: Schema.String,
        machineId: Schema.String,
      },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.delete(
    "release",
    "/orgs/:orgId/jams/:jamId/machines/:machineId/reserve",
    {
      error: HttpApiError.NotFoundNoContent,
      params: {
        orgId: Schema.String,
        jamId: Schema.String,
        machineId: Schema.String,
      },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.delete(
    "removeServicePreview",
    "/orgs/:orgId/jams/:jamId/machines/:machineId/service-previews/:port",
    {
      error: HttpApiError.NotFoundNoContent,
      params: {
        orgId: Schema.String,
        jamId: Schema.String,
        machineId: Schema.String,
        port: Schema.String,
      },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get(
    "sessions",
    "/orgs/:orgId/jams/:jamId/machines/:machineId/sessions",
    {
      error: HttpApiError.NotFoundNoContent,
      params: {
        orgId: Schema.String,
        jamId: Schema.String,
        machineId: Schema.String,
      },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post(
    "launchSetupEntry",
    "/orgs/:orgId/jams/:jamId/machines/:machineId/setup-entries/launch",
    {
      error: HttpApiError.NotFoundNoContent,
      params: {
        orgId: Schema.String,
        jamId: Schema.String,
        machineId: Schema.String,
      },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post(
    "rerunSetup",
    "/orgs/:orgId/jams/:jamId/machines/:machineId/setup/rerun",
    {
      error: HttpApiError.NotFoundNoContent,
      params: {
        orgId: Schema.String,
        jamId: Schema.String,
        machineId: Schema.String,
      },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post(
    "wake",
    "/orgs/:orgId/jams/:jamId/machines/:machineId/wake",
    {
      error: HttpApiError.NotFoundNoContent,
      params: {
        orgId: Schema.String,
        jamId: Schema.String,
        machineId: Schema.String,
      },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post("attachPhone", "/orgs/:orgId/jams/:jamId/phones", {
    error: HttpApiError.NotFoundNoContent,
    params: { orgId: Schema.String, jamId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get(
    "listServicePreviews",
    "/orgs/:orgId/jams/:jamId/service-previews",
    {
      params: { orgId: Schema.String, jamId: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get(
    "resolvePreviewToken",
    "/orgs/:orgId/jams/:jamId/service-previews/resolve",
    {
      params: { orgId: Schema.String, jamId: Schema.String },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get("sizes", "/orgs/:orgId/machine-sizes", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
) {}
