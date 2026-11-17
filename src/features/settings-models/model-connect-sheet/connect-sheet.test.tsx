import { RegistryProvider } from "@effect/atom-react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SideSheet, SideSheetContent } from "@/primitives/side-sheet";
import type { CatalogEntry, Credential } from "../model-routing/types.ts";
import { ConnectSheet } from "./connect-sheet.tsx";
import { CustomModelForm } from "./custom-model-form.tsx";
import { HeaderRows } from "./header-rows.tsx";
import { RemoveCredentialDialog } from "./remove-credential-dialog.tsx";
import { DaybreakAccessRow, MediaDeliveryRows, WireNotice } from "./rows.tsx";

afterEach(cleanup);

const wrap = (node: ReactNode) =>
  render(<RegistryProvider>{node}</RegistryProvider>);

const entry = (id: string, provider: string, name: string): CatalogEntry => ({
  id,
  name,
  provider,
  efforts: [],
  fast: false,
  pro: false,
  limits: { context: 2e5, output: 32e3 },
  pricing: { input: 1, output: 2 },
});

const catalog = [
  entry("openai/acme-large", "openai", "Acme Large"),
  entry("openai/acme-small", "openai", "Acme Small"),
];

const credential = (patch: Partial<Credential> = {}): Credential => ({
  id: "cred_1",
  name: "Acme Gateway",
  provider: "openai_compatible",
  ownerType: "org",
  status: "active",
  enabled: true,
  position: 0,
  ticks: [],
  models: [],
  allModels: false,
  baseURL: "https://gateway.acme.test/v1",
  api: "responses",
  ...patch,
});

describe("ConnectSheet", () => {
  it("connects a direct provider once a key is typed", () => {
    wrap(
      <ConnectSheet
        request={{ kind: "create", scope: "org", provider: "openai" }}
        credentials={[]}
        catalog={catalog}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("Connect OpenAI")).toBeTruthy();
    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe(
      "OpenAI",
    );
    expect(screen.getByText("Serves 2 of 2 OpenAI models")).toBeTruthy();
    const check = screen.getByRole("button", { name: "Check access" });
    expect(check.hasAttribute("disabled")).toBe(true);
    fireEvent.change(screen.getByLabelText("API key"), {
      target: { value: " sk-test " },
    });
    expect(check.hasAttribute("disabled")).toBe(false);
    expect(
      screen.getByRole("button", { name: "Connect" }).hasAttribute("disabled"),
    ).toBe(true);
    expect(
      screen.getByText("Requests go to https://api.openai.com/v1/responses"),
    ).toBeTruthy();
  });

  it("leaves the name empty when the scope already has one", () => {
    wrap(
      <ConnectSheet
        request={{ kind: "create", scope: "org", provider: "openai" }}
        credentials={[credential({ name: "OpenAI", provider: "openai" })]}
        catalog={catalog}
        onClose={() => {}}
      />,
    );
    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe("");
    expect(screen.getByPlaceholderText("OpenAI (ZDR)")).toBeTruthy();
  });

  it("checks a preset's key prefix and links to its keys", () => {
    wrap(
      <ConnectSheet
        request={{
          kind: "create",
          scope: "user",
          provider: "openai_compatible",
          preset: "nvidia",
        }}
        credentials={[]}
        catalog={catalog}
        onClose={() => {}}
      />,
    );
    expect(
      screen
        .getByRole("link", { name: /Get a key from NVIDIA/ })
        .getAttribute("href"),
    ).toBe("https://build.nvidia.com/settings/api-keys");
    fireEvent.change(screen.getByLabelText("API key"), {
      target: { value: "abc" },
    });
    expect(screen.getByText("NVIDIA keys start with nvapi-")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Get a key/ })).toBeNull();
  });

  it("titles an unnamed custom endpoint", () => {
    wrap(
      <ConnectSheet
        request={{
          kind: "create",
          scope: "org",
          provider: "openai_compatible",
        }}
        credentials={[]}
        catalog={catalog}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("Connect a custom endpoint")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Responses" })).toBeTruthy();
    expect(screen.getByText("Add custom model")).toBeTruthy();
  });

  it("edits a saved connection and offers removal", () => {
    const onRemove = vi.fn();
    const saved = credential();
    wrap(
      <ConnectSheet
        request={{ kind: "edit", credential: saved }}
        credentials={[saved]}
        catalog={catalog}
        onRemove={onRemove}
        onClose={() => {}}
      />,
    );
    const save = screen.getByRole("button", { name: "Save" });
    expect(save.hasAttribute("disabled")).toBe(true);
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Acme Edge" },
    });
    expect(save.hasAttribute("disabled")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalledWith(saved);
    expect(screen.getByText("Advanced")).toBeTruthy();
    expect(
      screen.getByPlaceholderText("Saved, paste a new key to replace it"),
    ).toBeTruthy();
  });

  it("renders inside a parent sheet when nested", () => {
    const onBack = vi.fn();
    wrap(
      <SideSheet open>
        <SideSheetContent aria-label="Add a connection">
          <ConnectSheet
            nest={{ onBack }}
            request={{ kind: "create", scope: "org", provider: "openai" }}
            credentials={[]}
            catalog={catalog}
            onClose={() => {}}
          />
        </SideSheetContent>
      </SideSheet>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalled();
  });
});

describe("RemoveCredentialDialog", () => {
  const route = {
    model: "openai/acme-large",
    entryId: "openai/acme-large",
    org: { kind: "org_credential" as const, ref: "cred_1", label: "Acme" },
    orgNext: { kind: "capy" as const, ref: "capy", label: "Capy" },
  };
  const routes = [route];

  it("says what serves the models next", () => {
    wrap(
      <RemoveCredentialDialog
        credential={credential()}
        routes={routes}
        lockedModels={[]}
        catalog={catalog}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("Remove Acme Gateway")).toBeTruthy();
    expect(screen.getByText("What serves its models next")).toBeTruthy();
    expect(
      screen.getByText("Acme Large will run on Capy credits"),
    ).toBeTruthy();
  });

  it("blocks removal of a key a locked model needs", () => {
    wrap(
      <RemoveCredentialDialog
        credential={credential()}
        routes={[{ ...route, orgNext: undefined }]}
        lockedModels={["openai/acme-large"]}
        catalog={catalog}
        onClose={() => {}}
      />,
    );
    expect(
      screen.getByText(
        "Acme Large run only on this key, turn off Only Acme Gateway or connect another key for them first",
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Remove" }).hasAttribute("disabled"),
    ).toBe(true);
  });
});

describe("HeaderRows", () => {
  it("adds a header and previews what the endpoint receives", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <HeaderRows headers={[]} recipient="Acme" onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add header" }));
    expect(onChange).toHaveBeenCalledWith([{ id: 0, name: "", value: "" }]);
    rerender(
      <HeaderRows
        headers={[{ id: 0, name: "X-User", value: `\${capy.user.email}` }]}
        recipient="Acme"
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Acme will receive")).toBeTruthy();
    expect(screen.getByText("you@example.com", { exact: false })).toBeTruthy();
  });

  it("shows a header's problem", () => {
    render(
      <HeaderRows
        headers={[{ id: 0, name: "Host", value: "" }]}
        recipient="Acme"
        onChange={() => {}}
      />,
    );
    expect(
      screen.getByText("Host is set by Capy, pick another name"),
    ).toBeTruthy();
    expect(
      screen.getByLabelText("Header 1 name").getAttribute("aria-invalid"),
    ).toBe("true");
  });
});

describe("CustomModelForm", () => {
  it("submits a valid model", () => {
    const onSubmit = vi.fn();
    render(
      <CustomModelForm
        connection="Acme"
        initial={{}}
        listed={[
          { providerModelId: "acme-coder", name: "Acme Coder", context: 64e3 },
        ]}
        idProblem={() => undefined}
        compactable
        editing={false}
        onSubmit={onSubmit}
        onCancel={() => {}}
      />,
    );
    const add = screen.getByRole("button", { name: "Add model" });
    expect(add.hasAttribute("disabled")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "acme-coder" }));
    expect(screen.getByDisplayValue("64,000")).toBeTruthy();
    fireEvent.click(add);
    expect(onSubmit).toHaveBeenCalledWith({
      id: "acme-coder",
      name: "Acme Coder",
      context: 64e3,
      output: undefined,
      reasoning: false,
      images: false,
      compactAt: undefined,
    });
  });

  it("shows the id problem and edit copy", () => {
    render(
      <CustomModelForm
        connection="Acme"
        initial={{ id: "acme-coder", name: "Acme Coder", context: 1e3 }}
        listed={[]}
        idProblem={() => "Already added"}
        compactable={false}
        editing
        onSubmit={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText("Edit Acme Coder")).toBeTruthy();
    expect(screen.queryByText("Already added")).toBeNull();
    expect(screen.getByText("Remove the model to change its id")).toBeTruthy();
    expect(screen.queryByText("Compact at")).toBeNull();
  });
});

describe("rows", () => {
  it("renders the wire notice", () => {
    const onCheckAgain = vi.fn();
    render(
      <WireNotice
        rejections={[{ feature: "fallbacks" }]}
        checkedAt={new Date(2026, 0, 5)}
        checking={false}
        onCheckAgain={onCheckAgain}
      />,
    );
    expect(
      screen.getByText(
        /This endpoint rejected model fallbacks, so Capy leaves them out/,
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Check again" }));
    expect(onCheckAgain).toHaveBeenCalled();
  });

  it("marks the delivery in use", () => {
    render(
      <MediaDeliveryRows
        media={{ state: "yes" }}
        checking={false}
        disabled={false}
        onCheck={() => {}}
      />,
    );
    expect(screen.getByText("Not checked yet")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Check" })).toBeTruthy();
    const url = screen.getByText("URL").closest("[data-slot=settings-row]");
    expect(within(url as HTMLElement).getByText("In use")).toBeTruthy();
  });

  it("lists Daybreak grants", () => {
    render(
      <DaybreakAccessRow
        access={{ granted: ["Acme Large"] }}
        refreshing={false}
        disabled
        onRefresh={() => {}}
      />,
    );
    expect(screen.getByText("Granted for Acme Large")).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "Refresh access" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });
});
