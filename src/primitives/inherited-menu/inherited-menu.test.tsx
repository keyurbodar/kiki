import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InheritedMenu, InheritedMenuTrigger } from "./inherited-menu";

afterEach(cleanup);

const options = [
  { value: "fast", label: "Fast" },
  { value: "smart", label: "Smart", description: "Slower, deeper" },
];

const trigger = () => screen.getByRole("button", { name: "Model" });

describe("InheritedMenu", () => {
  it("shows the inherited option with the Org tag while it inherits", () => {
    render(
      <InheritedMenu
        aria-label="Model"
        value={undefined}
        inherits
        inherited="smart"
        options={options}
        onChange={() => {}}
      />,
    );
    expect(trigger().textContent).toBe("SmartOrg");
  });

  it("shows the default label when nothing is inherited", () => {
    render(
      <InheritedMenu
        aria-label="Model"
        value={undefined}
        inherits
        inheritedLabel="Project default"
        options={options}
        onChange={() => {}}
      />,
    );
    expect(trigger().textContent).toBe("Project default");
  });

  it("shows the value, or the first option when it neither inherits nor has a value", () => {
    const { rerender } = render(
      <InheritedMenu
        aria-label="Model"
        value="smart"
        inherits
        inherited="fast"
        options={options}
        onChange={() => {}}
      />,
    );
    expect(trigger().textContent).toBe("Smart");
    rerender(
      <InheritedMenu
        aria-label="Model"
        value={undefined}
        options={options}
        onChange={() => {}}
      />,
    );
    expect(trigger().textContent).toBe("Fast");
  });

  it("lists the default row first and reports undefined when it is picked", async () => {
    const onChange = vi.fn();
    render(
      <InheritedMenu
        aria-label="Model"
        value="fast"
        inherits
        inherited="smart"
        options={options}
        onChange={onChange}
      />,
    );
    fireEvent.click(trigger());
    const menu = await screen.findByRole("menu");
    const items = within(menu).getAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Org defaultSmart",
      "Fast",
      "SmartSlower, deeper",
    ]);
    expect(items[1]?.querySelector('[data-icon="checkmark-1"]')).not.toBeNull();
    fireEvent.click(items[0] as HTMLElement);
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("disables the trigger with the reason as its title", () => {
    render(
      <InheritedMenu
        aria-label="Model"
        value="fast"
        options={options}
        disabled
        disabledReason="Admins only"
        onChange={() => {}}
      />,
    );
    expect(trigger().getAttribute("title")).toBe("Admins only");
    expect(trigger().hasAttribute("disabled")).toBe(true);
  });
});

describe("InheritedMenu as a menu root", () => {
  it("still composes a custom trigger without options", () => {
    render(
      <InheritedMenu>
        <InheritedMenuTrigger>Pick</InheritedMenuTrigger>
      </InheritedMenu>,
    );
    expect(screen.getByRole("button", { name: "Pick" }).dataset.slot).toBe(
      "menu-trigger",
    );
  });
});
