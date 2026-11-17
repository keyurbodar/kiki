import { Schema } from "effect";
import { Timestamp, UserId } from "./ids.ts";

export const DeviceId = Schema.String.pipe(Schema.brand("Core.DeviceId"));
export type DeviceId = typeof DeviceId.Type;

export const MachineId = Schema.String.pipe(Schema.brand("Core.MachineId"));
export type MachineId = typeof MachineId.Type;

export const DeviceOs = Schema.Literals(["linux", "darwin", "win32"]);
export type DeviceOs = typeof DeviceOs.Type;

export const DeviceArch = Schema.Literals(["arm64", "x86_64"]);
export type DeviceArch = typeof DeviceArch.Type;

export const DeviceAccess = Schema.Literals(["personal", "shared"]);
export type DeviceAccess = typeof DeviceAccess.Type;

export const DeviceAgentAccessMode = Schema.Literals(["ask", "always"]);
export type DeviceAgentAccessMode = typeof DeviceAgentAccessMode.Type;

export const DeviceFormFactor = Schema.Literals([
  "laptop",
  "desktop",
  "server",
  "cloud",
]);
export type DeviceFormFactor = typeof DeviceFormFactor.Type;

const HardwareText = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(128),
);
const HardwareCount = Schema.Number.check(
  Schema.isInt(),
  Schema.isGreaterThanOrEqualTo(0),
);

export const DeviceHardware = Schema.Struct({
  formFactor: Schema.optional(DeviceFormFactor),
  vendor: Schema.optional(HardwareText),
  model: Schema.optional(HardwareText),
  modelIdentifier: Schema.optional(HardwareText),
  chip: Schema.optional(HardwareText),
  cpuCores: Schema.optional(HardwareCount),
  memoryBytes: Schema.optional(HardwareCount),
  osName: Schema.optional(HardwareText),
  osVersion: Schema.optional(HardwareText),
});
export type DeviceHardware = typeof DeviceHardware.Type;

export const DeviceWorkspace = Schema.Struct({
  root: Schema.String,
  repos: Schema.Array(Schema.String),
  branch: Schema.optional(Schema.String),
  dirty: Schema.optional(Schema.Boolean),
  insertions: Schema.optional(Schema.Number),
  deletions: Schema.optional(Schema.Number),
  missing: Schema.optional(Schema.Boolean),
});
export type DeviceWorkspace = typeof DeviceWorkspace.Type;

export class Device extends Schema.Class<Device>("Device")({
  id: DeviceId,
  machineId: MachineId,
  name: Schema.String,
  description: Schema.NullOr(Schema.String),
  hardware: Schema.NullOr(DeviceHardware),
  hostname: Schema.String,
  os: DeviceOs,
  arch: DeviceArch,
  tokenHint: Schema.String,
  userId: UserId,
  ownerName: Schema.NullOr(Schema.String),
  access: DeviceAccess,
  agentAccess: DeviceAgentAccessMode,
  computerUseAccess: DeviceAgentAccessMode,
  connected: Schema.Boolean,
  workspaces: Schema.NullOr(Schema.Array(DeviceWorkspace)),
  revokedAt: Schema.NullOr(Timestamp),
  lastConnectedAt: Schema.NullOr(Timestamp),
  createdAt: Timestamp,
}) {}

export class DeviceCodePreview extends Schema.Class<DeviceCodePreview>(
  "DeviceCodePreview",
)({
  hostname: Schema.String,
  os: DeviceOs,
  arch: DeviceArch,
  expiresAt: Timestamp,
}) {}

export class DeviceCodeResolution extends Schema.Class<DeviceCodeResolution>(
  "DeviceCodeResolution",
)({
  status: Schema.Literals(["approved", "denied"]),
}) {}

const UserCode = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(64),
);

export const LookupDeviceCodeRequest = Schema.Struct({
  userCode: UserCode,
}).annotate({ identifier: "LookupDeviceCodeRequest" });

export const ApproveDeviceCodeRequest = Schema.Struct({
  userCode: UserCode,
  name: Schema.optional(Schema.String),
}).annotate({ identifier: "ApproveDeviceCodeRequest" });

export const RenameDeviceRequest = Schema.Struct({
  name: Schema.String,
}).annotate({ identifier: "RenameDeviceRequest" });

export const SetDeviceDescriptionRequest = Schema.Struct({
  description: Schema.NullOr(Schema.String.check(Schema.isMaxLength(1024))),
}).annotate({ identifier: "SetDeviceDescriptionRequest" });

export const SetDeviceAccessRequest = Schema.Struct({
  access: DeviceAccess,
}).annotate({ identifier: "SetDeviceAccessRequest" });

export const SetDeviceAgentAccessRequest = Schema.Struct({
  agentAccess: DeviceAgentAccessMode,
}).annotate({ identifier: "SetDeviceAgentAccessRequest" });

export const SetDeviceComputerUseAccessRequest = Schema.Struct({
  computerUseAccess: DeviceAgentAccessMode,
}).annotate({ identifier: "SetDeviceComputerUseAccessRequest" });

export class DeviceNotFound extends Schema.TaggedError<DeviceNotFound>()(
  "capy/DeviceNotFound",
  { deviceId: DeviceId },
  { httpApiStatus: 404 },
) {}

export class DeviceCodeNotFound extends Schema.TaggedError<DeviceCodeNotFound>()(
  "capy/DeviceCodeNotFound",
  {},
  { httpApiStatus: 404 },
) {}
