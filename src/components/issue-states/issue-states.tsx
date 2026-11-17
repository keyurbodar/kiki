import { cx } from "class-variance-authority";
import { type IssueColor, issueColors } from "@/data/api/schemas/issue";
import { Button, type ButtonVariants } from "@/primitives/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";

export type IssueColorKey = IssueColor;

/** Capy's issue colour keys with their label, text utility and swatch utility. */
export const issueColorStyles: Record<
  IssueColorKey,
  { label: string; text: string; swatch: string }
> = {
  gray: {
    label: "Gray",
    text: "text-muted-foreground-3",
    swatch: "bg-muted-foreground-3",
  },
  blue: { label: "Blue", text: "text-info", swatch: "bg-info" },
  purple: { label: "Purple", text: "text-complete", swatch: "bg-complete" },
  pink: { label: "Pink", text: "text-pink", swatch: "bg-pink" },
  red: { label: "Red", text: "text-destructive", swatch: "bg-destructive" },
  orange: { label: "Orange", text: "text-orange", swatch: "bg-orange" },
  yellow: { label: "Yellow", text: "text-progress", swatch: "bg-progress" },
  lime: { label: "Lime", text: "text-lime", swatch: "bg-lime" },
  green: { label: "Green", text: "text-success", swatch: "bg-success" },
};

export const isIssueColorKey = (value: string): value is IssueColorKey =>
  (issueColors as ReadonlyArray<string>).includes(value);

export type IssueColorSwatchPickerProps = {
  value: IssueColorKey;
  onChange: (color: IssueColorKey) => void;
  size?: ButtonVariants["size"];
  className?: string;
};

/** A radio group of colour swatches, each with its name in a tooltip. */
export function IssueColorSwatchPicker({
  value,
  onChange,
  size,
  className,
}: IssueColorSwatchPickerProps) {
  return (
    <div role="radiogroup" aria-label="Color" className={className}>
      {issueColors.map((key) => (
        <Tooltip key={key}>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size={size}
                role="radio"
                aria-checked={key === value}
                aria-label={issueColorStyles[key].label}
                data-selected={key === value || undefined}
                onClick={() => onChange(key)}
              >
                <span
                  aria-hidden
                  className={cx(
                    "size-3 rounded-full",
                    issueColorStyles[key].swatch,
                  )}
                />
              </Button>
            }
          />
          <TooltipContent side="top">
            {issueColorStyles[key].label}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
