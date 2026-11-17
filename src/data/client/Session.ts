import { Context, Effect, Layer, Schema } from "effect";
import type { OrgId } from "../api/schemas/ids.ts";
import type { Organization } from "../api/schemas/organization.ts";
import type { UserProfile } from "../api/schemas/user.ts";
import { ApiClient } from "./ApiClient.ts";

export class SessionError extends Schema.TaggedError<SessionError>()(
  "SessionError",
  { reason: Schema.Literals(["signedOut", "noOrganization", "unavailable"]) },
) {}

export class Session extends Context.Service<
  Session,
  {
    readonly currentUser: Effect.Effect<UserProfile, SessionError>;
    readonly organizations: Effect.Effect<
      ReadonlyArray<Organization>,
      SessionError
    >;
    readonly activeOrgId: Effect.Effect<OrgId, SessionError>;
  }
>()("kiki/Session") {
  static readonly layer = Layer.effect(
    Session,
    Effect.gen(function* () {
      const client = yield* ApiClient;

      const currentUser = client.users.getCurrent().pipe(
        Effect.catch((error) =>
          Effect.fail(
            new SessionError({
              reason:
                error._tag === "capy/Unauthorized"
                  ? "signedOut"
                  : "unavailable",
            }),
          ),
        ),
      );

      const organizations = client.organizations
        .list()
        .pipe(
          Effect.mapError(() => new SessionError({ reason: "unavailable" })),
        );

      const activeOrgId = organizations.pipe(
        Effect.flatMap((list) => {
          const first = list[0];
          return first
            ? Effect.succeed(first.id)
            : Effect.fail(new SessionError({ reason: "noOrganization" }));
        }),
      );

      return Session.of({ currentUser, organizations, activeOrgId });
    }),
  );
}
