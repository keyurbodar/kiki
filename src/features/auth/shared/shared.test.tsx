import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { sampleFailingNotMeToken, sampleNotMeToken } from "@/data/auth";
import { NotMePage, notMeReportFailed } from "../not-me";
import { wallTitle } from "../two-step-wall";
import { parseVerifyStatus } from "../verify-email";
import { sanitizeCode } from "./code-field";
import { safeRedirect, ssoCallbackUrl } from "./redirect";

afterEach(cleanup);

describe("auth helpers", () => {
  it("keeps only same-origin redirect paths", () => {
    expect(safeRedirect("/threads")).toBe("/threads");
    expect(safeRedirect("//evil.example")).toBe("/new");
    expect(safeRedirect("https://evil.example")).toBe("/new");
    expect(safeRedirect(undefined)).toBe("/new");
    expect(ssoCallbackUrl("/sign-up/sso-callback", "/a?b=1")).toBe(
      "/sign-up/sso-callback?redirect_url=%2Fa%3Fb%3D1",
    );
  });

  it("sanitizes codes to six digits", () => {
    expect(sanitizeCode("12 34-5678")).toBe("123456");
  });

  it("parses verify statuses and wall titles", () => {
    expect(parseVerifyStatus("expired")).toBe("expired");
    expect(parseVerifyStatus("bogus")).toBeUndefined();
    expect(wallTitle(true, false)).toBe("Single sign-on");
    expect(wallTitle(false, true)).toBe("Passkey sign-in");
    expect(wallTitle(false, false)).toBe("Two-step verification");
  });
});

describe("NotMePage", () => {
  it("asks for the email link when the token is missing", () => {
    render(<NotMePage />);
    expect(screen.getByRole("heading").textContent).toBe(
      "This link is incomplete",
    );
    expect(screen.getByText("support@capy.ai")).toBeTruthy();
  });

  it("locks the account once reported", async () => {
    render(<NotMePage token={sampleNotMeToken} />);
    fireEvent.click(screen.getByText("This wasn't me"));
    await waitFor(() =>
      expect(screen.getByRole("heading").textContent).toBe(
        "Your account is locked",
      ),
    );
  });

  it("shows the error when the report fails", async () => {
    render(<NotMePage token={sampleFailingNotMeToken} />);
    fireEvent.click(screen.getByText("This wasn't me"));
    await waitFor(() =>
      expect(screen.getByText(notMeReportFailed)).toBeTruthy(),
    );
  });
});
