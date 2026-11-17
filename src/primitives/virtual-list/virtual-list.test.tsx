import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { VirtualList } from ".";

afterEach(cleanup);

describe("VirtualList", () => {
  it("renders a LegendList viewport with Capy's scroll classes", () => {
    const { container } = render(
      <VirtualList
        data={["Alpha", "Beta"]}
        keyExtractor={(item) => item}
        estimatedItemSize={44}
        renderItem={({ item }) => <p>{item}</p>}
        className="pt-1"
      />,
    );
    const list = container.querySelector("[data-slot=virtual-list]");
    expect(list).not.toBeNull();
    expect(list?.className).toContain("[overflow-anchor:none]");
    expect(list?.className).toContain("pt-1");
  });
});
