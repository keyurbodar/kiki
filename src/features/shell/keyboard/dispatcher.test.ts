import { fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { registerCommands } from "./dispatcher";
import { KEYBINDS_KEY } from "./store";

const disposers: Array<() => void> = [];
const register = (...args: Parameters<typeof registerCommands>) => {
  const dispose = registerCommands(...args);
  disposers.push(dispose);
  return dispose;
};

afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose();
  window.localStorage.removeItem(KEYBINDS_KEY);
  document.body.innerHTML = "";
});

const field = () => {
  const input = document.createElement("input");
  document.body.append(input);
  return input;
};

const press = (key: string, init: KeyboardEventInit = {}, target?: Element) =>
  fireEvent.keyDown(target ?? document.body, { key, ...init });

describe("keybinding dispatcher", () => {
  it("runs the handler a printed shortcut is bound to", () => {
    const toggle = vi.fn();
    register({ "sidebar.toggle": toggle });
    press("b", { ctrlKey: true });
    expect(toggle).toHaveBeenCalledOnce();
  });

  it("consumes the key so the page's own binding cannot fire", () => {
    register({ "sidebar.toggle": () => undefined });
    const event = new KeyboardEvent("keydown", {
      key: "b",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    document.body.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it("honours the override the Shortcuts page recorded", () => {
    window.localStorage.setItem(
      KEYBINDS_KEY,
      JSON.stringify({ "sidebar.toggle": ["mod+j"] }),
    );
    const toggle = vi.fn();
    register({ "sidebar.toggle": toggle });
    press("b", { ctrlKey: true });
    expect(toggle).not.toHaveBeenCalled();
    press("j", { ctrlKey: true });
    expect(toggle).toHaveBeenCalledOnce();
  });

  it("drops a shortcut the page unassigned", () => {
    window.localStorage.setItem(
      KEYBINDS_KEY,
      JSON.stringify({ "sidebar.toggle": null }),
    );
    const toggle = vi.fn();
    register({ "sidebar.toggle": toggle });
    press("b", { ctrlKey: true });
    expect(toggle).not.toHaveBeenCalled();
  });

  it("ignores a held key repeating", () => {
    const toggle = vi.fn();
    register({ "sidebar.toggle": toggle });
    press("b", { ctrlKey: true, repeat: true });
    expect(toggle).not.toHaveBeenCalled();
  });

  it("leaves typing alone, except for the commands Capy runs in a field", () => {
    const jump = vi.fn();
    const attach = vi.fn();
    register({ "thread.jump": jump, "composer.attach": attach });
    const input = field();
    // thread.jump is scoped "not typing"; composer.attach is scoped to the composer.
    press("1", { altKey: true }, input);
    press("/", { ctrlKey: true }, input);
    expect(jump).not.toHaveBeenCalled();
    expect(attach).toHaveBeenCalledOnce();
  });

  it("lets the newest scope win and fall through when it declines", () => {
    const shell = vi.fn();
    const route = vi.fn(() => false);
    register({ "sidebar.toggle": shell });
    register({ "sidebar.toggle": route });
    press("b", { ctrlKey: true });
    expect(route).toHaveBeenCalledOnce();
    expect(shell).toHaveBeenCalledOnce();
  });

  it("runs a capture scope ahead of a bubble one and can swallow the key", () => {
    const order: string[] = [];
    register({ "sidebar.toggle": () => void order.push("bubble") });
    register(
      { "sidebar.toggle": () => void order.push("capture") },
      { capture: true },
    );
    press("b", { ctrlKey: true });
    expect(order).toEqual(["capture"]);
  });

  it("runs a punctuation shortcut whose key the platform withheld", () => {
    const settings = vi.fn();
    register({ "settings.open": settings });
    // Chrome on Linux sends Ctrl+Comma as key "" code "Comma".
    fireEvent.keyDown(document.body, {
      key: "",
      code: "Comma",
      ctrlKey: true,
    });
    expect(settings).toHaveBeenCalledOnce();
  });

  it("skips a scope whose guard says it is not mounted here", () => {
    const toggle = vi.fn();
    register({ "sidebar.toggle": toggle }, { when: () => false });
    press("b", { ctrlKey: true });
    expect(toggle).not.toHaveBeenCalled();
  });

  it("stops handling once it unregisters", () => {
    const toggle = vi.fn();
    register({ "sidebar.toggle": toggle })();
    press("b", { ctrlKey: true });
    expect(toggle).not.toHaveBeenCalled();
  });

  it("leaves the shortcut recorder's own keys to the recorder", () => {
    const toggle = vi.fn();
    register({ "sidebar.toggle": toggle });
    const recorder = document.createElement("input");
    recorder.setAttribute("data-keybinding-capture", "");
    document.body.append(recorder);
    press("b", { ctrlKey: true }, recorder);
    expect(toggle).not.toHaveBeenCalled();
  });
});
