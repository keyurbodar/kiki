import { DateTime, Effect, Ref } from "effect";
import { Forbidden } from "../../api/schemas/errors.ts";
import { ProjectId } from "../../api/schemas/ids.ts";
import { Organization } from "../../api/schemas/organization.ts";
import { fields, MockDb, missing, newId } from "../db/MockDb.ts";
import { fixtureNow, minutesAgo } from "../fixtures/time.ts";
import { isoMinutesAgo, org, people, projects } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  sampleDeletedOrganizations,
  sampleDepartedPrivateWork,
  sampleJoinableOrganizations,
  sampleMemberId,
  sampleOrganizations,
  sampleSsoCertificate,
} from "./fixtures.ts";
import type { DomainRow } from "./state.ts";

const text = (value: unknown) =>
  typeof value === "string" && value.length > 0 ? value : undefined;

const flag = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const memberId = (value: unknown) =>
  text(value) ??
  (Object.values(people).some((person) => person.id === value)
    ? String(value)
    : sampleMemberId);

export const OrganizationsMock = mockGroup("organizations", (handlers) =>
  Effect.gen(function* () {
    const { members, pendingInvitations, orgState: state } = yield* MockDb;
    const { organizations, domains, surfaceModels, sso, settings, avatarUrl } =
      state;

    const findOrganization = (orgId: string) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(organizations);
        const row = rows.find((candidate) => candidate.id === orgId);
        if (!row) return yield* Effect.fail(new Forbidden({}));
        return row;
      });

    const updateOrganizations = (
      orgId: string,
      patch: Record<string, unknown>,
    ) =>
      Ref.update(organizations, (rows) =>
        rows.map((row) =>
          row.id === orgId
            ? new Organization({
                ...row,
                ...patch,
                updatedAt: fixtureNow,
              })
            : row,
        ),
      ).pipe(Effect.asVoid);

    const setSettings = (patch: Record<string, unknown>) =>
      Ref.update(settings, (current) => ({
        ...current,
        ...Object.fromEntries(
          Object.entries(patch).filter(([, value]) => value !== undefined),
        ),
      }));

    const findDomain = (domainId: string) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(domains);
        const row = rows.find((candidate) => candidate.id === domainId);
        if (!row) {
          return yield* Effect.die(
            new Error(`organizations.allowedDomains: no row ${domainId}`),
          );
        }
        return row;
      });

    const replaceDomain = (domainId: string, patch: Record<string, unknown>) =>
      Effect.gen(function* () {
        const current = yield* findDomain(domainId);
        const updated = { ...current, ...patch } as DomainRow;
        yield* Ref.set(
          domains,
          (yield* Ref.get(domains)).map((row) =>
            row.id === domainId ? updated : row,
          ),
        );
        return updated;
      });

    const modelSelection = (value: unknown, fallback?: unknown) => {
      const modelId = text(
        typeof value === "object" && value !== null
          ? fields(value).modelId
          : value,
      );
      return modelId
        ? {
            modelId,
            ...(typeof value === "object" && value !== null
              ? fields(value)
              : {}),
          }
        : (fallback ?? null);
    };

    const validMember = (userId: string) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(members);
        if (!rows.some((row) => row.id === userId)) {
          return yield* missing("members", userId);
        }
      });

    return handlers
      .handle("listMyInvitations", () =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(pendingInvitations);
          return rows.map((row) => ({
            ...row,
            organizationId: org.id,
            organizationName: org.name,
            invitedByEmail: people.sam.email,
          }));
        }),
      )
      .handle("listJoinableOrganizations", () =>
        Effect.succeed(sampleJoinableOrganizations),
      )
      .handle("list", () => Ref.get(organizations))
      .handle("create", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const name = text(input.name) ?? "New organization";
          const result = JSON.parse(
            JSON.stringify({ ...sampleOrganizations[0], name }),
          );
          const currentAvatar = yield* Ref.get(avatarUrl);
          yield* Ref.update(organizations, (rows) =>
            rows.map((row) =>
              row.id === sampleOrganizations[0]!.id
                ? new Organization({
                    ...row,
                    name,
                    avatarUrl: currentAvatar,
                    updatedAt: fixtureNow,
                  })
                : row,
            ),
          );
          yield* Ref.set(state.name, name);
          return result;
        }),
      )
      .handle("listDeleted", () => Effect.succeed(sampleDeletedOrganizations))
      .handle("get", ({ params }) => findOrganization(params.orgId))
      .handle("listAllowedDomains", () => Ref.get(domains))
      .handle("addAllowedDomain", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const domain = text(input.domain) ?? "example.org";
          const row: DomainRow = {
            id: newId("dom"),
            domain,
            verified: false,
            ssoRequired: false,
            createdAt: isoMinutesAgo(0),
            verifiedAt: null,
          };
          yield* Ref.update(domains, (rows) => [...rows, row]);
          return row;
        }),
      )
      .handle("removeAllowedDomain", ({ params }) =>
        Effect.gen(function* () {
          yield* findDomain(params.domainId);
          yield* Ref.set(
            domains,
            (yield* Ref.get(domains)).filter(
              (row) => row.id !== params.domainId,
            ),
          );
          return { ok: true, domainId: params.domainId };
        }),
      )
      .handle("setAllowedDomainSsoRequired", ({ params, payload }) =>
        replaceDomain(params.domainId, {
          ssoRequired: flag(fields(payload).ssoRequired, true),
        }),
      )
      .handle("verifyAllowedDomain", ({ params }) =>
        replaceDomain(params.domainId, {
          verified: true,
          verifiedAt: isoMinutesAgo(0),
        }),
      )
      .handle("setDefaultModel", ({ payload }) =>
        Effect.gen(function* () {
          const current = yield* Ref.get(settings);
          const selection = modelSelection(
            fields(payload).modelId,
            current.defaultModel,
          );
          yield* setSettings({ defaultModel: selection });
          const name = String(
            (selection as { modelId?: string })?.modelId ?? "Claude Opus",
          );
          return { ok: true, defaultModel: selection, name };
        }),
      )
      .handle("surfaceDefaultModel", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(surfaceModels);
          return (
            rows[params.surface] ??
            rows.general ?? {
              modelId: "anthropic/claude-opus",
              reasoningMode: "high",
            }
          );
        }),
      )
      .handle("setSurfaceDefaultModel", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const selection = modelSelection(
            input.modelId ?? input.selection,
            (yield* Ref.get(surfaceModels))[params.surface],
          );
          yield* Ref.update(surfaceModels, (rows) => ({
            ...rows,
            [params.surface]: selection,
          }));
          return { ok: true, surface: params.surface, defaultModel: selection };
        }),
      )
      .handle("listDepartedPrivateWork", () =>
        Effect.succeed(sampleDepartedPrivateWork),
      )
      .handle("joinByDomain", ({ params }) =>
        Effect.gen(function* () {
          yield* findOrganization(params.orgId).pipe(Effect.orDie);
          const joined = sampleJoinableOrganizations.find(
            (row) => row.id === params.orgId,
          );
          return {
            ok: true,
            organizationId: params.orgId,
            name: joined?.name ?? org.name,
            membership: "member",
            joinedAt: isoMinutesAgo(0),
          };
        }),
      )
      .handle("setDefaultProject", ({ payload }) =>
        Effect.gen(function* () {
          const projectId = text(fields(payload).projectId) ?? projects.web.id;
          yield* setSettings({ defaultProjectId: projectId });
          yield* updateOrganizations(org.id, {
            defaultProjectId: ProjectId.make(projectId),
          });
          return { ok: true, projectId, defaultProjectId: projectId };
        }),
      )
      .handle("setDefaultVisibility", ({ payload }) =>
        Effect.gen(function* () {
          const visibility = text(fields(payload).visibility) ?? "org";
          yield* setSettings({ defaultVisibility: visibility });
          yield* updateOrganizations(org.id, { defaultVisibility: visibility });
          return { ok: true, visibility, defaultVisibility: visibility };
        }),
      )
      .handle("setTitlePrompt", ({ payload }) =>
        Effect.gen(function* () {
          const titlePrompt = text(fields(payload).titlePrompt) ?? null;
          yield* setSettings({ titlePrompt });
          yield* updateOrganizations(org.id, { titlePrompt });
          return { ok: true, titlePrompt };
        }),
      )
      .handle("setTitleTriggers", ({ payload }) =>
        Effect.gen(function* () {
          const titleTriggers = fields(payload).titleTriggers;
          const triggers = Array.isArray(titleTriggers) ? titleTriggers : null;
          yield* setSettings({ titleTriggers: triggers });
          yield* updateOrganizations(org.id, { titleTriggers: triggers });
          return { ok: true, titleTriggers: triggers };
        }),
      )
      .handle("transferPrivateWork", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* findOrganization(params.orgId).pipe(Effect.orDie);
          yield* validMember(params.userId);
          const input = fields(payload);
          const destination = memberId(
            input.toUserId ?? input.destinationUserId,
          );
          yield* validMember(destination);
          return {
            ok: true,
            fromUserId: params.userId,
            toUserId: destination,
            transferredAt: isoMinutesAgo(0),
          };
        }),
      )
      .handle("setMfaRequired", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* findOrganization(params.orgId).pipe(Effect.orDie);
          const input = fields(payload);
          const mfaRequired = flag(input.required ?? input.mfaRequired, true);
          const mfaEnforceAt = mfaRequired ? minutesAgo(-30 * 24 * 60) : null;
          yield* setSettings({ mfaRequired, mfaEnforceAt });
          yield* updateOrganizations(params.orgId, {
            mfaRequired,
            mfaEnforceAt,
          });
          return {
            ok: true,
            mfaRequired,
            mfaEnforceAt: mfaEnforceAt
              ? DateTime.formatIso(mfaEnforceAt)
              : null,
          };
        }),
      )
      .handle("setPersonalThreads", ({ payload }) =>
        Effect.gen(function* () {
          const personalThreadsEnabled = flag(
            fields(payload).enabled ?? fields(payload).personalThreadsEnabled,
            true,
          );
          yield* setSettings({ personalThreadsEnabled });
          yield* updateOrganizations(org.id, { personalThreadsEnabled });
          return { ok: true, personalThreadsEnabled };
        }),
      )
      .handle("setPullGuides", ({ payload }) =>
        Effect.gen(function* () {
          const pullGuidesEnabled = flag(
            fields(payload).enabled ?? fields(payload).pullGuidesEnabled,
            true,
          );
          yield* setSettings({ pullGuidesEnabled });
          yield* updateOrganizations(org.id, { pullGuidesEnabled });
          return { ok: true, pullGuidesEnabled };
        }),
      )
      .handle("setSharing", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const sharing = text(input.sharing) ?? "org";
          const defaultVisibility = sharing === "private" ? "private" : "org";
          yield* setSettings({ sharing, defaultVisibility });
          yield* updateOrganizations(org.id, { defaultVisibility });
          return { ok: true, sharing, defaultVisibility };
        }),
      )
      .handle("getSsoConnection", () => Ref.get(sso))
      .handle("connectSsoConnection", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const updated = {
            ...(yield* Ref.get(sso)),
            provider: text(input.provider) ?? "google",
            domain: text(input.domain) ?? org.domain,
            connected: true,
            updatedAt: isoMinutesAgo(0),
          };
          yield* Ref.set(sso, updated);
          return updated;
        }),
      )
      .handle("disconnectSsoConnection", () =>
        Effect.gen(function* () {
          const updated = {
            ...(yield* Ref.get(sso)),
            connection: null,
            connected: false,
            active: false,
            updatedAt: isoMinutesAgo(0),
          };
          yield* Ref.set(sso, updated);
          return { ...updated, ok: true };
        }),
      )
      .handle("configureSsoConnection", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const current = yield* Ref.get(sso);
          const updated = {
            ...current,
            connection: {
              ...fields(current.connection),
              ...input,
            },
            updatedAt: isoMinutesAgo(0),
          };
          yield* Ref.set(sso, updated);
          return updated;
        }),
      )
      .handle("setSsoConnectionActive", ({ payload }) =>
        Effect.gen(function* () {
          const active = flag(fields(payload).active, true);
          const updated = {
            ...(yield* Ref.get(sso)),
            active,
            updatedAt: isoMinutesAgo(0),
          };
          yield* Ref.set(sso, updated);
          return updated;
        }),
      )
      .handle("addSsoCertificate", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const certificate = {
            ...sampleSsoCertificate,
            id: newId("cert"),
            name: text(input.name) ?? sampleSsoCertificate.name,
            addedAt: isoMinutesAgo(0),
          };
          const current = yield* Ref.get(sso);
          const certificates = [
            ...(Array.isArray(current.certificates)
              ? current.certificates
              : []),
            certificate,
          ];
          const updated = {
            ...current,
            certificates,
            updatedAt: isoMinutesAgo(0),
          };
          yield* Ref.set(sso, updated);
          return certificate;
        }),
      )
      .handle("draftSsoConnection", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const draft = {
            id: newId("sso_draft"),
            provider: text(input.provider) ?? "google",
            domain: text(input.domain) ?? org.domain,
            connected: false,
            active: false,
            status: "draft",
            connection: fields(input.connection),
            certificates: [],
            updatedAt: isoMinutesAgo(0),
          };
          yield* Ref.set(sso, draft);
          return draft;
        }),
      )
      .handle("setOrgSsoRequired", ({ payload }) =>
        Effect.gen(function* () {
          const ssoRequired = flag(
            fields(payload).ssoRequired ?? fields(payload).required,
            true,
          );
          const updated = {
            ...(yield* Ref.get(sso)),
            ssoRequired,
            updatedAt: isoMinutesAgo(0),
          };
          yield* setSettings({ ssoRequired });
          yield* Ref.set(sso, updated);
          return updated;
        }),
      )
      .handle("setTaskLimits", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const taskConcurrentLimit =
            typeof input.concurrent === "number"
              ? input.concurrent
              : typeof input.taskConcurrentLimit === "number"
                ? input.taskConcurrentLimit
                : 5;
          const taskNestedDepth =
            typeof input.nested === "number"
              ? input.nested
              : typeof input.taskNestedDepth === "number"
                ? input.taskNestedDepth
                : 2;
          yield* setSettings({ taskConcurrentLimit, taskNestedDepth });
          yield* updateOrganizations(org.id, {
            taskConcurrentLimit,
            taskNestedDepth,
          });
          return {
            ok: true,
            taskConcurrentLimit,
            taskNestedDepth,
            limits: {
              concurrent: taskConcurrentLimit,
              nested: taskNestedDepth,
            },
          };
        }),
      )
      .handle("setOrgTitlePrompt", ({ payload }) =>
        Effect.gen(function* () {
          const orgTitlePrompt = text(fields(payload).titlePrompt) ?? null;
          yield* setSettings({ orgTitlePrompt });
          yield* updateOrganizations(org.id, { orgTitlePrompt });
          return { ok: true, orgTitlePrompt };
        }),
      )
      .handle("setOrgTitleTriggers", ({ payload }) =>
        Effect.gen(function* () {
          const triggers = fields(payload).titleTriggers;
          const orgTitleTriggers = Array.isArray(triggers) ? triggers : null;
          yield* setSettings({ orgTitleTriggers });
          yield* updateOrganizations(org.id, { orgTitleTriggers });
          return { ok: true, orgTitleTriggers };
        }),
      );
  }),
);
