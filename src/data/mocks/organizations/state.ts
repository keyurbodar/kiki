import { Effect, Ref } from "effect";
import { org, projects } from "../fixtures/world.ts";
import {
  sampleAllowedDomains,
  sampleOrganizations,
  sampleSsoConnection,
  sampleSurfaceModels,
} from "./fixtures.ts";

export type OrganizationRow = (typeof sampleOrganizations)[number];
export type DomainDnsRecord = {
  readonly host: string;
  readonly type: string;
  readonly value: string;
};

export type DomainRow = {
  readonly id: string;
  readonly domain: string;
  readonly verified: boolean;
  readonly verification: string;
  readonly dnsRecord: DomainDnsRecord | null;
  readonly ssoRequired: boolean;
  readonly createdAt: string;
  readonly verifiedAt: string | null;
};
export interface OrgState {
  readonly organizations: Ref.Ref<ReadonlyArray<OrganizationRow>>;
  readonly domains: Ref.Ref<ReadonlyArray<DomainRow>>;
  readonly surfaceModels: Ref.Ref<Record<string, unknown>>;
  readonly sso: Ref.Ref<Record<string, unknown>>;
  readonly settings: Ref.Ref<Record<string, unknown>>;
  readonly name: Ref.Ref<string>;
  readonly avatarUrl: Ref.Ref<string | null>;
}

export const makeOrgState = Effect.gen(function* () {
  const state: OrgState = {
    organizations:
      yield* Ref.make<ReadonlyArray<OrganizationRow>>(sampleOrganizations),
    domains: yield* Ref.make<ReadonlyArray<DomainRow>>(sampleAllowedDomains),
    surfaceModels:
      yield* Ref.make<Record<string, unknown>>(sampleSurfaceModels),
    sso: yield* Ref.make<Record<string, unknown>>(sampleSsoConnection),
    settings: yield* Ref.make<Record<string, unknown>>({
      defaultModel: null,
      defaultProjectId: projects.web.id,
      defaultVisibility: "org",
      titlePrompt: null,
      titleTriggers: null,
      mfaRequired: false,
      personalThreadsEnabled: true,
      pullGuidesEnabled: true,
      sharing: "org",
      ssoRequired: false,
      taskConcurrentLimit: 5,
      taskNestedDepth: 2,
      orgTitlePrompt: null,
      orgTitleTriggers: null,
    }),
    name: yield* Ref.make<string>(org.name),
    avatarUrl: yield* Ref.make<string | null>(null),
  };
  return state;
});
