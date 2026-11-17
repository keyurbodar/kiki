import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { toast } from "sonner";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Drawer, DrawerContent, DrawerTitle } from "@/primitives/drawer";
import { Icon } from "@/primitives/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  applyEdit,
  CROP_ASPECTS,
  type CropAspect,
  type CropHandle,
  dragCrop,
  FIXED_RATIOS,
  FULL_CROP,
  fitAspect,
  type ImageEdit,
  isFullCrop,
  loadImage,
  lockAspect,
  NO_EDIT,
  rotate,
  rotateCrop,
  rotatedSize,
  squareCrop,
  zoomCrop,
} from "./crop";

export * from "./crop";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

export type EditableImage = {
  name: string;
  blob: Blob;
  source: Blob;
  edit: ImageEdit;
  image: string;
};

export type ImageCropEditorProps = {
  image: EditableImage;
  title: string;
  aspect?: "free" | "square";
  onClose: () => void;
  onSave: (image: EditableImage) => void;
};

const HANDLES: Array<{ id: CropHandle; className: string }> = [
  { id: "nw", className: "-top-1 -left-1 cursor-nwse-resize" },
  { id: "ne", className: "-top-1 -right-1 cursor-nesw-resize" },
  { id: "sw", className: "-bottom-1 -left-1 cursor-nesw-resize" },
  { id: "se", className: "-right-1 -bottom-1 cursor-nwse-resize" },
  { id: "n", className: "-top-1 left-1/2 -translate-x-1/2 cursor-ns-resize" },
  {
    id: "s",
    className: "-bottom-1 left-1/2 -translate-x-1/2 cursor-ns-resize",
  },
  { id: "w", className: "top-1/2 -left-1 -translate-y-1/2 cursor-ew-resize" },
  { id: "e", className: "top-1/2 -right-1 -translate-y-1/2 cursor-ew-resize" },
];

const touchQuery = "(hover: none) and (pointer: coarse)";

const narrowQuery = () => {
  const md = getComputedStyle(document.documentElement)
    .getPropertyValue("--breakpoint-md")
    .trim();
  return md ? `(width < ${md})` : "not all";
};

const subscribeMobile = (onChange: () => void) => {
  const queries = [
    window.matchMedia(narrowQuery()),
    window.matchMedia(touchQuery),
  ];
  for (const query of queries) query.addEventListener("change", onChange);
  return () => {
    for (const query of queries) query.removeEventListener("change", onChange);
  };
};

const isMobile = () =>
  window.matchMedia(narrowQuery()).matches &&
  window.matchMedia(touchQuery).matches;

export const useMobileSheet = () =>
  useSyncExternalStore(subscribeMobile, isMobile, () => false);

const viewportSize = () => {
  const main = document
    .querySelector('[data-slot="sidebar-panel"] > main')
    ?.getBoundingClientRect();
  return main !== undefined && main.width > 0 && main.height > 0
    ? { width: main.width, height: main.height }
    : {
        width: Math.max(1, window.innerWidth),
        height: Math.max(1, window.innerHeight),
      };
};

function useElementSize() {
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );
  const ref = useCallback((element: HTMLElement | null) => {
    if (element === null) return;
    const measure = () => {
      const box = element.getBoundingClientRect();
      setSize((current) =>
        current?.width === box.width && current.height === box.height
          ? current
          : { width: box.width, height: box.height },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [size, ref] as const;
}

function IconTooltipButton({
  label,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: "arrow-rotate-counter-clockwise" | "arrow-rotate-clockwise";
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
          >
            <Icon name={icon} />
          </Button>
        }
      />
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

export function ImageCropEditor({
  image,
  title,
  aspect = "free",
  onClose,
  onSave,
}: ImageCropEditorProps) {
  const animated = image.blob.type === "image/gif";
  const mobile = useMobileSheet();
  const [edit, setEdit] = useState<ImageEdit>(image.edit);
  const [ratio, setRatio] = useState<CropAspect>(
    aspect === "square" ? "1:1" : "free",
  );
  const [loaded, setLoaded] = useState<{
    url: string;
    width: number;
    height: number;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewport] = useState(viewportSize);
  const [frame, frameRef] = useElementSize();
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const url = URL.createObjectURL(image.source);
    let alive = true;
    loadImage(image.source)
      .then((element) => {
        if (!alive) return;
        const size = {
          width: element.naturalWidth,
          height: element.naturalHeight,
        };
        setLoaded({ url, ...size });
        if (aspect === "square" && image.edit.crop === undefined)
          setEdit((current) => ({
            ...current,
            crop: squareCrop(rotatedSize(size, current.rotation)),
          }));
      })
      .catch(() => {
        if (!alive) return;
        toast.error("Could not read the image");
        closeRef.current();
      });
    return () => {
      alive = false;
      URL.revokeObjectURL(url);
    };
  }, [image.source, image.edit.crop, aspect]);

  const stageRef = useCallback(
    (element: HTMLDivElement | null) => {
      const cleanup = frameRef(element);
      if (element === null || animated) return cleanup;
      const onWheel = (event: WheelEvent) => {
        event.preventDefault();
        setEdit((current) => {
          const crop = zoomCrop(
            current.crop ?? FULL_CROP,
            Math.exp(event.deltaY * 0.002),
          );
          return { ...current, crop: isFullCrop(crop) ? undefined : crop };
        });
      };
      element.addEventListener("wheel", onWheel, { passive: false });
      return () => {
        cleanup?.();
        element.removeEventListener("wheel", onWheel);
      };
    },
    [frameRef, animated],
  );

  const turn = (turns: number) => {
    setEdit({
      rotation: rotate(edit.rotation, turns),
      crop: edit.crop === undefined ? undefined : rotateCrop(edit.crop, turns),
    });
    if (aspect === "free") setRatio("free");
  };

  const reset = () => {
    setEdit(
      aspect === "square" && loaded !== null
        ? { rotation: 0, crop: squareCrop(loaded) }
        : NO_EDIT,
    );
    if (aspect === "free") setRatio("free");
  };

  const crop = edit.crop ?? FULL_CROP;
  const sideways = edit.rotation === 90 || edit.rotation === 270;
  const shown = loaded === null ? null : rotatedSize(loaded, edit.rotation);
  const shape =
    shown === null
      ? viewport.width / viewport.height
      : shown.width / shown.height;
  const ratioOf = (id: CropAspect) => {
    const value =
      id === "original"
        ? shape
        : id === "window"
          ? viewport.width / viewport.height
          : FIXED_RATIOS[id];
    return value === undefined ? null : value / shape;
  };
  const locked = ratioOf(ratio);

  const pickRatio = (id: CropAspect) => {
    setRatio(id);
    const value = ratioOf(id);
    if (value === null) return;
    const next = fitAspect(crop, value);
    setEdit((current) => ({
      ...current,
      crop: isFullCrop(next) ? undefined : next,
    }));
  };

  const startDrag =
    (handle: CropHandle | "move") =>
    (event: ReactPointerEvent<HTMLElement>) => {
      if (frame === null || event.button !== 0) return;
      event.stopPropagation();
      const element = event.currentTarget;
      element.setPointerCapture?.(event.pointerId);
      const start = edit.crop ?? FULL_CROP;
      const origin = { x: event.clientX, y: event.clientY };
      const move = (moveEvent: PointerEvent) => {
        const next = dragCrop(
          start,
          handle,
          (moveEvent.clientX - origin.x) / frame.width,
          (moveEvent.clientY - origin.y) / frame.height,
        );
        const fitted =
          locked === null || handle === "move"
            ? next
            : lockAspect(start, next, handle, locked);
        setEdit((current) => ({
          ...current,
          crop: isFullCrop(fitted) ? undefined : fitted,
        }));
      };
      const end = () => {
        element.removeEventListener("pointermove", move);
        element.removeEventListener("pointerup", end);
        element.removeEventListener("pointercancel", end);
      };
      element.addEventListener("pointermove", move);
      element.addEventListener("pointerup", end);
      element.addEventListener("pointercancel", end);
    };

  const apply = () => {
    setSaving(true);
    applyEdit(image.source, edit.rotation, edit.crop)
      .then((blob) =>
        onSave({ ...image, blob, edit, image: URL.createObjectURL(blob) }),
      )
      .catch(() => toast.error("Could not adjust the image"))
      .finally(() => setSaving(false));
  };

  const stage = (
    <div
      ref={stageRef}
      data-slot="image-crop-stage"
      className="relative touch-none overflow-hidden rounded-(--radius-card) border-(length:--border-width-hairline) border-border-2 bg-bg [container-type:size]"
      style={{
        aspectRatio: String(shape),
        width: mobile
          ? "100%"
          : `min(100%, calc(var(--crop-editor-h) * ${shape}))`,
      }}
    >
      {loaded === null ? null : (
        <img
          src={loaded.url}
          alt=""
          draggable={false}
          className={
            sideways
              ? "absolute top-1/2 left-1/2 h-[100cqw] w-[100cqh] max-w-none select-none"
              : "block size-full select-none"
          }
          style={{
            transform: sideways
              ? `translate(-50%, -50%) rotate(${edit.rotation}deg)`
              : edit.rotation === 180
                ? "rotate(180deg)"
                : undefined,
          }}
        />
      )}
      {animated || loaded === null ? null : (
        <div
          data-slot="image-crop-area"
          className="absolute cursor-move shadow-(--crop-editor-scrim) ring-1 ring-white/80 ring-inset"
          style={{
            left: `${crop.x * 100}%`,
            top: `${crop.y * 100}%`,
            width: `${crop.width * 100}%`,
            height: `${crop.height * 100}%`,
          }}
          onPointerDown={startDrag("move")}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: "var(--crop-editor-grid)",
              backgroundSize: "33.334% 33.334%",
            }}
          />
          {HANDLES.map((handle) => (
            <span
              key={handle.id}
              role="presentation"
              className={cx(
                "absolute size-2.5 rounded-xs border-(length:--border-width-hairline) border-black/40 bg-white",
                handle.className,
              )}
              onPointerDown={startDrag(handle.id)}
            />
          ))}
        </div>
      )}
    </div>
  );

  const rotateButtons = (
    <>
      <IconTooltipButton
        label="Rotate left"
        icon="arrow-rotate-counter-clockwise"
        disabled={animated}
        onClick={() => turn(3)}
      />
      <IconTooltipButton
        label="Rotate right"
        icon="arrow-rotate-clockwise"
        disabled={animated}
        onClick={() => turn(1)}
      />
    </>
  );

  const aspects =
    animated || aspect === "square" ? null : (
      // biome-ignore lint/a11y/useSemanticElements: Capy renders the aspect choices as a div group
      <div
        role="group"
        aria-label="Crop aspect"
        className={cx(
          "flex items-center gap-1.5",
          mobile
            ? "-mx-4 overflow-x-auto px-4 [scrollbar-width:none]"
            : "flex-wrap",
        )}
      >
        {CROP_ASPECTS.map((option) => (
          <Button
            key={option.id}
            size="xs"
            variant="ghost"
            className="shrink-0"
            disabled={loaded === null}
            data-selected={ratio === option.id ? "" : undefined}
            onClick={() => pickRatio(option.id)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    );

  const resetButton = (
    <Button variant="ghost" size="xs" className="ml-auto" onClick={reset}>
      <Icon name="arrow-undo-up" />
      Reset
    </Button>
  );

  const toolbar = mobile ? (
    <>
      <div className="flex items-center gap-1.5">
        {rotateButtons}
        {resetButton}
      </div>
      {aspects}
    </>
  ) : (
    <div className="flex flex-wrap items-center gap-1.5">
      {rotateButtons}
      {aspects === null ? null : (
        // biome-ignore lint/a11y/useSemanticElements: matches Capy's vertical separator inside a flex row
        <span
          role="separator"
          aria-orientation="vertical"
          className="mx-1 h-4 w-(length:--border-width-hairline) self-center bg-border"
        />
      )}
      {aspects}
      {resetButton}
    </div>
  );

  const actions = (
    <>
      <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
        Cancel
      </Button>
      <Button
        intent="accent"
        size="sm"
        onClick={apply}
        disabled={saving}
        aria-busy={saving || undefined}
        data-loading={saving ? "" : undefined}
      >
        Apply
      </Button>
    </>
  );

  if (mobile)
    return (
      <Drawer open onOpenChange={(open) => !open && onClose()}>
        <DrawerContent>
          <div className="flex flex-col gap-3 px-4 pb-2">
            <DrawerTitle className="text-base font-medium text-foreground">
              {title}
            </DrawerTitle>
            {stage}
            {toolbar}
          </div>
          <div className="sticky bottom-0 flex justify-end gap-2 bg-popover px-4 py-3">
            {actions}
          </div>
        </DrawerContent>
      </Drawer>
    );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex w-full justify-center">{stage}</div>
          {toolbar}
        </DialogBody>
        <DialogFooter>{actions}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
