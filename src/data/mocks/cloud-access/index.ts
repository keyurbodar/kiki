import { Effect, Ref } from "effect";
import {
  CloudAccess,
  type CloudAccessTarget,
} from "../../api/schemas/cloud-access.ts";
import { InvalidRequest } from "../../api/schemas/errors.ts";
import { IntegrationMutationResult } from "../../api/schemas/integrations.ts";
import { newId } from "../db/MockDb.ts";
import { projects } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  makeTarget,
  recheck,
  sampleCloudAccess,
  updateTarget,
} from "./fixtures.ts";

const projectIds = new Set<string>(
  Object.values(projects).map((project) => project.id),
);

const unknownRow = (kind: string, id: string) =>
  Effect.fail(new InvalidRequest({ message: `No ${kind} ${id}` }));

export const CloudAccessMock = mockGroup("cloud-access", (handlers) =>
  Effect.gen(function* () {
    const access = yield* Ref.make(sampleCloudAccess);

    const setTargets = (targets: ReadonlyArray<CloudAccessTarget>) =>
      Ref.update(access, (current) => new CloudAccess({ ...current, targets }));

    const replace = (
      id: string,
      next: (target: CloudAccessTarget) => CloudAccessTarget,
    ) =>
      Effect.gen(function* () {
        const { targets } = yield* Ref.get(access);
        const target = targets.find((row) => row.id === id);
        if (!target) return yield* unknownRow("target", id);
        const updated = next(target);
        yield* setTargets(
          targets.map((row) => (row.id === id ? updated : row)),
        );
        return updated;
      });

    return handlers
      .handle("getCloudAccess", () => Ref.get(access))
      .handle("createCloudAccessTarget", ({ payload }) =>
        Effect.gen(function* () {
          if (!projectIds.has(payload.projectId)) {
            return yield* unknownRow("project", payload.projectId);
          }
          const { targets } = yield* Ref.get(access);
          const target = makeTarget(newId("cat"), payload, targets);
          yield* setTargets([...targets, target]);
          return target;
        }),
      )
      .handle("updateCloudAccessTarget", ({ params, payload }) =>
        replace(params.targetId, (target) => updateTarget(target, payload)),
      )
      .handle("checkCloudAccessTarget", ({ params }) =>
        replace(params.targetId, recheck),
      )
      .handle("deleteCloudAccessTarget", ({ params }) =>
        Effect.gen(function* () {
          const { targets } = yield* Ref.get(access);
          if (!targets.some((row) => row.id === params.targetId)) {
            return yield* unknownRow("target", params.targetId);
          }
          yield* setTargets(
            targets.filter((row) => row.id !== params.targetId),
          );
          return new IntegrationMutationResult({ ok: true });
        }),
      );
  }),
);
