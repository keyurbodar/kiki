import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TokenList } from ".";

afterEach(cleanup);

describe("TokenList", () => {
  it("draws Capy's divided card around its rows", () => {
    const { container } = render(
      <TokenList className="max-h-56 overflow-y-auto">
        <div>Personal access token</div>
      </TokenList>,
    );

    const list = container.querySelector("[data-slot=token-list]");
    expect(list?.className).toContain("flex flex-col");
    expect(list?.className).toContain("divide-y-hairline");
    expect(list?.className).toContain("divide-border-1");
    expect(list?.className).toContain("rounded-(--radius-card)");
    expect(list?.className).toContain("border-hairline");
    expect(list?.className).toContain("border-border-2");
    expect(list?.className).toContain("max-h-56 overflow-y-auto");
    expect(screen.getByText("Personal access token")).toBeTruthy();
  });

  it("passes the rest of its div props through", () => {
    render(<TokenList id="tokens" aria-label="Tokens" />);
    const list = screen.getByLabelText("Tokens");
    expect(list.id).toBe("tokens");
    expect(list.dataset.slot).toBe("token-list");
  });
});
