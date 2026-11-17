import { describe, expect, it } from "vitest";
import {
  handoffJamId,
  parseVmHandoffSearch,
  servicePreviewPane,
} from "./handoff-search";

describe("parseVmHandoffSearch", () => {
  it("reads Capy's snake_case params", () => {
    expect(
      parseVmHandoffSearch({ jam_id: "j1", machine_id: "m1", port: "3000" }),
    ).toEqual({ jamId: "j1", machineId: "m1", port: 3000 });
  });

  it("accepts camelCase params too", () => {
    expect(
      parseVmHandoffSearch({ jamId: "j1", machineId: "m1", port: 8080 }),
    ).toEqual({ jamId: "j1", machineId: "m1", port: 8080 });
  });

  it.each([["0"], ["65536"], ["3.5"], ["abc"], [undefined]])(
    "drops port %s",
    (port) => {
      expect(parseVmHandoffSearch({ port }).port).toBeUndefined();
    },
  );
});

it("builds the service preview pane id", () => {
  expect(servicePreviewPane("m1", 3000)).toBe("service-preview:m1:3000");
});

it("reads the jam id from a handoff response", () => {
  expect(handoffJamId({ orgId: "o1", jamId: "j1" })).toBe("j1");
  expect(handoffJamId({ orgId: "o1" })).toBeUndefined();
  expect(handoffJamId(null)).toBeUndefined();
});
