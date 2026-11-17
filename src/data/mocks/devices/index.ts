import { Effect, Ref } from "effect";
import { fields, MockDb, missing, newId } from "../db/MockDb.ts";
import {
  isoMinutesAgo,
  members,
  orgId,
  people,
  projects,
  threads,
} from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  type AccessStatus,
  accessRequests,
  agentAccess,
  checkouts,
  computerUse,
  type DeviceAccessRequest,
  type DeviceAgentAccess,
  type DeviceCheckout,
  type DeviceCode,
  type DeviceComputerUse,
  descriptions,
  deviceCodes,
  folders,
  linkedFolderIds,
  localPullDiff,
  localPulls,
  workspaceIndex,
  worktrees,
} from "./fixtures.ts";

type LocalPull = {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly state: string;
  readonly repo: string;
  readonly branch: string;
  readonly authorId: string;
  readonly threadId: string;
  readonly updatedAt: string;
};

const text = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;

const findRow = <T extends { readonly id: string }>(
  rows: ReadonlyArray<T>,
  id: string,
  label: string,
) => {
  const row = rows.find((candidate) => candidate.id === id);
  return row
    ? Effect.succeed(row)
    : Effect.die(new Error(`devices.${label}: no row ${id}`));
};

export const DevicesMock = mockGroup("devices", (handlers) =>
  Effect.gen(function* () {
    const { devices: deviceTable } = yield* MockDb;

    const codeRef = yield* Ref.make<ReadonlyArray<DeviceCode>>([
      ...deviceCodes,
    ]);
    const accessRef = yield* Ref.make<ReadonlyArray<DeviceAccessRequest>>([
      ...accessRequests,
    ]);
    const agentRef = yield* Ref.make<ReadonlyArray<DeviceAgentAccess>>([
      ...agentAccess,
    ]);
    const computerRef = yield* Ref.make<ReadonlyArray<DeviceComputerUse>>([
      ...computerUse,
    ]);
    const checkoutRef = yield* Ref.make<ReadonlyArray<DeviceCheckout>>([
      ...checkouts,
    ]);
    const descriptionRef = yield* Ref.make<Record<string, string>>({
      ...descriptions,
    });
    const linkedRef = yield* Ref.make<Record<string, ReadonlyArray<string>>>({
      ...linkedFolderIds,
    });
    const pullRef = yield* Ref.make<ReadonlyArray<LocalPull>>([...localPulls]);
    const pullBodyRef = yield* Ref.make<Record<string, string>>({});

    const defaultCode = deviceCodes[0]?.code ?? "ABCD-1234";
    const enrolledCode = deviceCodes[1]?.code ?? "EFGH-5678";

    const device = (deviceId: string) =>
      Effect.flatMap(Ref.get(deviceTable), (rows) => {
        const row = rows.find((candidate) => candidate.id === deviceId);
        return row ? Effect.succeed(row) : missing("devices", deviceId);
      });

    const detail = (deviceId: string) =>
      Effect.gen(function* () {
        const row = yield* device(deviceId);
        const [
          descriptionsById,
          linkedById,
          accessRows,
          agentRows,
          computerRows,
          checkoutsById,
        ] = yield* Effect.all([
          Ref.get(descriptionRef),
          Ref.get(linkedRef),
          Ref.get(accessRef),
          Ref.get(agentRef),
          Ref.get(computerRef),
          Ref.get(checkoutRef),
        ]);
        const owner = members.find((member) => member.id === row.ownerId);
        return {
          ...row,
          description: descriptionsById[row.id] ?? "",
          ownerName: owner
            ? `${owner.firstName} ${owner.lastName}`
            : "Acme member",
          organizationId: orgId,
          accessRequestCount: accessRows.filter(
            (item) => item.deviceId === row.id && item.status === "pending",
          ).length,
          agentAccessCount: agentRows.filter(
            (item) => item.deviceId === row.id && item.status === "granted",
          ).length,
          computerUseCount: computerRows.filter(
            (item) => item.deviceId === row.id && item.status !== "revoked",
          ).length,
          projectCheckoutIds: checkoutsById
            .filter((item) => item.deviceId === row.id && item.available)
            .map((item) => item.projectId),
          linkedFolderIds: linkedById[row.id] ?? [],
        };
      });

    const codeByValue = (code: string) =>
      Effect.flatMap(Ref.get(codeRef), (rows) => {
        const row = rows.find((candidate) => candidate.code === code);
        return row
          ? Effect.succeed(row)
          : Effect.die(new Error(`devices.codes: no row ${code}`));
      });

    const setCodeStatus = (code: string, status: DeviceCode["status"]) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(codeRef);
        const current = yield* codeByValue(code);
        const updated = { ...current, status };
        yield* Ref.set(
          codeRef,
          rows.map((row) => (row.code === code ? updated : row)),
        );
        return updated;
      });

    const setAccessStatus = (accessId: string, status: AccessStatus) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(accessRef);
        const current = yield* findRow(rows, accessId, "access");
        const updated = {
          ...current,
          status,
          decidedAt: isoMinutesAgo(0),
          decidedBy: people.alex.id,
        };
        yield* Ref.set(
          accessRef,
          rows.map((row) => (row.id === accessId ? updated : row)),
        );
        return updated;
      });

    const setAgentStatus = (
      accessId: string,
      status: DeviceAgentAccess["status"],
    ) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(agentRef);
        const current = yield* findRow(rows, accessId, "agentAccess");
        const updated = {
          ...current,
          status,
          updatedAt: isoMinutesAgo(0),
        };
        yield* Ref.set(
          agentRef,
          rows.map((row) => (row.id === accessId ? updated : row)),
        );
        return updated;
      });

    const setComputerStatus = (
      accessId: string,
      status: DeviceComputerUse["status"],
    ) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(computerRef);
        const current = yield* findRow(rows, accessId, "computerUse");
        const updated = {
          ...current,
          status,
          updatedAt: isoMinutesAgo(0),
        };
        yield* Ref.set(
          computerRef,
          rows.map((row) => (row.id === accessId ? updated : row)),
        );
        return updated;
      });

    return handlers
      .handle("codeStart", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const row: DeviceCode = {
            code: text(input.code) ?? "IJKL-9012",
            status: "pending",
            deviceId:
              text(input.deviceId) ??
              (yield* Ref.get(deviceTable))[0]?.id ??
              "machine_sample_laptop",
            createdAt: isoMinutesAgo(0),
          };
          yield* Ref.update(codeRef, (rows) => [
            ...rows.filter((candidate) => candidate.code !== row.code),
            row,
          ]);
          return {
            code: row.code,
            status: row.status,
            expiresAt: isoMinutesAgo(10),
            verificationUrl: `https://example.com/verify/${row.code}`,
          };
        }),
      )
      .handle("codeDeny", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const code = text(input.code) ?? defaultCode;
          const denied = yield* setCodeStatus(code, "denied");
          return { ok: true, code: denied.code, status: denied.status };
        }),
      )
      .handle("codeLookup", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const row = yield* codeByValue(text(input.code) ?? defaultCode);
          const owner = members.find((member) => member.id === row.deviceId);
          return {
            code: row.code,
            status: row.status,
            deviceName:
              (yield* Ref.get(deviceTable)).find(
                (item) => item.id === row.deviceId,
              )?.name ?? "Acme device",
            requestedBy: owner
              ? `${owner.firstName} ${owner.lastName}`
              : "Alex Morgan",
            createdAt: isoMinutesAgo(2),
          };
        }),
      )
      .handle("codePoll", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const row = yield* codeByValue(text(input.code) ?? defaultCode);
          return {
            code: row.code,
            status: row.status,
            approved: row.status === "approved",
            denied: row.status === "denied",
          };
        }),
      )
      .handle("enroll", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const code = text(input.code) ?? enrolledCode;
          const row = yield* codeByValue(code);
          const enrolled = yield* detail(row.deviceId);
          return {
            ...enrolled,
            code: row.code,
            enrolledAt: isoMinutesAgo(0),
          };
        }),
      )
      .handle("codeApprove", ({ params: _params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const row = yield* setCodeStatus(
            text(input.code) ?? defaultCode,
            "approved",
          );
          return { ok: true, code: row.code, status: row.status };
        }),
      )
      .handle("list", () =>
        Effect.flatMap(Ref.get(deviceTable), (rows) =>
          Effect.forEach(rows, (row) => detail(row.id)),
        ),
      )
      .handle("rename", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const current = yield* device(params.deviceId);
          const updated = {
            ...current,
            name: text(input.name) ?? current.name,
          };
          yield* Ref.update(deviceTable, (rows) =>
            rows.map((row) => (row.id === current.id ? updated : row)),
          );
          return yield* detail(updated.id);
        }),
      )
      .handle("setDescription", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const current = yield* device(params.deviceId);
          const description =
            text(input.description) ?? text(input.value) ?? "";
          yield* Ref.update(descriptionRef, (rows) => ({
            ...rows,
            [current.id]: description,
          }));
          return yield* detail(current.id);
        }),
      )
      .handle("revoke", ({ params }) =>
        Effect.gen(function* () {
          const current = yield* device(params.deviceId);
          yield* Ref.update(deviceTable, (rows) =>
            rows.filter((row) => row.id !== current.id),
          );
          return { ok: true, deviceId: current.id };
        }),
      )
      .handle("setAccess", ({ params, payload }) =>
        Effect.gen(function* () {
          const current = yield* device(params.deviceId);
          const input = fields(payload);
          const row: DeviceAccessRequest = {
            id: newId("dac"),
            deviceId: current.id,
            requesterId: text(input.requesterId) ?? people.priya.id,
            reason: text(input.reason) ?? "Review work on this device",
            scope: text(input.scope) ?? "read",
            status: "pending",
            createdAt: isoMinutesAgo(0),
            decidedAt: null,
            decidedBy: null,
          };
          yield* Ref.update(accessRef, (rows) => [...rows, row]);
          return row;
        }),
      )
      .handle("listAccess", ({ params }) =>
        Effect.gen(function* () {
          const current = yield* device(params.deviceId);
          return (yield* Ref.get(accessRef)).filter(
            (row) => row.deviceId === current.id,
          );
        }),
      )
      .handle("denyAccess", ({ params }) =>
        Effect.map(setAccessStatus(params.accessId, "denied"), (row) => ({
          ...row,
          ok: true,
        })),
      )
      .handle("grantAccess", ({ params }) =>
        Effect.map(setAccessStatus(params.accessId, "granted"), (row) => ({
          ...row,
          ok: true,
        })),
      )
      .handle("revokeAccess", ({ params }) =>
        Effect.map(setAccessStatus(params.accessId, "revoked"), (row) => ({
          ...row,
          ok: true,
        })),
      )
      .handle("withdrawAccess", ({ params }) =>
        Effect.map(setAccessStatus(params.accessId, "withdrawn"), (row) => ({
          ...row,
          ok: true,
        })),
      )
      .handle("activeThreads", ({ params }) =>
        Effect.gen(function* () {
          const current = yield* device(params.deviceId);
          const granted = (yield* Ref.get(agentRef)).filter(
            (row) => row.deviceId === current.id && row.status === "granted",
          );
          return [threads.checkoutTest, threads.darkMode, threads.bundler]
            .filter((thread) =>
              granted.some((row) => row.threadId === thread.id),
            )
            .map((thread) => ({
              thread,
            }));
        }),
      )
      .handle("setAgentAccess", ({ params, payload }) =>
        Effect.gen(function* () {
          const current = yield* device(params.deviceId);
          const input = fields(payload);
          const row: DeviceAgentAccess = {
            id: newId("dag"),
            deviceId: current.id,
            threadId: text(input.threadId) ?? threads.checkoutTest.id,
            agentId: text(input.agentId) ?? people.alex.id,
            grantedBy: people.alex.id,
            status: "granted",
            updatedAt: isoMinutesAgo(0),
          };
          yield* Ref.update(agentRef, (rows) => [...rows, row]);
          return row;
        }),
      )
      .handle("listAgentAccess", ({ params }) =>
        Effect.gen(function* () {
          const current = yield* device(params.deviceId);
          return (yield* Ref.get(agentRef)).filter(
            (row) => row.deviceId === current.id,
          );
        }),
      )
      .handle("denyAgentAccess", ({ params }) =>
        Effect.map(setAgentStatus(params.accessId, "denied"), (row) => ({
          ...row,
          ok: true,
        })),
      )
      .handle("grantAgentAccess", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const current = yield* findRow(
            yield* Ref.get(agentRef),
            params.accessId,
            "agentAccess",
          );
          const updated = {
            ...current,
            status: "granted" as const,
            threadId: text(input.threadId) ?? current.threadId,
            updatedAt: isoMinutesAgo(0),
          };
          yield* Ref.update(agentRef, (rows) =>
            rows.map((row) => (row.id === current.id ? updated : row)),
          );
          return { ...updated, ok: true };
        }),
      )
      .handle("revokeAgentAccess", ({ params }) =>
        Effect.map(setAgentStatus(params.accessId, "revoked"), (row) => ({
          ...row,
          ok: true,
        })),
      )
      .handle("listThreadAgentAccess", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(agentRef);
          return rows.filter((row) => row.threadId === params.threadId);
        }),
      )
      .handle("findCheckouts", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const current = yield* device(params.deviceId);
          const search = text(input.path) ?? text(input.query) ?? "";
          return (yield* Ref.get(checkoutRef)).filter(
            (row) =>
              row.deviceId === current.id &&
              (search.length === 0 ||
                row.path.toLowerCase().includes(search.toLowerCase()) ||
                row.repo.toLowerCase().includes(search.toLowerCase())),
          );
        }),
      )
      .handle("setProjectCheckout", ({ params, payload }) =>
        Effect.gen(function* () {
          const current = yield* device(params.deviceId);
          const input = fields(payload);
          const projectId = text(input.projectId) ?? projects.web.id;
          const project =
            Object.values(projects).find((item) => item.id === projectId) ??
            projects.web;
          const existing = (yield* Ref.get(checkoutRef)).find(
            (row) =>
              row.deviceId === current.id && row.projectId === project.id,
          );
          const row: DeviceCheckout = existing
            ? { ...existing, available: true }
            : {
                id: newId("dco"),
                deviceId: current.id,
                projectId: project.id,
                repo: project.repos[0],
                path: `/work/acme/${project.code.toLowerCase()}`,
                branch: "main",
                available: true,
              };
          yield* Ref.update(checkoutRef, (rows) => [
            ...rows.filter((candidate) => candidate.id !== row.id),
            row,
          ]);
          return row;
        }),
      )
      .handle("clearProjectCheckout", ({ params, payload }) =>
        Effect.gen(function* () {
          const current = yield* device(params.deviceId);
          const input = fields(payload);
          const projectId = text(input.projectId) ?? projects.web.id;
          const rows = yield* Ref.get(checkoutRef);
          const existing = rows.find(
            (row) => row.deviceId === current.id && row.projectId === projectId,
          );
          if (!existing) {
            return yield* Effect.die(
              new Error(`devices.checkouts: no checkout for ${projectId}`),
            );
          }
          const cleared = { ...existing, available: false };
          yield* Ref.set(
            checkoutRef,
            rows.map((row) => (row.id === existing.id ? cleared : row)),
          );
          return { ...cleared, ok: true };
        }),
      )
      .handle("listProjectCheckouts", ({ params }) =>
        Effect.gen(function* () {
          return (yield* Ref.get(checkoutRef)).filter(
            (row) => row.projectId === params.projectId && row.available,
          );
        }),
      )
      .handle("browseFolders", ({ params, query }) =>
        Effect.gen(function* () {
          const current = yield* device(params.deviceId);
          const search = text(fields(query).path) ?? "";
          const linked = (yield* Ref.get(linkedRef))[current.id] ?? [];
          return folders
            .filter((row) =>
              search.length === 0
                ? true
                : row.path.toLowerCase().includes(search.toLowerCase()),
            )
            .map((row) => ({
              ...row,
              linked: linked.includes(row.id),
            }));
        }),
      )
      .handle("linkFolder", ({ params, payload }) =>
        Effect.gen(function* () {
          const current = yield* device(params.deviceId);
          const input = fields(payload);
          const folderId =
            text(input.folderId) ??
            (yield* findRow(folders, text(input.path) ?? "", "folders")).id;
          const folder = yield* findRow(folders, folderId, "folders");
          yield* Ref.update(linkedRef, (rows) => {
            const currentIds = rows[current.id] ?? [];
            return {
              ...rows,
              [current.id]: currentIds.includes(folder.id)
                ? currentIds
                : [...currentIds, folder.id],
            };
          });
          return { ...folder, linked: true, ok: true };
        }),
      )
      .handle("unlinkFolder", ({ params, payload }) =>
        Effect.gen(function* () {
          const current = yield* device(params.deviceId);
          const input = fields(payload);
          const folderId =
            text(input.folderId) ??
            (yield* findRow(folders, text(input.path) ?? "", "folders")).id;
          const folder = yield* findRow(folders, folderId, "folders");
          yield* Ref.update(linkedRef, (rows) => ({
            ...rows,
            [current.id]: (rows[current.id] ?? []).filter(
              (id) => id !== folder.id,
            ),
          }));
          return { ...folder, linked: false, ok: true };
        }),
      )
      .handle("setComputerUseAccess", ({ params, payload }) =>
        Effect.gen(function* () {
          const current = yield* device(params.deviceId);
          const input = fields(payload);
          const row: DeviceComputerUse = {
            id: newId("dcu"),
            deviceId: current.id,
            requesterId: text(input.requesterId) ?? people.alex.id,
            status: "pending",
            updatedAt: isoMinutesAgo(0),
          };
          yield* Ref.update(computerRef, (rows) => [...rows, row]);
          return row;
        }),
      )
      .handle("denyComputerUse", ({ params }) =>
        Effect.map(setComputerStatus(params.accessId, "denied"), (row) => ({
          ...row,
          ok: true,
        })),
      )
      .handle("grantComputerUse", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const current = yield* findRow(
            yield* Ref.get(computerRef),
            params.accessId,
            "computerUse",
          );
          const updated = {
            ...current,
            status: "granted" as const,
            requesterId: text(input.requesterId) ?? current.requesterId,
            updatedAt: isoMinutesAgo(0),
          };
          yield* Ref.update(computerRef, (rows) =>
            rows.map((row) => (row.id === current.id ? updated : row)),
          );
          return { ...updated, ok: true };
        }),
      )
      .handle("revokeComputerUse", ({ params }) =>
        Effect.map(setComputerStatus(params.accessId, "revoked"), (row) => ({
          ...row,
          ok: true,
        })),
      )
      .handle("workspaceIndex", ({ params }) =>
        Effect.gen(function* () {
          const current = yield* device(params.deviceId);
          return {
            ...workspaceIndex,
            deviceId: current.id,
          };
        }),
      )
      .handle("worktrees", ({ params, query }) =>
        Effect.gen(function* () {
          const current = yield* device(params.deviceId);
          const repo = text(fields(query).repo);
          return worktrees.filter(
            (row) =>
              row.deviceId === current.id && (!repo || row.repo === repo),
          );
        }),
      )
      .handle("pullList", ({ query }) =>
        Effect.gen(function* () {
          const state = text(fields(query).state);
          return (yield* Ref.get(pullRef)).filter(
            (row) => !state || row.state === state,
          );
        }),
      )
      .handle("pullDetail", ({ params, query }) =>
        Effect.gen(function* () {
          const current = yield* device(params.deviceId);
          const pull = yield* findRow(
            yield* Ref.get(pullRef),
            `localpull_sample_${params.number}`,
            "pulls",
          );
          return {
            ...pull,
            deviceId: current.id,
            body:
              (yield* Ref.get(pullBodyRef))[pull.id] ??
              "Local change waiting for review.",
            query: fields(query),
          };
        }),
      )
      .handle("pullAct", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const id = `localpull_sample_${params.number}`;
          const current = yield* findRow(yield* Ref.get(pullRef), id, "pulls");
          const action = text(input.action) ?? "refresh";
          const state =
            action === "ready" || action === "merge"
              ? "ready"
              : action === "draft"
                ? "draft"
                : current.state;
          const updated = { ...current, state, updatedAt: isoMinutesAgo(0) };
          yield* Ref.update(pullRef, (rows) =>
            rows.map((row) => (row.id === id ? updated : row)),
          );
          const body = text(input.body);
          if (body) {
            yield* Ref.update(pullBodyRef, (rows) => ({
              ...rows,
              [id]: body,
            }));
          }
          return { ...updated, action, ok: true };
        }),
      )
      .handle("pullDiff", ({ params }) =>
        Effect.gen(function* () {
          const current = yield* device(params.deviceId);
          const pull = yield* findRow(
            yield* Ref.get(pullRef),
            `localpull_sample_${params.number}`,
            "pulls",
          );
          return { ...localPullDiff, deviceId: current.id, pullId: pull.id };
        }),
      )
      .handle("pullRefresh", ({ params }) =>
        Effect.gen(function* () {
          const current = yield* device(params.deviceId);
          yield* Ref.update(pullRef, (rows) =>
            rows.map((row) => ({ ...row, updatedAt: isoMinutesAgo(0) })),
          );
          return {
            deviceId: current.id,
            refreshed: (yield* Ref.get(pullRef)).length,
            refreshedAt: isoMinutesAgo(0),
          };
        }),
      );
  }),
);
