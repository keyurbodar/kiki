import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { avatarInitials, UserAvatar } from "./user-avatar";

afterEach(cleanup);

it("paints the avatar image when the account carries one", () => {
  const { container } = render(
    <UserAvatar
      src="https://avatars.example.com/alex.png"
      name="Alex Morgan"
    />,
  );
  const img = container.querySelector("img");
  expect(img?.getAttribute("src")).toBe("https://avatars.example.com/alex.png");
  expect(img?.parentElement?.className).toContain("rounded bg-secondary");
  expect(container.textContent).toBe("");
});

it("falls back to initials when there is no avatar", () => {
  const { container } = render(<UserAvatar src={null} name="Alex Morgan" />);
  expect(container.querySelector("img")).toBeNull();
  expect(container.textContent).toBe("AM");
  expect(
    container.querySelector("[role=img]")?.getAttribute("aria-label"),
  ).toBe("Alex Morgan");
});

it("initialises from the first and last word", () => {
  expect(avatarInitials("Alex Morgan")).toBe("AM");
  expect(avatarInitials("Yuzu")).toBe("Y");
  expect(avatarInitials("  keyur  kumar  ")).toBe("KK");
});
