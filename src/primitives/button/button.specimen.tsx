import { Icon } from "@/primitives/icon";
import { intents } from "@/primitives/intent";
import { Button, ButtonIcon, type ButtonVariants } from "./button";

const variants = [
  "solid",
  "soft",
  "ghost",
  "outline",
  "link",
  "bare",
  "inverse",
  "segmented",
] as const satisfies ReadonlyArray<ButtonVariants["variant"]>;
const sizes = ["xs", "sm", "base", "lg"] as const;
const iconSizes = [
  "icon-xs",
  "icon-sm",
  "icon-sm-narrow",
  "icon-base",
] as const;

export function ButtonSpecimen() {
  return (
    <div className="flex flex-col gap-4 p-6">
      {variants.map((variant) => (
        <div key={variant} className="flex flex-wrap items-center gap-2">
          {sizes.map((size) => (
            <Button key={size} variant={variant} size={size}>
              <ButtonIcon>
                <Icon name="square-plus" />
              </ButtonIcon>
              {variant} {size}
            </Button>
          ))}
          {iconSizes.map((size) => (
            <Button key={size} variant={variant} size={size} aria-label={size}>
              <ButtonIcon>
                <Icon name="square-plus" />
              </ButtonIcon>
            </Button>
          ))}
          <Button variant={variant} data-selected="">
            selected
          </Button>
          <Button variant={variant} disabled>
            disabled
          </Button>
          <Button variant={variant} loading>
            loading
          </Button>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        {intents.map((intent) => (
          <Button key={intent} intent={intent}>
            {intent}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {intents.map((intent) => (
          <Button key={intent} variant="soft" intent={intent}>
            {intent}
          </Button>
        ))}
      </div>
      <div className="flex items-center">
        <Button shape="segment-start">Merge</Button>
        <Button shape="segment-end" size="icon-sm" aria-label="More">
          <ButtonIcon>
            <Icon name="chevron-grabber-vertical" />
          </ButtonIcon>
        </Button>
      </div>
    </div>
  );
}
