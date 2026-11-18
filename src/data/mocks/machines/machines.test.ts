import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { HttpApiError } from "effect/http-api";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { machines, orgId, threads } from "../fixtures/world.ts";

const key = `machines:${orgId}`;
const jamId = threads.checkoutTest.id;
const machineId = machines[0].id;

const listAtom = ApiClient.query("machines", "list", {
  params: { orgId, jamId },
  reactivityKeys: [key],
});
const portsAtom = ApiClient.query("machines", "ports", {
  params: { orgId, jamId, machineId },
  reactivityKeys: [key],
});
const openPort = ApiClient.mutation("machines", "openPort");
const wake = ApiClient.mutation("machines", "wake");
const reserve = ApiClient.mutation("machines", "reserve");

const rows = (value: unknown) =>
  value as ReadonlyArray<{ id: string; port?: string; status?: string }>;

describe("machines mock", () => {
  it.effect("answers every machines endpoint", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();

      assert.isAbove(
        rows(yield* AtomRegistry.getResult(registry, listAtom)).length,
        0,
      );
      assert.isNotEmpty(
        yield* AtomRegistry.getResult(
          registry,
          ApiClient.query("machines", "previewHandoff", {
            params: { machineId, port: "8080" },
          }),
        ),
      );
      assert.isNotEmpty(
        yield* AtomRegistry.getResult(
          registry,
          ApiClient.query("machines", "metrics", {
            params: { orgId, jamId, machineId },
          }),
        ),
      );
      assert.isNotEmpty(
        yield* AtomRegistry.getResult(
          registry,
          ApiClient.query("machines", "phoneStream", {
            params: { orgId, jamId, machineId },
          }),
        ),
      );
      assert.isAbove(
        rows(yield* AtomRegistry.getResult(registry, portsAtom)).length,
        0,
      );
      assert.isNotEmpty(
        yield* AtomRegistry.getResult(
          registry,
          ApiClient.query("machines", "sessions", {
            params: { orgId, jamId, machineId },
          }),
        ),
      );
      assert.isNotEmpty(
        yield* AtomRegistry.getResult(
          registry,
          ApiClient.query("machines", "listServicePreviews", {
            params: { orgId, jamId },
          }),
        ),
      );
      assert.isNotEmpty(
        yield* AtomRegistry.getResult(
          registry,
          ApiClient.query("machines", "resolvePreviewToken", {
            params: { orgId, jamId },
            query: { token: "capy_preview_sample_web" },
          }),
        ),
      );
      assert.isAbove(
        rows(
          yield* AtomRegistry.getResult(
            registry,
            ApiClient.query("machines", "sizes", { params: { orgId } }),
          ),
        ).length,
        0,
      );

      registry.set(openPort, {
        params: { orgId, jamId, machineId, port: "3000" },
        payload: { label: "Preview" },
        reactivityKeys: [key],
      });
      assert.isNotEmpty(yield* AtomRegistry.getResult(registry, openPort));

      for (const endpoint of [
        "connect",
        "extend",
        "pressPhone",
        "sleepPhone",
        "reserve",
        "launchSetupEntry",
        "rerunSetup",
      ] as const) {
        const mutation = ApiClient.mutation("machines", endpoint);
        registry.set(mutation, {
          params: { orgId, jamId, machineId },
          payload: { provider: "GitHub", minutes: 60, action: "done" },
          reactivityKeys: [key],
        });
        assert.isNotEmpty(yield* AtomRegistry.getResult(registry, mutation));
      }

      for (const endpoint of [
        "removePhone",
        "release",
        "removeServicePreview",
      ] as const) {
        const params =
          endpoint === "removeServicePreview"
            ? { orgId, jamId, machineId, port: "8080" }
            : { orgId, jamId, machineId };
        const mutation = ApiClient.mutation("machines", endpoint);
        registry.set(mutation, { params, reactivityKeys: [key] });
        assert.isNotEmpty(yield* AtomRegistry.getResult(registry, mutation));
      }

      const attachPhone = ApiClient.mutation("machines", "attachPhone");
      registry.set(attachPhone, {
        params: { orgId, jamId },
        payload: { deviceId: "machine_sample_laptop", machineId },
        reactivityKeys: [key],
      });
      assert.isNotEmpty(yield* AtomRegistry.getResult(registry, attachPhone));
    }),
  );

  it.effect("refreshes the machine list and its ports after mutations", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(listAtom);
      registry.mount(portsAtom);
      yield* AtomRegistry.getResult(registry, listAtom);
      const before = yield* AtomRegistry.getResult(registry, portsAtom, {
        suspendOnWaiting: true,
      });

      registry.set(openPort, {
        params: { orgId, jamId, machineId, port: "3100" },
        payload: { label: "Second preview" },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, openPort);
      const after = yield* AtomRegistry.getResult(registry, portsAtom, {
        suspendOnWaiting: true,
      });
      assert.isAbove(rows(after).length, rows(before).length);
      assert.isTrue(rows(after).some((row) => row.port === "3100"));

      registry.set(wake, {
        params: { orgId, jamId, machineId },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, wake);
      const awake = rows(
        yield* AtomRegistry.getResult(registry, listAtom, {
          suspendOnWaiting: true,
        }),
      );
      assert.strictEqual(
        awake.find((row) => row.id === machineId)?.status,
        "running",
      );

      registry.set(reserve, {
        params: { orgId, jamId, machineId },
        reactivityKeys: [key],
      });
      const reserved = yield* AtomRegistry.getResult(registry, reserve);
      assert.isNotEmpty(reserved);
      assert.strictEqual(
        (reserved as { machineId: string }).machineId,
        machineId,
      );
    }),
  );

  it.effect(
    "answers the 404 each machine route declares for an unknown id",
    () =>
      Effect.gen(function* () {
        const registry = AtomRegistry.make();
        const call = (endpoint: string, input: object) =>
          AtomRegistry.getResult(
            registry,
            ApiClient.query("machines", endpoint as never, input as never),
          ) as unknown as Effect.Effect<unknown>;
        const phoneFree = { orgId, jamId, machineId: machines[1].id };
        const cases = [
          ["removePhone", { params: phoneFree }],
          ["sleepPhone", { params: phoneFree }],
          ["pressPhone", { params: phoneFree, payload: { action: "done" } }],
          ["removeServicePreview", { params: { ...phoneFree, port: "9999" } }],
          [
            "resolvePreviewToken",
            { params: { orgId, jamId }, query: { token: "no_such_token" } },
          ],
          [
            "attachPhone",
            {
              params: { orgId, jamId },
              payload: {
                deviceId: "machine_nobody",
                machineId: machines[1].id,
              },
            },
          ],
        ] as const;
        for (const [endpoint, input] of cases) {
          const error = yield* call(endpoint, input).pipe(Effect.flip);
          assert.instanceOf(error, HttpApiError.NotFound);
        }
      }),
  );
});
