/// <reference types="node" />
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const API = "https://api.instabox.sh";

export class InstaboxError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
  }
}

export function instaboxKey(): string | undefined {
  const fromEnv = process.env.INSTABOX_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  const file = join(homedir(), ".config/instabox/key");
  return existsSync(file)
    ? readFileSync(file, "utf8").trim() || undefined
    : undefined;
}

type Operation = {
  id: string;
  state: "queued" | "running" | "succeeded" | "failed";
  machineId?: string;
  error?: {
    code?: string;
    message?: string;
    retryAfterSeconds?: number;
  } | null;
};

export type ExecResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
  timedOut?: boolean;
};

export class Instabox {
  constructor(private readonly key: string) {}

  private async call(
    method: string,
    path: string,
    init: {
      body?: unknown;
      raw?: Uint8Array;
      headers?: Record<string, string>;
      idempotent?: boolean;
    } = {},
  ): Promise<Response> {
    const headers: Record<string, string> = {
      "X-API-Key": this.key,
      ...init.headers,
    };
    if (init.idempotent) headers["Idempotency-Key"] = randomUUID();
    let body: BodyInit | undefined;
    if (init.raw) {
      headers["Content-Type"] = "application/octet-stream";
      body = new Blob([new Uint8Array(init.raw)]);
    } else if (init.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(init.body);
    }
    const res = await fetch(API + path, { method, headers, body });
    if (res.ok) return res;
    const text = await res.text();
    let err: { code?: string; message?: string; retryAfterSeconds?: number } =
      {};
    try {
      err = (JSON.parse(text) as { error?: typeof err }).error ?? {};
    } catch {}
    throw new InstaboxError(
      `instabox ${method} ${path.split("?")[0]}: ${res.status} ${err.code ?? ""} ${err.message ?? text.slice(0, 200)}`.trim(),
      res.status,
      err.code,
      err.retryAfterSeconds,
    );
  }

  private async json<T>(
    method: string,
    path: string,
    init?: Parameters<Instabox["call"]>[2],
  ): Promise<T> {
    return (await (await this.call(method, path, init)).json()) as T;
  }

  async waitOperation(op: Operation, timeoutMs = 300_000): Promise<Operation> {
    const deadline = Date.now() + timeoutMs;
    let current = op;
    while (current.state === "queued" || current.state === "running") {
      if (Date.now() > deadline)
        throw new Error(`instabox operation ${op.id} still ${current.state}`);
      current = await this.json<Operation>(
        "GET",
        `/v1/operations/${op.id}?wait=25s`,
      );
    }
    if (current.state === "failed")
      throw new InstaboxError(
        `instabox operation ${op.id} failed: ${current.error?.code ?? ""} ${current.error?.message ?? ""}`,
        0,
        current.error?.code,
        current.error?.retryAfterSeconds,
      );
    return current;
  }

  async create(opts: {
    name: string;
    snapshotId?: string;
    templateId?: string;
    vcpus?: number;
    memMiB?: number;
    deleteAfterSeconds?: number;
  }): Promise<string> {
    const op = await this.json<Operation>("POST", "/v1/machines", {
      body: opts,
      idempotent: true,
    });
    const done = await this.waitOperation(op);
    const id = done.machineId ?? op.machineId;
    if (!id) throw new Error("instabox create returned no machineId");
    return id;
  }

  async exec(
    id: string,
    cmd: string,
    timeoutSeconds = 600,
  ): Promise<ExecResult> {
    return this.json<ExecResult>("POST", `/v1/machines/${id}/exec`, {
      body: { cmd, timeoutSeconds, noHistory: false },
    });
  }

  async put(
    id: string,
    path: string,
    bytes: Uint8Array,
    mode = "0644",
  ): Promise<void> {
    const q = new URLSearchParams({ path, mode, parents: "true" });
    await this.call("PUT", `/v1/machines/${id}/files?${q}`, { raw: bytes });
  }

  async get(id: string, path: string): Promise<Uint8Array> {
    const res = await this.call(
      "GET",
      `/v1/machines/${id}/files/content?${new URLSearchParams({ path })}`,
    );
    return new Uint8Array(await res.arrayBuffer());
  }

  async delete(id: string): Promise<void> {
    try {
      await this.call("DELETE", `/v1/machines/${id}`, {
        headers: { "X-Confirm-Delete": id },
        idempotent: true,
      });
    } catch (e) {
      if (e instanceof InstaboxError && e.status === 404) return;
      throw e;
    }
  }

  async machines(): Promise<
    { id: string; name?: string; createdAt?: string }[]
  > {
    const res = await this.json<{
      machines?: { id: string; name?: string; createdAt?: string }[];
    }>("GET", "/v1/machines");
    return res.machines ?? [];
  }

  async snapshots(): Promise<
    { id: string; name: string; status: string; createdAt: string }[]
  > {
    const res = await this.json<{
      snapshots?: {
        id: string;
        name: string;
        status: string;
        createdAt: string;
      }[];
    }>("GET", "/v1/snapshots");
    return res.snapshots ?? [];
  }

  async snapshot(
    id: string,
    name: string,
    description: string,
  ): Promise<string> {
    const snap = await this.json<{ id: string; status: string }>(
      "POST",
      `/v1/machines/${id}/snapshots`,
      {
        body: { name, description },
        idempotent: true,
      },
    );
    for (let i = 0; i < 180 && snap.status === "pending"; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      Object.assign(
        snap,
        await this.json<{ status: string }>("GET", `/v1/snapshots/${snap.id}`),
      );
    }
    if (snap.status !== "ready")
      throw new Error(`snapshot ${snap.id} ended ${snap.status}`);
    return snap.id;
  }

  async deleteSnapshot(id: string): Promise<void> {
    await this.call("DELETE", `/v1/snapshots/${id}`, {
      headers: { "X-Confirm-Delete": id },
      idempotent: true,
    });
  }
}
