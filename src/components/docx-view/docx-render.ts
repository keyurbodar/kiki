export const DOCX_PAGE_GAP = 24;
export const DOCX_DEFAULT_WIDTH = 816;

export const DOCX_OPTIONS = {
  className: "docx",
  inWrapper: true,
  breakPages: true,
  ignoreLastRenderedPageBreak: true,
  useBase64URL: true,
  renderHeaders: true,
  renderFooters: true,
  renderFootnotes: true,
  renderEndnotes: true,
  renderChanges: false,
  renderComments: false,
  renderAltChunks: false,
  experimental: false,
};

export const DOCX_HOST_CSS = `
.docx-wrapper { background: transparent; padding: ${DOCX_PAGE_GAP}px; gap: ${DOCX_PAGE_GAP}px; width: fit-content; margin: 0 auto; zoom: var(--docx-zoom, 1); }
.docx-wrapper > section.docx { margin: 0; box-shadow: var(--sh-card), var(--sh-plate); }
.docx a[href] { cursor: pointer; }
`;

const BLOCKED_TAGS = new Set([
  "script",
  "iframe",
  "frame",
  "object",
  "embed",
  "link",
  "meta",
  "base",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "template",
  "audio",
  "video",
  "source",
  "foreignobject",
  "use",
  "set",
  "animate",
  "animatemotion",
  "animatetransform",
]);
const SAFE_LINK = /^(?:https?:|mailto:|#)/i;
const DATA_IMAGE = /^data:image\//i;
const REMOTE_CSS = /(?:url|src)\((?!\s*["']?data:)|image-set\(|image\(/i;
const GENERIC_FAMILY =
  /(?:^|,)\s*(?:serif|sans-serif|monospace|system-ui|cursive|fantasy)\s*$/i;
const SYMBOL_BULLETS: Record<string, string> = {
  "\uf0a7": "\u25aa",
  "\uf0a8": "\u25e6",
  "\uf06e": "\u25a0",
  "\uf071": "\u2751",
  "\uf076": "\u2756",
  "\uf0d8": "\u27a2",
  "\uf0fc": "\u2713",
};

export const withFallbackFamily = (family: string) =>
  GENERIC_FAMILY.test(family.trim())
    ? family
    : `${family.trim()}, ${
        /courier|consolas|mono|menlo/i.test(family)
          ? "monospace"
          : /times|georgia|cambria|garamond|palatino|baskerville|book antiqua/i.test(
                family,
              )
            ? "serif"
            : "var(--font-sans)"
      }`;

const cleanStyle = (style: CSSStyleDeclaration, fonts: boolean) => {
  for (const property of Array.from(style)) {
    if (REMOTE_CSS.test(style.getPropertyValue(property)))
      style.removeProperty(property);
  }
  if (fonts && style.fontFamily !== "")
    style.fontFamily = withFallbackFamily(style.fontFamily);
};

const cleanRules = (sheet: CSSStyleSheet | CSSGroupingRule) => {
  for (let index = sheet.cssRules.length - 1; index >= 0; index -= 1) {
    const rule = sheet.cssRules[index];
    const keep =
      rule instanceof CSSStyleRule
        ? !/:host/i.test(rule.selectorText)
        : rule instanceof CSSFontFaceRule || rule instanceof CSSGroupingRule;
    if (!keep) {
      sheet.deleteRule(index);
      continue;
    }
    if (rule instanceof CSSStyleRule) cleanStyle(rule.style, true);
    if (rule instanceof CSSFontFaceRule) cleanStyle(rule.style, false);
    if (rule instanceof CSSGroupingRule) cleanRules(rule);
  }
};

export const toStyleSheet = (css: string) => {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(
    css.replace(
      /[\uf000-\uf0ff]/g,
      (glyph) => SYMBOL_BULLETS[glyph] ?? "\u2022",
    ),
  );
  cleanRules(sheet);
  return sheet;
};

export const isSafeAttribute = (
  element: Element,
  name: string,
  value: string,
) => {
  if (
    name.startsWith("on") ||
    ["srcdoc", "srcset", "action", "formaction"].includes(name)
  )
    return false;
  if (name === "href" || name === "xlink:href") {
    return element.localName === "a"
      ? SAFE_LINK.test(value)
      : DATA_IMAGE.test(value);
  }
  if (name === "src") return DATA_IMAGE.test(value);
  return (
    name === "style" ||
    !/url\(|\\/i.test(value) ||
    /^url\(\s*["']?#/i.test(value)
  );
};

export const sanitizeNode = (node: Node): Node | undefined => {
  if (!(node instanceof Element))
    return node.nodeType === Node.TEXT_NODE ? node : undefined;
  for (const element of [node, ...node.querySelectorAll("*")]) {
    if (BLOCKED_TAGS.has(element.localName.toLowerCase())) {
      element.remove();
      continue;
    }
    for (const attribute of Array.from(element.attributes)) {
      if (
        !isSafeAttribute(
          element,
          attribute.name.toLowerCase(),
          attribute.value.trim(),
        )
      ) {
        element.removeAttribute(attribute.name);
      }
    }
    if (
      (element instanceof HTMLElement || element instanceof SVGElement) &&
      element.hasAttribute("style")
    ) {
      cleanStyle(element.style, true);
    }
    const href =
      element.localName === "a" ? element.getAttribute("href") : null;
    if (href !== null && !href.startsWith("#")) {
      element.setAttribute("target", "_blank");
      element.setAttribute("rel", "noopener noreferrer");
    }
  }
  return BLOCKED_TAGS.has(node.localName.toLowerCase()) ? undefined : node;
};

export const pageWidth = (nodes: Node[]) =>
  Math.max(
    DOCX_DEFAULT_WIDTH,
    ...nodes.flatMap((node) =>
      node instanceof HTMLElement
        ? [...node.querySelectorAll<HTMLElement>("section.docx")].map(
            (section) =>
              section.style.width.endsWith("pt")
                ? (Number.parseFloat(section.style.width) * 96) / 72
                : DOCX_DEFAULT_WIDTH,
          )
        : [],
    ),
  );

const hostSheet = () => {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(DOCX_HOST_CSS);
  return sheet;
};

export const renderDocx = (blob: Blob) =>
  import("docx-preview").then((docx) =>
    docx
      .parseAsync(blob, DOCX_OPTIONS)
      .then((document) => docx.renderDocument(document, DOCX_OPTIONS))
      .then((nodes) => ({
        sheets: [
          ...nodes.flatMap((node) =>
            node instanceof HTMLStyleElement
              ? [toStyleSheet(node.textContent ?? "")]
              : [],
          ),
          hostSheet(),
        ],
        nodes: nodes.flatMap((node) =>
          node instanceof HTMLStyleElement ? [] : (sanitizeNode(node) ?? []),
        ),
      })),
  );
