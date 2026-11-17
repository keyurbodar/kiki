import { DateTime, Effect, Ref } from "effect";
import {
  ServiceUser,
  ServiceUserDetail,
  ServiceUserNotFound,
} from "../../api/schemas/api-keys.ts";
import { type ServiceUserId, UserId } from "../../api/schemas/ids.ts";
import { MockDb, newId } from "../db/MockDb.ts";
import { fixtureNow } from "../fixtures/time.ts";
import { viewer } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import { sampleServiceUsers } from "./fixtures.ts";

const summary = ({
  projectIds: _p,
  subscriptionServices: _s,
  ...row
}: ServiceUserDetail) => new ServiceUser(row);

export const ServiceUsersMock = mockGroup("serviceUsers", (handlers) =>
  Effect.gen(function* () {
    const db = yield* MockDb;
    const users =
      yield* Ref.make<ReadonlyArray<ServiceUserDetail>>(sampleServiceUsers);

    const find = (serviceUserId: ServiceUserId) =>
      Ref.get(users).pipe(
        Effect.map((rows) => rows.find((row) => row.id === serviceUserId)),
        Effect.flatMap((row) =>
          row === undefined
            ? Effect.fail(new ServiceUserNotFound({ serviceUserId }))
            : Effect.succeed(row),
        ),
      );

    const update = (
      serviceUserId: ServiceUserId,
      change: Partial<ConstructorParameters<typeof ServiceUserDetail>[0]>,
    ) =>
      Effect.gen(function* () {
        const current = yield* find(serviceUserId);
        const next = new ServiceUserDetail({
          ...current,
          ...change,
          updatedAt: DateTime.nowUnsafe(),
        });
        yield* Ref.update(users, (rows) =>
          rows.map((row) => (row.id === serviceUserId ? next : row)),
        );
        yield* Ref.update(db.serviceUsers, (rows) =>
          rows.map((row) =>
            row.id === serviceUserId
              ? { ...row, name: next.name, description: next.description ?? "" }
              : row,
          ),
        );
        return next;
      });

    return handlers
      .handle("list", () =>
        Ref.get(users).pipe(Effect.map((rows) => rows.map(summary))),
      )
      .handle("get", ({ params }) => find(params.serviceUserId))
      .handle("create", ({ payload }) =>
        Effect.gen(function* () {
          const created = new ServiceUserDetail({
            id: newId("svc") as ServiceUserId,
            name: payload.name,
            description: payload.description ?? null,
            icon: payload.icon ?? null,
            role: payload.role,
            projectAccessMode: "all_org_projects",
            projectIds: [],
            model: null,
            monthlySpendCapCredits: null,
            subscriptionOwnerUserId: null,
            subscriptionServices: [],
            createdByUserId: UserId.make(viewer.id),
            disabledAt: null,
            createdAt: fixtureNow,
            updatedAt: fixtureNow,
          });
          yield* Ref.update(users, (rows) => [...rows, created]);
          yield* Ref.update(db.serviceUsers, (rows) => [
            ...rows,
            {
              id: created.id,
              name: created.name,
              description: created.description ?? "",
              createdBy: viewer.id,
              createdAt: DateTime.formatIso(fixtureNow),
            },
          ]);
          return created;
        }),
      )
      .handle("update", ({ params, payload }) =>
        update(params.serviceUserId, payload),
      )
      .handle("disable", ({ params }) =>
        update(params.serviceUserId, { disabledAt: DateTime.nowUnsafe() }),
      )
      .handle("restore", ({ params }) =>
        update(params.serviceUserId, { disabledAt: null }),
      )
      .handle("replaceProjects", ({ params, payload }) =>
        update(params.serviceUserId, {
          projectAccessMode: payload.projectAccessMode,
          projectIds:
            payload.projectAccessMode === "all_org_projects"
              ? []
              : payload.projectIds,
        }),
      )
      .handle("setSubscription", ({ params, payload }) =>
        update(params.serviceUserId, {
          subscriptionOwnerUserId: payload.ownerUserId,
          subscriptionServices: payload.ownerUserId === null ? [] : ["claude"],
        }),
      );
  }),
);
