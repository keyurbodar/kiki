import { Effect, Ref } from "effect";
import { fields, MockDb, newId, notFound } from "../db/MockDb.ts";
import { isoMinutesAgo } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  connections,
  handoffOwner,
  handoffThread,
  type MachineConnection,
  type MachinePort,
  machineSizes,
  metrics,
  type Phone,
  phoneEvents,
  phones,
  ports,
  previews,
  type Reservation,
  reservations,
  type ServicePreview,
  type SetupRun,
  sessions,
  setupEntries,
  setupRuns,
} from "./fixtures.ts";

const requireRow = <T extends { readonly id: string }>(
  rows: ReadonlyArray<T>,
  id: string,
  label: string,
) => {
  const row = rows.find((candidate) => candidate.id === id);
  return row
    ? Effect.succeed(row)
    : Effect.die(new Error(`machines.${label}: no row ${id}`));
};

export const MachinesMock = mockGroup("machines", (handlers) =>
  Effect.gen(function* () {
    const { machines, devices } = yield* MockDb;
    const portRef = yield* Ref.make<ReadonlyArray<MachinePort>>(ports);
    const previewRef = yield* Ref.make<ReadonlyArray<ServicePreview>>(previews);
    const connectionRef =
      yield* Ref.make<ReadonlyArray<MachineConnection>>(connections);
    const reservationRef =
      yield* Ref.make<ReadonlyArray<Reservation>>(reservations);
    const phoneRef = yield* Ref.make<ReadonlyArray<Phone>>(phones);
    const setupRef = yield* Ref.make<ReadonlyArray<SetupRun>>(setupRuns);

    const machine = (machineId: string) =>
      Effect.flatMap(Ref.get(machines), (rows) => {
        const row = rows.find((candidate) => candidate.id === machineId);
        return row ? Effect.succeed(row) : notFound("machines", machineId);
      });

    return handlers
      .handle("previewHandoff", ({ params }) =>
        Effect.gen(function* () {
          const row = yield* machine(params.machineId);
          const preview = (yield* Ref.get(previewRef)).find(
            (candidate) =>
              candidate.machineId === row.id && candidate.port === params.port,
          );
          return {
            machineId: row.id,
            port: params.port,
            url: preview?.url ?? `https://preview.example.com/${params.port}`,
            token: preview?.token ?? `capy_preview_${params.port}`,
            threadId: handoffThread.id,
            ownerId: handoffOwner.id,
          };
        }),
      )
      .handle("list", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(machines);
          const phoneRows = yield* Ref.get(phoneRef);
          return rows.map((row) => ({
            ...row,
            status: row.kind === "cloud" ? row.status : "online",
            threadTitle: handoffThread.title,
            deviceId:
              phoneRows.find((phone) => phone.machineId === row.id)?.deviceId ??
              null,
            organizationId: params.orgId,
          }));
        }),
      )
      .handle("connect", ({ params, payload }) =>
        Effect.gen(function* () {
          const row = yield* machine(params.machineId);
          const input = fields(payload);
          const connection: MachineConnection = {
            machineId: row.id,
            provider:
              typeof input.provider === "string" ? input.provider : "GitHub",
            repoFullName:
              typeof input.repoFullName === "string"
                ? input.repoFullName
                : "acme/web",
            connectedAt: isoMinutesAgo(0),
          };
          yield* Ref.update(connectionRef, (rows) => [
            ...rows.filter((item) => item.machineId !== row.id),
            connection,
          ]);
          return { ...connection, connected: true };
        }),
      )
      .handle("extend", ({ params, payload }) =>
        Effect.gen(function* () {
          const row = yield* machine(params.machineId);
          const input = fields(payload);
          const minutes =
            typeof input.minutes === "number" ? input.minutes : 60;
          const reservedUntil = isoMinutesAgo(-minutes);
          const reservation = { machineId: row.id, reservedUntil };
          yield* Ref.update(reservationRef, (rows) => [
            ...rows.filter((item) => item.machineId !== row.id),
            reservation,
          ]);
          return {
            machineId: row.id,
            reservedUntil,
            extendedByMinutes: minutes,
          };
        }),
      )
      .handle("metrics", ({ params }) =>
        Effect.gen(function* () {
          const row = yield* machine(params.machineId);
          const sample = metrics.find((item) => item.machineId === row.id);
          return {
            machineId: row.id,
            ...(sample ?? {
              cpuPercent: 0,
              memoryPercent: 0,
              diskPercent: 0,
              sampledAt: isoMinutesAgo(1),
            }),
          };
        }),
      )
      .handle("removePhone", ({ params }) =>
        Effect.gen(function* () {
          const row = yield* machine(params.machineId);
          const attached = (yield* Ref.get(phoneRef)).find(
            (phone) => phone.machineId === row.id,
          );
          if (!attached) {
            return yield* Effect.die(
              new Error(`machines.phone: no phone on ${row.id}`),
            );
          }
          yield* Ref.update(phoneRef, (rows) =>
            rows.filter((phone) => phone.id !== attached.id),
          );
          return { ok: true, machineId: row.id };
        }),
      )
      .handle("pressPhone", ({ params, payload }) =>
        Effect.gen(function* () {
          const row = yield* machine(params.machineId);
          const input = fields(payload);
          const action =
            typeof input.action === "string" ? input.action : "done";
          const rows = yield* Ref.get(phoneRef);
          const attached = yield* requireRow(
            rows.map((phone) => ({ ...phone, id: phone.machineId })),
            row.id,
            "phone",
          );
          yield* Ref.update(phoneRef, (all) =>
            all.map((phone) =>
              phone.id === attached.id
                ? { ...phone, lastAction: action }
                : phone,
            ),
          );
          return {
            machineId: row.id,
            action,
            accepted: true,
            at: isoMinutesAgo(0),
          };
        }),
      )
      .handle("sleepPhone", ({ params }) =>
        Effect.gen(function* () {
          const row = yield* machine(params.machineId);
          const rows = yield* Ref.get(phoneRef);
          if (!rows.some((phone) => phone.machineId === row.id)) {
            return yield* Effect.die(
              new Error(`machines.phone: no phone on ${row.id}`),
            );
          }
          yield* Ref.update(phoneRef, (all) =>
            all.map((phone) =>
              phone.machineId === row.id ? { ...phone, sleeping: true } : phone,
            ),
          );
          return { machineId: row.id, sleeping: true };
        }),
      )
      .handle("phoneStream", ({ params }) =>
        Effect.gen(function* () {
          const row = yield* machine(params.machineId);
          return {
            machineId: row.id,
            events: phoneEvents.filter((event) => event.machineId === row.id),
            hasLiveStream: true,
          };
        }),
      )
      .handle("ports", ({ params }) =>
        Effect.gen(function* () {
          const row = yield* machine(params.machineId);
          return (yield* Ref.get(portRef)).filter(
            (port) => port.machineId === row.id,
          );
        }),
      )
      .handle("openPort", ({ params, payload }) =>
        Effect.gen(function* () {
          const row = yield* machine(params.machineId);
          const input = fields(payload);
          const label =
            typeof input.label === "string" ? input.label : "Service preview";
          const port: MachinePort = {
            id: newId("port"),
            machineId: row.id,
            port: params.port,
            protocol: "http",
            label,
            status: "open",
            url: `https://preview.example.com/${params.port}`,
          };
          yield* Ref.update(portRef, (rows) => [
            ...rows.filter(
              (item) =>
                !(item.machineId === row.id && item.port === params.port),
            ),
            port,
          ]);
          return port;
        }),
      )
      .handle("reserve", ({ params }) =>
        Effect.gen(function* () {
          const row = yield* machine(params.machineId);
          const reservedUntil = isoMinutesAgo(-30);
          const reservation: Reservation = { machineId: row.id, reservedUntil };
          yield* Ref.update(reservationRef, (rows) => [
            ...rows.filter((item) => item.machineId !== row.id),
            reservation,
          ]);
          yield* Ref.update(machines, (rows) =>
            rows.map((item) =>
              item.id === row.id ? { ...item, status: "running" } : item,
            ),
          );
          return { machineId: row.id, reservedUntil, reserved: true };
        }),
      )
      .handle("release", ({ params }) =>
        Effect.gen(function* () {
          const row = yield* machine(params.machineId);
          yield* Ref.update(reservationRef, (rows) =>
            rows.filter((item) => item.machineId !== row.id),
          );
          yield* Ref.update(machines, (rows) =>
            rows.map((item) =>
              item.id === row.id ? { ...item, status: "sleeping" } : item,
            ),
          );
          return { ok: true, machineId: row.id };
        }),
      )
      .handle("removeServicePreview", ({ params }) =>
        Effect.gen(function* () {
          const row = yield* machine(params.machineId);
          const existing = yield* Ref.get(previewRef);
          const preview = existing.find(
            (item) => item.machineId === row.id && item.port === params.port,
          );
          if (!preview) {
            return yield* Effect.die(
              new Error(
                `machines.servicePreviews: no port ${params.port} on ${row.id}`,
              ),
            );
          }
          yield* Ref.set(
            previewRef,
            existing.filter((item) => item.id !== preview.id),
          );
          return { ok: true, machineId: row.id, port: params.port };
        }),
      )
      .handle("sessions", ({ params }) =>
        Effect.gen(function* () {
          const row = yield* machine(params.machineId);
          return sessions.filter((session) => session.machineId === row.id);
        }),
      )
      .handle("launchSetupEntry", ({ params, payload }) =>
        Effect.gen(function* () {
          const row = yield* machine(params.machineId);
          const input = fields(payload);
          const entryId = String(input.entryId ?? "setup_sample_browser");
          const entry = yield* requireRow(
            [...setupEntries],
            entryId,
            "setupEntries",
          );
          const run: SetupRun = {
            machineId: row.id,
            entryId: entry.id,
            startedAt: isoMinutesAgo(0),
          };
          yield* Ref.update(setupRef, (rows) => [
            ...rows.filter((item) => item.entryId !== entry.id),
            run,
          ]);
          return { ...run, name: entry.name, status: "running" };
        }),
      )
      .handle("rerunSetup", ({ params }) =>
        Effect.gen(function* () {
          const row = yield* machine(params.machineId);
          const run: SetupRun = {
            machineId: row.id,
            entryId: "setup_sample_browser",
            startedAt: isoMinutesAgo(0),
          };
          yield* Ref.update(setupRef, (rows) => [...rows, run]);
          return { ...run, status: "running" };
        }),
      )
      .handle("wake", ({ params }) =>
        Effect.gen(function* () {
          const row = yield* machine(params.machineId);
          yield* Ref.update(machines, (rows) =>
            rows.map((item) =>
              item.id === row.id ? { ...item, status: "running" } : item,
            ),
          );
          return {
            machineId: row.id,
            status: "running",
            wokenAt: isoMinutesAgo(0),
          };
        }),
      )
      .handle("attachPhone", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const deviceRows = yield* Ref.get(devices);
          const deviceId = String(input.deviceId ?? deviceRows[0]?.id ?? "");
          const device = yield* requireRow(
            [...deviceRows],
            deviceId,
            "devices",
          );
          const machineRows = yield* Ref.get(machines);
          const machineId = String(input.machineId ?? machineRows[0]?.id ?? "");
          const row = yield* machine(machineId);
          const phone: Phone = {
            id: newId("phone"),
            machineId: row.id,
            deviceId: device.id,
            attachedAt: isoMinutesAgo(0),
            sleeping: false,
            lastAction: null,
          };
          yield* Ref.update(phoneRef, (rows) => [
            ...rows.filter((item) => item.machineId !== row.id),
            phone,
          ]);
          return { ...phone, deviceName: device.name };
        }),
      )
      .handle("listServicePreviews", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(machines);
          const previews = yield* Ref.get(previewRef);
          return previews.map((preview) => ({
            ...preview,
            organizationId: params.orgId,
            jamId: params.jamId,
            threadId:
              rows.find((row) => row.id === preview.machineId)?.threadId ??
              null,
          }));
        }),
      )
      .handle("resolvePreviewToken", ({ params, query }) =>
        Effect.gen(function* () {
          const token = String(query.token ?? "");
          const preview = (yield* Ref.get(previewRef)).find(
            (item) => item.token === token,
          );
          if (!preview) {
            return yield* Effect.die(
              new Error(`machines.previews: no token ${token}`),
            );
          }
          return {
            ...preview,
            organizationId: params.orgId,
            jamId: params.jamId,
            valid: true,
          };
        }),
      )
      .handle("sizes", () => Effect.succeed(machineSizes));
  }),
);
