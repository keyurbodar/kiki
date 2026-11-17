import { DateTime, Effect, Ref } from "effect";
import {
  DeviceCodeNotFound,
  DeviceCodePreview,
  DeviceCodeResolution,
  DeviceId,
  DeviceNotFound,
} from "../../api/schemas/devices.ts";
import { MockDb, newId } from "../db/MockDb.ts";
import { isoMinutesAgo } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  type DeviceDetails,
  deviceDetails,
  normalizeCode,
  pairedDetails,
  pendingCodes,
  toDevice,
  viewerId,
} from "./fixtures.ts";

const codeTtlMinutes = 15;

export const DevicesMock = mockGroup("devices", (handlers) =>
  Effect.gen(function* () {
    const { devices } = yield* MockDb;
    const details = yield* Ref.make<Record<string, DeviceDetails>>({
      ...deviceDetails,
    });
    const codes = yield* Ref.make({ ...pendingCodes });

    const read = (deviceId: string) =>
      Effect.gen(function* () {
        const row = (yield* Ref.get(devices)).find((r) => r.id === deviceId);
        const extra = (yield* Ref.get(details))[deviceId];
        if (row === undefined || extra === undefined) {
          return yield* Effect.fail(
            new DeviceNotFound({ deviceId: DeviceId.make(deviceId) }),
          );
        }
        return toDevice(row, extra);
      });

    const patchDetails = (deviceId: string, patch: Partial<DeviceDetails>) =>
      Effect.gen(function* () {
        yield* read(deviceId);
        yield* Ref.update(details, (all) => {
          const current = all[deviceId];
          return current === undefined
            ? all
            : { ...all, [deviceId]: { ...current, ...patch } };
        });
        return yield* read(deviceId);
      });

    const patchRow = (
      deviceId: string,
      patch: { name?: string; sharedWithOrg?: boolean },
    ) =>
      Effect.gen(function* () {
        yield* read(deviceId);
        yield* Ref.update(devices, (rows) =>
          rows.map((row) => (row.id === deviceId ? { ...row, ...patch } : row)),
        );
        return yield* read(deviceId);
      });

    const pending = (userCode: string) =>
      Effect.gen(function* () {
        const code = (yield* Ref.get(codes))[normalizeCode(userCode)];
        if (code === undefined) {
          return yield* Effect.fail(new DeviceCodeNotFound());
        }
        return code;
      });

    const consume = (userCode: string) =>
      Ref.update(codes, (all) => {
        const { [normalizeCode(userCode)]: _, ...rest } = all;
        return rest;
      });

    return handlers
      .handle("list", () =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(devices);
          const extra = yield* Ref.get(details);
          return rows.flatMap((row) => {
            const more = extra[row.id];
            return more === undefined ? [] : [toDevice(row, more)];
          });
        }),
      )
      .handle("rename", ({ params, payload }) =>
        patchRow(params.deviceId, { name: payload.name }),
      )
      .handle("setDescription", ({ params, payload }) =>
        patchDetails(params.deviceId, { description: payload.description }),
      )
      .handle("setAccess", ({ params, payload }) =>
        patchRow(params.deviceId, {
          sharedWithOrg: payload.access === "shared",
        }),
      )
      .handle("setAgentAccess", ({ params, payload }) =>
        patchDetails(params.deviceId, { agentAccess: payload.agentAccess }),
      )
      .handle("setComputerUseAccess", ({ params, payload }) =>
        patchDetails(params.deviceId, {
          computerUseAccess: payload.computerUseAccess,
        }),
      )
      .handle("revoke", ({ params }) =>
        Effect.gen(function* () {
          const revokedAt = yield* DateTime.now;
          return yield* patchDetails(params.deviceId, { revokedAt });
        }),
      )
      .handle("codeLookup", ({ payload }) =>
        Effect.gen(function* () {
          const code = yield* pending(payload.userCode);
          const now = yield* DateTime.now;
          return new DeviceCodePreview({
            ...code,
            expiresAt: DateTime.add(now, { minutes: codeTtlMinutes }),
          });
        }),
      )
      .handle("codeApprove", ({ payload }) =>
        Effect.gen(function* () {
          const code = yield* pending(payload.userCode);
          yield* consume(payload.userCode);
          const id = newId("device");
          yield* Ref.update(devices, (rows) => [
            ...rows,
            {
              id,
              kind: "device",
              name: payload.name ?? code.hostname,
              os: code.os,
              arch: code.arch,
              cores: 0,
              memoryGb: 0,
              ownerId: viewerId,
              online: true,
              lastSeenAt: isoMinutesAgo(0),
              sharedWithOrg: false,
            },
          ]);
          yield* Ref.update(details, (all) => ({
            ...all,
            [id]: pairedDetails(code.hostname),
          }));
          return new DeviceCodeResolution({ status: "approved" });
        }),
      )
      .handle("codeDeny", ({ payload }) =>
        Effect.gen(function* () {
          yield* pending(payload.userCode);
          yield* consume(payload.userCode);
          return new DeviceCodeResolution({ status: "denied" });
        }),
      );
  }),
);
