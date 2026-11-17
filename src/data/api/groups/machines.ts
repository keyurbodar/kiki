import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class MachinesGroup extends HttpApiGroup.make("machines").add(
  HttpApiEndpoint.get(
    "previewHandoff",
    "/machines/:machineId/ports/:port/handoff",
    {
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
      params: {
        orgId: Schema.String,
        jamId: Schema.String,
        machineId: Schema.String,
      },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post("attachPhone", "/orgs/:orgId/jams/:jamId/phones", {
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
