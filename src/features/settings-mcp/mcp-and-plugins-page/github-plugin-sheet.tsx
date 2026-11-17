import { useAtomSet } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { type FormEvent, useId, useState } from "react";
import { Button } from "@/primitives/button";
import { Input } from "@/primitives/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetOverlay,
  SheetTitle,
} from "@/primitives/sheet";
import { pluginMutation } from "../model/atoms.ts";
import type { FetchedGitHubPlugin } from "../model/types.ts";
import { useActiveOrgId } from "../model/use-mcp-data.ts";
import { fetchFailureMessage } from "../ui/plugin-shared.tsx";

export interface GitHubPluginSheetProps {
  readonly open: boolean;
  readonly initialUrl?: string;
  readonly onOpenChange: (open: boolean) => void;
}

export function GitHubPluginSheet({
  open,
  initialUrl,
  onOpenChange,
}: GitHubPluginSheetProps) {
  const navigate = useNavigate();
  const orgId = useActiveOrgId();
  const fetchVersion = useAtomSet(pluginMutation.fetchGitHubVersion, {
    mode: "promise",
  });
  const inputId = useId();
  const [url, setUrl] = useState(initialUrl ?? "");
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const changeOpen = (next: boolean) => {
    if (fetching) return;
    onOpenChange(next);
    if (!next) {
      setUrl("");
      setError(undefined);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (orgId === undefined) return;
    setFetching(true);
    setError(undefined);
    fetchVersion({ params: { orgId }, payload: { url: url.trim() } })
      .then((result) => {
        const fetched = result as FetchedGitHubPlugin;
        setUrl("");
        onOpenChange(false);
        return navigate({
          to: "/settings/mcp/add/$versionId",
          params: { versionId: fetched.version.id },
          search: fetched.ref === null ? {} : { ref: fetched.ref },
        });
      })
      .catch((cause: unknown) => {
        const failure = cause as { reason?: string; message?: string };
        setError(
          fetchFailureMessage(
            failure?.reason,
            undefined,
            "Capy could not fetch that repository",
          ),
        );
      })
      .finally(() => setFetching(false));
  };

  return (
    <Sheet open={open} onOpenChange={changeOpen}>
      <SheetOverlay />
      <SheetContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <SheetTitle>Add from GitHub</SheetTitle>
            <SheetDescription>
              Capy copies the plugin and keeps its own copy until you sync it
            </SheetDescription>
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={inputId}
              className="text-sm font-medium text-foreground"
            >
              Repository URL
            </label>
            <Input
              id={inputId}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              placeholder="https://github.com/owner/name"
              value={url}
              aria-invalid={error !== undefined}
              onChange={(event) => setUrl(event.target.value)}
            />
            <span
              className={
                error === undefined
                  ? "text-sm font-normal text-muted-foreground-2"
                  : "text-sm font-normal text-destructive"
              }
            >
              {error ??
                "A repository, or a /tree/<branch>/<folder> link to one plugin in it"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <a
              href="https://docs.capy.ai/integrations/plugins"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-muted-foreground-1 hover:text-foreground"
            >
              Plugin guide
            </a>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={fetching}
                onClick={() => changeOpen(false)}
              >
                Cancel
              </Button>
              <Button
                intent="accent"
                type="submit"
                disabled={fetching || url.trim() === ""}
              >
                {fetching ? "Fetching" : "Continue"}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
