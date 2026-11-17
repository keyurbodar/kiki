import { DateTime, Effect, Ref } from "effect";
import { Forbidden } from "../../api/schemas/errors.ts";
import { Organization } from "../../api/schemas/organization.ts";
import { fields } from "../db/MockDb.ts";
import { mockGroup } from "../mockGroup.ts";
import { sampleOrganizations } from "./fixtures.ts";
import {
  addDomain,
  configureConnection,
  connectGoogleWorkspace,
  disconnectConnection,
  draftConnection,
  initialIdentityState,
  removeDomain,
  setConnectionActive,
  setSsoRequired,
  ssoStatusView,
  verifyDomain,
} from "./identity.ts";

export const OrganizationsMock = mockGroup("organizations", (handlers) =>
  Effect.gen(function* () {
    const organizations = yield* Ref.make(sampleOrganizations);
    const identity = yield* Ref.make(initialIdentityState());
    const status = Effect.map(Ref.get(identity), ssoStatusView);
    const connectionResult = Effect.map(Ref.get(identity), (state) => ({
      connection: state.connection,
    }));
    return handlers
      .handle("list", () => Ref.get(organizations))
      .handle("get", ({ params }) =>
        Effect.flatMap(Ref.get(organizations), (list) => {
          const organization = list.find(
            (candidate) => candidate.id === params.orgId,
          );
          return organization
            ? Effect.succeed(organization)
            : Effect.fail(new Forbidden({}));
        }),
      )
      .handle("listMyInvitations", () => Effect.succeed([]))
      .handle("listJoinableOrganizations", () => Effect.succeed([]))
      .handle("create", ({ payload }) => {
        const name =
          typeof payload === "object" &&
          payload !== null &&
          "name" in payload &&
          typeof payload.name === "string"
            ? payload.name
            : "Workspace";
        return Effect.succeed({ id: "org_sample_new", name });
      })
      .handle("setSharing", ({ payload }) => Effect.succeed(payload))
      .handle("setMfaRequired", ({ params, payload }) => {
        const { required, graceDays, level } = fields(payload);
        return Ref.updateAndGet(organizations, (list) =>
          list.map((organization) =>
            organization.id !== params.orgId
              ? organization
              : new Organization({
                  ...organization,
                  mfaRequired: required === true,
                  mfaLevel: level === "passkey" ? "passkey" : "any",
                  mfaEnforceAt:
                    required === true && typeof graceDays === "number"
                      ? DateTime.add(DateTime.nowUnsafe(), { days: graceDays })
                      : null,
                }),
          ),
        ).pipe(Effect.as({ ok: true }));
      })
      .handle("listAllowedDomains", () =>
        Effect.map(Ref.get(identity), (state) => state.domains),
      )
      .handle("addAllowedDomain", ({ payload }) =>
        Ref.modify(identity, (state) => addDomain(state, payload)),
      )
      .handle("verifyAllowedDomain", ({ params }) =>
        Ref.modify(identity, (state) => verifyDomain(state, params.domainId)),
      )
      .handle("removeAllowedDomain", ({ params }) =>
        Ref.update(identity, (state) =>
          removeDomain(state, params.domainId),
        ).pipe(Effect.as({ ok: true })),
      )
      .handle("setOrgSsoRequired", ({ payload }) =>
        Ref.update(identity, (state) => setSsoRequired(state, payload)).pipe(
          Effect.as({ ok: true }),
        ),
      )
      .handle("getSsoConnection", () => status)
      .handle("draftSsoConnection", ({ payload }) =>
        Ref.update(identity, (state) => draftConnection(state, payload)).pipe(
          Effect.andThen(connectionResult),
        ),
      )
      .handle("configureSsoConnection", () =>
        Ref.update(identity, configureConnection).pipe(
          Effect.andThen(connectionResult),
        ),
      )
      .handle("setSsoConnectionActive", ({ payload }) =>
        Ref.update(identity, (state) =>
          setConnectionActive(state, payload),
        ).pipe(Effect.andThen(connectionResult)),
      )
      .handle("addSsoCertificate", () => connectionResult)
      .handle("connectSsoConnection", ({ payload }) =>
        Ref.update(identity, (state) =>
          connectGoogleWorkspace(state, payload),
        ).pipe(Effect.andThen(connectionResult)),
      )
      .handle("disconnectSsoConnection", () =>
        Ref.update(identity, disconnectConnection).pipe(
          Effect.as({ ok: true }),
        ),
      );
  }),
);
