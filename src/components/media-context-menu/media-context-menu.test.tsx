import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { MediaContextMenu } from "./media-context-menu";

afterEach(cleanup);

it("renders only the children when there is nothing to offer", () => {
  const { container } = render(
    <MediaContextMenu kind="image" name="a.png">
      <img alt="a" />
    </MediaContextMenu>,
  );
  expect(
    container.querySelector('[data-slot="context-menu-trigger"]'),
  ).toBeNull();
  expect(screen.getByAltText("a")).toBeTruthy();
});

it("wraps the media in a context menu trigger when it has a source", () => {
  const { container } = render(
    <MediaContextMenu kind="video" name="a.mp4" url="/a.mp4">
      <span>clip</span>
    </MediaContextMenu>,
  );
  expect(
    container.querySelector('[data-slot="context-menu-trigger"]'),
  ).toBeTruthy();
});
