import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import type { LexicalEditor } from "lexical";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconId } from "@/primitives/icon";
import { menuRowVariants } from "@/primitives/menu";
import {
  $getSelectedTableCell,
  filterInsertOptions,
  INSERT_OPTIONS,
  type InsertOption,
} from "./blocks";
import {
  cn,
  menuIconSlotClass,
  overlayLayerClass,
  overlaySurfaceClass,
  preventMouseDown,
} from "./shared";

class SlashOption extends MenuOption {
  label: string;
  iconName: IconId;
  keywords: string;
  apply: () => void;

  constructor(option: InsertOption) {
    super(option.key);
    this.label = option.label;
    this.iconName = option.icon;
    this.keywords = option.keywords;
    this.apply = option.apply;
  }
}

const SLASH_OPTIONS = INSERT_OPTIONS.map((option) => new SlashOption(option));

export function SlashMenuPlugin() {
  const [editor] = useLexicalComposerContext();
  const [query, setQuery] = useState<string | null>(null);
  const match = useBasicTypeaheadTriggerMatch("/", {
    minLength: 0,
    maxLength: 24,
  });
  const options = filterInsertOptions(SLASH_OPTIONS, query);

  return (
    <LexicalTypeaheadMenuPlugin<SlashOption>
      triggerFn={(text: string, current: LexicalEditor) =>
        current.getEditorState().read($getSelectedTableCell) === null
          ? match(text, current)
          : null
      }
      options={options}
      onQueryChange={setQuery}
      onSelectOption={(option, textNode, closeMenu) => {
        editor.update(() => {
          textNode?.remove();
          option.apply();
        });
        closeMenu();
      }}
      menuRenderFn={(
        anchor,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
      ) =>
        anchor.current === null || options.length === 0
          ? null
          : createPortal(
              <div
                role="listbox"
                aria-label="Block type"
                className={cn(
                  overlaySurfaceClass,
                  overlayLayerClass,
                  "absolute top-0 left-0 w-56",
                )}
              >
                {options.map((option, index) => (
                  // biome-ignore lint/a11y/useKeyWithClickEvents: the typeahead plugin drives the keyboard
                  <div
                    key={option.key}
                    ref={(element) => option.setRefElement(element)}
                    role="option"
                    tabIndex={-1}
                    aria-selected={index === selectedIndex}
                    data-highlighted={index === selectedIndex ? "" : undefined}
                    className={menuRowVariants()}
                    onMouseDown={preventMouseDown}
                    onClick={() => selectOptionAndCleanUp(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <span className={menuIconSlotClass}>
                      <Icon name={option.iconName} />
                    </span>
                    <span className="min-w-0 truncate">{option.label}</span>
                  </div>
                ))}
              </div>,
              anchor.current,
            )
      }
    />
  );
}
