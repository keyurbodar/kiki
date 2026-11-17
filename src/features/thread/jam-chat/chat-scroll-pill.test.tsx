import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ChatScrollPill } from "./chat-scroll-pill";

afterEach(cleanup);

it("labels the pill with the messages below", () => {
  render(<ChatScrollPill messagesBelow={3} />);
  expect(
    screen.getByRole("button", { name: "Scroll to end, 3 messages below" }),
  ).toBeTruthy();
});

it("falls back to Scroll to end and calls onClick", () => {
  const onClick = vi.fn();
  render(<ChatScrollPill onClick={onClick} />);
  fireEvent.click(screen.getByRole("button", { name: "Scroll to end" }));
  expect(onClick).toHaveBeenCalledOnce();
});

it("is inert while hidden", () => {
  const { container } = render(<ChatScrollPill visible={false} />);
  expect(
    container.querySelector('[data-slot="chat-scroll-pill"] [inert]'),
  ).not.toBeNull();
});
