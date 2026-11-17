import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { type ComponentProps, useSyncExternalStore } from "react";
import { CrossMediumIcon, GiftBoxIcon, RotateIcon } from "@/components/release";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import {
  dealDismissedKey,
  dealRecipientAtom,
  pendingDealCodeAtom,
} from "./atoms";
import { dealTitle } from "./model";

export type SidebarDealReminderProps = ComponentProps<"div">;

const readDismissed = (code: string) => {
  try {
    return globalThis.localStorage?.getItem(dealDismissedKey(code)) === "true";
  } catch {
    return true;
  }
};

const writeDismissed = (code: string) => {
  try {
    globalThis.localStorage?.setItem(dealDismissedKey(code), "true");
  } catch {}
};

function DealReminderRow({
  title,
  code,
  onDismiss,
}: {
  title: string;
  code: string;
  onDismiss: () => void;
}) {
  return (
    <Card className="group relative flex flex-row items-center gap-2.5 px-3 py-2.5">
      <a
        data-track-owner="shared/sidebar-deal-reminder.tsx#DealReminderRow:Link.1"
        href={`/p/${code}`}
        aria-label={`${title}, open your offer`}
        className="absolute inset-0 rounded-[inherit] outline-none focus-visible:outline-ring-inset"
      >
        <span className="sr-only">{title}</span>
      </a>
      <GiftBoxIcon className="size-(--icon-base) shrink-0 text-foreground" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground-1">Your offer is waiting</p>
      </div>
      <RotateIcon className="size-(--icon-sm) shrink-0 text-muted-foreground-2 group-hover:hidden group-focus-within:hidden" />
      <Button
        data-track-owner="shared/sidebar-deal-reminder.tsx#DealReminderRow:Button[Dismiss offer reminder]"
        variant="bare"
        size="icon-shrink"
        aria-label="Dismiss offer reminder"
        onClick={onDismiss}
        className="relative hidden p-1 group-hover:inline-flex group-focus-within:inline-flex"
      >
        <CrossMediumIcon />
      </Button>
    </Card>
  );
}

export function SidebarDealReminder({
  className,
  ...props
}: SidebarDealReminderProps) {
  const store = useAtomValue(pendingDealCodeAtom);
  const code = useSyncExternalStore(store.subscribe, store.get, () => null) as
    | string
    | null;
  const result = useAtomValue(dealRecipientAtom(code ?? ""));
  const dismissed = useSyncExternalStore(
    store.subscribe,
    () => code === null || readDismissed(code),
    () => true,
  );
  const recipient =
    code !== null &&
    AsyncResult.isSuccess(result) &&
    typeof result.value === "object" &&
    result.value !== null
      ? (result.value as unknown as Record<string, unknown>)
      : undefined;
  const title = dealTitle(recipient);
  if (code === null || title === undefined || dismissed) return null;
  return (
    <div
      className={["shrink-0 px-2 pb-2", className].filter(Boolean).join(" ")}
      {...props}
    >
      <DealReminderRow
        title={title}
        code={code}
        onDismiss={() => writeDismissed(code)}
      />
    </div>
  );
}
