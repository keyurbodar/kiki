import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import {
  devices,
  orgId,
  people,
  projects,
  threads,
} from "../fixtures/world.ts";
import {
  accessRequests,
  agentAccess,
  computerUse,
  deviceCodes,
  folders,
  localPulls,
} from "./fixtures.ts";

const firstAccess = accessRequests[0];
const firstAgent = agentAccess[0];
const firstComputer = computerUse[0];
const firstPull = localPulls[0];
const firstFolder = folders[0];
const thirdFolder = folders[2];
const firstCode = deviceCodes[0];
const secondCode = deviceCodes[1];

const key = `devices:${orgId}`;
const laptop = devices[0] ?? devices[0];
const buildBox = devices[1] ?? devices[0];
const deviceParams = { orgId, deviceId: buildBox.id };
const accessParams = { ...deviceParams, accessId: firstAccess.id };
const agentParams = { ...deviceParams, accessId: firstAgent.id };
const computerParams = {
  ...deviceParams,
  accessId: firstComputer.id,
};
const pullNumber = String(firstPull.number);
const pullParams = { ...deviceParams, number: pullNumber };

const listAtom = ApiClient.query("devices", "list", {
  params: { orgId },
  reactivityKeys: [key],
});
const accessAtom = ApiClient.query("devices", "listAccess", {
  params: deviceParams,
  reactivityKeys: [key],
});
const agentAtom = ApiClient.query("devices", "listAgentAccess", {
  params: deviceParams,
  reactivityKeys: [key],
});
const foldersAtom = ApiClient.query("devices", "browseFolders", {
  params: deviceParams,
  query: {},
  reactivityKeys: [key],
});
const checkoutsAtom = ApiClient.query("devices", "findCheckouts", {
  params: deviceParams,
  payload: {},
  reactivityKeys: [key],
});
const threadsAtom = ApiClient.query("devices", "activeThreads", {
  params: deviceParams,
  reactivityKeys: [key],
});
const projectCheckoutsAtom = ApiClient.query(
  "devices",
  "listProjectCheckouts",
  {
    params: { orgId, projectId: projects.api.id },
    reactivityKeys: [key],
  },
);
const threadAgentAtom = ApiClient.query("devices", "listThreadAgentAccess", {
  params: { orgId, threadId: threads.checkoutTest.id },
  reactivityKeys: [key],
});
const pullListAtom = ApiClient.query("devices", "pullList", {
  params: deviceParams,
  query: {},
  reactivityKeys: [key],
});

const rows = (value: unknown) =>
  value as ReadonlyArray<Record<string, unknown>>;
const record = (value: unknown) => value as Record<string, unknown>;

type Endpoint = Parameters<typeof ApiClient.mutation<"devices", never>>[1];

const mutate = (
  registry: ReturnType<typeof AtomRegistry.make>,
  endpoint: string,
  request: Record<string, unknown>,
) => {
  const atom = ApiClient.mutation("devices", endpoint as Endpoint);
  registry.set(
    atom as never,
    {
      ...request,
      reactivityKeys: [key],
    } as never,
  );
  return AtomRegistry.getResult(
    registry,
    atom as never,
    {
      suspendOnWaiting: true,
    } as never,
  ) as Effect.Effect<unknown, never>;
};

const readAll = (registry: ReturnType<typeof AtomRegistry.make>) =>
  Effect.gen(function* () {
    const codeStart = yield* mutate(registry, "codeStart", { payload: {} });
    const codeDeny = yield* mutate(registry, "codeDeny", {
      payload: { code: record(codeStart).code },
    });
    const codeLookup = yield* mutate(registry, "codeLookup", {
      payload: { code: record(codeStart).code },
    });
    const codePoll = yield* mutate(registry, "codePoll", {
      payload: { code: secondCode.code },
    });
    const enroll = yield* mutate(registry, "enroll", {
      payload: { code: secondCode.code },
    });
    assert.isString(record(codeStart).code);
    assert.equal(record(codeDeny).status, "denied");
    assert.equal(record(codeLookup).status, "denied");
    assert.isTrue(record(codePoll).approved === true);
    assert.equal(record(enroll).id, buildBox.id);

    const codeApprove = yield* mutate(registry, "codeApprove", {
      params: { orgId },
      payload: { code: firstCode.code },
    });
    assert.equal(record(codeApprove).status, "approved");

    const rename = yield* mutate(registry, "rename", {
      params: { orgId, deviceId: laptop.id },
      payload: { name: "alex-laptop-renamed" },
    });
    assert.equal(record(rename).name, "alex-laptop-renamed");
    const description = yield* mutate(registry, "setDescription", {
      params: { orgId, deviceId: laptop.id },
      payload: { description: "Primary development machine" },
    });
    assert.equal(
      record(description).description,
      "Primary development machine",
    );

    const pullList = yield* AtomRegistry.getResult(registry, pullListAtom);
    assert.isAbove(rows(pullList).length, 0);
    const pullDetail = yield* mutate(registry, "pullDetail", {
      params: pullParams,
      query: {},
    });
    assert.equal(record(pullDetail).number, firstPull.number);
    const pullDiff = yield* mutate(registry, "pullDiff", {
      query: {},
      params: pullParams,
    });
    assert.isAbove(rows(record(pullDiff).files).length, 0);
    const pullAct = yield* mutate(registry, "pullAct", {
      params: pullParams,
      query: {},
      payload: { action: "ready", body: "Ready for review" },
    });
    assert.equal(record(pullAct).action, "ready");
    const pullRefresh = yield* mutate(registry, "pullRefresh", {
      params: deviceParams,
      query: {},
    });
    assert.isNumber(record(pullRefresh).refreshed);

    const workspace = yield* mutate(registry, "workspaceIndex", {
      params: deviceParams,
      query: {},
    });
    assert.isArray(rows(record(workspace).projects));
    const worktrees = yield* mutate(registry, "worktrees", {
      params: deviceParams,
      query: {},
    });
    assert.isAbove(rows(worktrees).length, 0);

    const revokeDevice = yield* mutate(registry, "revoke", {
      params: { orgId, deviceId: laptop.id },
    });
    assert.equal(record(revokeDevice).ok, true);
  });

describe("devices mock", () => {
  it.effect("reads every devices GET endpoint", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();

      const list = yield* AtomRegistry.getResult(registry, listAtom);
      assert.deepStrictEqual(
        rows(list).map((row) => row.id),
        devices.map((row) => row.id),
      );
      assert.isString(rows(list)[0]?.description);

      const access = yield* AtomRegistry.getResult(registry, accessAtom);
      assert.isAbove(rows(access).length, 0);
      assert.equal(rows(access)[0]?.deviceId, buildBox.id);

      const agent = yield* AtomRegistry.getResult(registry, agentAtom);
      assert.isAbove(rows(agent).length, 0);

      const threadsResult = yield* AtomRegistry.getResult(
        registry,
        threadsAtom,
      );
      assert.isAbove(rows(threadsResult).length, 0);

      const foldersResult = yield* AtomRegistry.getResult(
        registry,
        foldersAtom,
      );
      assert.isAbove(rows(foldersResult).length, 0);
      assert.equal(rows(foldersResult)[0]?.id, firstFolder.id);

      const checkoutResult = yield* AtomRegistry.getResult(
        registry,
        checkoutsAtom,
      );
      assert.isAbove(rows(checkoutResult).length, 0);
      assert.equal(rows(checkoutResult)[0]?.id, "dco_sample_build_api");

      const projectCheckouts = yield* AtomRegistry.getResult(
        registry,
        projectCheckoutsAtom,
      );
      assert.isAbove(rows(projectCheckouts).length, 0);
      assert.equal(rows(projectCheckouts)[0]?.projectId, projects.api.id);

      const threadAgent = yield* AtomRegistry.getResult(
        registry,
        threadAgentAtom,
      );
      assert.isAbove(rows(threadAgent).length, 0);
      assert.equal(rows(threadAgent)[0]?.threadId, threads.checkoutTest.id);
    }),
  );

  it.effect("calls every devices mutation endpoint", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      yield* readAll(registry);

      const denyAccess = yield* mutate(registry, "denyAccess", {
        params: accessParams,
      });
      assert.equal(record(denyAccess).status, "denied");
      const grantAccess = yield* mutate(registry, "grantAccess", {
        params: accessParams,
      });
      assert.equal(record(grantAccess).status, "granted");
      const revokeAccess = yield* mutate(registry, "revokeAccess", {
        params: accessParams,
      });
      assert.equal(record(revokeAccess).status, "revoked");
      const withdrawAccess = yield* mutate(registry, "withdrawAccess", {
        params: accessParams,
      });
      assert.equal(record(withdrawAccess).status, "withdrawn");
      const setAccess = yield* mutate(registry, "setAccess", {
        params: deviceParams,
        payload: { requesterId: people.priya.id, reason: "Check the release" },
      });
      assert.equal(record(setAccess).status, "pending");

      const setAgentAccess = yield* mutate(registry, "setAgentAccess", {
        params: deviceParams,
        payload: { threadId: threads.darkMode.id },
      });
      assert.isString(record(setAgentAccess).id);
      const denyAgentAccess = yield* mutate(registry, "denyAgentAccess", {
        params: agentParams,
      });
      assert.equal(record(denyAgentAccess).status, "denied");
      const grantAgentAccess = yield* mutate(registry, "grantAgentAccess", {
        params: agentParams,
        payload: { threadId: threads.checkoutTest.id },
      });
      assert.equal(record(grantAgentAccess).status, "granted");
      const revokeAgentAccess = yield* mutate(registry, "revokeAgentAccess", {
        params: agentParams,
      });
      assert.equal(record(revokeAgentAccess).status, "revoked");

      const findCheckouts = yield* mutate(registry, "findCheckouts", {
        params: deviceParams,
        payload: { path: "/work" },
      });
      assert.isAbove(rows(findCheckouts).length, 0);
      const projectCheckout = yield* mutate(registry, "setProjectCheckout", {
        params: deviceParams,
        payload: { projectId: projects.web.id },
      });
      assert.equal(record(projectCheckout).projectId, projects.web.id);
      const clearCheckout = yield* mutate(registry, "clearProjectCheckout", {
        params: deviceParams,
        payload: { projectId: projects.web.id },
      });
      assert.equal(record(clearCheckout).ok, true);

      const linkFolder = yield* mutate(registry, "linkFolder", {
        params: deviceParams,
        payload: { folderId: firstFolder.id },
      });
      assert.equal(record(linkFolder).linked, true);
      const unlinkFolder = yield* mutate(registry, "unlinkFolder", {
        params: deviceParams,
        payload: { folderId: firstFolder.id },
      });
      assert.equal(record(unlinkFolder).linked, false);

      const computerAccess = yield* mutate(registry, "setComputerUseAccess", {
        params: deviceParams,
        payload: { requesterId: people.sam.id },
      });
      assert.isString(record(computerAccess).id);
      const denyComputerUse = yield* mutate(registry, "denyComputerUse", {
        params: computerParams,
      });
      assert.equal(record(denyComputerUse).status, "denied");
      const grantComputerUse = yield* mutate(registry, "grantComputerUse", {
        params: computerParams,
        payload: { requesterId: people.sam.id },
      });
      assert.equal(record(grantComputerUse).status, "granted");
      const revokeComputerUse = yield* mutate(registry, "revokeComputerUse", {
        params: computerParams,
      });
      assert.equal(record(revokeComputerUse).status, "revoked");
    }),
  );

  it.effect("refetches device queries after mutations", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(listAtom);
      registry.mount(accessAtom);
      registry.mount(agentAtom);
      registry.mount(foldersAtom);
      registry.mount(checkoutsAtom);
      const before = rows(
        yield* AtomRegistry.getResult(registry, listAtom, {
          suspendOnWaiting: true,
        }),
      );

      const rename = ApiClient.mutation("devices", "rename");
      registry.set(rename, {
        params: { orgId, deviceId: laptop.id },
        payload: { name: "alex-laptop-renamed" },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, rename);
      const afterRename = rows(
        yield* AtomRegistry.getResult(registry, listAtom, {
          suspendOnWaiting: true,
        }),
      );
      assert.equal(afterRename.length, before.length);
      assert.isTrue(
        afterRename.some((row) => row.name === "alex-laptop-renamed"),
      );

      const setAccess = ApiClient.mutation("devices", "setAccess");
      registry.set(setAccess, {
        params: deviceParams,
        payload: { requesterId: people.priya.id },
        reactivityKeys: [key],
      });
      const created = record(
        yield* AtomRegistry.getResult(registry, setAccess),
      );
      const afterAccess = rows(
        yield* AtomRegistry.getResult(registry, accessAtom, {
          suspendOnWaiting: true,
        }),
      );
      assert.isTrue(afterAccess.some((row) => row.id === created.id));

      const setAgentAccess = ApiClient.mutation("devices", "setAgentAccess");
      registry.set(setAgentAccess, {
        params: deviceParams,
        payload: { threadId: threads.darkMode.id },
        reactivityKeys: [key],
      });
      const createdAgent = record(
        yield* AtomRegistry.getResult(registry, setAgentAccess),
      );
      const afterAgent = rows(
        yield* AtomRegistry.getResult(registry, agentAtom, {
          suspendOnWaiting: true,
        }),
      );
      assert.isTrue(afterAgent.some((row) => row.id === createdAgent.id));

      const linkFolder = ApiClient.mutation("devices", "linkFolder");
      registry.set(linkFolder, {
        params: deviceParams,
        payload: { folderId: thirdFolder.id },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, linkFolder);
      const afterFolders = rows(
        yield* AtomRegistry.getResult(registry, foldersAtom, {
          suspendOnWaiting: true,
        }),
      );
      assert.isTrue(
        afterFolders.some(
          (row) => row.id === thirdFolder.id && row.linked === true,
        ),
      );

      const setProjectCheckout = ApiClient.mutation(
        "devices",
        "setProjectCheckout",
      );
      registry.set(setProjectCheckout, {
        params: deviceParams,
        payload: { projectId: projects.docs.id },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, setProjectCheckout);
      const afterCheckouts = rows(
        yield* AtomRegistry.getResult(registry, checkoutsAtom, {
          suspendOnWaiting: true,
        }),
      );
      assert.isTrue(
        afterCheckouts.some((row) => row.projectId === projects.docs.id),
      );

      const revoke = ApiClient.mutation("devices", "revoke");
      registry.set(revoke, {
        params: { orgId, deviceId: laptop.id },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, revoke);
      const afterRevoke = rows(
        yield* AtomRegistry.getResult(registry, listAtom, {
          suspendOnWaiting: true,
        }),
      );
      assert.equal(afterRevoke.length, before.length - 1);
      assert.isFalse(afterRevoke.some((row) => row.id === laptop.id));
    }),
  );
});
