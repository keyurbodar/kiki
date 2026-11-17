import { Effect, Ref } from "effect";
import { fields, MockDb } from "../db/MockDb.ts";
import { mockGroup } from "../mockGroup.ts";
import { sampleConnection, sampleDashboard, updatedAt } from "./fixtures.ts";

type Connection = Record<string, unknown>;

const flag = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const text = (value: unknown, fallback: string) =>
  typeof value === "string" && value.length > 0 ? value : fallback;

export const MobileConnectionMock = mockGroup("mobileConnection", (handlers) =>
  Effect.gen(function* () {
    const db = yield* MockDb;
    const connection = yield* Ref.make<Connection>({ ...sampleConnection });

    const detail = (current: Connection) =>
      Effect.gen(function* () {
        const devices = yield* Ref.get(db.devices);
        const device = devices.find((row) => row.id === current.deviceId);
        return {
          ...current,
          device: device ?? null,
          online: device?.online ?? false,
        };
      });

    const state = () => Ref.get(connection).pipe(Effect.flatMap(detail));

    return handlers
      .handle("get", () => state())
      .handle("connect", () =>
        Effect.gen(function* () {
          const devices = yield* Ref.get(db.devices);
          const device = devices.find((row) => row.online) ?? devices[0];
          if (!device) {
            return yield* Effect.die(
              new Error("mobileConnection.connect: no online device"),
            );
          }
          yield* Ref.update(connection, (current) => ({
            ...current,
            connected: true,
            enabled: true,
            deviceId: device.id,
            deviceName: device.name,
            ownerId: device.ownerId,
            pairedAt: current.pairedAt,
            lastSyncAt: updatedAt(),
          }));
          return yield* state();
        }),
      )
      .handle("disconnect", () =>
        Effect.gen(function* () {
          yield* Ref.update(connection, (current) => ({
            ...current,
            connected: false,
            lastSyncAt: updatedAt(),
          }));
          return yield* state();
        }),
      )
      .handle("setEnabled", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          yield* Ref.update(connection, (current) => ({
            ...current,
            enabled: flag(input.enabled, false),
            ...(typeof input.deviceId === "string"
              ? { deviceId: text(input.deviceId, "") }
              : {}),
            lastSyncAt: updatedAt(),
          }));
          return yield* state();
        }),
      )
      .handle("dashboard", () =>
        Effect.gen(function* () {
          const current = yield* Ref.get(connection);
          return {
            ...sampleDashboard,
            connected: current.connected === true,
            activeSessions: sampleDashboard.threads.length,
            updatedAt: updatedAt(),
          };
        }),
      );
  }),
);
