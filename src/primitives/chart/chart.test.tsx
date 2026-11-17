import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { Bar, BarChart, XAxis } from "recharts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  Chart,
  ChartHover,
  ChartLegend,
  ChartTooltipContent,
  chartColor,
  chartSeriesClass,
  chartSeriesColor,
  chartSeriesIndex,
  chartSeriesVar,
  createChartPointer,
  placeAlong,
  useChartConfig,
} from "@/primitives/chart";

class ImmediateObserver {
  constructor(private readonly callback: IntersectionObserverCallback) {}
  observe(target: Element) {
    this.callback(
      [
        {
          isIntersecting: true,
          target,
          boundingClientRect: { width: 400, height: 200 },
        } as IntersectionObserverEntry,
      ],
      this as unknown as IntersectionObserver,
    );
  }
  disconnect() {}
}

function Probe() {
  useChartConfig();
  return null;
}

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", ImmediateObserver);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
    DOMRect.fromRect({ width: 400, height: 200 }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

const setup = (mode?: "cell" | "line") => {
  const container = document.createElement("div");
  const under = document.createElement("div");
  const over = document.createElement("div");
  container.append(under, over);
  document.body.append(container);
  under.innerHTML = '<div data-chart-part="cursor"></div>';
  over.innerHTML =
    '<span data-chart-part="dot-0"></span><div data-chart-part="tooltip"></div>';
  const target = document.createElement("div");
  over.append(target);
  const pointer = createChartPointer();
  pointer.attach({ under, over });
  pointer.configure({
    data: [
      { a: 10, b: 20 },
      { a: 30, b: 40 },
      { a: 5, b: 0 },
    ],
    highlight: { mode, keys: ["a", "b"] },
    dots: [{ key: "a" }],
    selectable: (hit) => hit.day === 1,
  });
  pointer.scale(0, (value) => 100 - value);
  pointer.measure({
    plot: { x: 0, y: 0, width: 300, height: 100 },
    centers: [50, 150, 250],
    band: 80,
  });
  const cursor = under.firstElementChild as HTMLElement;
  const dot = over.firstElementChild as HTMLElement;
  return { pointer, target, cursor, dot, container };
};

describe("chart helpers", () => {
  it("maps series to Capy's palette and per-key variables", () => {
    expect(chartColor(0)).toBe("var(--chart-1)");
    expect(chartColor(7)).toBe("var(--chart-8)");
    expect(chartColor(8)).toBe("var(--chart-other)");
    expect(chartSeriesVar("ab")).toBe("--chart-series-97-98");
    expect(chartSeriesColor("ab")).toBe("var(--chart-series-97-98)");
    expect(chartSeriesClass(2)).toBe("chart-series chart-series-2");
  });

  it("reads the series index from the closest series node", () => {
    const series = document.createElement("div");
    series.className = chartSeriesClass(3);
    const child = document.createElement("span");
    series.append(child);
    expect(chartSeriesIndex(child)).toBe(3);
    expect(chartSeriesIndex(document.createElement("span"))).toBeUndefined();
    expect(chartSeriesIndex(null)).toBeUndefined();
  });

  it("places the tooltip after the anchor and flips or clamps at the edge", () => {
    expect(placeAlong(50, 40, 0, 300)).toBe(60);
    expect(placeAlong(280, 40, 0, 300)).toBe(230);
    expect(placeAlong(20, 40, 0, 50)).toBe(0);
    expect(placeAlong(-30, 40, 0, 300)).toBe(0);
  });
});

describe("chart pointer", () => {
  it("snaps to the nearest day and finds the stacked series under the pointer", () => {
    const { pointer, target, cursor, dot } = setup();
    const listener = vi.fn();
    pointer.subscribe(listener);
    expect(pointer.press(target, 140, 50)).toEqual({ day: 1, series: "b" });
    expect(pointer.press(target, 150, 80)).toEqual({ day: 1, series: "a" });
    expect(listener).toHaveBeenCalledTimes(2);
    expect(cursor.style.visibility).toBe("visible");
    expect(cursor.style.transform).toBe("translate3d(110px, 0px, 0)");
    expect(cursor.style.width).toBe("80px");
    expect(cursor.style.height).toBe("100px");
    expect(dot.style.transform).toBe("translate3d(150px, 70px, 0)");
    expect(target.style.cursor).toBe("pointer");
    expect(pointer.press(target, 250, 99)).toEqual({ day: 2, series: "a" });
    expect(target.style.cursor).toBe("");
  });

  it("drops the series between bars and outside the plot", () => {
    const { pointer, target } = setup();
    expect(pointer.press(target, 95, 50)).toEqual({
      day: 0,
      series: undefined,
    });
    expect(pointer.press(target, 150, 150)).toBeUndefined();
  });

  it("picks the nearest line within the snap distance", () => {
    const { pointer, target } = setup("line");
    expect(pointer.press(target, 150, 62)).toEqual({ day: 1, series: "b" });
    expect(pointer.press(target, 150, 72)).toEqual({ day: 1, series: "a" });
    expect(pointer.press(target, 150, 15)).toEqual({
      day: 1,
      series: undefined,
    });
  });

  it("maps cell rows from the bottom and inset the cell cursor", () => {
    const { pointer, target, cursor } = setup("cell");
    expect(pointer.press(target, 50, 20)).toEqual({ day: 0, series: "b" });
    expect(cursor.style.transform).toBe("translate3d(11px, 1px, 0)");
    expect(cursor.style.width).toBe("78px");
    expect(cursor.style.height).toBe("48px");
    expect(pointer.press(target, 50, 80)).toEqual({ day: 0, series: "a" });
  });

  it("steps with the keyboard and hides on leave", () => {
    const { pointer, target, cursor, dot } = setup();
    pointer.step(target, -1);
    expect(pointer.get()).toEqual({ day: 2, series: undefined });
    pointer.step(target, 1);
    expect(pointer.get().day).toBe(2);
    pointer.step(target, -1);
    expect(pointer.hit()).toEqual({ day: 1, series: undefined });
    pointer.leave(target);
    expect(pointer.get()).toEqual({ day: undefined, series: undefined });
    expect(cursor.style.visibility).toBe("hidden");
    expect(dot.style.visibility).toBe("hidden");
  });

  it("steps cell rows from the top row", () => {
    const { pointer, target } = setup("cell");
    pointer.step(target, 1);
    expect(pointer.hit()).toEqual({ day: 0, series: "b" });
    pointer.step(target, 0, -1);
    expect(pointer.hit()).toEqual({ day: 0, series: "a" });
    pointer.step(target, 0, -1);
    expect(pointer.hit()).toEqual({ day: 0, series: "a" });
  });

  it("dims the other series inside the card", () => {
    const { pointer, container } = setup();
    const card = document.createElement("div");
    card.dataset.slot = "card";
    container.replaceWith(card);
    card.append(container);
    const first = document.createElement("div");
    first.className = chartSeriesClass(0);
    const second = document.createElement("div");
    second.className = chartSeriesClass(1);
    card.append(first, second);
    pointer.highlight(1);
    expect(first.style.opacity).toBe("0.5");
    expect(second.style.opacity).toBe("");
    pointer.highlight(undefined);
    expect(first.style.opacity).toBe("");
  });
});

describe("chart components", () => {
  it("keeps the chart slot and sets a variable per configured series", () => {
    render(
      <Chart
        data-testid="chart"
        config={{
          spend: { label: "Spend" },
          other: { label: "Other", color: "var(--chart-5)" },
        }}
      />,
    );
    const chart = screen.getByTestId("chart");
    expect(chart.dataset.slot).toBe("chart");
    expect(chart.style.getPropertyValue(chartSeriesVar("spend"))).toBe(
      "var(--chart-1)",
    );
    expect(chart.style.getPropertyValue(chartSeriesVar("other"))).toBe(
      "var(--chart-5)",
    );
  });

  it("requires a chart container for chart content", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(
      "Chart content must be used within a ChartContainer",
    );
    vi.restoreAllMocks();
  });

  it("renders tooltip rows, the total and the footer", () => {
    render(
      <Chart config={{ a: { label: "Alpha" }, b: { label: "Beta" } }}>
        <ChartTooltipContent
          active
          label="Nov 15"
          payload={[
            { dataKey: "a", value: 2, color: "red" },
            { dataKey: "b", value: 0.001 },
            { dataKey: "c", name: "Gamma", value: 3 },
          ]}
          minValue={0.01}
          valueFormatter={(value) => `$${value.toFixed(2)}`}
          footer="Billed"
        />
      </Chart>,
    );
    expect(screen.getByText("Nov 15")).toBeTruthy();
    expect(screen.getByText("Alpha")).toBeTruthy();
    expect(screen.queryByText("Beta")).toBeNull();
    expect(screen.getByText("Gamma")).toBeTruthy();
    expect(screen.getByText("Total").nextElementSibling?.textContent).toBe(
      "$5.00",
    );
    expect(screen.getByText("Billed")).toBeTruthy();
  });

  it("renders nothing while inactive and no total for one row", () => {
    const { container } = render(
      <Chart config={{}}>
        <ChartTooltipContent payload={[{ dataKey: "a", value: 1 }]} />
      </Chart>,
    );
    expect(container.textContent).toBe("");
    cleanup();
    render(
      <Chart config={{}}>
        <ChartTooltipContent
          active
          payload={[{ dataKey: "a", name: "A", value: 1 }]}
        />
      </Chart>,
    );
    expect(screen.queryByText("Total")).toBeNull();
  });

  it("renders the legend in config order with palette colours", () => {
    render(
      <ChartLegend
        config={{
          a: { label: "Billed" },
          b: { label: "BYOK", color: "var(--chart-3)" },
        }}
      />,
    );
    const swatch = (label: string) =>
      screen.getByText(label).previousElementSibling as HTMLElement;
    expect(swatch("Billed").style.background).toBe("var(--chart-1)");
    expect(swatch("BYOK").style.background).toBe("var(--chart-3)");
  });

  it("wires the hover surface to keyboard selection and the tooltip", async () => {
    const onSelect = vi.fn();
    render(
      <Chart config={{ spend: { label: "Spend" } }}>
        <BarChart
          data={[
            { day: "Mon", spend: 4 },
            { day: "Tue", spend: 6 },
          ]}
        >
          <XAxis dataKey="day" />
          <Bar dataKey="spend" />
          <ChartHover
            data={[
              { day: "Mon", spend: 4 },
              { day: "Tue", spend: 6 },
            ]}
            highlight={{ keys: ["spend"] }}
            onSelect={onSelect}
            content={<ChartTooltipContent />}
          />
        </BarChart>
      </Chart>,
    );
    const surface = await screen.findByRole("application", {
      name: "Chart values, arrow keys move between points",
    });
    expect(surface.dataset.trackOwner).toBe("ui/chart.tsx#ChartHover:div.1");
    act(() => surface.focus());
    fireEvent.keyDown(surface, { key: "ArrowRight" });
    fireEvent.keyDown(surface, { key: "Enter" });
    expect(onSelect).toHaveBeenLastCalledWith({ day: 1, series: undefined });
    expect(screen.getByRole("status").textContent).toContain("Spend");
    fireEvent.keyDown(surface, { key: "Escape" });
    expect(screen.getByRole("status").textContent).toBe("");
  });
});
