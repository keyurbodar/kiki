/*
 * kiki's visual kit: the script every show_visual frame loads before the
 * agent's HTML. Capy serves its own kit from /_visual/visual-kit.js (React,
 * the app's button and field components, chart fill patterns); this is a
 * dependency-free reimplementation of the same public surface:
 *
 *   window.visual: state, get, set, on("change"), inset(), color(i),
 *                  fill(i, kind), render(el, markup), tween(key, to, paint)
 *   elements:      app-tabs, app-select, app-slider, app-toggle, app-input,
 *                  app-button, app-stat, app-table, app-legend, visual-head
 *
 * It is serialised with String(visualKit) into the frame, so it must not
 * reference anything outside its own body.
 */
export function visualKit() {
  type Value = string | number | boolean;
  type Option = { label: string; value: string };
  type Listener = (state: Record<string, Value>, name: string) => void;

  const post = (message: Record<string, unknown>) => {
    const send = Reflect.get(window, "__capyVisualPost");
    if (typeof send === "function") send(message);
  };

  const store = new Map<string, Value>();
  const listeners = new Set<Listener>();
  const repaints = new Set<() => void>();
  const snapshot = () => Object.fromEntries(store);
  const seed = (name: string, value: Value) => {
    if (!store.has(name)) store.set(name, value);
  };
  const write = (name: string, value: Value, notify: boolean) => {
    store.set(name, value);
    for (const repaint of repaints) repaint();
    if (!notify) return;
    const state = snapshot();
    for (const listener of listeners)
      queueMicrotask(() => listener(state, name));
  };

  const touched = new Set<string>();
  const inert = new Set<string>();
  let mutated = false;
  let inertTimer: ReturnType<typeof setTimeout> | undefined;
  new MutationObserver(() => {
    mutated = true;
  }).observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true,
  });
  const interacted = (control: string, name: string) => {
    if (!touched.has(name)) {
      touched.add(name);
      post({ type: "interact", name, control });
    }
    mutated = false;
    if (inertTimer !== undefined) clearTimeout(inertTimer);
    inertTimer = setTimeout(() => {
      inertTimer = undefined;
      if (mutated || inert.has(name)) return;
      inert.add(name);
      post({ type: "inert", name, control });
    }, 600);
  };

  const cssNumber = (name: string) =>
    Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(name),
    ) || 0;
  const cssSeconds = (name: string) => {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    const value = Number.parseFloat(raw) || 0;
    return raw.endsWith("ms") ? value : value * 1000;
  };

  const slot = (index: number) => (((Math.trunc(index) % 8) + 8) % 8) + 1;
  const color = (index: number) => `var(--chart-${slot(index)})`;

  const rendered = new WeakMap<Element, string>();
  const tweens = new Map<string, number | number[]>();
  const frames = new Map<string, number>();
  const reduced = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ease = (t: number) => 1 - (1 - t) ** 4;

  const visual = {
    get state() {
      return snapshot();
    },
    get: (name: string) => store.get(name),
    set: (name: string, value: Value) => write(String(name), value, true),
    on: (event: string, listener: Listener) => {
      if (event !== "change") return () => false;
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    inset: () => ({
      top: cssNumber("--visual-chart-inset-top"),
      right: cssNumber("--visual-chart-inset-right"),
      bottom: cssNumber("--visual-chart-inset-bottom"),
      left: cssNumber("--visual-chart-inset-left"),
      axis: 0,
    }),
    color,
    fill: (index: number, kind?: string) =>
      kind === "area" ? "none" : color(index),
    render: (element: Element, markup: string) => {
      if (!(element instanceof Element))
        throw new TypeError("visual.render needs an element");
      const next = String(markup);
      if (rendered.get(element) === next) return;
      element.innerHTML = next;
      rendered.set(element, next);
    },
    tween: (
      key: string,
      to: number | number[],
      paint: (value: number | number[]) => void,
    ) => {
      if (typeof paint !== "function")
        throw new TypeError("visual.tween needs a paint function");
      const id = String(key);
      const target = Array.isArray(to) ? to.map(Number) : Number(to);
      const previous = tweens.get(id);
      const from =
        previous ?? (typeof target === "number" ? 0 : target.map(() => 0));
      const apply = (value: number | number[]) => {
        tweens.set(id, value);
        paint(value);
      };
      const running = frames.get(id);
      if (running !== undefined) cancelAnimationFrame(running);
      if (reduced()) {
        apply(target);
        return;
      }
      const duration = cssSeconds(
        previous === undefined ? "--duration-slower" : "--duration-slow",
      );
      const start = performance.now();
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
      const step = (now: number) => {
        const t = duration <= 0 ? 1 : Math.min(1, (now - start) / duration);
        const k = ease(t);
        apply(
          typeof target === "number"
            ? lerp(typeof from === "number" ? from : (from[0] ?? 0), target, k)
            : target.map((b, i) =>
                lerp(typeof from === "number" ? from : (from[i] ?? b), b, k),
              ),
        );
        if (t < 1) frames.set(id, requestAnimationFrame(step));
        else frames.delete(id);
      };
      frames.set(id, requestAnimationFrame(step));
    },
  };
  Object.defineProperty(window, "visual", { value: visual, enumerable: true });

  const parseJson = (raw: string | null): unknown => {
    if (raw === null) return undefined;
    try {
      return JSON.parse(raw);
    } catch {
      return undefined;
    }
  };
  const options = (raw: string | null): Option[] => {
    const parsed = parseJson(raw);
    const list = Array.isArray(parsed)
      ? parsed
      : (raw ?? "")
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean);
    return list.flatMap((item): Option[] => {
      if (typeof item === "string" || typeof item === "number")
        return [{ label: String(item), value: String(item) }];
      if (item && typeof item === "object" && "value" in item) {
        const value = String((item as { value: unknown }).value);
        const label = (item as { label?: unknown }).label;
        return [{ label: label === undefined ? value : String(label), value }];
      }
      return [];
    });
  };
  const swatch = (raw: unknown) =>
    typeof raw === "number"
      ? color(raw - 1)
      : typeof raw === "string" && /^\d+$/.test(raw)
        ? color(Number(raw) - 1)
        : typeof raw === "string"
          ? raw
          : color(0);
  const numberFormat = (value: number, format: string | null) =>
    format === "percent"
      ? new Intl.NumberFormat(undefined, {
          style: "percent",
          maximumFractionDigits: 1,
        }).format(value)
      : format === "currency"
        ? new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          }).format(value)
        : format === "compact"
          ? new Intl.NumberFormat(undefined, { notation: "compact" }).format(
              value,
            )
          : new Intl.NumberFormat().format(value);

  const css = `
    :host { display: block; }
    :host([hidden]) { display: none; }
    * { box-sizing: border-box; }
    .root { color: var(--capy-fg, var(--text)); font: inherit; }
    .row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--visual-space-1); }
    .field { display: flex; flex-direction: column; gap: var(--visual-gap-label); }
    .label { color: var(--muted); font-size: 0.923em; }
    .btn {
      font: inherit; font-weight: 500; color: var(--muted); cursor: pointer;
      height: calc(var(--visual-space-6) + var(--visual-space-1)); padding: 0 var(--visual-space-2);
      border: 0; border-radius: var(--radius, 0.375rem); background: transparent;
    }
    .btn:hover { background: var(--capy-secondary-hover, var(--surface)); color: var(--text); }
    .btn[aria-pressed="true"] { background: var(--capy-secondary, var(--surface)); color: var(--text); }
    .btn.primary { background: var(--capy-primary, var(--accent)); color: var(--capy-primary-text, var(--text)); }
    .btn.secondary { background: var(--capy-button, var(--surface)); color: var(--text);
      border: var(--hairline) solid var(--border); }
    .btn:focus-visible, select:focus-visible, input:focus-visible {
      outline: calc(var(--hairline) * 2) solid var(--accent); outline-offset: calc(var(--hairline) * -2); }
    select, input[type="text"], input[type="number"] {
      font: inherit; color: var(--text); min-width: 8rem;
      height: calc(var(--visual-space-8)); padding: 0 var(--visual-space-3);
      border: var(--hairline) solid var(--border); border-radius: var(--radius, 0.375rem);
      background: var(--capy-input, var(--surface));
    }
    input[type="number"] { min-width: 0; width: 7rem; font-variant-numeric: tabular-nums; }
    .slider-head { display: flex; justify-content: space-between; gap: var(--visual-space-3); }
    .slider-value { color: var(--muted); font-variant-numeric: tabular-nums; }
    input[type="range"] { width: 100%; min-width: 10rem; accent-color: var(--text); margin: 0; }
    .switch { display: inline-flex; align-items: center; gap: var(--visual-space-2); cursor: pointer; }
    .track { position: relative; width: 1.85em; height: 1.08em; border-radius: 1em;
      background: var(--capy-secondary, var(--surface)); transition: background-color var(--duration-fast); }
    .track::after { content: ""; position: absolute; top: 0.12em; left: 0.12em; width: 0.84em; height: 0.84em;
      border-radius: 50%; background: var(--text); transition: transform var(--duration-fast); }
    [aria-checked="true"] .track { background: var(--accent); }
    [aria-checked="true"] .track::after { transform: translateX(0.77em); background: var(--capy-primary-text, white); }
    .stat { display: flex; flex-direction: column; gap: var(--visual-gap-stat); }
    .stat-value { font-size: 1.54em; font-weight: 560; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
    .stat-delta { color: var(--muted); font-variant-numeric: tabular-nums; }
    .stat-delta.up { color: var(--positive); }
    .stat-delta.down { color: var(--negative); }
    .stat-note { color: var(--faint); font-size: 0.923em; }
    .table { display: grid; overflow-x: auto; column-gap: var(--visual-space-3);
      border: var(--hairline) solid var(--border); border-radius: var(--radius-card, 0.5rem); }
    .tr { display: grid; grid-template-columns: subgrid; grid-column: 1 / -1; align-items: center;
      min-height: var(--visual-space-8); padding: 0 var(--visual-space-3); }
    .tr + .tr { border-top: var(--hairline) solid var(--grid); }
    .th { color: var(--muted); font-size: 0.923em; }
    [data-align="end"] { justify-self: end; font-variant-numeric: tabular-nums; }
    .legend { display: flex; flex-wrap: wrap; gap: var(--visual-gap-legend); color: var(--muted); font-size: 0.923em; }
    .legend-item { display: inline-flex; align-items: center; gap: var(--visual-space-1); }
    .dot { width: var(--visual-space-2); height: var(--visual-space-2); border-radius: 50%; }
    .head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--visual-gap-head); }
    .head-label { font-weight: 500; min-width: 0; }
    .head slot { margin-inline-start: auto; display: flex; min-width: 0; max-width: 100%; }
    .tip { position: fixed; z-index: 10; pointer-events: none; min-width: 9em;
      padding: var(--visual-space-2) var(--visual-space-3); border-radius: var(--radius-card, 0.5rem);
      background: var(--capy-popover, var(--surface)); border: var(--hairline) solid var(--border);
      color: var(--text); font-size: 0.923em; }
    .tip-label { font-weight: 500; padding-bottom: var(--visual-space-1); }
    .tip-row { display: flex; align-items: center; gap: var(--visual-space-2); }
    .tip-name { color: var(--muted); flex: 1; }
    .tip-value { font-weight: 600; font-variant-numeric: tabular-nums; }
  `;
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(css);

  const el = <K extends keyof HTMLElementTagNameMap>(
    tag: K,
    props: Record<string, string> = {},
    children: (Node | string)[] = [],
  ) => {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (key === "class") node.className = value;
      else node.setAttribute(key, value);
    }
    node.append(...children);
    return node;
  };

  const STATEFUL: Record<string, string> = {
    "app-tabs": "value",
    "app-select": "value",
    "app-slider": "value",
    "app-toggle": "checked",
    "app-input": "value",
  };

  const initial = (tag: string, host: HTMLElement): Value | undefined => {
    const attr = (name: string) => host.getAttribute(name);
    switch (tag) {
      case "app-tabs":
      case "app-select":
        return attr("value") ?? options(attr("options"))[0]?.value;
      case "app-slider":
        return Number(attr("value") ?? attr("min") ?? 0);
      case "app-toggle":
        return attr("checked") !== null && attr("checked") !== "false";
      case "app-input":
        return attr("type") === "number"
          ? Number(attr("value") ?? 0)
          : (attr("value") ?? "");
      default:
        return undefined;
    }
  };

  const change = (tag: string, name: string, value: Value) => {
    interacted(tag, name);
    write(name, value, true);
  };

  const paint = (tag: string, host: HTMLElement): Node => {
    const attr = (name: string) => host.getAttribute(name);
    const name = attr("name") ?? "";
    const current = store.get(name);
    const label = attr("label");
    switch (tag) {
      case "app-tabs":
        return el(
          "div",
          { class: "row", role: "group", "aria-label": name },
          options(attr("options")).map((option) => {
            const button = el(
              "button",
              {
                type: "button",
                class: "btn",
                "aria-pressed": String(option.value === current),
              },
              [option.label],
            );
            button.addEventListener("click", () =>
              change(tag, name, option.value),
            );
            return button;
          }),
        );
      case "app-select": {
        const select = el(
          "select",
          { "aria-label": label ?? name },
          options(attr("options")).map((option) =>
            el("option", { value: option.value }, [option.label]),
          ),
        );
        select.value = String(current ?? "");
        select.addEventListener("change", () =>
          change(tag, name, select.value),
        );
        return el("label", { class: "field" }, [
          ...(label === null ? [] : [el("span", { class: "label" }, [label])]),
          select,
        ]);
      }
      case "app-slider": {
        const value = Number(current ?? 0);
        const input = el("input", {
          type: "range",
          min: attr("min") ?? "0",
          max: attr("max") ?? "100",
          step: attr("step") ?? "1",
          "aria-label": label ?? name,
        });
        input.value = String(value);
        const readout = el("span", { class: "slider-value" }, [
          numberFormat(value, attr("format")),
        ]);
        input.addEventListener("input", () => {
          readout.textContent = numberFormat(
            Number(input.value),
            attr("format"),
          );
          change(tag, name, Number(input.value));
        });
        return el("label", { class: "field" }, [
          el("span", { class: "slider-head" }, [
            el("span", { class: "label" }, [label ?? ""]),
            readout,
          ]),
          input,
        ]);
      }
      case "app-toggle": {
        const button = el(
          "button",
          {
            type: "button",
            role: "switch",
            class: "btn switch",
            "aria-checked": String(current === true),
          },
          [el("span", { class: "track" }), label ?? ""],
        );
        button.addEventListener("click", () =>
          change(tag, name, current !== true),
        );
        return button;
      }
      case "app-input": {
        const numeric = attr("type") === "number";
        const input = el("input", {
          type: numeric ? "number" : "text",
          placeholder: attr("placeholder") ?? "",
          "aria-label": label ?? name,
        });
        input.value = String(current ?? "");
        input.addEventListener("change", () =>
          change(tag, name, numeric ? Number(input.value) : input.value),
        );
        return el("label", { class: "field" }, [
          ...(label === null ? [] : [el("span", { class: "label" }, [label])]),
          input,
        ]);
      }
      case "app-button": {
        const button = el(
          "button",
          {
            type: "button",
            class: `btn ${attr("variant") === "primary" ? "primary" : "secondary"}`,
          },
          [label ?? name],
        );
        button.addEventListener("click", () =>
          change(tag, name, Number(store.get(name) ?? 0) + 1),
        );
        return button;
      }
      case "app-stat": {
        const delta = attr("delta");
        const trend = delta?.trim().startsWith("-")
          ? " down"
          : delta?.trim().startsWith("+")
            ? " up"
            : "";
        return el("div", { class: "stat" }, [
          el("span", { class: "label" }, [label ?? ""]),
          el("span", { class: "stat-value" }, [attr("value") ?? ""]),
          ...(delta === null
            ? []
            : [el("span", { class: `stat-delta${trend}` }, [delta])]),
          ...(attr("note") === null
            ? []
            : [el("span", { class: "stat-note" }, [attr("note") ?? ""])]),
        ]);
      }
      case "app-table": {
        const columns =
          (parseJson(attr("columns")) as unknown[] | undefined) ?? [];
        const rows = (parseJson(attr("rows")) as unknown[] | undefined) ?? [];
        const keys = columns.map((column, i) =>
          typeof column === "object" && column !== null && "key" in column
            ? String((column as { key: unknown }).key)
            : String(i),
        );
        const titles = columns.map((column) =>
          typeof column === "object" && column !== null
            ? String(
                (column as { label?: unknown; key?: unknown }).label ??
                  (column as { key?: unknown }).key ??
                  "",
              )
            : String(column),
        );
        const cell = (row: unknown, key: string, i: number) =>
          Array.isArray(row)
            ? row[i]
            : typeof row === "object" && row !== null
              ? (row as Record<string, unknown>)[key]
              : undefined;
        const table = el("div", { class: "table", role: "table" }, [
          el(
            "div",
            { class: "tr th", role: "row" },
            titles.map((title, i) =>
              el(
                "span",
                {
                  role: "columnheader",
                  ...(i > 0 ? { "data-align": "end" } : {}),
                },
                [title],
              ),
            ),
          ),
          ...rows.map((row) =>
            el(
              "div",
              { class: "tr", role: "row" },
              keys.map((key, i) => {
                const value = cell(row, key, i);
                return el(
                  "span",
                  {
                    role: "cell",
                    ...(typeof value === "number"
                      ? { "data-align": "end" }
                      : {}),
                  },
                  [
                    typeof value === "number"
                      ? numberFormat(value, null)
                      : String(value ?? ""),
                  ],
                );
              }),
            ),
          ),
        ]);
        table.style.gridTemplateColumns = `repeat(${Math.max(1, keys.length)}, auto)`;
        return table;
      }
      case "app-legend": {
        const items = (parseJson(attr("items")) as unknown[] | undefined) ?? [];
        return el(
          "div",
          { class: "legend" },
          items.map((item, i) => {
            const entry =
              typeof item === "object" && item !== null
                ? (item as { label?: unknown; color?: unknown })
                : { label: item, color: i + 1 };
            const dot = el("span", { class: "dot" });
            dot.style.background = swatch(entry.color ?? i + 1);
            return el("span", { class: "legend-item" }, [
              dot,
              String(entry.label ?? ""),
            ]);
          }),
        );
      }
      default:
        return document.createTextNode("");
    }
  };

  const TAGS: Record<string, string[]> = {
    "app-tabs": ["name", "options", "value"],
    "app-select": ["name", "label", "options", "value"],
    "app-slider": ["name", "label", "min", "max", "step", "value", "format"],
    "app-toggle": ["name", "label", "checked"],
    "app-input": ["name", "label", "type", "value", "placeholder"],
    "app-button": ["name", "label", "variant"],
    "app-stat": ["label", "value", "delta", "note"],
    "app-table": ["columns", "rows"],
    "app-legend": ["items"],
  };

  for (const [tag, attributes] of Object.entries(TAGS)) {
    if (customElements.get(tag) !== undefined) continue;
    customElements.define(
      tag,
      class extends HTMLElement {
        static observedAttributes = attributes;
        root: HTMLDivElement | undefined;
        repaint = () => this.draw();
        connectedCallback() {
          if (this.shadowRoot === null) {
            const shadow = this.attachShadow({ mode: "open" });
            shadow.adoptedStyleSheets = [sheet];
            this.root = el("div", { class: "root" });
            shadow.append(this.root);
          }
          const name = this.getAttribute("name");
          const value = initial(tag, this);
          if (name !== null && value !== undefined) seed(name, value);
          repaints.add(this.repaint);
          this.draw();
        }
        disconnectedCallback() {
          repaints.delete(this.repaint);
        }
        attributeChangedCallback(
          attribute: string,
          before: string | null,
          after: string | null,
        ) {
          if (before === after || this.root === undefined) return;
          const name = this.getAttribute("name");
          const value = initial(tag, this);
          if (
            attribute === STATEFUL[tag] &&
            name !== null &&
            value !== undefined
          )
            write(name, value, false);
          this.draw();
        }
        draw() {
          if (this.root === undefined) return;
          const focused = this.shadowRoot?.activeElement;
          if (focused instanceof HTMLInputElement && focused.type !== "range")
            return;
          this.root.replaceChildren(paint(tag, this));
        }
      },
    );
  }

  customElements.define(
    "visual-head",
    class extends HTMLElement {
      connectedCallback() {
        if (this.shadowRoot !== null) return;
        const shadow = this.attachShadow({ mode: "open" });
        shadow.adoptedStyleSheets = [sheet];
        shadow.append(
          el("div", { class: "root head" }, [
            el("span", { class: "head-label" }, [
              this.getAttribute("label") ?? "",
            ]),
            el("slot"),
          ]),
        );
      }
    },
  );

  const onlyContentBefore = (target: Element) => {
    const skip = new Set([
      "VISUAL-HEAD",
      "STYLE",
      "SCRIPT",
      "TEMPLATE",
      "LINK",
      "NOSCRIPT",
    ]);
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) =>
          skip.has(node.nodeName)
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT,
      },
    );
    for (
      let node = walker.nextNode();
      node !== null && node !== target;
      node = walker.nextNode()
    )
      if (
        node.nodeType === Node.TEXT_NODE
          ? node.textContent?.trim() !== ""
          : !node.contains(target)
      )
        return false;
    return true;
  };

  const tooltipHost = document.createElement("visual-tooltip");
  const tooltipShadow = tooltipHost.attachShadow({ mode: "open" });
  tooltipShadow.adoptedStyleSheets = [sheet];
  const tip = el("div", { class: "root tip", hidden: "" });
  tooltipShadow.append(tip);

  const showTip = (event: PointerEvent) => {
    const target =
      event.target instanceof Element
        ? event.target.closest("svg [data-value]")
        : null;
    if (target === null) {
      tip.setAttribute("hidden", "");
      return;
    }
    const series = target.getAttribute("data-series");
    const fill = getComputedStyle(target).fill;
    const dot = el("span", { class: "dot" });
    dot.style.background = fill;
    tip.replaceChildren(
      ...(target.getAttribute("data-label") === null
        ? []
        : [
            el("div", { class: "tip-label" }, [
              target.getAttribute("data-label") ?? "",
            ]),
          ]),
      el("div", { class: "tip-row" }, [
        dot,
        el("span", { class: "tip-name" }, [series ?? ""]),
        el("span", { class: "tip-value" }, [
          target.getAttribute("data-value") ?? "",
        ]),
      ]),
    );
    tip.removeAttribute("hidden");
    const gap = cssNumber("--visual-space-3");
    const width = tip.offsetWidth;
    const x =
      event.clientX + gap + width > window.innerWidth
        ? event.clientX - gap - width
        : event.clientX + gap;
    tip.style.left = `${Math.max(0, x)}px`;
    tip.style.top = `${Math.max(0, event.clientY + gap)}px`;
  };

  document.addEventListener("DOMContentLoaded", () => {
    const head = document.querySelector("visual-head");
    const tabs = document.querySelector("app-tabs");
    if (head !== null && tabs !== null && onlyContentBefore(tabs))
      head.append(tabs);
    document.body.append(tooltipHost);
    document.addEventListener("pointermove", showTip);
    document.addEventListener("pointerleave", () =>
      tip.setAttribute("hidden", ""),
    );
  });
}
