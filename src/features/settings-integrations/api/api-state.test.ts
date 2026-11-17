import { DateTime } from "effect";
import { describe, expect, it } from "vitest";
import { ApiKey, type ApiKeyId } from "@/data/api/schemas/api-keys";
import { ProjectId, ServiceUserId, UserId } from "@/data/api/schemas/ids";
import {
  apiKeyState,
  expirationDate,
  parseSpendCap,
  pluralize,
  sortApiKeys,
  sortServiceUsers,
  unreachedProjects,
} from "./api-state";

const now = Date.parse("2026-03-02T09:00:00.000Z");
const at = (iso: string) => DateTime.makeUnsafe(iso);
const svc = ServiceUserId.make("svc_sample_bot");

const key = (
  overrides: Partial<ConstructorParameters<typeof ApiKey>[0]> = {},
) =>
  new ApiKey({
    id: "key_sample_1" as ApiKeyId,
    name: "CI",
    tokenHint: "capy_…ab12",
    principalKind: "human",
    principalUserId: UserId.make("user_sample_alex"),
    expiresAt: null,
    revokedAt: null,
    createdByUserId: UserId.make("user_sample_alex"),
    createdAt: at("2026-02-01T00:00:00.000Z"),
    privateProjects: [],
    ...overrides,
  });

describe("apiKeyState", () => {
  const users = new Map([[svc as string, { disabledAt: null }]]);

  it("maps revoked, expired, expiring and active keys", () => {
    expect(
      apiKeyState(
        key({ revokedAt: at("2026-02-02T00:00:00.000Z") }),
        users,
        now,
      ),
    ).toBe("revoked");
    expect(
      apiKeyState(
        key({ expiresAt: at("2026-03-01T00:00:00.000Z") }),
        users,
        now,
      ),
    ).toBe("expired");
    expect(
      apiKeyState(
        key({ expiresAt: at("2026-04-01T00:00:00.000Z") }),
        users,
        now,
      ),
    ).toBe("expires");
    expect(apiKeyState(key(), users, now)).toBe("active");
  });

  it("checks the service-user principal before expiry", () => {
    const serviceKey = key({ principalKind: "service", principalUserId: svc });
    expect(apiKeyState(serviceKey, users, now)).toBe("active");
    expect(apiKeyState(serviceKey, new Map(), now)).toBe("unavailable");
    expect(
      apiKeyState(
        serviceKey,
        new Map([
          [svc as string, { disabledAt: at("2026-02-03T00:00:00.000Z") }],
        ]),
        now,
      ),
    ).toBe("disabled");
  });

  it("sorts live keys first, then newest", () => {
    const old = key({
      id: "key_sample_old" as ApiKeyId,
      createdAt: at("2026-01-01T00:00:00.000Z"),
    });
    const revoked = key({
      id: "key_sample_rev" as ApiKeyId,
      revokedAt: at("2026-02-05T00:00:00.000Z"),
      createdAt: at("2026-02-10T00:00:00.000Z"),
    });
    const fresh = key({
      id: "key_sample_new" as ApiKeyId,
      createdAt: at("2026-02-20T00:00:00.000Z"),
    });
    expect(
      sortApiKeys([revoked, old, fresh], users, now).map((k) => k.id),
    ).toEqual(["key_sample_new", "key_sample_old", "key_sample_rev"]);
  });
});

describe("helpers", () => {
  it("pluralizes counts like Capy", () => {
    expect(pluralize(0, "API key")).toBe("No API keys");
    expect(pluralize(1, "service user")).toBe("1 service user");
    expect(pluralize(3, "private project")).toBe("3 private projects");
  });

  it("puts disabled service users last, then sorts by name", () => {
    const rows = [
      { name: "beta", disabledAt: null },
      { name: "Alpha", disabledAt: at("2026-01-01T00:00:00.000Z") },
      { name: "alpha", disabledAt: null },
    ];
    expect(sortServiceUsers(rows).map((row) => row.name)).toEqual([
      "alpha",
      "beta",
      "Alpha",
    ]);
  });

  it("lists only uncarried private projects on live keys", () => {
    const privateProjects = [
      { projectId: ProjectId.make("proj_sample_web"), carried: true },
      { projectId: ProjectId.make("proj_sample_docs"), carried: false },
    ];
    expect(
      unreachedProjects({ revokedAt: null, privateProjects }),
    ).toHaveLength(1);
    expect(
      unreachedProjects({
        revokedAt: at("2026-01-01T00:00:00.000Z"),
        privateProjects,
      }),
    ).toHaveLength(0);
  });

  it("computes mint expiry dates", () => {
    expect(expirationDate("never", "", now)).toBeUndefined();
    expect(expirationDate("30", "", now)?.getTime()).toBe(
      now + 30 * 86_400_000,
    );
    expect(expirationDate("custom", "not-a-date", now)).toBeUndefined();
    expect(expirationDate("custom", "2026-05-01", now)?.getDate()).toBe(1);
  });

  it("parses the monthly spend cap in dollars", () => {
    expect(parseSpendCap("")).toBeNull();
    expect(parseSpendCap("50")).toBe(50_000);
    expect(parseSpendCap("0")).toBe("invalid");
    expect(parseSpendCap("abc")).toBe("invalid");
  });
});
