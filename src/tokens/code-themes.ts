/*
 * Capy's code highlighting themes, value for value from the production bundle
 * (capy-light-*.js and capy-dark-*.js, loaded by shiki.worker). The markdown
 * code block maps them onto --shiki-light / --shiki-dark per token.
 */
import type { ThemeRegistration } from "shiki";

export const capyLightCodeTheme = {
  colors: {
    "editor.background": "#ffffff",
    "editor.foreground": "#1e1e1e",
    foreground: "#1e1e1e",
    "editorCursor.foreground": "#3b5de8",
    "editor.lineHighlightBorder": "#00000000",
    "editor.selectionBackground": "#3b5de833",
    "editorLineNumber.foreground": "#9c9c9d",
    "editorLineNumber.activeForeground": "#6a6a6b",
    "textLink.foreground": "#3b5de8",
    "gitDecoration.addedResourceForeground": "#338a31",
    "gitDecoration.untrackedResourceForeground": "#338a31",
    "gitDecoration.deletedResourceForeground": "#b9463f",
    "gitDecoration.modifiedResourceForeground": "#3b5de8",
    "gitDecoration.ignoredResourceForeground": "#9c9c9d",
  },
  name: "capy-light",
  semanticHighlighting: true,
  tokenColors: [
    {
      scope: ["comment", "punctuation.definition.comment", "string.comment"],
      settings: {
        foreground: "#545c64",
      },
    },
    {
      scope: [
        "constant",
        "entity.name.constant",
        "variable.other.constant",
        "variable.other.enummember",
        "variable.language",
      ],
      settings: {
        foreground: "#00665f",
      },
    },
    {
      scope: ["entity", "entity.name"],
      settings: {
        foreground: "#6c40bc",
      },
    },
    {
      scope: "variable.parameter.function",
      settings: {
        foreground: "#24292e",
      },
    },
    {
      scope: "entity.name.tag",
      settings: {
        foreground: "#1a682d",
      },
    },
    {
      scope: "keyword",
      settings: {
        foreground: "#a82d39",
      },
    },
    {
      scope: ["storage", "storage.type"],
      settings: {
        foreground: "#a82d39",
      },
    },
    {
      scope: [
        "storage.modifier.package",
        "storage.modifier.import",
        "storage.type.java",
      ],
      settings: {
        foreground: "#24292e",
      },
    },
    {
      scope: [
        "string",
        "punctuation.definition.string",
        "string punctuation.section.embedded source",
      ],
      settings: {
        foreground: "#032f62",
      },
    },
    {
      scope: "support",
      settings: {
        foreground: "#00665f",
      },
    },
    {
      scope: "meta.property-name",
      settings: {
        foreground: "#00665f",
      },
    },
    {
      scope: "variable",
      settings: {
        foreground: "#984106",
      },
    },
    {
      scope: "variable.other",
      settings: {
        foreground: "#24292e",
      },
    },
    {
      scope: "invalid.broken",
      settings: {
        fontStyle: "italic",
        foreground: "#b21d28",
      },
    },
    {
      scope: "invalid.deprecated",
      settings: {
        fontStyle: "italic",
        foreground: "#b21d28",
      },
    },
    {
      scope: "invalid.illegal",
      settings: {
        fontStyle: "italic",
        foreground: "#b21d28",
      },
    },
    {
      scope: "invalid.unimplemented",
      settings: {
        fontStyle: "italic",
        foreground: "#b21d28",
      },
    },
    {
      scope: "carriage-return",
      settings: {
        background: "#ffeef0",
        content: "^M",
        fontStyle: "italic underline",
        foreground: "#b21d28",
      },
    },
    {
      scope: "message.error",
      settings: {
        foreground: "#b21d28",
      },
    },
    {
      scope: "string variable",
      settings: {
        foreground: "#00665f",
      },
    },
    {
      scope: ["source.regexp", "string.regexp"],
      settings: {
        foreground: "#032f62",
      },
    },
    {
      scope: [
        "string.regexp.character-class",
        "string.regexp constant.character.escape",
        "string.regexp source.ruby.embedded",
        "string.regexp string.regexp.arbitrary-repitition",
      ],
      settings: {
        foreground: "#032f62",
      },
    },
    {
      scope: "string.regexp constant.character.escape",
      settings: {
        fontStyle: "bold",
        foreground: "#1a682d",
      },
    },
    {
      scope: "support.constant",
      settings: {
        foreground: "#00665f",
      },
    },
    {
      scope: "support.variable",
      settings: {
        foreground: "#00665f",
      },
    },
    {
      scope: "meta.module-reference",
      settings: {
        foreground: "#00665f",
      },
    },
    {
      scope: "punctuation.definition.list.begin.markdown",
      settings: {
        foreground: "#984106",
      },
    },
    {
      scope: ["markup.heading", "markup.heading entity.name"],
      settings: {
        fontStyle: "bold",
        foreground: "#00665f",
      },
    },
    {
      scope: "markup.quote",
      settings: {
        foreground: "#1a682d",
      },
    },
    {
      scope: "markup.italic",
      settings: {
        fontStyle: "italic",
        foreground: "#24292e",
      },
    },
    {
      scope: "markup.bold",
      settings: {
        fontStyle: "bold",
        foreground: "#24292e",
      },
    },
    {
      scope: ["markup.underline"],
      settings: {
        fontStyle: "underline",
      },
    },
    {
      scope: ["markup.strikethrough"],
      settings: {
        fontStyle: "strikethrough",
      },
    },
    {
      scope: "markup.inline.raw",
      settings: {
        foreground: "#00665f",
      },
    },
    {
      scope: [
        "markup.deleted",
        "meta.diff.header.from-file",
        "punctuation.definition.deleted",
      ],
      settings: {
        background: "#ffeef0",
        foreground: "#b21d28",
      },
    },
    {
      scope: [
        "markup.inserted",
        "meta.diff.header.to-file",
        "punctuation.definition.inserted",
      ],
      settings: {
        background: "#f0fff4",
        foreground: "#1a682d",
      },
    },
    {
      scope: ["markup.changed", "punctuation.definition.changed"],
      settings: {
        background: "#ffebda",
        foreground: "#984106",
      },
    },
    {
      scope: ["markup.ignored", "markup.untracked"],
      settings: {
        background: "#f0f5fa",
        foreground: "#032f62",
      },
    },
    {
      scope: "meta.diff.range",
      settings: {
        fontStyle: "bold",
        foreground: "#6c40bc",
      },
    },
    {
      scope: "meta.diff.header",
      settings: {
        foreground: "#00665f",
      },
    },
    {
      scope: "meta.separator",
      settings: {
        fontStyle: "bold",
        foreground: "#00665f",
      },
    },
    {
      scope: "meta.output",
      settings: {
        foreground: "#00665f",
      },
    },
    {
      scope: [
        "brackethighlighter.tag",
        "brackethighlighter.curly",
        "brackethighlighter.round",
        "brackethighlighter.square",
        "brackethighlighter.angle",
        "brackethighlighter.quote",
      ],
      settings: {
        foreground: "#545c65",
      },
    },
    {
      scope: "brackethighlighter.unmatched",
      settings: {
        foreground: "#b21d28",
      },
    },
    {
      scope: ["constant.other.reference.link", "string.other.link"],
      settings: {
        fontStyle: "underline",
        foreground: "#2a44af",
      },
    },
  ],
  type: "light",
} as ThemeRegistration;

export const capyDarkCodeTheme = {
  colors: {
    "editor.background": "#181819",
    "editor.foreground": "#f5f5f5",
    foreground: "#f5f5f5",
    "editorCursor.foreground": "#456af6",
    "editor.lineHighlightBorder": "#00000000",
    "editor.selectionBackground": "#456af633",
    "editorLineNumber.foreground": "#6b6b6c",
    "editorLineNumber.activeForeground": "#a6a6a7",
    "textLink.foreground": "#93aff8",
    "gitDecoration.addedResourceForeground": "#60ae5c",
    "gitDecoration.untrackedResourceForeground": "#60ae5c",
    "gitDecoration.deletedResourceForeground": "#db6c66",
    "gitDecoration.modifiedResourceForeground": "#93aff8",
    "gitDecoration.ignoredResourceForeground": "#6b6b6c",
  },
  name: "capy-dark",
  semanticHighlighting: true,
  tokenColors: [
    {
      scope: ["comment", "punctuation.definition.comment", "string.comment"],
      settings: {
        foreground: "#6a737d",
      },
    },
    {
      scope: [
        "constant",
        "entity.name.constant",
        "variable.other.constant",
        "variable.other.enummember",
        "variable.language",
      ],
      settings: {
        foreground: "#5ab7ae",
      },
    },
    {
      scope: ["entity", "entity.name"],
      settings: {
        foreground: "#b392f0",
      },
    },
    {
      scope: "variable.parameter.function",
      settings: {
        foreground: "#e1e4e8",
      },
    },
    {
      scope: "entity.name.tag",
      settings: {
        foreground: "#85e89d",
      },
    },
    {
      scope: "keyword",
      settings: {
        foreground: "#f97583",
      },
    },
    {
      scope: ["storage", "storage.type"],
      settings: {
        foreground: "#f97583",
      },
    },
    {
      scope: [
        "storage.modifier.package",
        "storage.modifier.import",
        "storage.type.java",
      ],
      settings: {
        foreground: "#e1e4e8",
      },
    },
    {
      scope: [
        "string",
        "punctuation.definition.string",
        "string punctuation.section.embedded source",
      ],
      settings: {
        foreground: "#9ecbff",
      },
    },
    {
      scope: "support",
      settings: {
        foreground: "#5ab7ae",
      },
    },
    {
      scope: "meta.property-name",
      settings: {
        foreground: "#5ab7ae",
      },
    },
    {
      scope: "variable",
      settings: {
        foreground: "#ffab70",
      },
    },
    {
      scope: "variable.other",
      settings: {
        foreground: "#e1e4e8",
      },
    },
    {
      scope: "invalid.broken",
      settings: {
        fontStyle: "italic",
        foreground: "#fdaeb7",
      },
    },
    {
      scope: "invalid.deprecated",
      settings: {
        fontStyle: "italic",
        foreground: "#fdaeb7",
      },
    },
    {
      scope: "invalid.illegal",
      settings: {
        fontStyle: "italic",
        foreground: "#fdaeb7",
      },
    },
    {
      scope: "invalid.unimplemented",
      settings: {
        fontStyle: "italic",
        foreground: "#fdaeb7",
      },
    },
    {
      scope: "carriage-return",
      settings: {
        background: "#f97583",
        content: "^M",
        fontStyle: "italic underline",
        foreground: "#24292e",
      },
    },
    {
      scope: "message.error",
      settings: {
        foreground: "#fdaeb7",
      },
    },
    {
      scope: "string variable",
      settings: {
        foreground: "#5ab7ae",
      },
    },
    {
      scope: ["source.regexp", "string.regexp"],
      settings: {
        foreground: "#dbedff",
      },
    },
    {
      scope: [
        "string.regexp.character-class",
        "string.regexp constant.character.escape",
        "string.regexp source.ruby.embedded",
        "string.regexp string.regexp.arbitrary-repitition",
      ],
      settings: {
        foreground: "#dbedff",
      },
    },
    {
      scope: "string.regexp constant.character.escape",
      settings: {
        fontStyle: "bold",
        foreground: "#85e89d",
      },
    },
    {
      scope: "support.constant",
      settings: {
        foreground: "#5ab7ae",
      },
    },
    {
      scope: "support.variable",
      settings: {
        foreground: "#5ab7ae",
      },
    },
    {
      scope: "meta.module-reference",
      settings: {
        foreground: "#5ab7ae",
      },
    },
    {
      scope: "punctuation.definition.list.begin.markdown",
      settings: {
        foreground: "#ffab70",
      },
    },
    {
      scope: ["markup.heading", "markup.heading entity.name"],
      settings: {
        fontStyle: "bold",
        foreground: "#5ab7ae",
      },
    },
    {
      scope: "markup.quote",
      settings: {
        foreground: "#85e89d",
      },
    },
    {
      scope: "markup.italic",
      settings: {
        fontStyle: "italic",
        foreground: "#e1e4e8",
      },
    },
    {
      scope: "markup.bold",
      settings: {
        fontStyle: "bold",
        foreground: "#e1e4e8",
      },
    },
    {
      scope: ["markup.underline"],
      settings: {
        fontStyle: "underline",
      },
    },
    {
      scope: ["markup.strikethrough"],
      settings: {
        fontStyle: "strikethrough",
      },
    },
    {
      scope: "markup.inline.raw",
      settings: {
        foreground: "#5ab7ae",
      },
    },
    {
      scope: [
        "markup.deleted",
        "meta.diff.header.from-file",
        "punctuation.definition.deleted",
      ],
      settings: {
        background: "#86181d",
        foreground: "#fdaeb7",
      },
    },
    {
      scope: [
        "markup.inserted",
        "meta.diff.header.to-file",
        "punctuation.definition.inserted",
      ],
      settings: {
        background: "#144620",
        foreground: "#85e89d",
      },
    },
    {
      scope: ["markup.changed", "punctuation.definition.changed"],
      settings: {
        background: "#c24e00",
        foreground: "#ffab70",
      },
    },
    {
      scope: ["markup.ignored", "markup.untracked"],
      settings: {
        background: "#79b8ff",
        foreground: "#2f363d",
      },
    },
    {
      scope: "meta.diff.range",
      settings: {
        fontStyle: "bold",
        foreground: "#b392f0",
      },
    },
    {
      scope: "meta.diff.header",
      settings: {
        foreground: "#5ab7ae",
      },
    },
    {
      scope: "meta.separator",
      settings: {
        fontStyle: "bold",
        foreground: "#5ab7ae",
      },
    },
    {
      scope: "meta.output",
      settings: {
        foreground: "#5ab7ae",
      },
    },
    {
      scope: [
        "brackethighlighter.tag",
        "brackethighlighter.curly",
        "brackethighlighter.round",
        "brackethighlighter.square",
        "brackethighlighter.angle",
        "brackethighlighter.quote",
      ],
      settings: {
        foreground: "#d1d5da",
      },
    },
    {
      scope: "brackethighlighter.unmatched",
      settings: {
        foreground: "#fdaeb7",
      },
    },
    {
      scope: ["constant.other.reference.link", "string.other.link"],
      settings: {
        fontStyle: "underline",
        foreground: "#93aff8",
      },
    },
  ],
  type: "dark",
} as ThemeRegistration;
