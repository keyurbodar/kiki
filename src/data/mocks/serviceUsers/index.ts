import { Effect, Ref } from "effect";
import { fields, MockDb, missing, newId } from "../db/MockDb.ts";
import { isoMinutesAgo, people, projects } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import { sampleServiceUserDefaults } from "./fixtures.ts";

export const ServiceUsersMock = mockGroup("serviceUsers", (handlers) =>
  Effect.gen(function* () {
    const { serviceUsers } = yield* MockDb;
    const details = yield* Ref.make<
      Readonly<Record<string, Record<string, unknown>>>
    >({});

    const find = (serviceUserId: string) =>
      Effect.flatMap(Ref.get(serviceUsers), (rows) => {
        const row = rows.find((candidate) => candidate.id === serviceUserId);
        return row
          ? Effect.succeed(row)
          : missing("serviceUsers", serviceUserId);
      });

    const readDetails = (serviceUserId: string) =>
      Effect.map(Ref.get(details), (rows) => rows[serviceUserId] ?? {});

    const putDetails = (serviceUserId: string, next: Record<string, unknown>) =>
      Ref.update(details, (rows) => ({ ...rows, [serviceUserId]: next })).pipe(
        Effect.as(next),
      );

    const replace = (serviceUserId: string, next: Record<string, unknown>) =>
      Effect.gen(function* () {
        yield* find(serviceUserId);
        const rows = yield* Ref.get(serviceUsers);
        yield* Ref.set(
          serviceUsers,
          rows.map((row) =>
            row.id === serviceUserId ? next : row,
          ) as typeof rows,
        );
        return next;
      });

    return handlers
      .handle("list", () => Ref.get(serviceUsers))
      .handle("create", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const row = {
            id: newId("svc"),
            name:
              typeof input.name === "string" && input.name.length > 0
                ? input.name
                : sampleServiceUserDefaults.name,
            description:
              typeof input.description === "string"
                ? input.description
                : sampleServiceUserDefaults.description,
            createdBy:
              typeof input.createdBy === "string"
                ? input.createdBy
                : people.sam.id,
            createdAt: isoMinutesAgo(0),
          };
          yield* Ref.update(serviceUsers, (rows) => [...rows, row]);
          yield* putDetails(row.id, {
            disabledAt: null,
            projectIds: [...sampleServiceUserDefaults.projectIds],
            subscriptionPlan: sampleServiceUserDefaults.subscriptionPlan,
          });
          return row;
        }),
      )
      .handle("get", ({ params }) =>
        Effect.gen(function* () {
          const row = yield* find(params.serviceUserId);
          const extra = yield* readDetails(params.serviceUserId);
          return { ...row, ...extra, organizationId: params.orgId };
        }),
      )
      .handle("update", ({ params, payload }) =>
        Effect.gen(function* () {
          const current = yield* find(params.serviceUserId);
          const input = fields(payload);
          const next = {
            ...current,
            ...(typeof input.name === "string" ? { name: input.name } : {}),
            ...(typeof input.description === "string"
              ? { description: input.description }
              : {}),
          };
          return yield* replace(params.serviceUserId, next);
        }),
      )
      .handle("disable", ({ params }) =>
        Effect.gen(function* () {
          const row = yield* find(params.serviceUserId);
          const disabledAt = isoMinutesAgo(0);
          const extra = yield* readDetails(params.serviceUserId);
          yield* putDetails(params.serviceUserId, { ...extra, disabledAt });
          return { ...row, ...extra, disabledAt, enabled: false };
        }),
      )
      .handle("restore", ({ params }) =>
        Effect.gen(function* () {
          const row = yield* find(params.serviceUserId);
          const extra = yield* readDetails(params.serviceUserId);
          yield* putDetails(params.serviceUserId, {
            ...extra,
            disabledAt: null,
          });
          return { ...row, ...extra, disabledAt: null, enabled: true };
        }),
      )
      .handle("replaceProjects", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* find(params.serviceUserId);
          const input = fields(payload);
          const candidate = input.projectIds ?? input.ids;
          const projectIds = Array.isArray(candidate)
            ? candidate.filter((id): id is string => typeof id === "string")
            : [projects.web.id];
          const extra = yield* readDetails(params.serviceUserId);
          const next = yield* putDetails(params.serviceUserId, {
            ...extra,
            projectIds,
          });
          return { ok: true, id: params.serviceUserId, ...next };
        }),
      )
      .handle("setSubscription", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* find(params.serviceUserId);
          const input = fields(payload);
          const subscriptionPlan =
            typeof input.plan === "string"
              ? input.plan
              : typeof input.subscription === "string"
                ? input.subscription
                : sampleServiceUserDefaults.subscriptionPlan;
          const extra = yield* readDetails(params.serviceUserId);
          const next = yield* putDetails(params.serviceUserId, {
            ...extra,
            subscriptionPlan,
          });
          return { ok: true, id: params.serviceUserId, ...next };
        }),
      );
  }),
);
