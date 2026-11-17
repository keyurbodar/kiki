import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HomeWelcome, type HomeWelcomeProject } from "./home-welcome";

afterEach(cleanup);

const project = (id: string, name: string): HomeWelcomeProject => ({
  id,
  name,
});

const projectNames = () =>
  screen.getAllByRole("button").map((button) => button.textContent);

describe("HomeWelcome", () => {
  it("offers the four most recent projects as picks", () => {
    const onPick = vi.fn();
    render(
      <HomeWelcome
        projects={[
          project("p1", "One"),
          project("p2", "Two"),
          project("p3", "Three"),
          project("p4", "Four"),
          project("p5", "Five"),
        ]}
        onPick={onPick}
      />,
    );
    expect(projectNames()).toEqual(["One", "Two", "Three", "Four"]);
    fireEvent.click(screen.getByRole("button", { name: "Three" }));
    expect(onPick).toHaveBeenCalledWith(project("p3", "Three"));
  });

  it("shows how to start with no project when the org has none", () => {
    const onAddProject = vi.fn();
    const onStart = vi.fn();
    render(<HomeWelcome onAddProject={onAddProject} onStart={onStart} />);
    expect(projectNames()).toEqual([
      "Add project",
      "Start without a repository",
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Add project" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Start without a repository" }),
    );
    expect(onAddProject).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("starts without a project where the org allows it", () => {
    render(<HomeWelcome projectless />);
    expect(
      screen.getByRole("button", { name: "Start without a project" }),
    ).toBeTruthy();
  });

  it("offers a Captain only where one can be created", () => {
    const { rerender } = render(<HomeWelcome />);
    expect(
      screen.queryByRole("button", { name: "Create a Captain" }),
    ).toBeNull();
    rerender(<HomeWelcome onCreateCaptain={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: "Create a Captain" }),
    ).toBeTruthy();
  });
});
