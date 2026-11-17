import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS as DndCss } from "@dnd-kit/utilities";
import { cx } from "class-variance-authority";
import {
  type ComponentProps,
  createContext,
  type MouseEvent,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { settleMotion } from "./motion";
import { reorderIds, restrictToVerticalContainer } from "./reorder";

const MODIFIERS = [restrictToVerticalContainer];

type Settle = { id: string; left: number; top: number };

function useDropSettle() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [settle, setSettle] = useState<Settle | null>(null);

  useLayoutEffect(() => {
    if (settle === null) return;
    setSettle(null);
    const node = containerRef.current?.querySelector(
      `[data-drop-settle="${CSS.escape(settle.id)}"]`,
    );
    if (!node || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = node.getBoundingClientRect();
    const dx = settle.left - rect.left;
    const dy = settle.top - rect.top;
    if (dx === 0 && dy === 0) return;
    const { duration, easing } = settleMotion();
    node.animate(
      [
        { transform: `translate(${dx}px, ${dy}px)` },
        { transform: "translate(0, 0)" },
      ],
      { duration, easing },
    );
  }, [settle]);

  const capture = (event: DragEndEvent) => {
    const rect = event.active.rect.current.translated;
    if (rect === null) return;
    setSettle({ id: String(event.active.id), left: rect.left, top: rect.top });
  };

  return { containerRef, capture };
}

export type SortableListProps = Omit<ComponentProps<"div">, "children"> & {
  ids: readonly string[];
  onReorder: (ids: string[]) => void;
  children?: ReactNode;
};

export function SortableList({
  ids,
  onReorder,
  className,
  children,
  ...props
}: SortableListProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const { containerRef, capture } = useDropSettle();

  const handleDragEnd = (event: DragEndEvent) => {
    capture(event);
    const next = reorderIds(
      ids,
      String(event.active.id),
      event.over === null ? null : String(event.over.id),
    );
    if (next !== null) onReorder(next);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={MODIFIERS}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={[...ids]} strategy={verticalListSortingStrategy}>
        <div
          data-slot="sortable-list"
          {...props}
          ref={containerRef}
          className={cx("flex flex-col", className)}
        >
          {children}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export type SortableRow = ReturnType<typeof useSortable>;

export function useSortableRow(id: string, disabled = false) {
  const row = useSortable({ id, disabled, transition: settleMotion() });
  return {
    row,
    nodeProps: {
      ref: row.setNodeRef,
      style: {
        transform: DndCss.Transform.toString(row.transform),
        transition: row.transition,
      },
      "data-drop-settle": id,
      className: cx(
        row.isDragging &&
          "relative z-(--z-top-bar) rounded-(--radius-card) bg-card shadow-card",
      ),
    },
  };
}

const SortableRowContext = createContext<SortableRow | null>(null);

export type SortableRowProviderProps = {
  row: SortableRow;
  children?: ReactNode;
};

export function SortableRowProvider({
  row,
  children,
}: SortableRowProviderProps) {
  return (
    <SortableRowContext.Provider value={row}>
      {children}
    </SortableRowContext.Provider>
  );
}

const stopPropagation = (event: MouseEvent) => event.stopPropagation();

export type SortableHandleProps = {
  label: string;
  disabled?: boolean;
  title?: string;
  className?: string;
};

export function SortableHandle({
  label,
  disabled = false,
  title,
  className,
}: SortableHandleProps) {
  const row = useContext(SortableRowContext);
  if (row === null)
    throw TypeError("SortableHandle renders inside SortableRowProvider");
  return (
    <button
      data-slot="sortable-handle"
      type="button"
      aria-label={`Reorder ${label}`}
      disabled={disabled}
      title={title}
      data-dragging={row.isDragging ? "" : undefined}
      onClick={stopPropagation}
      className={cx(
        "relative grid size-6 shrink-0 touch-none place-items-center rounded text-muted-foreground-3 outline-none",
        "transition-[color,opacity] duration-hover hover:text-foreground focus-visible:outline-ring-inset",
        "opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 data-[dragging]:opacity-100 pointer-coarse:opacity-100",
        "pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2",
        disabled
          ? "cursor-default group-hover/row:opacity-55 pointer-coarse:opacity-55"
          : row.isDragging
            ? "cursor-grabbing"
            : "cursor-grab",
        className,
      )}
      {...row.attributes}
      {...row.listeners}
    >
      <DotGrid2x3 className="size-3.5" />
    </button>
  );
}

function DotGrid2x3({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      {DOT_GRID_PATHS.map((d) => (
        <path key={d} d={d} stroke="currentColor" strokeWidth="2" />
      ))}
    </svg>
  );
}

const DOT_GRID_PATHS = [
  "M10 5C10 5.55228 9.55228 6 9 6C8.44772 6 8 5.55228 8 5C8 4.44772 8.44772 4 9 4C9.55228 4 10 4.44772 10 5Z",
  "M10 12C10 12.5523 9.55228 13 9 13C8.44772 13 8 12.5523 8 12C8 11.4477 8.44772 11 9 11C9.55228 11 10 11.4477 10 12Z",
  "M10 19C10 19.5523 9.55228 20 9 20C8.44772 20 8 19.5523 8 19C8 18.4477 8.44772 18 9 18C9.55228 18 10 18.4477 10 19Z",
  "M16 12C16 12.5523 15.5523 13 15 13C14.4477 13 14 12.5523 14 12C14 11.4477 14.4477 11 15 11C15.5523 11 16 11.4477 16 12Z",
  "M16 19C16 19.5523 15.5523 20 15 20C14.4477 20 14 19.5523 14 19C14 18.4477 14.4477 18 15 18C15.5523 18 16 18.4477 16 19Z",
  "M16 5C16 5.55228 15.5523 6 15 6C14.4477 6 14 5.55228 14 5C14 4.44772 14.4477 4 15 4C15.5523 4 16 4.44772 16 5Z",
];
