import { Effect, Ref } from "effect";
import { InvalidRequest } from "../../api/schemas/errors.ts";
import { fields } from "../db/MockDb.ts";
import { isoMinutesAgo, viewer } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import { type Experiment, sampleExperiments } from "./fixtures.ts";

const text = (input: Record<string, unknown>, key: string) =>
  typeof input[key] === "string" ? (input[key] as string) : undefined;

export const ExperimentsMock = mockGroup("experiments", (handlers) =>
  Effect.gen(function* () {
    const experiments = yield* Ref.make<Experiment[]>([...sampleExperiments]);

    return handlers
      .handle("listExperiments", () => Ref.get(experiments))
      .handle("setExperiment", ({ params, payload }) => {
        const input = fields(payload);
        return Effect.gen(function* () {
          const rows = yield* Ref.get(experiments);
          const current = rows.find((row) => row.feature === params.feature);
          if (!current && !text(input, "name")) {
            return yield* Effect.fail(
              new InvalidRequest({
                message: `No experiment ${params.feature}`,
              }),
            );
          }
          const enabled =
            typeof input.enabled === "boolean"
              ? input.enabled
              : current
                ? !current.enabled
                : true;
          const updated: Experiment = {
            feature: params.feature,
            name: current?.name ?? params.feature,
            enabled,
            updatedAt: isoMinutesAgo(0),
            updatedBy: viewer.id,
          };
          yield* Ref.set(experiments, [
            ...rows.filter((row) => row.feature !== params.feature),
            updated,
          ]);
          return updated;
        });
      });
  }),
);
