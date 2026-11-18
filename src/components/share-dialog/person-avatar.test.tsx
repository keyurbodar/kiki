import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { initialsOf, PersonAvatar } from "./person-avatar";

afterEach(cleanup);

it("paints the directory's face when the member has one", () => {
  const { container } = render(
    <PersonAvatar src="/avatars/capy-avatar-3.png" name="Sam Rivera" />,
  );
  const img = container.querySelector("img");
  expect(img?.getAttribute("src")).toBe("/avatars/capy-avatar-3.png");
  expect(img?.getAttribute("alt")).toBe("Sam Rivera");
  expect(container.textContent).toBe("");
});

it("paints initials, not a broken image, when the directory has no face", () => {
  const { container } = render(<PersonAvatar src={null} name="Sam Rivera" />);
  expect(container.querySelector("img")).toBeNull();
  expect(container.textContent).toBe("SR");
  expect(
    container.querySelector("[role=img]")?.getAttribute("aria-label"),
  ).toBe("Sam Rivera");
});

it("drops back to initials when the face fails to load", () => {
  const { container } = render(
    <PersonAvatar src="/avatars/missing.png" name="Sam Rivera" />,
  );
  const img = container.querySelector("img");
  expect(img).not.toBeNull();
  if (img !== null) fireEvent.error(img);
  expect(container.querySelector("img")).toBeNull();
  expect(container.textContent).toBe("SR");
});

it("paints a neutral tile when nobody in the directory knows the id", () => {
  const { container } = render(<PersonAvatar src={null} />);
  expect(container.querySelector("img")).toBeNull();
  expect(container.textContent).toBe("");
  expect(
    container.querySelector("[role=img]")?.getAttribute("aria-label"),
  ).toBe("Unknown person");
});

it("initialises from the first and last word", () => {
  expect(initialsOf("Sam Rivera")).toBe("SR");
  expect(initialsOf("Yuzu")).toBe("Y");
  expect(initialsOf("  keyur  kumar  ")).toBe("KK");
});
