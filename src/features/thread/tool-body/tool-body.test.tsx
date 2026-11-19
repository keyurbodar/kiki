import { cleanup, render } from "@testing-library/react";
import type { Schema } from "effect";
import { afterEach, expect, it } from "vitest";
import type { ActivityRow as ActivityRowSchema } from "@/data/events";
import { hasToolBody, ToolBody } from "./tool-body";

type ActivityRowData = Schema.Schema.Type<typeof ActivityRowSchema>;
type ToolRow = Extract<ActivityRowData, { kind: "tool" }>;

afterEach(cleanup);

const at = (ms: number) => new Date(Date.UTC(2026, 0, 1, 12, 0, 0) + ms);

const toolRow = (over: Record<string, unknown> = {}) =>
  ({
    id: "toolu_1",
    eventId: "01JAAAAAAAAAAAAAAAAAAAAAAA",
    createdAt: at(0),
    type: "activity",
    kind: "tool",
    toolName: "bash",
    args: { command: "bun test" },
    phase: "done",
    turnOpen: false,
    turnCloses: false,
    startedAt: at(0),
    result: {
      blocks: [{ type: "text", text: "42 pass" }],
      isError: false,
      settledAt: at(2_400),
    },
    ...over,
  }) as unknown as ToolRow;

it("prints a json result as the indented document Capy shows", () => {
  const { container } = render(
    <ToolBody
      row={toolRow({
        result: {
          blocks: [{ type: "json", data: { ok: true, count: 2 } }],
          isError: false,
          settledAt: at(2_400),
        },
      })}
    />,
  );
  const output = container.querySelector("pre");
  expect(output?.textContent).toContain('"ok": true');
  expect(output?.textContent).toContain('"count": 2');
});

it("draws a file result as a chip instead of dropping it", () => {
  const { container } = render(
    <ToolBody
      row={toolRow({
        args: {},
        result: {
          blocks: [
            {
              type: "file",
              file: {
                fileId: "file_report",
                name: "report.csv",
                mediaType: "text/csv",
                sizeBytes: 120,
              },
            },
          ],
          isError: false,
          settledAt: at(2_400),
        },
      })}
    />,
  );
  const files = container.querySelector("[data-slot=tool-files]");
  expect(files?.textContent).toContain("report.csv");
});

it("says No output for a call that returned nothing", () => {
  const { container } = render(
    <ToolBody
      row={toolRow({
        args: {},
        result: { blocks: [], isError: false, settledAt: at(2_400) },
      })}
    />,
  );
  expect(container.textContent).toContain("No output");
});

it("asks for a newer build when a block type is unknown", () => {
  const { container } = render(
    <ToolBody
      row={toolRow({
        result: {
          blocks: [{ type: "unsupported", of: "chart" }],
          isError: false,
          settledAt: at(2_400),
        },
      })}
    />,
  );
  expect(container.textContent).toContain(
    "This update needs a newer version of Capy",
  );
});

it("marks a call still in flight as running", () => {
  const { container } = render(
    <ToolBody row={toolRow({ phase: "running", result: undefined })} />,
  );
  expect(container.textContent).toContain("running");
});

it("marks a call that hit its timeout", () => {
  const { container } = render(
    <ToolBody
      row={toolRow({
        result: {
          blocks: [],
          data: { timed_out: true },
          isError: true,
          settledAt: at(2_400),
        },
      })}
    />,
  );
  expect(container.textContent).toContain("timed out");
});

it("prints a zero exit code quietly and a failing one in red", () => {
  const ok = render(
    <ToolBody
      row={toolRow({
        result: {
          blocks: [{ type: "text", text: "ok" }],
          data: { exit_code: 0 },
          isError: false,
          settledAt: at(2_400),
        },
      })}
    />,
  );
  expect(ok.container.textContent).toContain("exit 0");
  expect(ok.container.querySelector(".text-destructive")).toBeNull();
  ok.unmount();
  const failed = render(
    <ToolBody
      row={toolRow({
        result: {
          blocks: [{ type: "text", text: "boom" }],
          data: { exit_code: 2 },
          isError: false,
          settledAt: at(2_400),
        },
      })}
    />,
  );
  expect(failed.container.textContent).toContain("exit 2");
  expect(failed.container.querySelector(".text-destructive")).not.toBeNull();
});

it("shows the patch an edit call made instead of an empty result", () => {
  const { container } = render(
    <ToolBody
      row={toolRow({
        toolName: "edit",
        args: {
          path: "src/a.ts",
          old_string: "const a = 1;",
          new_string: "const a = 2;",
        },
        result: { blocks: [], isError: false, settledAt: at(2_400) },
      })}
    />,
  );
  expect(container.querySelector("[data-slot=diff-card]")).not.toBeNull();
  expect(container.textContent).not.toContain("No output");
});

it("shows the patch an apply_patch call carried", () => {
  const { container } = render(
    <ToolBody
      row={toolRow({
        toolName: "apply_patch",
        args: {
          patch_text: [
            "*** Begin Patch",
            "*** Update File: src/a.ts",
            "@@",
            "-old",
            "+new",
            "*** End Patch",
          ].join("\n"),
        },
        result: { blocks: [], isError: false, settledAt: at(2_400) },
      })}
    />,
  );
  expect(container.querySelector("[data-slot=diff-card]")).not.toBeNull();
});

it("opens a panel for a write call that returned nothing else", () => {
  expect(
    hasToolBody(
      toolRow({
        toolName: "write",
        args: { path: "src/a.ts", content: "x" },
        result: { blocks: [], isError: false, settledAt: at(2_400) },
      }),
    ),
  ).toBe(true);
});

it("shows what a prose tool said, not what it printed", () => {
  const { container } = render(
    <ToolBody
      row={toolRow({
        toolName: "message_agent",
        args: { to: "2", text: "Re-run shard 3 before you push." },
        result: {
          blocks: [{ type: "text", text: "Delivered to Subagent 2." }],
          isError: false,
          settledAt: at(2_400),
        },
      })}
    />,
  );
  expect(container.textContent).toContain("Re-run shard 3 before you push.");
  expect(container.textContent).not.toContain("Delivered to Subagent 2.");
});

it("says No text when a prose tool carried none", () => {
  const { container } = render(
    <ToolBody
      row={toolRow({ toolName: "end_turn", args: {}, result: undefined })}
    />,
  );
  expect(container.textContent).toContain("No text");
});

it("shows a terminal call's command head and outcome without its output", () => {
  const { container } = render(
    <ToolBody
      row={toolRow({
        toolName: "request_terminal",
        args: { command: "bun run seed" },
        result: {
          blocks: [{ type: "text", text: "seeded 40 rows" }],
          data: { exit_code: 0 },
          isError: false,
          settledAt: at(2_400),
        },
      })}
    />,
  );
  expect(container.textContent).toContain("bun run seed");
  expect(container.textContent).toContain("exit 0");
  expect(container.textContent).not.toContain("seeded 40 rows");
});

it("renders a coloured, carriage-returned output as the terminal would", () => {
  const { container } = render(
    <ToolBody
      row={toolRow({
        args: { command: "bun test" },
        result: {
          blocks: [
            {
              type: "text",
              text: "\u001b[32mPASS\u001b[0m suite\n10%\r55%\r100%\n\ttabbed",
            },
          ],
          isError: false,
          settledAt: at(2_400),
        },
      })}
    />,
  );
  const output = container.querySelector("pre")?.textContent ?? "";
  expect(output).toBe("PASS suite\n100%\n        tabbed");
  expect(output).not.toContain("\u001b");
  expect(output).not.toContain("\r");
});

it("says how many earlier lines a long output dropped", () => {
  const log = Array.from({ length: 450 }, (_, i) => `line ${i}`).join("\n");
  const { container } = render(
    <ToolBody
      row={toolRow({
        result: {
          blocks: [{ type: "text", text: log }],
          isError: false,
          settledAt: at(2_400),
        },
      })}
    />,
  );
  expect(container.textContent).toContain("50 earlier lines trimmed");
  expect(
    container.querySelector("pre")?.textContent?.startsWith("line 50"),
  ).toBe(true);
});

const mobileBuild = (over: Record<string, unknown> = {}) =>
  toolRow({
    toolName: "mobile_build",
    args: {
      action: "start",
      platform: "ios",
      app: "acme-guide",
      source: {
        type: "workspace",
        path: "apps/guide",
        output_path:
          "ios/build/Build/Products/Debug-iphonesimulator/AcmeGuide.app",
        commands: ["bun install", "xcodebuild -scheme AcmeGuide"],
      },
    },
    result: {
      blocks: [{ type: "text", text: "Remote build started" }],
      data: {
        build_id: "01K9PHIOS00000000000000004",
        status: "succeeded",
        version_id: "7f3c9a21",
      },
      isError: false,
      settledAt: at(2_400),
    },
    ...over,
  });

it("draws a remote build as its own fields, not as a log of nothing", () => {
  const { container } = render(<ToolBody row={mobileBuild()} />);
  const text = container.textContent ?? "";
  expect(text).toContain("Succeeded");
  expect(text).toContain("iOS");
  expect(text).toContain("Simulator app");
  expect(text).toContain("acme-guide");
  expect(text).toContain("7f3c9a21");
  expect(text).toContain("01K9PHIOS00000000000000004");
  expect(text).toContain("$ bun install");
  expect(text).not.toContain("No output");
});

it("reads the build's version out of the result when the field is absent", () => {
  const { container } = render(
    <ToolBody
      row={mobileBuild({
        result: {
          blocks: [
            {
              type: "text",
              text: "Version 7f3c9a21 is the app's current build.",
            },
          ],
          data: { build_id: "build_1", status: "succeeded" },
          isError: false,
          settledAt: at(2_400),
        },
      })}
    />,
  );
  expect(container.textContent).toContain("7f3c9a21");
});

it("shows a failed remote build's error instead of the fields alone", () => {
  const { container } = render(
    <ToolBody
      row={mobileBuild({
        result: {
          blocks: [{ type: "text", text: "Gradle task :app:compile failed" }],
          data: { build_id: "build_1", status: "failed" },
          isError: true,
          settledAt: at(2_400),
        },
      })}
    />,
  );
  expect(container.textContent).toContain("Failed");
  expect(container.textContent).toContain("Gradle task :app:compile failed");
});

it("counts a remote build as a body even when it printed nothing", () => {
  expect(
    hasToolBody(
      toolRow({
        toolName: "mobile_build",
        args: { action: "start", platform: "ios", app: "acme-guide" },
        result: { blocks: [], data: {}, isError: false, settledAt: at(2_400) },
      }),
    ),
  ).toBe(true);
});
