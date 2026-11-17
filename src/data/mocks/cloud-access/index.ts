import { Effect, Ref } from "effect";
import { fields, newId } from "../db/MockDb.ts";
import { isoMinutesAgo } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  type CloudAccessTarget,
  organizationName,
  providerScopes,
  targets,
} from "./fixtures.ts";

const provider = (value: unknown): CloudAccessTarget["provider"] =>
  value === "Linear" || value === "Slack" ? value : "GitHub";

export const CloudAccessMock = mockGroup("cloud-access", (handlers) =>
  Effect.gen(function* () {
    const targetRef =
      yield* Ref.make<ReadonlyArray<CloudAccessTarget>>(targets);

    return handlers
      .handle("getCloudAccess", () =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(targetRef);
          return {
            organizationName,
            targets: rows,
            connectedCount: rows.filter((row) => row.status === "connected")
              .length,
            needsAttentionCount: rows.filter(
              (row) => row.status === "needs_attention",
            ).length,
          };
        }),
      )
      .handle("createCloudAccessTarget", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const kind = provider(input.provider);
          const target: CloudAccessTarget = {
            id: newId("cat"),
            name: String(input.name ?? `${organizationName} ${kind}`),
            provider: kind,
            projectId: String(input.projectId ?? "proj_sample_web"),
            status: "needs_attention",
            externalId: String(input.externalId ?? "acme"),
            lastCheckedAt: null,
            createdBy: String(input.createdBy ?? "user_sample_alex"),
            createdAt: isoMinutesAgo(0),
          };
          yield* Ref.update(targetRef, (rows) => [...rows, target]);
          return target;
        }),
      )
      .handle("updateCloudAccessTarget", ({ params, payload }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(targetRef);
          const current = rows.find((row) => row.id === params.targetId);
          if (!current) {
            return yield* Effect.die(
              new Error(`cloud-access.targets: no row ${params.targetId}`),
            );
          }
          const input = fields(payload);
          const updated: CloudAccessTarget = {
            ...current,
            ...(typeof input.name === "string" ? { name: input.name } : {}),
            ...(typeof input.projectId === "string"
              ? { projectId: input.projectId }
              : {}),
            ...(typeof input.externalId === "string"
              ? { externalId: input.externalId }
              : {}),
          };
          yield* Ref.set(
            targetRef,
            rows.map((row) => (row.id === current.id ? updated : row)),
          );
          return updated;
        }),
      )
      .handle("deleteCloudAccessTarget", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(targetRef);
          if (!rows.some((row) => row.id === params.targetId)) {
            return yield* Effect.die(
              new Error(`cloud-access.targets: no row ${params.targetId}`),
            );
          }
          yield* Ref.set(
            targetRef,
            rows.filter((row) => row.id !== params.targetId),
          );
          return { ok: true };
        }),
      )
      .handle("checkCloudAccessTarget", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(targetRef);
          const current = rows.find((row) => row.id === params.targetId);
          if (!current) {
            return yield* Effect.die(
              new Error(`cloud-access.targets: no row ${params.targetId}`),
            );
          }
          const checked = {
            ...current,
            status: "connected" as const,
            lastCheckedAt: isoMinutesAgo(0),
          };
          yield* Ref.set(
            targetRef,
            rows.map((row) => (row.id === current.id ? checked : row)),
          );
          return {
            targetId: current.id,
            provider: current.provider,
            ok: true,
            status: checked.status,
            scopes: providerScopes[current.provider],
            checkedAt: checked.lastCheckedAt,
          };
        }),
      );
  }),
);
