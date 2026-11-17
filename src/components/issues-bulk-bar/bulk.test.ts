import { beforeEach, describe, expect, it, vi } from "vitest";

const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: { error: (...args: unknown[]) => toastError(...args) },
}));

const { settleBulk, toBulkMembers } = await import("./bulk");

describe("settleBulk", () => {
  beforeEach(() => toastError.mockReset());

  it("stays quiet when every request succeeds", async () => {
    const failed = await settleBulk(
      [() => Promise.resolve(1), () => Promise.resolve(2)],
      "Could not change the status",
    );
    expect(failed).toBe(0);
    expect(toastError).not.toHaveBeenCalled();
  });

  it("runs the requests one at a time so shared mutation atoms never overlap", async () => {
    const order: string[] = [];
    const request = (name: string) => async () => {
      order.push(`${name}:start`);
      await Promise.resolve();
      order.push(`${name}:end`);
    };
    await settleBulk([request("a"), request("b")], "Could not change");
    expect(order).toEqual(["a:start", "a:end", "b:start", "b:end"]);
  });

  it("raises one toast naming how many requests failed", async () => {
    const failed = await settleBulk(
      [
        () => Promise.resolve(1),
        () => Promise.reject(new Error("x")),
        () => Promise.reject(new Error("y")),
      ],
      "Could not change the priority",
    );
    expect(failed).toBe(2);
    expect(toastError).toHaveBeenCalledOnce();
    expect(toastError).toHaveBeenCalledWith("Could not change the priority", {
      description: "2 of 3 failed",
    });
  });
});

describe("toBulkMembers", () => {
  it("reads bare arrays, wrapped lists and nested users", () => {
    expect(
      toBulkMembers([
        { id: "user_a", name: "Alex Morgan" },
        { user: { id: "user_b", firstName: "Sam", lastName: "Rivera" } },
        { id: "user_c" },
        "skip",
        { name: "no id" },
      ]),
    ).toEqual([
      { id: "user_a", name: "Alex Morgan" },
      { id: "user_b", name: "Sam Rivera" },
      { id: "user_c", name: "user_c" },
    ]);
    expect(
      toBulkMembers({ members: [{ id: "user_a", name: "Alex" }] }),
    ).toEqual([{ id: "user_a", name: "Alex" }]);
    expect(toBulkMembers(undefined)).toEqual([]);
  });
});
