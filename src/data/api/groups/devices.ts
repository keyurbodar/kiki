import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { InferredMethod } from "../annotations.ts";
import {
  ApproveDeviceCodeRequest,
  Device,
  DeviceCodeNotFound,
  DeviceCodePreview,
  DeviceCodeResolution,
  DeviceId,
  DeviceNotFound,
  LookupDeviceCodeRequest,
  RenameDeviceRequest,
  SetDeviceAccessRequest,
  SetDeviceAgentAccessRequest,
  SetDeviceComputerUseAccessRequest,
  SetDeviceDescriptionRequest,
} from "../schemas/devices.ts";
import { OrgId } from "../schemas/ids.ts";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class DevicesGroup extends HttpApiGroup.make("devices").add(
  HttpApiEndpoint.post("codeStart", "/devices/code", {
    payload: Undecoded,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.post("codeDeny", "/devices/code/deny", {
    payload: LookupDeviceCodeRequest,
    success: DeviceCodeResolution,
    error: DeviceCodeNotFound,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.post("codeLookup", "/devices/code/lookup", {
    payload: LookupDeviceCodeRequest,
    success: DeviceCodePreview,
    error: DeviceCodeNotFound,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.post("codePoll", "/devices/code/poll", {
    payload: Undecoded,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.post("enroll", "/devices/enroll", {
    payload: Undecoded,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.get("list", "/orgs/:orgId/devices", {
    params: { orgId: OrgId },
    success: Schema.Array(Device),
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.patch("rename", "/orgs/:orgId/devices/:deviceId", {
    params: { orgId: OrgId, deviceId: DeviceId },
    payload: RenameDeviceRequest,
    success: Device,
    error: DeviceNotFound,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.post("setAccess", "/orgs/:orgId/devices/:deviceId/access", {
    params: { orgId: OrgId, deviceId: DeviceId },
    payload: SetDeviceAccessRequest,
    success: Device,
    error: DeviceNotFound,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.get("listAccess", "/orgs/:orgId/devices/:deviceId/access", {
    params: { orgId: Schema.String, deviceId: Schema.String },
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "denyAccess",
    "/orgs/:orgId/devices/:deviceId/access/:accessId/deny",
    {
      params: {
        orgId: Schema.String,
        deviceId: Schema.String,
        accessId: Schema.String,
      },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "grantAccess",
    "/orgs/:orgId/devices/:deviceId/access/:accessId/grant",
    {
      params: {
        orgId: Schema.String,
        deviceId: Schema.String,
        accessId: Schema.String,
      },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "revokeAccess",
    "/orgs/:orgId/devices/:deviceId/access/:accessId/revoke",
    {
      params: {
        orgId: Schema.String,
        deviceId: Schema.String,
        accessId: Schema.String,
      },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "withdrawAccess",
    "/orgs/:orgId/devices/:deviceId/access/:accessId/withdraw",
    {
      params: {
        orgId: Schema.String,
        deviceId: Schema.String,
        accessId: Schema.String,
      },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get(
    "activeThreads",
    "/orgs/:orgId/devices/:deviceId/active-threads",
    {
      params: { orgId: Schema.String, deviceId: Schema.String },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "setAgentAccess",
    "/orgs/:orgId/devices/:deviceId/agent-access",
    {
      params: { orgId: OrgId, deviceId: DeviceId },
      payload: SetDeviceAgentAccessRequest,
      success: Device,
      error: DeviceNotFound,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get(
    "listAgentAccess",
    "/orgs/:orgId/devices/:deviceId/agent-access",
    {
      params: { orgId: Schema.String, deviceId: Schema.String },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "denyAgentAccess",
    "/orgs/:orgId/devices/:deviceId/agent-access/:accessId/deny",
    {
      params: {
        orgId: Schema.String,
        deviceId: Schema.String,
        accessId: Schema.String,
      },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "grantAgentAccess",
    "/orgs/:orgId/devices/:deviceId/agent-access/:accessId/grant",
    {
      params: {
        orgId: Schema.String,
        deviceId: Schema.String,
        accessId: Schema.String,
      },
      payload: Undecoded,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "revokeAgentAccess",
    "/orgs/:orgId/devices/:deviceId/agent-access/:accessId/revoke",
    {
      params: {
        orgId: Schema.String,
        deviceId: Schema.String,
        accessId: Schema.String,
      },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "findCheckouts",
    "/orgs/:orgId/devices/:deviceId/checkouts/find",
    {
      params: { orgId: Schema.String, deviceId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "setComputerUseAccess",
    "/orgs/:orgId/devices/:deviceId/computer-use",
    {
      params: { orgId: OrgId, deviceId: DeviceId },
      payload: SetDeviceComputerUseAccessRequest,
      success: Device,
      error: DeviceNotFound,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "denyComputerUse",
    "/orgs/:orgId/devices/:deviceId/computer-use/:accessId/deny",
    {
      params: {
        orgId: Schema.String,
        deviceId: Schema.String,
        accessId: Schema.String,
      },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "grantComputerUse",
    "/orgs/:orgId/devices/:deviceId/computer-use/:accessId/grant",
    {
      params: {
        orgId: Schema.String,
        deviceId: Schema.String,
        accessId: Schema.String,
      },
      payload: Undecoded,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "revokeComputerUse",
    "/orgs/:orgId/devices/:deviceId/computer-use/:accessId/revoke",
    {
      params: {
        orgId: Schema.String,
        deviceId: Schema.String,
        accessId: Schema.String,
      },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "setDescription",
    "/orgs/:orgId/devices/:deviceId/description",
    {
      params: { orgId: OrgId, deviceId: DeviceId },
      payload: SetDeviceDescriptionRequest,
      success: Device,
      error: DeviceNotFound,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get(
    "browseFolders",
    "/orgs/:orgId/devices/:deviceId/folders",
    {
      params: { orgId: Schema.String, deviceId: Schema.String },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "linkFolder",
    "/orgs/:orgId/devices/:deviceId/folders/link",
    {
      params: { orgId: Schema.String, deviceId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "unlinkFolder",
    "/orgs/:orgId/devices/:deviceId/folders/unlink",
    {
      params: { orgId: Schema.String, deviceId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "setProjectCheckout",
    "/orgs/:orgId/devices/:deviceId/project-checkout",
    {
      params: { orgId: Schema.String, deviceId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "clearProjectCheckout",
    "/orgs/:orgId/devices/:deviceId/project-checkout/clear",
    {
      params: { orgId: Schema.String, deviceId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get("pullList", "/orgs/:orgId/devices/:deviceId/pulls", {
    params: { orgId: Schema.String, deviceId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.get(
    "pullDetail",
    "/orgs/:orgId/devices/:deviceId/pulls/:number",
    {
      params: {
        orgId: Schema.String,
        deviceId: Schema.String,
        number: Schema.String,
      },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "pullAct",
    "/orgs/:orgId/devices/:deviceId/pulls/:number/act",
    {
      params: {
        orgId: Schema.String,
        deviceId: Schema.String,
        number: Schema.String,
      },
      query: UndecodedQuery,
      payload: Undecoded,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get(
    "pullDiff",
    "/orgs/:orgId/devices/:deviceId/pulls/:number/diff",
    {
      params: {
        orgId: Schema.String,
        deviceId: Schema.String,
        number: Schema.String,
      },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post(
    "pullRefresh",
    "/orgs/:orgId/devices/:deviceId/pulls/refresh",
    {
      params: { orgId: Schema.String, deviceId: Schema.String },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.post("revoke", "/orgs/:orgId/devices/:deviceId/revoke", {
    params: { orgId: OrgId, deviceId: DeviceId },
    success: Device,
    error: DeviceNotFound,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.get(
    "workspaceIndex",
    "/orgs/:orgId/devices/:deviceId/workspace-index",
    {
      params: { orgId: Schema.String, deviceId: Schema.String },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get("worktrees", "/orgs/:orgId/devices/:deviceId/worktrees", {
    params: { orgId: Schema.String, deviceId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.post("codeApprove", "/orgs/:orgId/devices/code/approve", {
    params: { orgId: OrgId },
    payload: ApproveDeviceCodeRequest,
    success: DeviceCodeResolution,
    error: DeviceCodeNotFound,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.get(
    "listProjectCheckouts",
    "/orgs/:orgId/projects/:projectId/device-checkouts",
    {
      params: { orgId: Schema.String, projectId: Schema.String },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
  HttpApiEndpoint.get(
    "listThreadAgentAccess",
    "/orgs/:orgId/threads/:threadId/agent-access",
    {
      params: { orgId: Schema.String, threadId: Schema.String },
      success: Undecoded,
    },
  ).annotate(InferredMethod, true),
) {}
