import { DateTime, Effect, Ref } from "effect";
import {
  DeviceCodeNotFound,
  DeviceCodePreview,
  DeviceCodeResolution,
  DeviceId,
  DeviceNotFound,
} from "../../api/schemas/devices.ts";
import { fields, MockDb, newId } from "../db/MockDb.ts";
import { isoMinutesAgo, projects } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  accessRequests,
  agentAccess,
  checkouts,
  computerUse,
  type DeviceAccessRequest,
  type DeviceAgentAccess,
  type DeviceCheckout,
  type DeviceComputerUse,
  type DeviceDetails,
  deviceDetails,
  folders,
  linkedFolderIds,
  localPullDiff,
  localPulls,
  normalizeCode,
  pairedDetails,
  pendingCodes,
  toDevice,
  viewerId,
  workspaceIndex,
  worktrees,
} from "./fixtures.ts";

const codeTtlMinutes = 15;

type LocalPull = (typeof localPulls)[number];

export const DevicesMock = mockGroup("devices", (handlers) =>
  Effect.gen(function* () {
    const { devices } = yield* MockDb;
    const details = yield* Ref.make<Record<string, DeviceDetails>>({
      ...deviceDetails,
    });
    const codes = yield* Ref.make({ ...pendingCodes });
    const access = yield* Ref.make<ReadonlyArray<DeviceAccessRequest>>([
      ...accessRequests,
    ]);
    const agent = yield* Ref.make<ReadonlyArray<DeviceAgentAccess>>([
      ...agentAccess,
    ]);
    const computer = yield* Ref.make<ReadonlyArray<DeviceComputerUse>>([
      ...computerUse,
    ]);
    const checkout = yield* Ref.make<ReadonlyArray<DeviceCheckout>>([
      ...checkouts,
    ]);
    const linked = yield* Ref.make<Record<string, ReadonlyArray<string>>>({
      ...linkedFolderIds,
    });
    const localPullRef = yield* Ref.make<ReadonlyArray<LocalPull>>(
      localPulls.map((pull) => ({ ...pull })),
    );
    const localPullBody = yield* Ref.make<Record<string, string>>({});

    const findRow = <A extends { readonly id: string }>(
      rows: ReadonlyArray<A>,
      id: string,
      table: string,
    ): Effect.Effect<A> => {
      const row = rows.find((candidate) => candidate.id === id);
      return row === undefined
        ? Effect.die(new Error(`devices.${table}: no row ${id}`))
        : Effect.succeed(row);
    };

    const findFolder = (input: Record<string, unknown>) => {
      const id = String(input.folderId ?? "");
      const path = String(input.path ?? "");
      const row =
        folders.find((candidate) => candidate.id === id) ??
        folders.find((candidate) => candidate.path === path);
      return row === undefined
        ? Effect.die(new Error(`devices.folders: no folder ${id || path}`))
        : Effect.succeed(row);
    };

    const setAccessStatus = (
      accessId: string,
      status: DeviceAccessRequest["status"],
    ) =>
      Effect.gen(function* () {
        const current = yield* findRow(
          yield* Ref.get(access),
          accessId,
          "access",
        );
        const updated = {
          ...current,
          status,
          decidedAt: isoMinutesAgo(0),
          decidedBy: viewerId,
        };
        yield* Ref.update(access, (rows) =>
          rows.map((row) => (row.id === current.id ? updated : row)),
        );
        return updated;
      });

    const setAgentStatus = (
      accessId: string,
      status: DeviceAgentAccess["status"],
    ) =>
      Effect.gen(function* () {
        const current = yield* findRow(
          yield* Ref.get(agent),
          accessId,
          "agentAccess",
        );
        const updated = { ...current, status, updatedAt: isoMinutesAgo(0) };
        yield* Ref.update(agent, (rows) =>
          rows.map((row) => (row.id === current.id ? updated : row)),
        );
        return updated;
      });

    const setComputerStatus = (
      accessId: string,
      status: DeviceComputerUse["status"],
    ) =>
      Effect.gen(function* () {
        const current = yield* findRow(
          yield* Ref.get(computer),
          accessId,
          "computerUse",
        );
        const updated = { ...current, status, updatedAt: isoMinutesAgo(0) };
        yield* Ref.update(computer, (rows) =>
          rows.map((row) => (row.id === current.id ? updated : row)),
        );
        return updated;
      });

    const read = (deviceId: string) =>
      Effect.gen(function* () {
        const row = (yield* Ref.get(devices)).find((r) => r.id === deviceId);
        const extra = (yield* Ref.get(details))[deviceId];
        if (row === undefined || extra === undefined) {
          return yield* Effect.fail(
            new DeviceNotFound({ deviceId: DeviceId.make(deviceId) }),
          );
        }
        return toDevice(row, extra);
      });

    const ensure = (deviceId: string) => read(deviceId).pipe(Effect.orDie);

    const patchDetails = (deviceId: string, patch: Partial<DeviceDetails>) =>
      Effect.gen(function* () {
        yield* read(deviceId);
        yield* Ref.update(details, (all) => {
          const current = all[deviceId];
          return current === undefined
            ? all
            : { ...all, [deviceId]: { ...current, ...patch } };
        });
        return yield* read(deviceId);
      });

    const patchRow = (
      deviceId: string,
      patch: { name?: string; sharedWithOrg?: boolean },
    ) =>
      Effect.gen(function* () {
        yield* read(deviceId);
        yield* Ref.update(devices, (rows) =>
          rows.map((row) => (row.id === deviceId ? { ...row, ...patch } : row)),
        );
        return yield* read(deviceId);
      });

    const pending = (userCode: string) =>
      Effect.gen(function* () {
        const code = (yield* Ref.get(codes))[normalizeCode(userCode)];
        if (code === undefined) {
          return yield* Effect.fail(new DeviceCodeNotFound());
        }
        return code;
      });

    const consume = (userCode: string) =>
      Ref.update(codes, (all) => {
        const { [normalizeCode(userCode)]: _, ...rest } = all;
        return rest;
      });

    return handlers
      .handle("list", () =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(devices);
          const extra = yield* Ref.get(details);
          return rows.flatMap((row) => {
            const more = extra[row.id];
            return more === undefined ? [] : [toDevice(row, more)];
          });
        }),
      )
      .handle("rename", ({ params, payload }) =>
        patchRow(params.deviceId, { name: payload.name }),
      )
      .handle("setDescription", ({ params, payload }) =>
        patchDetails(params.deviceId, { description: payload.description }),
      )
      .handle("setAccess", ({ params, payload }) =>
        patchRow(params.deviceId, {
          sharedWithOrg: payload.access === "shared",
        }),
      )
      .handle("setAgentAccess", ({ params, payload }) =>
        patchDetails(params.deviceId, { agentAccess: payload.agentAccess }),
      )
      .handle("setComputerUseAccess", ({ params, payload }) =>
        patchDetails(params.deviceId, {
          computerUseAccess: payload.computerUseAccess,
        }),
      )
      .handle("revoke", ({ params }) =>
        Effect.gen(function* () {
          const revokedAt = yield* DateTime.now;
          return yield* patchDetails(params.deviceId, { revokedAt });
        }),
      )
      .handle("codeLookup", ({ payload }) =>
        Effect.gen(function* () {
          const code = yield* pending(payload.userCode);
          const now = yield* DateTime.now;
          return new DeviceCodePreview({
            ...code,
            expiresAt: DateTime.add(now, { minutes: codeTtlMinutes }),
          });
        }),
      )
      .handle("codeApprove", ({ payload }) =>
        Effect.gen(function* () {
          const code = yield* pending(payload.userCode);
          yield* consume(payload.userCode);
          const id = newId("device");
          yield* Ref.update(devices, (rows) => [
            ...rows,
            {
              id,
              kind: "device",
              name: payload.name ?? code.hostname,
              os: code.os,
              arch: code.arch,
              cores: 0,
              memoryGb: 0,
              ownerId: viewerId,
              online: true,
              lastSeenAt: isoMinutesAgo(0),
              sharedWithOrg: false,
            },
          ]);
          yield* Ref.update(details, (all) => ({
            ...all,
            [id]: pairedDetails(code.hostname),
          }));
          return new DeviceCodeResolution({ status: "approved" });
        }),
      )
      .handle("codeDeny", ({ payload }) =>
        Effect.gen(function* () {
          yield* pending(payload.userCode);
          yield* consume(payload.userCode);
          return new DeviceCodeResolution({ status: "denied" });
        }),
      )
      .handle("codeStart", ({ payload }) =>
        Effect.succeed({
          userCode: "JKLM-NPQR",
          verificationUrl: "https://kiki.example.com/devices/approve",
          expiresAt: isoMinutesAgo(-codeTtlMinutes),
          hostname: fields(payload).hostname ?? "new-machine",
        }),
      )
      .handle("codePoll", ({ payload }) =>
        Effect.succeed({
          status: "pending",
          userCode: String(fields(payload).userCode ?? "JKLM-NPQR"),
          deviceId: null,
        }),
      )
      .handle("enroll", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const id = newId("device");
          const hostname = String(input.hostname ?? "new-machine");
          yield* Ref.update(devices, (rows) => [
            ...rows,
            {
              id,
              kind: "device",
              name: hostname,
              os: String(input.os ?? "linux"),
              arch: String(input.arch ?? "x86_64"),
              cores: 0,
              memoryGb: 0,
              ownerId: viewerId,
              online: true,
              lastSeenAt: isoMinutesAgo(0),
              sharedWithOrg: false,
            },
          ]);
          yield* Ref.update(details, (all) => ({
            ...all,
            [id]: pairedDetails(hostname),
          }));
          yield* ensure(id);
          return { deviceId: id, enrolled: true };
        }),
      )
      .handle("listAccess", ({ params }) =>
        Effect.gen(function* () {
          yield* ensure(params.deviceId);
          return (yield* Ref.get(access)).filter(
            (row) => row.deviceId === params.deviceId,
          );
        }),
      )
      .handle("grantAccess", ({ params }) =>
        setAccessStatus(params.accessId, "approved").pipe(
          Effect.map((row) => ({ ...row, ok: true })),
        ),
      )
      .handle("denyAccess", ({ params }) =>
        setAccessStatus(params.accessId, "denied").pipe(
          Effect.map((row) => ({ ...row, ok: true })),
        ),
      )
      .handle("revokeAccess", ({ params }) =>
        setAccessStatus(params.accessId, "revoked").pipe(
          Effect.map((row) => ({ ...row, ok: true })),
        ),
      )
      .handle("withdrawAccess", ({ params }) =>
        setAccessStatus(params.accessId, "withdrawn").pipe(
          Effect.map((row) => ({ ...row, ok: true })),
        ),
      )
      .handle("activeThreads", ({ params }) =>
        Effect.gen(function* () {
          yield* ensure(params.deviceId);
          const granted = (yield* Ref.get(agent)).filter(
            (row) =>
              row.deviceId === params.deviceId && row.status === "granted",
          );
          return granted.map((row) => ({
            threadId: row.threadId,
            agentId: row.agentId,
            updatedAt: row.updatedAt,
          }));
        }),
      )
      .handle("listAgentAccess", ({ params }) =>
        Effect.gen(function* () {
          yield* ensure(params.deviceId);
          return (yield* Ref.get(agent)).filter(
            (row) => row.deviceId === params.deviceId,
          );
        }),
      )
      .handle("grantAgentAccess", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const current = yield* findRow(
            yield* Ref.get(agent),
            params.accessId,
            "agentAccess",
          );
          const updated = {
            ...current,
            status: "granted" as const,
            threadId: String(input.threadId ?? current.threadId),
            updatedAt: isoMinutesAgo(0),
          };
          yield* Ref.update(agent, (rows) =>
            rows.map((row) => (row.id === current.id ? updated : row)),
          );
          return { ...updated, ok: true };
        }),
      )
      .handle("denyAgentAccess", ({ params }) =>
        setAgentStatus(params.accessId, "denied").pipe(
          Effect.map((row) => ({ ...row, ok: true })),
        ),
      )
      .handle("revokeAgentAccess", ({ params }) =>
        setAgentStatus(params.accessId, "revoked").pipe(
          Effect.map((row) => ({ ...row, ok: true })),
        ),
      )
      .handle("listThreadAgentAccess", ({ params }) =>
        Ref.get(agent).pipe(
          Effect.map((rows) =>
            rows.filter((row) => row.threadId === params.threadId),
          ),
        ),
      )
      .handle("findCheckouts", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* ensure(params.deviceId);
          const search = String(
            fields(payload).path ?? fields(payload).query ?? "",
          ).toLowerCase();
          return (yield* Ref.get(checkout)).filter(
            (row) =>
              row.deviceId === params.deviceId &&
              (search.length === 0 ||
                row.path.toLowerCase().includes(search) ||
                row.repo.toLowerCase().includes(search)),
          );
        }),
      )
      .handle("listProjectCheckouts", ({ params }) =>
        Ref.get(checkout).pipe(
          Effect.map((rows) =>
            rows.filter(
              (row) => row.projectId === params.projectId && row.available,
            ),
          ),
        ),
      )
      .handle("setProjectCheckout", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* ensure(params.deviceId);
          const input = fields(payload);
          const projectId = String(input.projectId ?? projects.web.id);
          const project =
            Object.values(projects).find((item) => item.id === projectId) ??
            projects.web;
          const existing = (yield* Ref.get(checkout)).find(
            (row) =>
              row.deviceId === params.deviceId && row.projectId === project.id,
          );
          const row: DeviceCheckout = existing
            ? { ...existing, available: true }
            : {
                id: newId("dco"),
                deviceId: params.deviceId,
                projectId: project.id,
                repo: project.repos[0],
                path: `/work/acme/${project.code.toLowerCase()}`,
                branch: "main",
                available: true,
              };
          yield* Ref.update(checkout, (rows) => [
            ...rows.filter((candidate) => candidate.id !== row.id),
            row,
          ]);
          return { ...row, ok: true };
        }),
      )
      .handle("clearProjectCheckout", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* ensure(params.deviceId);
          const projectId = String(
            fields(payload).projectId ?? projects.web.id,
          );
          const rows = yield* Ref.get(checkout);
          const existing = rows.find(
            (row) =>
              row.deviceId === params.deviceId && row.projectId === projectId,
          );
          if (existing === undefined) {
            return yield* Effect.die(
              new Error(`devices.checkouts: no checkout for ${projectId}`),
            );
          }
          const cleared = { ...existing, available: false };
          yield* Ref.set(
            checkout,
            rows.map((row) => (row.id === existing.id ? cleared : row)),
          );
          return { ...cleared, ok: true };
        }),
      )
      .handle("browseFolders", ({ params, query }) =>
        Effect.gen(function* () {
          yield* ensure(params.deviceId);
          const search = String(fields(query).path ?? "").toLowerCase();
          const linkedIds = (yield* Ref.get(linked))[params.deviceId] ?? [];
          return folders
            .filter(
              (row) =>
                search.length === 0 ||
                row.path.toLowerCase().includes(search) ||
                row.name.toLowerCase().includes(search),
            )
            .map((row) => ({
              ...row,
              linked: linkedIds.includes(row.id),
            }));
        }),
      )
      .handle("linkFolder", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* ensure(params.deviceId);
          const input = fields(payload);
          const folder = yield* findFolder(input);
          yield* Ref.update(linked, (all) => {
            const currentIds = all[params.deviceId] ?? [];
            return {
              ...all,
              [params.deviceId]: currentIds.includes(folder.id)
                ? currentIds
                : [...currentIds, folder.id],
            };
          });
          return { ...folder, linked: true, ok: true };
        }),
      )
      .handle("unlinkFolder", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* ensure(params.deviceId);
          const folder = yield* findFolder(fields(payload));
          yield* Ref.update(linked, (all) => ({
            ...all,
            [params.deviceId]: (all[params.deviceId] ?? []).filter(
              (id) => id !== folder.id,
            ),
          }));
          return { ...folder, linked: false, ok: true };
        }),
      )
      .handle("denyComputerUse", ({ params }) =>
        setComputerStatus(params.accessId, "denied").pipe(
          Effect.map((row) => ({ ...row, ok: true })),
        ),
      )
      .handle("grantComputerUse", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const current = yield* findRow(
            yield* Ref.get(computer),
            params.accessId,
            "computerUse",
          );
          const updated = {
            ...current,
            status: "granted" as const,
            requesterId: String(input.requesterId ?? current.requesterId),
            updatedAt: isoMinutesAgo(0),
          };
          yield* Ref.update(computer, (rows) =>
            rows.map((row) => (row.id === current.id ? updated : row)),
          );
          return { ...updated, ok: true };
        }),
      )
      .handle("revokeComputerUse", ({ params }) =>
        setComputerStatus(params.accessId, "revoked").pipe(
          Effect.map((row) => ({ ...row, ok: true })),
        ),
      )
      .handle("workspaceIndex", ({ params }) =>
        Effect.gen(function* () {
          yield* ensure(params.deviceId);
          return { ...workspaceIndex, deviceId: params.deviceId };
        }),
      )
      .handle("worktrees", ({ params, query }) =>
        Effect.gen(function* () {
          yield* ensure(params.deviceId);
          const repo = String(fields(query).repo ?? "");
          return worktrees.filter(
            (row) =>
              row.deviceId === params.deviceId &&
              (repo.length === 0 || row.repo === repo),
          );
        }),
      )
      .handle("pullList", ({ query }) =>
        Effect.gen(function* () {
          const state = String(fields(query).state ?? "");
          return (yield* Ref.get(localPullRef)).filter(
            (row) => state.length === 0 || row.state === state,
          );
        }),
      )
      .handle("pullDetail", ({ params, query }) =>
        Effect.gen(function* () {
          yield* ensure(params.deviceId);
          const pull = yield* findRow(
            yield* Ref.get(localPullRef),
            `localpull_sample_${params.number}`,
            "localPulls",
          );
          return {
            ...pull,
            deviceId: params.deviceId,
            body:
              (yield* Ref.get(localPullBody))[pull.id] ??
              "Local change waiting for review.",
            query: fields(query),
          };
        }),
      )
      .handle("pullDiff", ({ params }) =>
        Effect.gen(function* () {
          yield* ensure(params.deviceId);
          return localPullDiff;
        }),
      )
      .handle("pullRefresh", ({ params }) =>
        Effect.gen(function* () {
          yield* ensure(params.deviceId);
          const rows = yield* Ref.get(localPullRef);
          if (rows.length === 0) {
            return yield* Effect.die(
              new Error("devices.localPulls: nothing to refresh"),
            );
          }
          const refreshed = rows.map((row) => ({
            ...row,
            updatedAt: isoMinutesAgo(0),
          }));
          yield* Ref.set(localPullRef, refreshed);
          return refreshed;
        }),
      )
      .handle("pullAct", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* ensure(params.deviceId);
          const current = yield* findRow(
            yield* Ref.get(localPullRef),
            `localpull_sample_${params.number}`,
            "localPulls",
          );
          const action = String(fields(payload).action ?? "refresh");
          const state =
            action === "ready" || action === "merge"
              ? "ready"
              : action === "draft"
                ? "draft"
                : current.state;
          const updated = { ...current, state, updatedAt: isoMinutesAgo(0) };
          yield* Ref.update(localPullRef, (rows) =>
            rows.map((row) => (row.id === current.id ? updated : row)),
          );
          return { ...updated, ok: true };
        }),
      );
  }),
);
