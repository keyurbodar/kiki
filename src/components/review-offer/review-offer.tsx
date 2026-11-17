import {
  type ComponentProps,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { Kbd } from "@/primitives/kbd";
import {
  MenuSelect,
  MenuSelectContent,
  MenuSelectItem,
  MenuSelectTrigger,
  MenuSelectValue,
} from "@/primitives/menu-select";

export type AutoReviewMode = "off" | "once" | "always";

export const AUTO_REVIEW_MODES: ReadonlyArray<{
  value: AutoReviewMode;
  label: string;
  hint: string;
}> = [
  { value: "off", label: "Off", hint: "No automatic reviews" },
  {
    value: "once",
    label: "Once",
    hint: "First review only, when a pull request opens",
  },
  {
    value: "always",
    label: "Every push",
    hint: "Each opening and every later push",
  },
];

export const REVIEW_CREDITS_NOTE =
  "Charged to Capy credits, not your key or subscription";

export type ReviewOfferCandidate = {
  repoFullName: string;
  needsAccess: boolean;
};

export type ReviewOfferResult = { enabled: string[]; failed: string[] };

export const reviewTargets = (
  candidates: readonly ReviewOfferCandidate[],
  modeOf: (repo: string) => AutoReviewMode,
) =>
  candidates.filter((c) => !c.needsAccess && modeOf(c.repoFullName) !== "off");

export const reviewOfferPrimaryLabel = (count: number) =>
  count === 0 ? "Done" : `Turn on review for ${count}`;

export type ReviewOfferProps = Omit<
  ComponentProps<"div">,
  "children" | "onKeyDownCapture"
> & {
  candidates?: readonly ReviewOfferCandidate[];
  groupLabel?: string;
  onFinish?: (result: ReviewOfferResult | undefined) => void;
  onEnable?: (repo: string, mode: AutoReviewMode) => Promise<void>;
  onGrantAccess?: () => void;
  grantAccessReason?: string;
  onBusyChange?: (busy: boolean) => void;
  example?: ComponentProps<"div">["children"];
};

export function ReviewOffer({
  candidates = [],
  groupLabel,
  onFinish,
  onEnable,
  onGrantAccess,
  grantAccessReason,
  onBusyChange,
  example,
  className,
  ...props
}: ReviewOfferProps) {
  const [modes, setModes] = useState<ReadonlyMap<string, AutoReviewMode>>(
    () => new Map(),
  );
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const finished = useRef(false);
  const primary = useRef<HTMLButtonElement>(null);

  useEffect(() => primary.current?.focus(), []);

  const finish = (result: ReviewOfferResult | undefined) => {
    if (finished.current) return;
    finished.current = true;
    onFinish?.(result);
  };
  const modeOf = (repo: string) => modes.get(repo) ?? "always";
  const targets = reviewTargets(candidates, modeOf);

  const submit = async () => {
    if (busy || finished.current) return;
    if (onEnable === undefined || targets.length === 0) {
      finish(undefined);
      return;
    }
    setBusy(true);
    onBusyChange?.(true);
    const results = await Promise.all(
      targets.map(({ repoFullName }) =>
        onEnable(repoFullName, modeOf(repoFullName)).then(
          () => ({ repoFullName, ok: true }),
          () => ({ repoFullName, ok: false }),
        ),
      ),
    );
    setBusy(false);
    onBusyChange?.(false);
    finish({
      enabled: results.filter((r) => r.ok).map((r) => r.repoFullName),
      failed: results.filter((r) => !r.ok).map((r) => r.repoFullName),
    });
  };

  const onKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>) => {
    if (openMenu !== null) return;
    if (busy) {
      if (event.key === "Enter" || event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (
      event.key === "Enter" &&
      target?.closest("[data-review-offer-native]") === null
    ) {
      event.preventDefault();
      event.stopPropagation();
      void submit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      finish(undefined);
    }
  };

  return (
    <div
      data-slot="review-offer"
      className={["flex min-h-0 flex-col", className].filter(Boolean).join(" ")}
      onKeyDownCapture={onKeyDownCapture}
      {...props}
    >
      <div className="flex min-h-0 flex-col gap-2.5 overflow-y-auto px-5 pt-3.5 pb-3">
        <div className="flex flex-col gap-1 pt-0.5">
          <h2 className="text-base font-medium text-foreground">
            Want a second pair of eyes on these?
          </h2>
          <p className="text-sm text-muted-foreground-1">
            Capy comments on every pull request the way a careful teammate
            would, like this:
          </p>
        </div>
        <div data-review-offer-native="" className="min-h-59.25">
          {example ?? (
            <div
              role="status"
              aria-label="Loading example"
              className="h-59.25 rounded-(--radius-card) bg-secondary"
            />
          )}
        </div>
      </div>
      <div className="flex flex-col border-t-hairline border-border-1 px-2.5 pt-1 pb-2">
        <div className="flex min-h-7 items-center px-2.5 text-xs font-medium text-muted-foreground-2">
          {groupLabel}
        </div>
        {candidates.map((candidate) => (
          <div
            key={candidate.repoFullName}
            className="flex min-h-(--h-palette-row) items-center gap-2.5 px-2.5"
          >
            <span
              aria-hidden
              className="grid size-(--icon-base) shrink-0 place-items-center rounded-sm bg-secondary text-2xs text-muted-foreground-1 uppercase"
            >
              {candidate.repoFullName.split("/")[0]?.charAt(0)}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">
              {candidate.repoFullName}
            </span>
            {candidate.needsAccess ? (
              <span className="flex shrink-0 items-center gap-2.5">
                <Badge size="sm" color="warning">
                  Needs GitHub App access
                </Badge>
                {onGrantAccess !== undefined && (
                  <span title={grantAccessReason}>
                    <Button
                      variant="link"
                      size="auto-sm"
                      className="focus-gutter"
                      data-review-offer-native=""
                      disabled={grantAccessReason !== undefined}
                      onClick={onGrantAccess}
                    >
                      Grant access
                    </Button>
                  </span>
                )}
              </span>
            ) : (
              <MenuSelect
                items={AUTO_REVIEW_MODES.map(({ value, label }) => ({
                  value,
                  label,
                }))}
                value={modeOf(candidate.repoFullName)}
                onValueChange={(value) =>
                  setModes(
                    (current) =>
                      new Map([
                        ...current,
                        [candidate.repoFullName, value as AutoReviewMode],
                      ]),
                  )
                }
                onOpenChange={(open) =>
                  setOpenMenu(open ? candidate.repoFullName : null)
                }
              >
                <MenuSelectTrigger
                  className="w-29 shrink-0"
                  disabled={busy}
                  data-review-offer-native=""
                  aria-label={`${candidate.repoFullName} automatic reviews`}
                >
                  <MenuSelectValue />
                </MenuSelectTrigger>
                <MenuSelectContent align="end" className="w-72">
                  {AUTO_REVIEW_MODES.map((mode) => (
                    <MenuSelectItem key={mode.value} value={mode.value}>
                      <span className="flex min-w-0 flex-col">
                        <span>{mode.label}</span>
                        <span className="text-xs text-muted-foreground-2">
                          {mode.hint}
                        </span>
                      </span>
                    </MenuSelectItem>
                  ))}
                </MenuSelectContent>
              </MenuSelect>
            )}
          </div>
        ))}
      </div>
      <div
        data-slot="dialog-footer"
        className="flex items-center gap-2 border-t-hairline border-border-1 px-5 pt-4 pb-4"
      >
        <span className="mr-auto min-w-0 truncate text-xs text-muted-foreground-2">
          {REVIEW_CREDITS_NOTE}
        </span>
        <Button
          variant="ghost"
          disabled={busy}
          data-review-offer-native=""
          aria-keyshortcuts="Escape"
          onClick={() => finish(undefined)}
        >
          Skip
        </Button>
        <Button
          ref={primary}
          intent="accent"
          aria-busy={busy || undefined}
          aria-keyshortcuts="Enter"
          onClick={() => void submit()}
        >
          {busy ? "Turning on" : reviewOfferPrimaryLabel(targets.length)}
          <Kbd variant="onFill" className="pointer-coarse:hidden">
            ↵
          </Kbd>
        </Button>
      </div>
    </div>
  );
}
