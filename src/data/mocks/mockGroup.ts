import { Effect, type Layer, type Scope } from "effect";
import { HttpServerResponse } from "effect/http";
import {
  type HttpApi,
  HttpApiBuilder,
  type HttpApiGroup,
} from "effect/http-api";
import { KikiApi } from "../api/Api.ts";

export type KikiGroups =
  typeof KikiApi extends HttpApi.HttpApi<string, infer G> ? G : never;

export type GroupId = HttpApiGroup.Identifier<KikiGroups>;

export type GroupHandlers<Id extends GroupId> =
  HttpApiBuilder.Handlers.FromGroup<
    HttpApiGroup.WithIdentifier<KikiGroups, Id>
  >;

interface HandlerRegistry {
  readonly handlers: Map<string, unknown>;
  handleRaw(endpoint: string, handler: () => unknown): HandlerRegistry;
}

export const notImplementedStatus = 501;

export const mockGroup = <const Id extends GroupId, R = never>(
  id: Id,
  build?: (handlers: GroupHandlers<Id>) => Effect.Effect<unknown, never, R>,
): Layer.Layer<
  HttpApiGroup.Service<"kiki", Id>,
  never,
  Exclude<R, Scope.Scope>
> =>
  HttpApiBuilder.group(
    KikiApi,
    id,
    (handlers) =>
      (build
        ? build(handlers as unknown as GroupHandlers<Id>)
        : Effect.succeed(handlers)
      ).pipe(
        Effect.map((built) => {
          let registry = built as HandlerRegistry;
          for (const endpoint of Object.keys(KikiApi.groups[id].endpoints)) {
            if (registry.handlers.has(endpoint)) continue;
            registry = registry.handleRaw(endpoint, () =>
              Effect.succeed(
                HttpServerResponse.jsonUnsafe(
                  { _tag: "MockNotImplemented", group: id, endpoint },
                  { status: notImplementedStatus },
                ),
              ),
            );
          }
          return registry as unknown as GroupHandlers<Id>;
        }),
      ) as never,
  ) as never;
