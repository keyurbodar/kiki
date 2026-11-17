import { PreviewCard as BasePreviewCard } from "@base-ui/react/preview-card";
import { cx } from "class-variance-authority";
import {
  type ComponentProps,
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { motion } from "@/lib/motion";
import { overlayPositionerClassName } from "@/primitives/popover";
import {
  type ConeElements,
  cardClosed,
  cardOpened,
  claimOpenCard,
  clearDeferredOpen,
  coneHolds,
  createConeElements,
  deferOpen,
  isWarm,
  OPEN_DELAY,
  ownsOpenCard,
  pointerFromEvent,
  releaseOpenCard,
  shieldedPoint,
  subscribeWarm,
  trackCone,
  warmOnServer,
} from "./interaction";

const coarsePointerQuery = "(pointer: coarse)";

const subscribeCoarsePointer = (onChange: () => void) => {
  if (typeof window === "undefined" || window.matchMedia === undefined) {
    return () => {};
  }
  const media = window.matchMedia(coarsePointerQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};

const isCoarsePointer = () =>
  typeof window !== "undefined" &&
  window.matchMedia !== undefined &&
  window.matchMedia(coarsePointerQuery).matches;

const coarsePointerOnServer = () => false;

type Controller = {
  accountOpen: (open: boolean) => void;
  forceClose: () => void;
  forceOpen: () => void;
  press: () => void;
  pressed: () => boolean;
  release: () => void;
  setOnOpenChange: (handler: ((open: boolean) => void) | undefined) => void;
};

const coneContext = createContext<ConeElements | null>(null);
const controllerContext = createContext<Controller | null>(null);
const insideContext = createContext(false);

/** Whether the calling component renders inside a preview card's popup. */
export const useInsidePreviewCard = () => useContext(insideContext);

export type PreviewCardProps = ComponentProps<typeof BasePreviewCard.Root> & {
  /**
   * How long a hover open waits while another card still owns the pointer.
   * Uncapped hover cards pass this to reveal themselves when the pointer dwells.
   */
  dwellOpen?: number;
};

export function PreviewCard({
  open,
  defaultOpen,
  onOpenChange,
  dwellOpen,
  ...props
}: PreviewCardProps) {
  const [openState, setOpenState] = useState(defaultOpen ?? false);
  const resolvedOpen = open ?? openState;
  const [cone] = useState(createConeElements);
  const touchOnly = useSyncExternalStore(
    subscribeCoarsePointer,
    isCoarsePointer,
    coarsePointerOnServer,
  );
  const [controller] = useState<Controller>(() => {
    const state = {
      wasOpen: false,
      pressed: false,
      onOpenChange: undefined as ((open: boolean) => void) | undefined,
    };
    const accountOpen = (next: boolean) => {
      if (next === state.wasOpen) return;
      state.wasOpen = next;
      if (next) cardOpened();
      else cardClosed();
    };
    const forceClose = () => {
      setOpenState(false);
      state.onOpenChange?.(false);
      accountOpen(false);
      releaseOpenCard(forceClose);
    };
    return {
      accountOpen,
      forceClose,
      forceOpen: () => {
        if (state.pressed) return;
        setOpenState(true);
        state.onOpenChange?.(true);
        accountOpen(true);
        claimOpenCard(forceClose);
      },
      press: () => {
        state.pressed = true;
        if (state.wasOpen) forceClose();
      },
      pressed: () => state.pressed,
      release: () => {
        state.pressed = false;
      },
      setOnOpenChange: (handler) => {
        state.onOpenChange = handler;
      },
    };
  });

  useEffect(() => {
    controller.setOnOpenChange(onOpenChange);
  }, [controller, onOpenChange]);

  useEffect(
    () => () => {
      releaseOpenCard(controller.forceClose);
      controller.accountOpen(false);
    },
    [controller],
  );

  useEffect(() => {
    if (!resolvedOpen) return;
    return trackCone(cone, controller.forceClose);
  }, [cone, controller, resolvedOpen]);

  const handleOpenChange: NonNullable<PreviewCardProps["onOpenChange"]> = (
    next,
    details,
  ) => {
    if (next && (touchOnly || controller.pressed())) {
      details.cancel();
      return;
    }
    const point =
      details.reason === "trigger-hover"
        ? pointerFromEvent(details.event)
        : null;
    if (details.reason === "trigger-hover") {
      if (next && point !== null && shieldedPoint(point[0], point[1])) {
        details.cancel();
        if (details.trigger !== undefined) {
          deferOpen(details.trigger, controller.forceOpen, dwellOpen);
        }
        return;
      }
      if (!next && ownsOpenCard(controller.forceClose) && coneHolds()) {
        details.cancel();
        return;
      }
    }
    if (next) {
      cone.setSeed(point);
      clearDeferredOpen();
    }
    setOpenState(next);
    onOpenChange?.(next, details);
    controller.accountOpen(next);
    if (next) claimOpenCard(controller.forceClose);
    else releaseOpenCard(controller.forceClose);
  };

  return (
    <coneContext.Provider value={cone}>
      <controllerContext.Provider value={controller}>
        <BasePreviewCard.Root
          open={resolvedOpen}
          onOpenChange={handleOpenChange}
          {...props}
        />
      </controllerContext.Provider>
    </coneContext.Provider>
  );
}

export type PreviewCardTriggerProps = ComponentProps<
  typeof BasePreviewCard.Trigger
> & {
  /** Close the card on press when the press is what opened it. */
  closeOnPress?: boolean;
};

export function PreviewCardTrigger({
  delay,
  closeDelay = 0,
  closeOnPress = false,
  onPointerDown,
  onPointerLeave,
  onBlur,
  ...props
}: PreviewCardTriggerProps) {
  const cone = useContext(coneContext);
  const controller = useContext(controllerContext);
  const warm = useSyncExternalStore(subscribeWarm, isWarm, warmOnServer);
  return (
    <BasePreviewCard.Trigger
      ref={cone?.setTrigger}
      data-slot="preview-card-trigger"
      delay={delay ?? (warm ? 0 : OPEN_DELAY)}
      closeDelay={closeDelay}
      onPointerDown={(event) => {
        if (closeOnPress) controller?.press();
        onPointerDown?.(event);
      }}
      onPointerLeave={(event) => {
        if (closeOnPress) controller?.release();
        onPointerLeave?.(event);
      }}
      onBlur={(event) => {
        if (closeOnPress) controller?.release();
        onBlur?.(event);
      }}
      {...props}
    />
  );
}

export type PreviewCardContentProps = Omit<
  ComponentProps<typeof BasePreviewCard.Popup>,
  "className"
> &
  Pick<
    ComponentProps<typeof BasePreviewCard.Positioner>,
    | "side"
    | "align"
    | "sideOffset"
    | "alignOffset"
    | "collisionPadding"
    | "anchor"
  > &
  Pick<ComponentProps<typeof BasePreviewCard.Portal>, "container"> & {
    className?: string;
  };

export function PreviewCardContent({
  side = "right",
  align = "start",
  sideOffset = 8,
  alignOffset,
  collisionPadding = 12,
  anchor,
  container,
  className,
  children,
  ...props
}: PreviewCardContentProps) {
  const cone = useContext(coneContext);
  return (
    <BasePreviewCard.Portal container={container}>
      <BasePreviewCard.Positioner
        data-slot="preview-card"
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        collisionPadding={collisionPadding}
        anchor={anchor}
        className={overlayPositionerClassName}
      >
        <BasePreviewCard.Popup
          ref={cone?.setPopup}
          data-slot="preview-card-content"
          className={cx(
            "rounded-(--radius-overlay) border-hairline border-border-2 bg-popover text-foreground shadow-overlay",
            motion.popup,
            "flex max-h-(--available-height) w-72 flex-col overflow-hidden p-3",
            className,
          )}
          {...props}
        >
          <insideContext.Provider value={true}>
            {children}
          </insideContext.Provider>
        </BasePreviewCard.Popup>
      </BasePreviewCard.Positioner>
    </BasePreviewCard.Portal>
  );
}
