import type { ComponentProps } from "react";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";

/** A secret's reveal/copy handles, as Capy's environment variables rows hold them. */
export type MaskedValueState = {
  readonly readable: boolean;
  readonly revealed: string | null;
  readonly toggleReveal: () => void;
  readonly copyValue: () => void;
};

export type MaskedValueRowProps = ComponentProps<"div"> & {
  readonly name?: string;
  readonly value?: MaskedValueState;
  readonly loading?: boolean;
};

export function MaskedValueRow({
  name,
  value,
  loading,
  ...props
}: MaskedValueRowProps) {
  if (value === undefined)
    return <div data-slot="masked-value-row" {...props} />;
  if (!value.readable)
    return (
      <div data-slot="masked-value-row" {...props}>
        <span className="min-w-0 truncate px-2 py-1 text-xs font-normal text-muted-foreground-3">
          ••••••••••
        </span>
      </div>
    );
  return (
    <div
      data-slot="masked-value-row"
      className="flex min-w-0 items-center gap-1"
      {...props}
    >
      <button
        type="button"
        aria-label={`Copy ${name ?? "value"}`}
        onClick={value.copyValue}
        className={
          value.revealed === null
            ? "min-h-6 min-w-24 cursor-pointer truncate rounded px-2 py-1 text-left text-xs font-normal transition-colors duration-100 text-muted-foreground-3 hover:bg-secondary outline-none focus-visible:outline-ring-inset"
            : "min-h-6 min-w-24 cursor-pointer truncate rounded px-2 py-1 text-left text-xs font-normal transition-colors duration-100 bg-secondary text-foreground hover:bg-secondary-hover outline-none focus-visible:outline-ring-inset"
        }
      >
        {value.revealed === null
          ? "••••••••••"
          : value.revealed === ""
            ? "(empty)"
            : value.revealed}
      </button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={value.revealed === null ? "Reveal value" : "Hide value"}
        loading={loading}
        onClick={value.toggleReveal}
      >
        <Icon
          name={value.revealed === null ? "eye-open" : "eye-slash"}
          className="size-(--icon-sm)"
        />
      </Button>
    </div>
  );
}
