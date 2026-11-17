import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ClarifyTakeover } from "./clarify-takeover";

afterEach(cleanup);

const questions = [
  {
    question: "Pick a theme",
    options: ["Light", "Dark", "System"],
    multiSelect: false,
  },
  { question: "Pick a size", options: ["Small", "Large"], multiSelect: false },
];

it("steps through questions, reviews, and sends the answers", () => {
  const onSubmit = vi.fn();
  render(
    <ClarifyTakeover
      questions={questions}
      onSubmit={onSubmit}
      onLater={() => {}}
    />,
  );
  expect(screen.getByText("1 of 2")).toBeTruthy();
  expect(screen.getByText("Later")).toBeTruthy();
  fireEvent.click(screen.getByText("Dark"));
  expect(screen.getByText("2 of 2")).toBeTruthy();
  fireEvent.keyDown(window, { key: "2" });
  expect(screen.getByText("Review")).toBeTruthy();
  fireEvent.click(screen.getByText("Send answers"));
  expect(onSubmit).toHaveBeenCalledWith([
    { question: "Pick a theme", selected: ["Dark"], other: undefined },
    { question: "Pick a size", selected: ["Large"], other: undefined },
  ]);
});

it("sends a single question straight away", () => {
  const onSubmit = vi.fn();
  render(
    <ClarifyTakeover questions={questions.slice(0, 1)} onSubmit={onSubmit} />,
  );
  expect(screen.getByText("One question")).toBeTruthy();
  fireEvent.click(screen.getByText("System"));
  expect(onSubmit).toHaveBeenCalledWith([
    { question: "Pick a theme", selected: ["System"], other: undefined },
  ]);
});
