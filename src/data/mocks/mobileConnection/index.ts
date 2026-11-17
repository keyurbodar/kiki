import { Effect } from "effect";
import { mockGroup } from "../mockGroup.ts";
import { sampleMobileConnection } from "./fixtures.ts";

export const MobileConnectionMock = mockGroup("mobileConnection", (handlers) =>
  Effect.succeed(
    handlers.handle("get", () => Effect.succeed(sampleMobileConnection)),
  ),
);
