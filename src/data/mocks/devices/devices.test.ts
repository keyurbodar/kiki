import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { DeviceId } from "../../api/schemas/devices.ts";
import { OrgId } from "../../api/schemas/ids.ts";
import {
  approveDeviceCodeAtom,
  deviceReactivityKeys,
  devicesAtom,
  lookupDeviceCodeAtom,
  renameDeviceAtom,
  revokeDeviceAtom,
  setDeviceAccessAtom,
} from "../../atoms/devices.ts";
import { orgId as acmeId } from "../fixtures/world.ts";

const orgId = OrgId.make(acmeId);
const reactivityKeys = [deviceReactivityKeys.devices(orgId)];
const laptop = DeviceId.make("machine_sample_laptop");

describe("devices mock", () => {
  it.effect("lists the org's devices from the shared world", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const devices = yield* AtomRegistry.getResult(
        registry,
        devicesAtom(orgId),
      );
      assert.deepStrictEqual(
        devices.map((device) => device.name),
        ["alex-laptop", "build-box", "jordan-desktop"],
      );
      const buildBox = devices.find((device) => device.name === "build-box");
      assert.strictEqual(buildBox?.access, "shared");
      assert.strictEqual(buildBox?.ownerName, "Sam Rivera");
      assert.strictEqual(buildBox?.os, "linux");
    }),
  );

  it.effect("refetches the list after rename, access and revoke", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const list = devicesAtom(orgId);
      registry.mount(list);
      yield* AtomRegistry.getResult(registry, list);

      registry.set(renameDeviceAtom, {
        params: { orgId, deviceId: laptop },
        payload: { name: "studio" },
        reactivityKeys,
      });
      yield* AtomRegistry.getResult(registry, renameDeviceAtom);
      registry.set(setDeviceAccessAtom, {
        params: { orgId, deviceId: laptop },
        payload: { access: "shared" },
        reactivityKeys,
      });
      yield* AtomRegistry.getResult(registry, setDeviceAccessAtom);
      registry.set(revokeDeviceAtom, {
        params: { orgId, deviceId: laptop },
        reactivityKeys,
      });
      yield* AtomRegistry.getResult(registry, revokeDeviceAtom);

      const after = yield* AtomRegistry.getResult(registry, list, {
        suspendOnWaiting: true,
      });
      const device = after.find((row) => row.id === laptop);
      assert.strictEqual(device?.name, "studio");
      assert.strictEqual(device?.access, "shared");
      assert.isNotNull(device?.revokedAt);
      assert.isFalse(device?.connected);
    }),
  );

  it.effect("looks up and approves a pairing code into a new device", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const list = devicesAtom(orgId);
      registry.mount(list);
      yield* AtomRegistry.getResult(registry, list);

      registry.set(lookupDeviceCodeAtom, {
        payload: { userCode: "bcdf-ghjk" },
      });
      const preview = yield* AtomRegistry.getResult(
        registry,
        lookupDeviceCodeAtom,
      );
      assert.strictEqual(preview.hostname, "casey-laptop");

      registry.set(approveDeviceCodeAtom, {
        params: { orgId },
        payload: { userCode: "BCDF-GHJK", name: "Casey's laptop" },
        reactivityKeys,
      });
      const resolution = yield* AtomRegistry.getResult(
        registry,
        approveDeviceCodeAtom,
      );
      assert.strictEqual(resolution.status, "approved");
      const after = yield* AtomRegistry.getResult(registry, list, {
        suspendOnWaiting: true,
      });
      assert.include(
        after.map((device) => device.name),
        "Casey's laptop",
      );
    }),
  );

  it.effect("fails an unknown code with DeviceCodeNotFound", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.set(lookupDeviceCodeAtom, { payload: { userCode: "NOPE" } });
      const exit = yield* Effect.exit(
        AtomRegistry.getResult(registry, lookupDeviceCodeAtom),
      );
      assert.isTrue(Exit.isFailure(exit));
      assert.include(JSON.stringify(exit), "capy/DeviceCodeNotFound");
    }),
  );
});
