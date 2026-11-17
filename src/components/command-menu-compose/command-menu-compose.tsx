import {
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  PaletteHint,
  paletteSeparatorClass,
} from "@/components/command-menu-search";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";

export type ComposeProject = { id: string; name: string };

export type ComposeSubmission = {
  projectId?: string;
  title?: string;
  text: string;
};

export type CommandMenuComposeProps = Omit<
  ComponentProps<"div">,
  "onSubmit"
> & {
  project?: ComposeProject;
  projects?: ReadonlyArray<ComposeProject>;
  onProjectChange?: (project: ComposeProject) => void;
  defaultText?: string;
  defaultTitle?: string;
  from?: "direct" | "root";
  onSubmit?: (submission: ComposeSubmission) => Promise<unknown> | undefined;
  onBack?: () => void;
  footer?: (hints: ReactNode) => ReactNode;
};

export const composePlaceholder = "Ask anything, / for commands, @ for context";

export const composeTitleInputClass =
  "h-(--h-control-sm) min-w-[10ch] max-w-full rounded bg-transparent px-1.5 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground-3";

export const composeHeaderClass =
  "flex h-11 shrink-0 items-center gap-1 pr-1.5 pl-4";

export const composeBodyClass = "min-h-0 p-3";

export const composeEditorClass =
  "max-h-[50dvh] min-h-30 w-full resize-none bg-transparent text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground-3 max-md:min-h-16";

export const composeFailure = {
  title: "Could not start the thread",
  description: "Your draft was kept",
};

export function CommandMenuCompose({
  project,
  projects = [],
  onProjectChange,
  defaultText = "",
  defaultTitle = "",
  from = "direct",
  onSubmit,
  onBack,
  footer,
  className,
  ...props
}: CommandMenuComposeProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [text, setText] = useState(defaultText);
  const editor = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    if (text.trim() === "") return;
    const submission: ComposeSubmission = {
      projectId: project?.id,
      title: title.trim() === "" ? undefined : title.trim(),
      text,
    };
    const pending = onSubmit?.(submission);
    if (pending === undefined) return;
    pending.then(
      () => {
        setText("");
        setTitle("");
      },
      () =>
        toast.error(composeFailure.title, {
          description: composeFailure.description,
        }),
    );
  };

  const onRootKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      event.key !== "Escape" ||
      !event.currentTarget.contains(event.target as Node)
    )
      return;
    event.preventDefault();
    event.stopPropagation();
    onBack?.();
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Escape inside the compose view goes back, as in Capy
    <div
      className={["flex min-h-0 flex-col", className].filter(Boolean).join(" ")}
      onKeyDown={onRootKeyDown}
      {...props}
    >
      <div className={composeHeaderClass}>
        <div
          data-slot="project-select"
          className="flex min-w-0 items-center"
        >
          <select
            aria-label="Project"
            className="h-(--h-control-sm) max-w-48 cursor-pointer truncate rounded bg-transparent text-sm font-medium text-foreground outline-none"
            value={project?.id ?? ""}
            onChange={(event) => {
              const next = projects.find(
                (option) => option.id === event.target.value,
              );
              if (next !== undefined) onProjectChange?.(next);
            }}
          >
            {project === undefined ? (
              <option value="">No project</option>
            ) : null}
            {projects.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
        <Icon
          name="chevron-right"
          size="sm"
          aria-hidden
          className="text-muted-foreground-3"
        />
        <Input
          variant="ghost"
          size="sm"
          value={title}
          placeholder="New thread"
          aria-label="Thread title"
          maxLength={255}
          className={composeTitleInputClass}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              editor.current?.focus();
            } else if (event.key === "Escape" && title !== "") {
              event.preventDefault();
              event.stopPropagation();
              setTitle("");
            }
          }}
        />
      </div>
      <div className={paletteSeparatorClass} />
      <div className={composeBodyClass}>
        <div data-slot="composer">
          <textarea
            ref={editor}
            // biome-ignore lint/a11y/noAutofocus: the compose view focuses its editor when it opens
            autoFocus
            aria-label="Message"
            value={text}
            placeholder={composePlaceholder}
            className={composeEditorClass}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return;
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
          />
        </div>
      </div>
      {footer?.(
        <>
          <PaletteHint keys="↵" label="Start" />
          <PaletteHint
            keys="Esc"
            label={from === "direct" ? "Close" : "Back"}
          />
        </>,
      )}
    </div>
  );
}
