import { Effect, Ref } from "effect";
import {
  type Row as DbRow,
  fields,
  MockDb,
  missing,
  newId,
} from "../db/MockDb.ts";
import { isoMinutesAgo, people, projects } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  serviceUserDefaults,
  serviceUserDetails,
  serviceUserSubscriptions,
} from "./fixtures.ts";

type Row = Record<string, unknown>;
type ServiceUserRow = DbRow<"serviceUsers">;

const string = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const projectIds = (value: unknown): ReadonlyArray<string> => {
  if (Array.isArray(value)) {
    return value.filter((id): id is string => typeof id === "string");
  }
  const single = string(value);
  return single ? [single] : [];
};

export const ServiceUsersMock = mockGroup("serviceUsers", (handlers) =>
  Effect.gen(function* () {
    const { serviceUsers } = yield* MockDb;
    const validProjects: ReadonlyArray<string> = Object.values(projects).map(
      (project) => project.id,
    );
    const details = yield* Ref.make<Readonly<Record<string, Row>>>(
      Object.fromEntries(
        Object.entries(serviceUserDetails).map(([id, value]) => [
          id,
          { ...value, disabledAt: null },
        ]),
      ),
    );
    const subscriptions = yield* Ref.make<ReadonlyArray<Row>>(
      structuredClone(serviceUserSubscriptions) as ReadonlyArray<Row>,
    );

    const withDetails = (
      row: ServiceUserRow,
      detail: Row | undefined,
    ): Row => ({
      ...row,
      projectIds: detail?.projectIds ?? serviceUserDefaults.projectIds,
      disabledAt: detail?.disabledAt ?? null,
      disabled: detail?.disabledAt != null,
    });

    const findRow = (id: string) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(serviceUsers);
        const row = rows.find((candidate) => candidate.id === id);
        if (!row) return yield* missing("serviceUsers", id);
        return row;
      });

    const replaceRow = (
      id: string,
      change: (row: ServiceUserRow) => ServiceUserRow,
    ) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(serviceUsers);
        if (!rows.some((row) => row.id === id)) {
          return yield* missing("serviceUsers", id);
        }
        const updated = rows.map((row) => (row.id === id ? change(row) : row));
        yield* Ref.set(serviceUsers, updated);
        return updated.find((row) => row.id === id)!;
      });

    const findDetail = (id: string) =>
      Effect.gen(function* () {
        const all = yield* Ref.get(details);
        const detail = all[id];
        if (!detail) {
          return yield* Effect.die(new Error(`serviceUsers: no detail ${id}`));
        }
        return detail;
      });

    const setDetail = (id: string, change: (detail: Row) => Row) =>
      Effect.flatMap(findDetail(id), (detail) =>
        Effect.flatMap(Ref.get(details), (all) =>
          Ref.set(details, { ...all, [id]: change(detail) }),
        ),
      );

    const scopedProjects = (value: unknown) => {
      const requested = projectIds(value);
      const selected = requested.filter((id) => validProjects.includes(id));
      return selected.length > 0 ? selected : serviceUserDefaults.projectIds;
    };

    return handlers
      .handle("list", () =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(serviceUsers);
          const all = yield* Ref.get(details);
          return rows.map((row) => withDetails(row, all[row.id]));
        }),
      )
      .handle("get", ({ params }) =>
        Effect.gen(function* () {
          const row = yield* findRow(params.serviceUserId);
          return withDetails(row, yield* findDetail(params.serviceUserId));
        }),
      )
      .handle("create", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const row: ServiceUserRow = {
            id: newId("svc"),
            name: string(input.name) ?? "New service user",
            description:
              string(input.description) ?? "Automates Acme project workflows.",
            createdBy: people.alex.id,
            createdAt: isoMinutesAgo(0),
          };
          yield* Ref.update(serviceUsers, (rows) => [...rows, row]);
          yield* Ref.update(details, (all) => ({
            ...all,
            [row.id]: {
              projectIds: scopedProjects(input.projectIds ?? input.projects),
              disabledAt: null,
            },
          }));
          return withDetails(row, yield* findDetail(row.id));
        }),
      )
      .handle("update", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* findRow(params.serviceUserId);
          const input = fields(payload);
          const name = string(input.name);
          const description = string(input.description);
          const updated = yield* replaceRow(params.serviceUserId, (row) => ({
            ...row,
            ...(name ? { name } : {}),
            ...(description ? { description } : {}),
          }));
          return withDetails(updated, yield* findDetail(params.serviceUserId));
        }),
      )
      .handle("disable", ({ params }) =>
        Effect.gen(function* () {
          const row = yield* findRow(params.serviceUserId);
          yield* setDetail(params.serviceUserId, (detail) => ({
            ...detail,
            disabledAt: isoMinutesAgo(0),
          }));
          return withDetails(row, yield* findDetail(params.serviceUserId));
        }),
      )
      .handle("restore", ({ params }) =>
        Effect.gen(function* () {
          const row = yield* findRow(params.serviceUserId);
          yield* setDetail(params.serviceUserId, (detail) => ({
            ...detail,
            disabledAt: null,
          }));
          return withDetails(row, yield* findDetail(params.serviceUserId));
        }),
      )
      .handle("replaceProjects", ({ params, payload }) =>
        Effect.gen(function* () {
          const row = yield* findRow(params.serviceUserId);
          const input = fields(payload);
          const selected = projectIds(
            input.projectIds ?? input.projects,
          ).filter((id) => validProjects.includes(id));
          yield* setDetail(params.serviceUserId, (detail) => ({
            ...detail,
            projectIds: selected,
          }));
          return withDetails(row, yield* findDetail(params.serviceUserId));
        }),
      )
      .handle("setSubscription", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* findRow(params.serviceUserId);
          const input = fields(payload);
          const existing = (yield* Ref.get(subscriptions)).find(
            (sub) => sub.serviceUserId === params.serviceUserId,
          );
          const subscription: Row = {
            id: existing?.id ?? newId("sub"),
            serviceUserId: params.serviceUserId,
            name: string(input.name) ?? existing?.name ?? "Issue activity",
            event: string(input.event) ?? existing?.event ?? "issue.updated",
            target:
              string(input.target) ??
              string(input.url) ??
              "https://hooks.example.com/acme/issues",
            enabled: input.enabled === true || existing?.enabled === true,
            createdAt: existing?.createdAt ?? isoMinutesAgo(0),
          };
          yield* Ref.update(subscriptions, (rows) => [
            ...rows.filter((row) => row.id !== subscription.id),
            subscription,
          ]);
          return subscription;
        }),
      );
  }),
);
