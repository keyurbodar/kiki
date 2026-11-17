import { type ReactNode, useRef, useState } from "react";
import { ClaudeConnectDialog } from "@/components/claude-connect-dialog";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Input, InputGroup } from "@/primitives/input";
import {
  SideSheet,
  SideSheetBody,
  SideSheetContent,
  SideSheetHeader,
  SideSheetTitle,
} from "@/primitives/side-sheet";
import { ConnectSheet } from "../model-connect-sheet/connect-sheet.tsx";
import { openaiCompatible } from "../model-connect-sheet/presets.ts";
import { ChevronRightGlyph, PlusGlyph } from "../model-routing/glyphs.tsx";
import { ProviderIcon } from "../model-routing/provider-icon.tsx";
import type {
  CatalogEntry,
  Credential,
  OwnerType,
} from "../model-routing/types.ts";
import { DeviceConnectDialog } from "./device-connect-dialog.tsx";
import {
  type ConnectionTarget,
  connectionSections,
  firstTarget,
  targetKey,
} from "./entries.ts";
import { SearchGlyph } from "./search-glyph.tsx";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

export type AddConnectionSheetProps = {
  scope: OwnerType;
  connectedSeats: ReadonlyArray<string>;
  credentials: ReadonlyArray<Credential>;
  catalog: ReadonlyArray<CatalogEntry>;
  disabled?: boolean;
  title?: string;
  onSeatConnected: (service: string) => void;
};

export function AddConnectionSheet({
  scope,
  connectedSeats,
  credentials,
  catalog,
  disabled,
  title,
  onSeatConnected,
}: AddConnectionSheetProps) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<ConnectionTarget>();
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const close = () => setOpen(false);
  const nest = { onBack: () => setTarget(undefined) };
  const sections = connectionSections(scope, connectedSeats, search);
  const first = firstTarget(sections);
  let content: ReactNode;
  if (target === undefined)
    content = (
      <>
        <SideSheetHeader>
          <SideSheetTitle>Add a connection</SideSheetTitle>
        </SideSheetHeader>
        <div className="shrink-0 px-5 pt-4">
          <InputGroup className="relative inline-flex w-full">
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-icon-muted [&_svg]:size-(--icon-sm)"
            >
              <SearchGlyph />
            </span>
            <Input
              ref={searchRef}
              className="pl-8"
              aria-label="Search providers"
              placeholder="Search providers"
              autoComplete="off"
              spellCheck={false}
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && first !== undefined)
                  setTarget(first);
              }}
            />
          </InputGroup>
        </div>
        <SideSheetBody className="gap-6 md:scroll-fade-y">
          {sections.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <p className="text-sm text-muted-foreground-2">
                No providers match {search.trim()}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setTarget({ kind: "key", provider: openaiCompatible })
                }
              >
                <Icon name="server-2" />
                Use a custom endpoint
              </Button>
            </div>
          ) : (
            sections.map((section) => (
              <section key={section.title} className="flex flex-col gap-2">
                <h3 className="text-sm font-medium">{section.title}</h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {section.entries.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      disabled={entry.target === undefined}
                      onClick={() => setTarget(entry.target)}
                      className="group flex min-w-0 items-center gap-3 rounded-(--radius-card) border-hairline border-(--card-hairline) bg-card p-3 text-left shadow-card transition-colors duration-hover outline-none select-none focus-visible:outline-ring-inset enabled:cursor-pointer enabled:hover:bg-card-hover"
                    >
                      <span
                        aria-hidden
                        className={cx(
                          "grid size-9 shrink-0 place-items-center rounded-md border-hairline border-border-1 bg-panel text-foreground [&_svg]:size-5",
                          entry.target === undefined && "opacity-50",
                        )}
                      >
                        {entry.id === openaiCompatible ? (
                          <Icon name="server-2" />
                        ) : (
                          <ProviderIcon provider={entry.id} />
                        )}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span
                          className={cx(
                            "truncate text-sm font-medium",
                            entry.target === undefined &&
                              "text-muted-foreground-2",
                          )}
                        >
                          {entry.name}
                        </span>
                        <span className="truncate text-xs text-muted-foreground-2">
                          {entry.detail}
                        </span>
                      </span>
                      {entry.state === undefined ? (
                        <ChevronRightGlyph className="size-(--icon-sm) shrink-0 text-muted-foreground-3 opacity-0 transition-opacity duration-hover group-hover:opacity-100 group-focus-visible:opacity-100" />
                      ) : (
                        <span className="shrink-0 text-xs text-muted-foreground-2">
                          {entry.state}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            ))
          )}
        </SideSheetBody>
      </>
    );
  else if (target.kind === "key")
    content = (
      <ConnectSheet
        nest={nest}
        request={{
          kind: "create",
          scope,
          provider: target.provider,
          preset: target.preset,
        }}
        credentials={credentials}
        catalog={catalog}
        onClose={close}
      />
    );
  else if (target.service === "claude")
    content = (
      <ClaudeConnectDialog
        nest={nest}
        onClose={close}
        onConnected={() => {
          onSeatConnected("claude");
          close();
        }}
      />
    );
  else
    content = (
      <DeviceConnectDialog
        nest={nest}
        service={target.service}
        onClose={close}
        onConnected={() => {
          onSeatConnected(target.service);
          close();
        }}
      />
    );
  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Add connection"
        disabled={disabled}
        title={title ?? "Add connection"}
        onClick={() => {
          setTarget(undefined);
          setSearch("");
          setOpen(true);
        }}
      >
        <PlusGlyph />
      </Button>
      <SideSheet open={open} onOpenChange={setOpen}>
        <SideSheetContent
          aria-label="Add a connection"
          initialFocus={searchRef}
        >
          <div
            key={targetKey(target)}
            className="flex min-h-0 flex-1 flex-col transition-opacity duration-base ease-out-quint starting:opacity-0 motion-reduce:transition-none"
          >
            {content}
          </div>
        </SideSheetContent>
      </SideSheet>
    </>
  );
}
