import { describe, expect, it } from "vitest";
import {
  answerText,
  clarifyStepLabel,
  formatClarifyAnswers,
  initialClarifyAnswers,
  initialClarifyStep,
  isAnswered,
} from "./answers";

const questions = [
  { question: "Pick a theme", options: ["Light", "Dark"], multiSelect: false },
  { question: "Pick a size", options: ["Small", "Large"], multiSelect: true },
];

describe("clarify answers", () => {
  it("counts a selection or a non-blank typed answer", () => {
    expect(isAnswered(undefined)).toBe(false);
    expect(isAnswered({ question: "q", selected: [], other: "  " })).toBe(
      false,
    );
    expect(isAnswered({ question: "q", selected: [], other: "Blue" })).toBe(
      true,
    );
    expect(
      isAnswered({ question: "q", selected: ["Light"], other: undefined }),
    ).toBe(true);
  });

  it("joins selections and the typed answer", () => {
    expect(
      answerText({ question: "q", selected: ["A", "B"], other: "C" }),
    ).toBe("A, B, C");
  });

  it("formats one answer as Q/A and several as a numbered list", () => {
    expect(
      formatClarifyAnswers([
        { question: "Pick a theme", selected: ["Dark"], other: undefined },
      ]),
    ).toBe("**Q:** Pick a theme\n**A:** Dark");
    expect(
      formatClarifyAnswers([
        { question: "Pick a theme", selected: ["Dark"], other: undefined },
        {
          question: "Pick a size",
          selected: ["Small", "Large"],
          other: undefined,
        },
      ]),
    ).toBe("1. **Pick a theme** → Dark\n\n2. **Pick a size** → Small, Large");
  });

  it("keeps saved answers only for the same question", () => {
    const answers = initialClarifyAnswers(questions, [
      { question: "Pick a theme", selected: ["Dark"], other: undefined },
      { question: "Something else", selected: ["X"], other: undefined },
    ]);
    expect(answers[0]?.selected).toEqual(["Dark"]);
    expect(answers[1]).toEqual({
      question: "Pick a size",
      selected: [],
      other: undefined,
    });
  });

  it("opens on review when every question is answered", () => {
    const answered = questions.map((q) => ({
      question: q.question,
      selected: [q.options[0] ?? ""],
      other: undefined,
    }));
    expect(initialClarifyStep(answered, undefined)).toBe(2);
    expect(initialClarifyStep(answered, 1)).toBe(1);
    expect(initialClarifyStep(answered, 5)).toBe(2);
    expect(initialClarifyStep(answered.slice(0, 1), undefined)).toBe(0);
  });

  it("labels the step", () => {
    expect(clarifyStepLabel(1, 0)).toBe("One question");
    expect(clarifyStepLabel(2, 0)).toBe("1 of 2");
    expect(clarifyStepLabel(2, 2)).toBe("Review");
  });
});
