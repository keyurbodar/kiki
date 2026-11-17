import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId } from "../fixtures/world.ts";

type Row = Record<string, unknown>;

const keys = [`sso-connection:${orgId}`, `allowed-domains:${orgId}`];

const domainsAtom = ApiClient.query("organizations", "listAllowedDomains", {
  params: { orgId },
  reactivityKeys: [keys[1] ?? ""],
});
const statusAtom = ApiClient.query("organizations", "getSsoConnection", {
  params: { orgId },
  reactivityKeys: keys,
});
const organizationsAtom = ApiClient.query("organizations", "list", {
  reactivityKeys: ["organizations"],
});
const addDomain = ApiClient.mutation("organizations", "addAllowedDomain");
const verifyDomain = ApiClient.mutation("organizations", "verifyAllowedDomain");
const draft = ApiClient.mutation("organizations", "draftSsoConnection");
const setActive = ApiClient.mutation("organizations", "setSsoConnectionActive");
const setMfa = ApiClient.mutation("organizations", "setMfaRequired");

describe("organizations identity mock", () => {
  it.effect("starts with no domains and no identity provider", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const domains = yield* AtomRegistry.getResult(registry, domainsAtom);
      const status = (yield* AtomRegistry.getResult(
        registry,
        statusAtom,
      )) as Row;
      assert.deepStrictEqual(domains, []);
      assert.strictEqual(status.connection, null);
      assert.deepStrictEqual(status.enterprise, []);
    }),
  );

  it.effect("adds a domain, hands out a TXT record, then verifies it", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(domainsAtom);
      yield* AtomRegistry.getResult(registry, domainsAtom);

      registry.set(addDomain, {
        params: { orgId },
        payload: { domain: "Acme.dev" },
        reactivityKeys: keys,
      });
      const added = (yield* AtomRegistry.getResult(registry, addDomain)) as Row;
      assert.strictEqual(added.domain, "acme.dev");
      assert.strictEqual(added.dnsRecord, null);

      const verify = () =>
        Effect.gen(function* () {
          registry.set(verifyDomain, {
            params: { orgId, domainId: String(added.id) },
            reactivityKeys: keys,
          });
          return (yield* AtomRegistry.getResult(registry, verifyDomain, {
            suspendOnWaiting: true,
          })) as Row;
        });
      const withRecord = yield* verify();
      assert.strictEqual(withRecord.verification, "pending");
      assert.strictEqual((withRecord.dnsRecord as Row).type, "TXT");
      const verified = yield* verify();
      assert.strictEqual(verified.verification, "dns");

      const domains = (yield* AtomRegistry.getResult(registry, domainsAtom, {
        suspendOnWaiting: true,
      })) as ReadonlyArray<Row>;
      assert.strictEqual(domains[0]?.verification, "dns");
    }),
  );

  it.effect("drafts a SAML connection and turns it on", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(statusAtom);
      registry.set(addDomain, {
        params: { orgId },
        payload: { domain: "acme.dev" },
      });
      const added = (yield* AtomRegistry.getResult(registry, addDomain)) as Row;
      registry.set(draft, {
        params: { orgId },
        payload: { provider: "okta", domainId: added.id },
        reactivityKeys: keys,
      });
      const drafted = (yield* AtomRegistry.getResult(registry, draft)) as Row;
      const connection = drafted.connection as Row;
      assert.strictEqual(connection.state, "draft");
      assert.isNotNull(connection.serviceProvider);

      registry.set(setActive, {
        params: { orgId },
        payload: { active: true },
        reactivityKeys: keys,
      });
      yield* AtomRegistry.getResult(registry, setActive);
      const status = (yield* AtomRegistry.getResult(registry, statusAtom, {
        suspendOnWaiting: true,
      })) as Row;
      assert.strictEqual((status.connection as Row).state, "active");
    }),
  );

  it.effect("requires two-step verification on the organization", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(organizationsAtom);
      yield* AtomRegistry.getResult(registry, organizationsAtom);
      registry.set(setMfa, {
        params: { orgId },
        payload: { required: true, graceDays: 7, level: "any" },
        reactivityKeys: ["organizations"],
      });
      yield* AtomRegistry.getResult(registry, setMfa);
      const organizations = yield* AtomRegistry.getResult(
        registry,
        organizationsAtom,
        { suspendOnWaiting: true },
      );
      const acme = organizations.find(
        (organization) => organization.id === orgId,
      );
      assert.strictEqual(acme?.mfaRequired, true);
      assert.isNotNull(acme?.mfaEnforceAt);
    }),
  );
});
