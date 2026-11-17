import {
  Component,
  type ComponentProps,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { useCodeWrap } from "./code-wrap";
import {
  type CodeToken,
  disposeHighlight,
  highlightCode,
  tokenStyle,
} from "./highlight";
import { MarkdownCodeHeader, MarkdownCodeLanguage } from "./parts";

const COPY_RESET_MS = 2000;

class HighlightBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export type CopyButtonProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
  text: string;
};

export function CopyButton({ text, ...props }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <Button
      {...props}
      variant="ghost"
      size="icon-xs"
      className="!size-(--h-control-xs)"
      aria-label={copied ? "Copied" : "Copy code"}
      onClick={() => {
        void navigator.clipboard?.writeText(text);
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), COPY_RESET_MS);
      }}
    >
      <Icon name={copied ? "checkmark-1" : "clipboard"} />
    </Button>
  );
}

export type CodeBlockProps = {
  text: string;
  language?: string;
  /** False while the fence is still streaming. */
  complete?: boolean;
  /** Stable per block; keys the highlighter's in-flight work. */
  blockKey: string;
};

type Highlighted = { source: string; tokens: CodeToken[] };

/** shared/markdown/code-block: header (language, wrap, copy) and shiki body. */
export function CodeBlock({ text, language, blockKey }: CodeBlockProps) {
  const [highlighted, setHighlighted] = useState<Highlighted>();
  const [wrap, setWrap] = useCodeWrap();
  useEffect(() => {
    let cancelled = false;
    void highlightCode(blockKey, text, language ?? "text").then((tokens) => {
      if (!cancelled && tokens) setHighlighted({ source: text, tokens });
    });
    return () => {
      cancelled = true;
    };
  }, [blockKey, text, language]);
  useEffect(() => () => disposeHighlight(blockKey), [blockKey]);
  const current =
    highlighted !== undefined && text.startsWith(highlighted.source)
      ? highlighted
      : undefined;
  const rest = current === undefined ? text : text.slice(current.source.length);
  return (
    <div data-component="markdown-code" data-wrap={wrap ? "" : undefined}>
      <MarkdownCodeHeader>
        <MarkdownCodeLanguage>{language ?? "text"}</MarkdownCodeLanguage>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon-xs"
            className="!size-(--h-control-xs)"
            aria-label={wrap ? "Disable line wrapping" : "Wrap lines"}
            aria-pressed={wrap}
            data-selected={wrap ? "" : undefined}
            onClick={() => setWrap(!wrap)}
          >
            <Icon name="linebreak" />
          </Button>
          <CopyButton text={text} />
        </div>
      </MarkdownCodeHeader>
      <HighlightBoundary
        fallback={
          <pre>
            <code>{text}</code>
          </pre>
        }
      >
        <pre>
          <code>
            {current?.tokens.map(([content, style], index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: tokens are positional and only ever append
              <span key={index} style={tokenStyle(style)}>
                {content}
              </span>
            ))}
            {rest ? <span>{rest}</span> : null}
          </code>
        </pre>
      </HighlightBoundary>
    </div>
  );
}
