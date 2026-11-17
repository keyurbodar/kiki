import type { Duration } from "effect";
import { Atom } from "effect/reactivity";
import { ApiClient } from "../client/ApiClient.ts";
import { reactivityKeys } from "./conventions.ts";

export const modelCatalogTimeToLive: Duration.Input = "1 hour";

export const modelsAtom = Atom.family((orgId: string) =>
  ApiClient.query("models", "list", {
    query: orgId === "" ? {} : { orgId },
    reactivityKeys: [reactivityKeys.modelCatalog],
    timeToLive: modelCatalogTimeToLive,
  }),
);
