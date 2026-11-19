import type { ReactNode } from "react";
import { FileChip } from "@/components/markdown-chips";
import type { ActivityRow } from "@/data/events";
import { DiffBodyCard } from "@/features/thread/diff-body";
import { formatElapsed } from "@/features/thread/summary-card";
import { cleanOutput } from "./clean";
import { EXPANDABLE_PATCH_LINES, patchForTool, patchPath } from "./patch";

type ToolRow = Extract<typeof ActivityRow.Type, { kind: "tool" }>;
type Block = NonNullable<ToolRow["result"]>["blocks"][number];
type FileBlock = Extract<Block, { file: { name: string } }>;

const field = (value: unknown, key: string) => {
  if (typeof value !== "object" || value === null) return undefined;
  const found = (value as Record<string, unknown>)[key];
  return typeof found === "string" ? found : undefined;
};

const exitCodeOf = (data: unknown) => {
  if (typeof data !== "object" || data === null) return undefined;
  const code = (data as Record<string, unknown>).exit_code;
  return typeof code === "number" ? code : undefined;
};

const timedOut = (data: unknown) =>
  typeof data === "object" &&
  data !== null &&
  (data as Record<string, unknown>).timed_out === true;

/**
 * The tools whose body is what they said, not what they printed. Capy keeps
 * this as a per-tool spec; the field is where the words live in the call.
 */
const PROSE_FIELD: Record<string, string> = {
  message_agent: "text",
  end_turn: "reason",
  environment_request_variables: "reason",
  request_desktop: "reason",
  pr_comment: "body",
  slack_post_to_channel: "text",
  review_rule_create: "body",
  review_rule_update: "body",
  memory_save: "body",
};

/** A terminal call shows its command head and outcome; the output lives in the pane. */
const TERMINAL_TOOLS: ReadonlySet<string> = new Set(["request_terminal"]);

/** A remote build's fields, which the call carries instead of a printed log. */
const MOBILE_BUILD = "mobile_build";

/** A JSON block renders as the indented document Capy prints, beside the text. */
const blockText = (block: Block) => {
  if (block.type === "text") return block.text;
  if (block.type === "json") return JSON.stringify(block.data, null, 2) ?? "";
  return undefined;
};

export function resultText(row: ToolRow) {
  return (row.result?.blocks ?? [])
    .flatMap((block) => {
      const text = blockText(block);
      return text === undefined ? [] : [text];
    })
    .join("\n")
    .trim();
}

/** Image, document, clip and file results render as chips under the output. */
const resultFiles = (row: ToolRow) =>
  (row.result?.blocks ?? []).flatMap((block): FileBlock[] =>
    block.type === "image" ||
    block.type === "document" ||
    block.type === "clip" ||
    block.type === "file"
      ? [block]
      : [],
  );

/** A block this client cannot paint; Capy asks for a newer build rather than drop it. */
const hasUnknownBlocks = (row: ToolRow) =>
  (row.result?.blocks ?? []).some((block) => block.type === "unsupported");

export function hasToolBody(row: ToolRow) {
  return (
    PROSE_FIELD[row.toolName] !== undefined ||
    row.toolName === MOBILE_BUILD ||
    TERMINAL_TOOLS.has(row.toolName) ||
    patchForTool(row.toolName, row.args) !== undefined ||
    field(row.args, "command") !== undefined ||
    field(row.call?.input, "command") !== undefined ||
    resultText(row) !== "" ||
    resultFiles(row).length > 0 ||
    hasUnknownBlocks(row)
  );
}

type Status = { label: string; tone: "muted" | "error" };

/** Capy's trailing state: running, timed out, an exit code, or failed. */
const statusOf = (row: ToolRow): Status | undefined => {
  if (row.result === undefined) {
    return row.phase === "running" || row.phase === "forming"
      ? { label: "running", tone: "muted" }
      : undefined;
  }
  if (timedOut(row.result.data)) return { label: "timed out", tone: "error" };
  const exitCode = exitCodeOf(row.result.data);
  if (exitCode !== undefined)
    return {
      label: `exit ${exitCode}`,
      tone: exitCode === 0 ? "muted" : "error",
    };
  if (row.result.isError) return { label: "failed", tone: "error" };
  return undefined;
};

export type ToolBodyProps = { row: ToolRow };

/** The prose body: the words the call carried, in Capy's muted reading tone. */
function ProseBody({ text }: { text: string | undefined }) {
  return (
    <div className="kiki-prose-body overflow-x-hidden overflow-y-auto md:scroll-fade-y">
      {text === undefined ? (
        <p className="text-sm text-muted-foreground-3">No text</p>
      ) : (
        <p className="text-sm break-words whitespace-pre-wrap text-muted-foreground-2">
          {text}
        </p>
      )}
    </div>
  );
}

const MOBILE_STATUS: Record<string, { label: string; tone: string }> = {
  queued: { label: "Building", tone: "text-warning" },
  building: { label: "Building", tone: "text-warning" },
  succeeded: { label: "Succeeded", tone: "text-success" },
  failed: { label: "Failed", tone: "text-destructive" },
  cancelled: { label: "Cancelled", tone: "text-muted-foreground-2" },
};

const PLATFORM_LABEL: Record<string, string> = {
  ios: "iOS",
  android: "Android",
};

/** Capy names the artifact from the platform and the path it was written to. */
const mobileTarget = (
  platform: string | undefined,
  path: string | undefined,
) => {
  const lower = path?.toLowerCase() ?? "";
  if (platform === "ios")
    return lower.includes("iphonesimulator") || lower.endsWith(".app")
      ? "Simulator app"
      : lower.includes("iphoneos") || lower.endsWith(".ipa")
        ? "Device archive"
        : undefined;
  if (lower.endsWith(".aab")) return "App bundle";
  if (lower.endsWith(".apk")) return "APK";
  return undefined;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const words = (value: unknown) =>
  typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;

function MobileCell({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <>
      <span className="text-muted-foreground-3">{label}</span>
      <span className="kiki-mobile-build-value text-foreground tabular-nums">
        {children}
      </span>
    </>
  );
}

/** What the build is doing: the call's own report, then what it implies. */
const mobileStatusOf = (
  row: ToolRow,
  action: string | undefined,
  reported: string | undefined,
) => {
  if (row.result?.isError) return MOBILE_STATUS.failed;
  const known = reported === undefined ? undefined : MOBILE_STATUS[reported];
  if (known !== undefined) return known;
  return row.result === undefined || action === "start"
    ? MOBILE_STATUS.building
    : undefined;
};

/** Capy's mobile-build body: the call's own fields, in its own order. */
function MobileBuildBody({ row }: { row: ToolRow }) {
  const args = asRecord(row.args);
  const source = asRecord(args.source);
  const data = asRecord(row.result?.data);
  const platform = words(args.platform);
  const written = words(source.output_path) ?? words(source.path);
  const status = mobileStatusOf(row, words(args.action), words(data.status));
  const version =
    words(data.version_id) ??
    /^Version (\S+) is the app's current build\.$/m.exec(resultText(row))?.[1];
  const buildId = words(data.build_id);
  const app = words(args.app);
  const target = mobileTarget(platform, written);
  const elapsed =
    row.result?.settledAt === undefined || row.startedAt === undefined
      ? undefined
      : Math.max(0, row.result.settledAt.getTime() - row.startedAt.getTime());
  const commands = Array.isArray(source.commands)
    ? source.commands.filter(
        (command): command is string => typeof command === "string",
      )
    : [];
  const failure = row.result?.isError
    ? resultText(row) || words(data.error) || words(data.suggested_fix)
    : undefined;
  const cells: Array<{ label: string; value: ReactNode }> = [];
  if (status !== undefined)
    cells.push({
      label: "Status",
      value: (
        <span className="kiki-mobile-build-status">
          <span className={`kiki-mobile-build-dot ${status.tone}`} />
          {status.label}
        </span>
      ),
    });
  if (platform !== undefined && PLATFORM_LABEL[platform] !== undefined)
    cells.push({ label: "Platform", value: PLATFORM_LABEL[platform] });
  if (target !== undefined) cells.push({ label: "Target", value: target });
  if (app !== undefined) cells.push({ label: "App", value: app });
  if (version !== undefined) cells.push({ label: "Version", value: version });
  if (buildId !== undefined) cells.push({ label: "Build", value: buildId });
  if (elapsed !== undefined)
    cells.push({
      label:
        words(source.type) === "artifact" ? "Upload" : "Archive and upload",
      value: formatElapsed(elapsed),
    });
  if (words(source.type) !== undefined && words(source.path) !== undefined)
    cells.push({
      label: words(source.type) === "artifact" ? "Artifact" : "Source",
      value: words(source.path),
    });
  if (
    words(source.type) === "workspace" &&
    words(source.output_path) !== undefined
  )
    cells.push({ label: "Output", value: words(source.output_path) });
  if (cells.length === 0 && commands.length === 0 && failure === undefined)
    return null;
  return (
    <div className="kiki-mobile-build">
      {cells.length > 0 && (
        <div
          data-slot="mobile-build"
          className="kiki-mobile-build-fields rounded-(--radius-card) border-[length:--spacing(0.125)] border-border-1 bg-panel text-xs"
        >
          {cells.map((cell) => (
            <MobileCell key={cell.label} label={cell.label}>
              {cell.value}
            </MobileCell>
          ))}
        </div>
      )}
      {commands.length > 0 && (
        <div className="overflow-x-auto rounded-(--radius-card) border-[length:--spacing(0.125)] border-border-1 bg-card">
          <pre className="kiki-mobile-build-code font-mono text-code-block leading-normal text-muted-foreground-1">
            {commands.map((command) => `$ ${command}`).join("\n")}
          </pre>
        </div>
      )}
      {failure !== undefined && (
        <div className="kiki-mobile-build-scroll rounded-(--radius-card) border-[length:--spacing(0.125)] border-border-1 bg-card md:scroll-fade-b">
          <pre className="kiki-mobile-build-code font-mono text-code-block leading-normal break-words whitespace-pre-wrap text-muted-foreground-1">
            {failure}
          </pre>
        </div>
      )}
    </div>
  );
}

export function ToolBody({ row }: ToolBodyProps) {
  if (row.toolName === MOBILE_BUILD) return <MobileBuildBody row={row} />;
  const proseField = PROSE_FIELD[row.toolName];
  if (proseField !== undefined)
    return (
      <ProseBody
        text={field(row.args, proseField) ?? field(row.call?.input, proseField)}
      />
    );
  const patch = patchForTool(row.toolName, row.args);
  if (patch !== undefined)
    return (
      <DiffBodyCard
        patch={patch}
        path={patchPath(patch)}
        expandable={patch.split("\n").length <= EXPANDABLE_PATCH_LINES}
      />
    );
  const command =
    field(row.args, "command") ?? field(row.call?.input, "command");
  const { text: output, trimmed } = cleanOutput(
    TERMINAL_TOOLS.has(row.toolName) ? "" : resultText(row),
  );
  const files = resultFiles(row);
  const unknown = hasUnknownBlocks(row);
  const status = statusOf(row);
  const empty = command === undefined && output === "" && files.length === 0;
  return (
    <div className="pt-1 pb-2">
      <div className="flex flex-col overflow-clip rounded-(--radius-card) border-[length:--spacing(0.125)] border-border-1 bg-card">
        <div className="md:scroll-fade-y flex max-h-72 flex-col gap-1.5 overflow-x-hidden overflow-y-auto px-2.5 py-1.5 font-mono text-code-block leading-normal">
          {command !== undefined && (
            <div className="flex gap-1.5">
              <span aria-hidden className="shrink-0 text-muted-foreground-3">
                $
              </span>
              <span
                data-component="shell-command"
                className="min-w-0 break-words whitespace-pre-wrap text-foreground"
              >
                {command}
              </span>
            </div>
          )}
          {trimmed > 0 && (
            <p className="text-sm text-muted-foreground-3">
              {trimmed} earlier {trimmed === 1 ? "line" : "lines"} trimmed
            </p>
          )}
          {output !== "" && (
            <pre className="min-w-0 break-words whitespace-pre-wrap text-muted-foreground-1">
              {output}
            </pre>
          )}
          {empty && (
            <p className="text-sm text-muted-foreground-3">No output</p>
          )}
          {files.length > 0 && (
            <div data-slot="tool-files" className="kiki-chip-row">
              {files.map((block) => (
                <FileChip key={block.file.fileId} value={block.file.name} />
              ))}
            </div>
          )}
          {unknown && (
            <p className="text-sm text-muted-foreground-3">
              This update needs a newer version of Capy
            </p>
          )}
        </div>
        {status !== undefined && (
          <div className="flex shrink-0 items-center justify-between gap-1.5 px-2.5 pt-0.5 pb-1.5 text-2xs tabular-nums">
            <span
              className={
                status.tone === "error"
                  ? "text-destructive"
                  : "text-muted-foreground-3"
              }
            >
              {status.label}
            </span>
            <span className="flex gap-1.5" />
          </div>
        )}
      </div>
    </div>
  );
}
