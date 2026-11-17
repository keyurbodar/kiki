import {
  auditActionLabels,
  auditChangeFieldLabels,
  auditFactLabels,
} from "./audit-catalog";
import type {
  AuditActor,
  AuditChange,
  AuditEvent,
  AuditFact,
  AuditPerson,
} from "./audit-schema";

/** Capy decodes actions it doesn't know as `unsupported`; kiki treats any action missing from the catalog that way. */
export const isSupportedEvent = (event: AuditEvent) =>
  event.action in auditActionLabels;

export const personName = (person: AuditPerson) =>
  person.name ?? person.email ?? "Unknown person";

export const actorName = (actor: AuditActor) =>
  actor._tag === "human"
    ? personName(actor.person)
    : actor._tag === "service"
      ? (actor.name ?? "Deleted service user")
      : "System";

/** One-line actor for the compact list: "Capy in WEB-41 for Alex Morgan", "Release bot via API". */
export const actorLine = (event: AuditEvent) =>
  event.viaAgent
    ? `${event.thread?.code == null ? "Capy" : `Capy in ${event.thread.code}`} for ${actorName(event.actor)}`
    : event.actor._tag === "service"
      ? `${actorName(event.actor)} via API`
      : actorName(event.actor);

/** The table's actor cell: a name and an optional muted qualifier. */
export const actorParts = (
  event: AuditEvent,
): readonly [string, string | null] =>
  event.viaAgent
    ? ["Capy", `for ${actorName(event.actor)}`]
    : event.actor._tag === "service"
      ? [actorName(event.actor), "API"]
      : [actorName(event.actor), null];

export const subjectLabel = (event: AuditEvent) =>
  !isSupportedEvent(event)
    ? null
    : (event.subject.label ??
      (event.subject.person === null
        ? null
        : personName(event.subject.person)));

const ssoLabel = (action: string, provider: string) =>
  action === "sso.connect"
    ? `Connected ${provider}`
    : action === "sso.delete"
      ? `Removed ${provider}`
      : action === "sso.suspend"
        ? `Turned off ${provider}`
        : action === "sso.resume"
          ? `Turned on ${provider}`
          : undefined;

export const actionLabel = (event: AuditEvent) => {
  const label = auditActionLabels[event.action];
  if (label === undefined) return event.action;
  const provider = event.facts.find((fact) => fact.key === "provider")?.value;
  return (
    (provider?._tag === "text"
      ? ssoLabel(event.action, provider.text)
      : undefined) ?? label
  );
};

export const isShownChange = (change: AuditChange) =>
  change.field in auditChangeFieldLabels;

export const isShownFact = (fact: AuditFact) => fact.key in auditFactLabels;

/** A "changed" list fact stands in for changes when the event recorded no values. */
export const changedFieldsFact = (event: AuditEvent) =>
  event.changes.length === 0
    ? event.facts.find(
        (fact) => fact.key === "changed" && fact.value._tag === "list",
      )
    : undefined;

const namedChangeFields = new Set([
  "env",
  "header",
  "credential_header",
  "variable",
]);

export const changeLabel = (change: AuditChange) => {
  const field = auditChangeFieldLabels[change.field] ?? change.field;
  if (change.name !== null && namedChangeFields.has(change.field))
    return change.name;
  return change.name === null ? field : `${field} · ${change.name}`;
};

export const hasDetails = (event: AuditEvent) =>
  isSupportedEvent(event) &&
  (event.changes.some(isShownChange) || changedFieldsFact(event) !== undefined);
