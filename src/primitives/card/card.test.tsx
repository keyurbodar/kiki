import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardListHeader,
  CardTitle,
} from "./card";

afterEach(cleanup);

function SearchHeader() {
  const [value, setValue] = useState("");
  return (
    <CardListHeader
      label="Members"
      search={{ value, onChange: setValue, placeholder: "Search members" }}
      action={<button type="button">Invite</button>}
    />
  );
}

describe("Card", () => {
  it("renders every part with its data-slot", () => {
    render(
      <Card variant="panel" rows>
        <CardHeader>
          <CardTitle>Title</CardTitle>
        </CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );
    const card = screen.getByText("Body").parentElement as HTMLElement;
    expect(card.dataset.slot).toBe("card");
    expect(card.className).toContain("bg-panel");
    expect(card.className).toContain("divide-border-1");
    expect(screen.getByText("Title").dataset.slot).toBe("card-title");
    expect(screen.getByText("Title").parentElement?.dataset.slot).toBe(
      "card-header",
    );
    expect(screen.getByText("Body").dataset.slot).toBe("card-content");
    expect(screen.getByText("Footer").dataset.slot).toBe("card-footer");
  });

  it("opens, filters and clears the list header search", () => {
    render(<SearchHeader />);
    expect(
      screen
        .getByText("Members")
        .closest("[data-slot]")
        ?.getAttribute("data-slot"),
    ).toBe("card-list-header");
    fireEvent.click(screen.getByRole("button", { name: "Search members" }));
    const input = screen.getByRole("textbox", { name: "Search members" });
    fireEvent.change(input, { target: { value: "ada" } });
    expect((input as HTMLInputElement).value).toBe("ada");
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByText("Members")).toBeTruthy();
  });

  it("closes the search on Escape", () => {
    render(<SearchHeader />);
    fireEvent.click(screen.getByRole("button", { name: "Search members" }));
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});
