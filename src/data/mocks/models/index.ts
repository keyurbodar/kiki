import { DateTime, Effect, Ref, Schema } from "effect";
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
  sampleCompactAt,
  sampleConnections,
  sampleCredentials,
  sampleOrgCompactAt,
  sampleOrgKeys,
  sampleRouting,
  sampleSettings,
} from "./fixtures.ts";

type Settings = {
  defaultModel: string;
  fallbackModel: string;
  memberCredentials: string;
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
    const routing = yield* Ref.make<Record<string, string>>({
      ...sampleRouting,
    });
    const settings = yield* Ref.make<Settings>({
      ...sampleSettings,
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
        if (!credential) return yield* notFound("credentials", id);
        return credential;
      });

    const patchCredential = (id: string, patch: Partial<SampleCredential>) =>
      Effect.gen(function* () {
        const current = yield* findCredential(id);
        const updated = { ...current, ...patch };
        yield* Ref.update(credentials, (rows) =>
          rows.map((row) => (row.id === id ? updated : row)),
        );
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
        Effect.gen(function* () {
          const rows = yield* Ref.get(credentials);
          return {
            models: worldModels.map((model) => ({ ...model, enabled: true })),
            credentials: rows.map(summary),
            services: [...new Set(rows.map((row) => row.service))],
          };
        }),
      )
      .handle("disconnect", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(credentials);
          const credential = rows.find((row) => row.service === params.service);
          if (!credential) return yield* notFound("services", params.service);
          yield* patchCredential(credential.id, {
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
      .handle("setCredentialEnabled", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const rows = yield* Ref.get(credentials);
          const credential = rows.find((row) => row.service === params.service);
          if (!credential) return yield* notFound("services", params.service);
          const enabled = bool(input, "enabled") ?? !credential.enabled;
          return summary(
            yield* patchCredential(credential.id, {
              enabled,
              status: enabled ? "connected" : "disconnected",
            }),
          );
        }),
      )
      .handle("startDevice", ({ params }) => {
        const attemptId = newId("device_attempt");
        return Effect.gen(function* () {
          const rows = yield* Ref.get(credentials);
          const credential = rows.find((row) => row.service === params.service);
          if (!credential) return yield* notFound("services", params.service);
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
          const updated = yield* patchCredential(credential.id, {
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
                yield* patchCredential(existing.id, {
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
            return yield* notFound("deviceAttempts", params.attemptId);
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
            return yield* notFound("connections", params.credentialId);
          }
          const updated = { ...current, models: selected };
          yield* Ref.set(
            connections,
            rows.map((row) =>
              row.credentialId === current.credentialId ? updated : row,
            ),
          );
          yield* patchCredential(current.credentialId, { models: selected });
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
          const updated = yield* patchCredential(current.id, {
            ...(text(input, "name") ? { name: text(input, "name") } : {}),
            ...(bool(input, "enabled") !== undefined
              ? {
                  enabled: bool(input, "enabled"),
                  status: bool(input, "enabled") ? "connected" : "disconnected",
                }
              : {}),
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
            yield* patchCredential(credential.id, { status: "connected" }),
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
            return yield* notFound("orgKeys", params.provider);
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
        return Ref.updateAndGet(settings, (current) => ({
          ...current,
          fallbackModel:
            text(input, "fallbackModel") ??
            text(input, "model") ??
            current.fallbackModel,
          updatedAt: DateTime.formatIso(minutesAgo(0)),
        }));
      })
      .handle("setMemberCredentials", ({ payload }) => {
        const input = fields(payload);
        return Ref.updateAndGet(settings, (current) => ({
          ...current,
          memberCredentials:
            text(input, "memberCredentials") ?? current.memberCredentials,
          updatedAt: DateTime.formatIso(minutesAgo(0)),
        }));
      });
  }),
);
