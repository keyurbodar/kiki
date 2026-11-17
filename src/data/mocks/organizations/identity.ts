import { fields, newId } from "../db/MockDb.ts";
import { isoMinutesAgo } from "../fixtures/world.ts";

type Row = Record<string, unknown>;

/** SSO and allowed-domain state behind Identity & access (ST36). */
export type IdentityState = {
  domains: ReadonlyArray<Row>;
  connection: Row | null;
  enterprise: ReadonlyArray<Row>;
  addOn: Row;
  available: boolean;
};

export const initialIdentityState = (): IdentityState => ({
  domains: [],
  connection: null,
  enterprise: [],
  addOn: {
    status: "active",
    eligible: true,
    priceCents: 10000,
    currentPeriodEnd: null,
  },
  available: true,
});

export const ssoStatusView = (state: IdentityState) => ({
  available: state.available,
  connection: state.connection,
  enterprise: state.enterprise,
  addOn: state.addOn,
});

const withDomain = (
  state: IdentityState,
  domainId: string,
  update: (row: Row) => Row,
): IdentityState => ({
  ...state,
  domains: state.domains.map((row) =>
    row.id === domainId ? update(row) : row,
  ),
});

export const addDomain = (state: IdentityState, payload: unknown) => {
  const domain = String(fields(payload).domain ?? "")
    .trim()
    .toLowerCase();
  const row: Row = {
    id: newId("domain"),
    domain,
    verification: "pending",
    dnsRecord: null,
    dnsMissingSince: null,
    sso: null,
    ssoRequired: false,
    createdAt: isoMinutesAgo(0),
  };
  return [row, { ...state, domains: [...state.domains, row] }] as const;
};

/** First call hands out the TXT record, the next one finds it. */
export const verifyDomain = (state: IdentityState, domainId: string) => {
  const next = withDomain(state, domainId, (row) =>
    row.dnsRecord === null
      ? {
          ...row,
          dnsRecord: {
            host: `_capy-verification.${String(row.domain)}`,
            type: "TXT",
            value: `capy-verification=${domainId}`,
          },
        }
      : { ...row, verification: "dns", dnsMissingSince: null },
  );
  return [next.domains.find((row) => row.id === domainId), next] as const;
};

export const removeDomain = (state: IdentityState, domainId: string) => ({
  ...state,
  domains: state.domains.filter((row) => row.id !== domainId),
  connection: state.connection?.domainId === domainId ? null : state.connection,
});

const domainOf = (state: IdentityState, domainId: unknown) =>
  state.domains.find((row) => row.id === domainId);

const serviceProvider = (id: string) => ({
  acsUrl: `https://sso.example.com/saml/${id}/acs`,
  entityId: `https://sso.example.com/saml/${id}`,
  metadataUrl: `https://sso.example.com/saml/${id}/metadata`,
});

const syncDomainSso = (state: IdentityState): IdentityState => ({
  ...state,
  domains: state.domains.map((row) => ({
    ...row,
    sso:
      state.connection !== null &&
      state.connection.domainId === row.id &&
      state.connection.state === "active"
        ? state.connection.provider
        : null,
  })),
});

export const draftConnection = (state: IdentityState, payload: unknown) => {
  const { provider, domainId } = fields(payload);
  const domain = domainOf(state, domainId);
  const id = newId("sso");
  const connection: Row = {
    id,
    provider,
    domainId,
    domain: domain?.domain ?? "",
    state: "draft",
    configured: false,
    testedAt: null,
    serviceProvider: serviceProvider(id),
  };
  return syncDomainSso({ ...state, connection });
};

export const configureConnection = (state: IdentityState) =>
  state.connection === null
    ? state
    : { ...state, connection: { ...state.connection, configured: true } };

export const setConnectionActive = (state: IdentityState, payload: unknown) =>
  state.connection === null
    ? state
    : syncDomainSso({
        ...state,
        connection: {
          ...state.connection,
          state: fields(payload).active === true ? "active" : "off",
        },
      });

export const connectGoogleWorkspace = (
  state: IdentityState,
  payload: unknown,
) => {
  const { domainId } = fields(payload);
  const domain = domainOf(state, domainId);
  return syncDomainSso({
    ...state,
    connection: {
      id: newId("sso"),
      provider: "google_workspace",
      domainId,
      domain: domain?.domain ?? "",
      state: "active",
      configured: true,
      testedAt: isoMinutesAgo(0),
      serviceProvider: null,
    },
  });
};

export const disconnectConnection = (state: IdentityState) =>
  syncDomainSso({ ...state, connection: null });

export const setSsoRequired = (state: IdentityState, payload: unknown) => {
  const required = fields(payload).required === true;
  return {
    ...state,
    domains: state.domains.map((row) => ({
      ...row,
      ssoRequired: required && row.sso !== null,
    })),
  };
};
