import { DateTime, Effect, Ref, Schema } from "effect";
import { InvalidRequest } from "../../api/schemas/errors.ts";
import { fields, MockDb, newId } from "../db/MockDb.ts";
import { minutesAgo } from "../fixtures/time.ts";
import {
  isoMinutesAgo,
  org,
  viewer,
  models as worldModels,
} from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  type SampleCredential,
  sampleCatalogModels,
  sampleCompactAt,
  sampleConnections,
  sampleCredentials,
  sampleOrgCompactAt,
  sampleOrgKeys,
  sampleRoutingPayload,
  sampleSettings,
} from "./fixtures.ts";

type Settings = {
  defaultModel: string;
  fallbackModel: string;
  memberCredentials: string;
  allowMemberCredentials: boolean;
  membersOverrideFallback: boolean;
  creditsFallback: string;
  availableModels: string[];
  updatedAt: string;
};

type Connection = {
  credentialId: string;
  service: string;
  name: string;
  enabled: boolean;
  models: string[];
  position: number;
};

interface OrgKey {
  provider: string;
  apiKeyId: string;
  prefix: string;
  createdAt: string;
}

const notFound = (kind: string, id: string) =>
  Effect.die(new Error(`models.${kind}: no row ${id}`));

const invalid = (message: string) =>
  Effect.fail(new InvalidRequest({ message }));

const text = (input: Record<string, unknown>, key: string) =>
  typeof input[key] === "string" ? (input[key] as string) : undefined;

const bool = (input: Record<string, unknown>, key: string) =>
  typeof input[key] === "boolean" ? input[key] : undefined;

const list = (input: Record<string, unknown>, key: string) =>
  Array.isArray(input[key])
    ? (input[key] as unknown[]).filter(
        (value): value is string => typeof value === "string",
      )
    : undefined;

export const ModelsMock = mockGroup("models", (handlers) =>
  Effect.gen(function* () {
    const { apiKeys, members } = yield* MockDb;
    const requester = yield* Ref.get(members);
    const credentials = yield* Ref.make<SampleCredential[]>([
      ...sampleCredentials,
    ]);
    const toDateTime = (iso: string) =>
      Schema.decodeUnknownSync(Schema.DateTimeUtcFromString)(iso);
    const myCompactAt = yield* Ref.make<Record<string, DateTime.DateTime>>(
      Object.fromEntries(
        Object.entries(sampleCompactAt).map(([id, at]) => [id, toDateTime(at)]),
      ),
    );
    const orgCompactAt = yield* Ref.make<Record<string, DateTime.DateTime>>(
      Object.fromEntries(
        Object.entries(sampleOrgCompactAt).map(([id, at]) => [
          id,
          toDateTime(at),
        ]),
      ),
    );
    const connections = yield* Ref.make<Connection[]>(
      sampleConnections.map((connection) => ({
        ...connection,
        models: [...connection.models],
      })),
    );
    const deviceAttempts = yield* Ref.make<Record<string, string>>({});
    const orgKeys = yield* Ref.make<OrgKey[]>([...sampleOrgKeys]);
    const routing = yield* Ref.make<Record<string, unknown>>({
      ...sampleRoutingPayload,
    });
    const settings = yield* Ref.make<Settings>({
      ...sampleSettings,
      allowMemberCredentials: true,
      membersOverrideFallback: false,
      creditsFallback: "own_then_ask",
      availableModels: [...sampleSettings.availableModels],
      updatedAt: DateTime.formatIso(minutesAgo(60 * 8)),
    });

    const membersById = new Map(requester.map((member) => [member.id, member]));

    const compactAtFrom = (input: Record<string, unknown>, field: string) => {
      const value = text(input, field);
      return value ? toDateTime(value) : minutesAgo(0);
    };

    const findCredential = (id: string) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(credentials);
        const credential = rows.find((row) => row.id === id);
        if (!credential) return yield* invalid(`No credential ${id}`);
        return credential;
      });

    const patchCredential = (
      current: SampleCredential,
      patch: Partial<SampleCredential>,
    ) =>
      Effect.gen(function* () {
        const updated = { ...current, ...patch };
        yield* Ref.update(credentials, (rows) =>
          rows.map((row) => (row.id === current.id ? updated : row)),
        );
        // The routing payload's rows carry fields the credentials Ref does not
        // (`ticks` among them), so merge the patch in rather than replacing the
        // row with the Ref's shape.
        yield* Ref.update(routing, (payload) => ({
          ...payload,
          credentials: (
            payload.credentials as ReadonlyArray<Record<string, unknown>>
          ).map((row) => (row.id === current.id ? { ...row, ...patch } : row)),
        }));
        return updated;
      });

    const summary = (credential: SampleCredential) => ({
      id: credential.id,
      service: credential.service,
      name: credential.name,
      status: credential.status,
      enabled: credential.enabled,
      models: credential.models,
      createdAt: credential.createdAt,
      createdBy: credential.createdBy,
    });

    return handlers
      .handle("list", () =>
        // Capy serves the catalog as a bare array; connections come from `connections`.
        Effect.succeed(sampleCatalogModels.map((model) => ({ ...model }))),
      )
      .handle("disconnect", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(credentials);
          const credential = rows.find((row) => row.service === params.service);
          if (!credential) return yield* notFound("services", params.service);
          yield* patchCredential(credential, {
            status: "disconnected",
            enabled: false,
          });
          yield* Ref.update(connections, (all) =>
            all.map((row) =>
              row.credentialId === credential.id
                ? { ...row, enabled: false }
                : row,
            ),
          );
          return { ok: true, service: params.service };
        }),
      )
      .handle("setCredentialEnabled", ({ params, payload, query }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const wanted = (query as { credentialId?: string }).credentialId;
          const seat = yield* Ref.get(routing).pipe(
            Effect.map((current) =>
              (current.seats as ReadonlyArray<Record<string, unknown>>).find(
                (row) =>
                  row.service === params.service &&
                  (wanted === undefined || row.credentialId === wanted),
              ),
            ),
          );
          if (seat !== undefined) {
            const enabled =
              bool(input, "enabled") ?? !(seat.enabled as boolean | undefined);
            const updated = { ...seat, enabled };
            yield* Ref.update(routing, (current) => ({
              ...current,
              seats: (current.seats as ReadonlyArray<unknown>).map((row) =>
                row === seat ? updated : row,
              ),
            }));
            return {
              id: seat.credentialId,
              service: seat.service,
              name: String(seat.accountLabel ?? seat.service),
              enabled,
            };
          }
          const rows = yield* Ref.get(credentials);
          const credential =
            rows.find((row) => row.id === wanted) ??
            rows.find((row) => row.service === params.service);
          if (!credential)
            return yield* invalid(
              `No credential for service ${params.service}`,
            );
          const enabled = bool(input, "enabled") ?? !credential.enabled;
          // `status` is "active" | "invalid" on the wire, and a row whose status
          // is neither renders without its power switch at all — writing
          // "connected"/"disconnected" here made the control vanish once used.
          return summary(yield* patchCredential(credential, { enabled }));
        }),
      )
      .handle("startDevice", ({ params }) => {
        const attemptId = newId("device_attempt");
        return Effect.gen(function* () {
          const rows = yield* Ref.get(credentials);
          const credential = rows.find((row) => row.service === params.service);
          if (!credential)
            return yield* invalid(
              `No credential for service ${params.service}`,
            );
          yield* Ref.update(deviceAttempts, (all) => ({
            ...all,
            [attemptId]: params.service,
          }));
          return {
            attemptId,
            service: params.service,
            verificationUrl: `https://auth.example.com/device?user_code=${attemptId}`,
            userCode: "EXAMPLE-1234",
            expiresAt: isoMinutesAgo(-10),
            status: "pending",
          };
        });
      })
      .handle("refreshClaudeSeat", ({ params }) =>
        Effect.gen(function* () {
          const credential = yield* findCredential(params.credentialId);
          const updated = yield* patchCredential(credential, {
            status: "connected",
            enabled: true,
          });
          return {
            ok: true,
            credential: summary(updated),
            refreshedAt: isoMinutesAgo(0),
          };
        }),
      )
      .handle("connectClaudeSeat", ({ payload }) => {
        const input = fields(payload);
        const service = text(input, "service") ?? "anthropic";
        return Effect.gen(function* () {
          const rows = yield* Ref.get(credentials);
          const existing = rows.find((row) => row.service === service);
          if (existing) {
            return {
              ok: true,
              credential: summary(
                yield* patchCredential(existing, {
                  status: "connected",
                  enabled: true,
                }),
              ),
            };
          }
          const credential: SampleCredential = {
            id: newId("cred"),
            service,
            name: text(input, "name") ?? "Claude seat",
            createdBy: viewer.id,
            createdAt: isoMinutesAgo(0),
            enabled: true,
            status: "connected",
            models: list(input, "models") ?? [worldModels[0].id],
          };
          yield* Ref.update(credentials, (all) => [...all, credential]);
          return { ok: true, credential: summary(credential) };
        });
      })
      .handle("pollDevice", ({ params }) =>
        Effect.gen(function* () {
          const attempts = yield* Ref.get(deviceAttempts);
          const service = attempts[params.attemptId];
          if (!service)
            return yield* invalid(`No device attempt ${params.attemptId}`);
          return {
            attemptId: params.attemptId,
            service,
            status: "approved",
            expiresAt: isoMinutesAgo(-10),
          };
        }),
      )
      .handle("listMyCompactAt", () =>
        Effect.map(Ref.get(myCompactAt), (rows) =>
          Object.entries(rows)
            .filter(([userId]) => membersById.has(userId))
            .map(([userId, at]) => ({
              userId,
              compactAt: DateTime.formatIso(at),
            })),
        ),
      )
      .handle("upsertMyCompactAt", ({ payload }) => {
        const input = fields(payload);
        const compactAt = compactAtFrom(input, "compactAt");
        return Ref.updateAndGet(myCompactAt, (rows) => ({
          ...rows,
          [viewer.id]: compactAt,
        })).pipe(
          Effect.map((rows) => ({
            userId: viewer.id,
            compactAt: DateTime.formatIso(rows[viewer.id] ?? minutesAgo(0)),
          })),
        );
      })
      .handle("removeMyCompactAt", () =>
        Ref.update(myCompactAt, (rows) => {
          const { [viewer.id]: _removed, ...rest } = rows;
          return rest;
        }).pipe(Effect.as({ ok: true })),
      )
      .handle("listCompactAt", () =>
        Effect.map(Ref.get(orgCompactAt), (rows) =>
          Object.entries(rows).map(([orgId, at]) => ({
            orgId,
            compactAt: DateTime.formatIso(at),
          })),
        ),
      )
      .handle("upsertCompactAt", ({ payload }) => {
        const input = fields(payload);
        const compactAt = compactAtFrom(input, "compactAt");
        return Ref.updateAndGet(orgCompactAt, (rows) => ({
          ...rows,
          [org.id]: compactAt,
        })).pipe(
          Effect.map((rows) => ({
            orgId: org.id,
            compactAt: DateTime.formatIso(rows[org.id] ?? minutesAgo(0)),
          })),
        );
      })
      .handle("removeCompactAt", () =>
        Ref.update(orgCompactAt, (rows) => {
          const { [org.id]: _removed, ...rest } = rows;
          return rest;
        }).pipe(Effect.as({ ok: true })),
      )
      .handle("connections", () =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(connections);
          return [...rows].sort((a, b) => a.position - b.position);
        }),
      )
      .handle("setConnectionModels", ({ params, payload }) => {
        const input = fields(payload);
        const selected = list(input, "models") ?? [];
        return Effect.gen(function* () {
          const rows = yield* Ref.get(connections);
          const current = rows.find(
            (row) => row.credentialId === params.credentialId,
          );
          if (!current) {
            return yield* invalid(`No connection ${params.credentialId}`);
          }
          const updated = { ...current, models: selected };
          yield* Ref.set(
            connections,
            rows.map((row) =>
              row.credentialId === current.credentialId ? updated : row,
            ),
          );
          yield* patchCredential(yield* findCredential(current.credentialId), {
            models: selected,
          });
          return updated;
        });
      })
      .handle("reorderConnections", ({ payload }) => {
        const input = fields(payload);
        const order =
          list(input, "order") ?? list(input, "credentialIds") ?? [];
        return Effect.gen(function* () {
          const rows = yield* Ref.get(connections);
          const byId = new Map(rows.map((row) => [row.credentialId, row]));
          const ordered = order
            .map((id, position) => {
              const row = byId.get(id);
              return row ? { ...row, position } : undefined;
            })
            .filter((row): row is Connection => row !== undefined);
          const reordered = [
            ...ordered,
            ...rows
              .filter((row) => !order.includes(row.credentialId))
              .map((row) => ({ ...row, position: ordered.length })),
          ];
          yield* Ref.set(connections, reordered);
          return { ok: true, order: reordered.map((row) => row.credentialId) };
        });
      })
      .handle("createCredential", ({ payload }) => {
        const input = fields(payload);
        return Effect.gen(function* () {
          const credential: SampleCredential = {
            id: newId("cred"),
            service: text(input, "service") ?? "openai",
            name: text(input, "name") ?? "New connection",
            createdBy: viewer.id,
            createdAt: isoMinutesAgo(0),
            enabled: true,
            status: "connected",
            models: list(input, "models") ?? [worldModels[0].id],
          };
          yield* Ref.update(credentials, (rows) => [...rows, credential]);
          yield* Ref.update(connections, (rows) => [
            ...rows,
            {
              credentialId: credential.id,
              service: credential.service,
              name: credential.name,
              enabled: true,
              models: [...credential.models],
              position: rows.length,
            },
          ]);
          return summary(credential);
        });
      })
      .handle("updateCredential", ({ params, payload }) => {
        const input = fields(payload);
        return Effect.gen(function* () {
          const current = yield* findCredential(params.credentialId);
          const updated = yield* patchCredential(current, {
            ...(text(input, "name") ? { name: text(input, "name") } : {}),
            ...(bool(input, "enabled") === undefined
              ? {}
              : { enabled: bool(input, "enabled") }),
            ...(list(input, "models") ? { models: list(input, "models") } : {}),
          });
          yield* Ref.update(connections, (rows) =>
            rows.map((row) =>
              row.credentialId === updated.id
                ? {
                    ...row,
                    name: updated.name,
                    enabled: updated.enabled,
                    models: [...updated.models],
                  }
                : row,
            ),
          );
          return summary(updated);
        });
      })
      .handle("removeCredential", ({ params }) =>
        Effect.gen(function* () {
          yield* findCredential(params.credentialId);
          yield* Ref.update(credentials, (rows) =>
            rows.filter((row) => row.id !== params.credentialId),
          );
          yield* Ref.update(connections, (rows) =>
            rows.filter((row) => row.credentialId !== params.credentialId),
          );
          return { ok: true };
        }),
      )
      .handle("refreshDaybreak", ({ params }) =>
        Effect.gen(function* () {
          const credential = yield* findCredential(params.credentialId);
          return {
            ok: true,
            credentialId: credential.id,
            usage: { used: 128, limit: 500, unit: "seats" },
            refreshedAt: isoMinutesAgo(0),
          };
        }),
      )
      .handle("checkMediaUrl", ({ params }) =>
        Effect.gen(function* () {
          yield* findCredential(params.credentialId);
          return { ok: true, supported: true, checkedAt: isoMinutesAgo(0) };
        }),
      )
      .handle("moveToOrganization", ({ params }) =>
        Effect.gen(function* () {
          const credential = yield* findCredential(params.credentialId);
          return summary(
            yield* patchCredential(credential, { status: "connected" }),
          );
        }),
      )
      .handle("testCredential", ({ params }) =>
        Effect.gen(function* () {
          const credential = yield* findCredential(params.credentialId);
          return {
            ok: true,
            credentialId: credential.id,
            status: "connected",
            testedAt: isoMinutesAgo(0),
          };
        }),
      )
      .handle("discoverModels", ({ payload }) => {
        const input = fields(payload);
        return Effect.gen(function* () {
          const credentialId = text(input, "credentialId");
          if (credentialId) yield* findCredential(credentialId);
          const query = (text(input, "query") ?? "").toLowerCase();
          return worldModels
            .filter((model) => model.id.toLowerCase().includes(query))
            .map((model) => ({ ...model, discovered: true }));
        });
      })
      .handle("upsertOrgKey", ({ params, payload }) => {
        const input = fields(payload);
        return Effect.gen(function* () {
          const rows = yield* Ref.get(orgKeys);
          const keyRow = yield* Effect.gen(function* () {
            const available = yield* Ref.get(apiKeys);
            return available.find(
              (key) => !rows.some((row) => row.apiKeyId === key.id),
            );
          });
          if (!keyRow) return yield* notFound("apiKeys", params.provider);
          const key: OrgKey = {
            provider: params.provider,
            apiKeyId: keyRow.id,
            prefix: keyRow.prefix,
            createdAt: keyRow.createdAt,
          };
          yield* Ref.set(orgKeys, [
            ...rows.filter((row) => row.provider !== params.provider),
            key,
          ]);
          return {
            ...key,
            secret: text(input, "secret") ? "provided" : "existing",
          };
        });
      })
      .handle("removeOrgKey", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(orgKeys);
          if (!rows.some((row) => row.provider === params.provider)) {
            return yield* invalid(`No organization key for ${params.provider}`);
          }
          yield* Ref.set(
            orgKeys,
            rows.filter((row) => row.provider !== params.provider),
          );
          return { ok: true };
        }),
      )
      .handle("routing", () => Ref.get(routing))
      .handle("getSettings", () => Ref.get(settings))
      .handle("setModelSetting", ({ payload }) => {
        const input = fields(payload);
        return Ref.updateAndGet(settings, (current) => ({
          ...current,
          ...(text(input, "model") || text(input, "defaultModel")
            ? {
                defaultModel:
                  text(input, "defaultModel") ??
                  text(input, "model") ??
                  current.defaultModel,
              }
            : {}),
          updatedAt: DateTime.formatIso(minutesAgo(0)),
        }));
      })
      .handle("setFallback", ({ payload }) => {
        const input = fields(payload);
        return Ref.updateAndGet(settings, (current) => {
          const credits = text(input, "creditsFallback");
          const members = bool(input, "membersOverrideFallback");
          return {
            ...current,
            fallbackModel:
              text(input, "fallbackModel") ??
              text(input, "model") ??
              current.fallbackModel,
            ...(credits === undefined ? {} : { creditsFallback: credits }),
            ...(members === undefined
              ? {}
              : { membersOverrideFallback: members }),
            updatedAt: DateTime.formatIso(minutesAgo(0)),
          };
        });
      })
      .handle("setMemberCredentials", ({ payload }) => {
        const input = fields(payload);
        return Ref.updateAndGet(settings, (current) => {
          const allowed = bool(input, "allowed");
          return {
            ...current,
            memberCredentials:
              text(input, "memberCredentials") ?? current.memberCredentials,
            ...(allowed === undefined
              ? {}
              : { allowMemberCredentials: allowed }),
            updatedAt: DateTime.formatIso(minutesAgo(0)),
          };
        });
      });
  }),
);
