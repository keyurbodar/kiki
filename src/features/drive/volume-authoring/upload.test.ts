import { describe, expect, it } from "vitest";
import {
  buildUpload,
  filesFromList,
  isSkillUpload,
  maxUploadBytes,
  uploadedMessage,
} from "./upload";

const file = (name: string, text = "x") => new File([text], name);

describe("buildUpload", () => {
  it("writes base64 content under the open folder", async () => {
    const upload = await buildUpload(
      [{ path: "a.txt", file: file("a.txt", "hi") }],
      "notes",
    );
    expect(upload).toEqual({
      changes: [{ path: "notes/a.txt", contentBase64: "aGk=" }],
      skill: false,
    });
  });

  it("routes a dropped skill folder into skills/", async () => {
    const files = [
      { path: "triage/SKILL.md", file: file("SKILL.md") },
      { path: "triage/ref.md", file: file("ref.md") },
    ];
    expect(isSkillUpload(files, "")).toBe(true);
    expect(isSkillUpload(files, "notes")).toBe(false);
    const upload = await buildUpload(files, "");
    expect(upload?.changes.map((change) => change.path)).toEqual([
      "skills/triage/SKILL.md",
      "skills/triage/ref.md",
    ]);
    expect(upload && uploadedMessage(2, upload)).toBe(
      "Skill uploaded to skills/triage",
    );
  });

  it("refuses uploads over 32 MB", async () => {
    const big = { size: maxUploadBytes + 1 } as File;
    expect(
      await buildUpload([{ path: "big.bin", file: big }], ""),
    ).toBeUndefined();
  });

  it("counts plain uploads", () => {
    expect(uploadedMessage(1, { skill: false, changes: [] })).toBe(
      "1 file uploaded",
    );
    expect(uploadedMessage(3, { skill: false, changes: [] })).toBe(
      "3 files uploaded",
    );
  });

  it("reads input file lists", () => {
    expect(filesFromList(null)).toEqual([]);
  });
});
