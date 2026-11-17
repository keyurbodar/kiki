type Row = Record<string, unknown>;

const row = (value: unknown): Row =>
  typeof value === "object" && value !== null ? (value as Row) : {};
const str = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;
const strOrNull = (value: unknown) =>
  typeof value === "string" && value !== "" ? value : null;
const bool = (value: unknown) => value === true;
const list = (value: unknown): ReadonlyArray<unknown> =>
  Array.isArray(value) ? value : [];
const date = (value: unknown) => {
  if (value instanceof Date) return value;
  if (typeof value !== "string" && typeof value !== "number")
    return new Date(0);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
};

export const auditFamilies = [
  "members",
  "api_keys",
  "automations",
  "projects",
  "models",
  "integrations",
  "mcp",
  "devices",
  "review",
  "billing",
  "tags_folders",
  "threads",
  "drive",
  "organization",
] as const;
export type AuditFamily = (typeof auditFamilies)[number];

export const auditSubjectKinds = [
  "member",
  "invitation",
  "domain",
  "api_key",
  "service_user",
  "device",
  "automation",
  "project",
  "mcp_server",
  "tag",
  "folder",
  "model",
  "provider",
  "repository",
  "feature",
  "organization",
  "pull_request",
] as const;
export type AuditSubjectKind = (typeof auditSubjectKinds)[number];

export type AuditOrder = "newest" | "oldest";
export type AuditActorFilter = "human" | "agent" | "service" | "system";

export type AuditListQuery = {
  cursor?: string;
  order?: AuditOrder;
  actor?: AuditActorFilter;
  userId?: string;
  family?: AuditFamily;
  from?: string;
  to?: string;
  q?: string;
};

export type AuditPerson = {
  userId: string;
  name: string | null;
  email: string | null;
  imageUrl: string | null;
};

export type AuditThread = {
  jamId: string;
  code: string | null;
  title: string | null;
};

export type AuditActor =
  | { readonly _tag: "human"; readonly person: AuditPerson }
  | {
      readonly _tag: "service";
      readonly serviceUserId: string;
      readonly name: string | null;
    }
  | { readonly _tag: "system" };

export type AuditFactValue =
  | { readonly _tag: "text"; readonly text: string }
  | {
      readonly _tag: "change";
      readonly from: string | null;
      readonly to: string | null;
    }
  | { readonly _tag: "list"; readonly items: ReadonlyArray<string> }
  | { readonly _tag: "people"; readonly people: ReadonlyArray<AuditPerson> }
  | { readonly _tag: "thread"; readonly thread: AuditThread | null };

export type AuditFact = { key: string; value: AuditFactValue };

export type AuditChange = (
  | {
      readonly _tag: "value";
      readonly from: string | null;
      readonly to: string | null;
    }
  | {
      readonly _tag: "text";
      readonly from: string | null;
      readonly to: string | null;
      readonly truncated: boolean;
    }
  | {
      readonly _tag: "list";
      readonly added: ReadonlyArray<string>;
      readonly removed: ReadonlyArray<string>;
      readonly truncated: boolean;
    }
  | { readonly _tag: "secret" }
) & { field: string; name: string | null };

export type AuditSubject = {
  kind: AuditSubjectKind | null;
  label: string | null;
  person: AuditPerson | null;
};

export type AuditEvent = {
  id: string;
  createdAt: Date;
  action: string;
  family: string;
  actor: AuditActor;
  viaAgent: boolean;
  thread: AuditThread | null;
  subject: AuditSubject;
  facts: ReadonlyArray<AuditFact>;
  changes: ReadonlyArray<AuditChange>;
};

export type AuditPage = {
  events: ReadonlyArray<AuditEvent>;
  nextCursor: string | null;
};

const person = (value: unknown): AuditPerson => {
  const r = row(value);
  return {
    userId: str(r.userId),
    name: strOrNull(r.name),
    email: strOrNull(r.email),
    imageUrl: strOrNull(r.imageUrl),
  };
};

const personOrNull = (value: unknown) =>
  value === null || value === undefined ? null : person(value);

const threadOrNull = (value: unknown): AuditThread | null => {
  if (value === null || value === undefined) return null;
  const r = row(value);
  return {
    jamId: str(r.jamId),
    code: strOrNull(r.code),
    title: strOrNull(r.title),
  };
};

const factValue = (value: unknown): AuditFactValue => {
  const r = row(value);
  switch (r._tag) {
    case "change":
      return { _tag: "change", from: strOrNull(r.from), to: strOrNull(r.to) };
    case "list":
      return { _tag: "list", items: list(r.items).map((item) => str(item)) };
    case "people":
      return { _tag: "people", people: list(r.people).map(person) };
    case "thread":
      return { _tag: "thread", thread: threadOrNull(r.thread) };
    default:
      return { _tag: "text", text: str(r.text ?? value) };
  }
};

const change = (value: unknown): AuditChange => {
  const r = row(value);
  const field = str(r.field);
  const name = strOrNull(r.name);
  switch (r._tag) {
    case "text":
      return {
        _tag: "text",
        field,
        name,
        from: strOrNull(r.from),
        to: strOrNull(r.to),
        truncated: bool(r.truncated),
      };
    case "list":
      return {
        _tag: "list",
        field,
        name,
        added: list(r.added).map((item) => str(item)),
        removed: list(r.removed).map((item) => str(item)),
        truncated: bool(r.truncated),
      };
    case "secret":
      return { _tag: "secret", field, name };
    default:
      return {
        _tag: "value",
        field,
        name,
        from: strOrNull(r.from),
        to: strOrNull(r.to),
      };
  }
};

const decodeActor = (value: unknown, legacy: Row): AuditActor => {
  const r = row(value);
  switch (r._tag) {
    case "human":
      return { _tag: "human", person: person(r.person) };
    case "service":
      return {
        _tag: "service",
        serviceUserId: str(r.serviceUserId),
        name: strOrNull(r.name),
      };
    case "system":
      return { _tag: "system" };
    default:
      break;
  }
  const actorId = strOrNull(legacy.actorId);
  if (actorId === null) return { _tag: "system" };
  return {
    _tag: "human",
    person: {
      userId: actorId,
      name: null,
      email: strOrNull(legacy.actorEmail),
      imageUrl: null,
    },
  };
};

const decodeEvent = (value: unknown): AuditEvent => {
  const r = row(value);
  const subject = row(r.subject);
  const kind = strOrNull(subject.kind);
  return {
    id: str(r.id),
    createdAt: date(r.createdAt),
    action: str(r.action, "unsupported"),
    family: str(r.family, "organization"),
    actor: decodeActor(r.actor, r),
    viaAgent: bool(r.viaAgent),
    thread: threadOrNull(r.thread),
    subject: {
      kind: (auditSubjectKinds as ReadonlyArray<string>).includes(kind ?? "")
        ? (kind as AuditSubjectKind)
        : null,
      label: strOrNull(subject.label) ?? strOrNull(r.targetName),
      person: personOrNull(subject.person),
    },
    facts: list(r.facts).map((fact) => {
      const f = row(fact);
      return { key: str(f.key), value: factValue(f.value) };
    }),
    changes: list(r.changes).map(change),
  };
};

/** Capy's audit page, read loosely: the endpoint is not decoded yet. */
export const decodeAuditPage = (value: unknown): AuditPage => {
  const r = row(value);
  if (Array.isArray(value))
    return { events: value.map(decodeEvent), nextCursor: null };
  const events = Array.isArray(r.entries)
    ? r.entries
    : Array.isArray(r.events)
      ? r.events
      : Array.isArray(r.items)
        ? r.items
        : [];
  return {
    events: events.map(decodeEvent),
    nextCursor: strOrNull(r.nextCursor) ?? strOrNull(r.cursor),
  };
};
