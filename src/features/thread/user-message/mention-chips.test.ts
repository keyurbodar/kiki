import type { Root } from "hast";
import { expect, it } from "vitest";
import type { Mention } from "@/data/events";
import { mentionChips, mentionTransform } from "./mention-chips";

const skill: Mention = {
  kind: "skill",
  id: "kiki-ux-verify",
  label: "kiki-ux-verify",
  start: 5,
  end: 19,
  text: "kiki-ux-verify",
};

const text = "run $kiki-ux-verify now";

it("swaps each mention range for its placeholder and keeps the rest", () => {
  const chips = mentionChips(text, [skill]);
  expect(chips.text).toBe("run $\ue000m0\ue001 now");
  expect(chips.labels).toEqual(["kiki-ux-verify"]);
  expect(chips.mentions.get(0)).toEqual({
    kind: "skill",
    id: "kiki-ux-verify",
    label: "kiki-ux-verify",
  });
});

it("leaves an excerpt mention out: the reply quote paints it", () => {
  const chips = mentionChips(text, [
    { ...skill, kind: "excerpt", id: "reply:row:0" },
  ]);
  expect(chips.labels).toEqual([]);
  expect(chips.text).toBe(text);
});

it("ignores a range that does not fit the text", () => {
  const chips = mentionChips("short", [{ ...skill, start: 20, end: 40 }]);
  expect(chips.labels).toEqual([]);
  expect(chips.text).toBe("short");
});

it("paints the placeholder as a mention span in the tree", () => {
  const chips = mentionChips(text, [skill]);
  const tree: Root = {
    type: "root",
    children: [{ type: "text", value: chips.text }],
  };
  mentionTransform(chips)(tree);
  const [before, chip, after] = tree.children;
  expect(before).toEqual({ type: "text", value: "run $" });
  expect(chip).toMatchObject({
    type: "element",
    tagName: "span",
    properties: { dataMention: "0" },
    children: [{ type: "text", value: "kiki-ux-verify" }],
  });
  expect(after).toEqual({ type: "text", value: " now" });
});

it("keeps surrounding markdown nodes in place", () => {
  const chips = mentionChips("**bold** \ue000", []);
  const tree: Root = {
    type: "root",
    children: [
      {
        type: "element",
        tagName: "p",
        properties: {},
        children: [{ type: "text", value: "keep" }],
      },
    ],
  };
  mentionTransform(chips)(tree);
  expect(tree.children[0]).toMatchObject({ tagName: "p" });
});
