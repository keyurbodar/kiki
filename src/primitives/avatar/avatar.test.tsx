import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar, avatarInitials } from "./avatar";

describe("avatarInitials", () => {
  it("takes the first letters of the first and last words", () => {
    expect(avatarInitials("Alex Morgan")).toBe("AM");
    expect(avatarInitials("  priya  ")).toBe("P");
    expect(avatarInitials("Ana de la Cruz")).toBe("AC");
    expect(avatarInitials("")).toBe("");
  });
});

describe("Avatar", () => {
  it("falls back to initials without an image", () => {
    render(<Avatar name="Sam Rivera" src={null} />);
    expect(screen.getByRole("img", { name: "Sam Rivera" }).textContent).toBe(
      "SR",
    );
  });
});
