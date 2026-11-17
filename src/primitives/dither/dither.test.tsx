import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@paper-design/shaders-react", () => ({
  Dithering: (props: Record<string, unknown>) => (
    <div
      data-testid="dithering"
      data-props={JSON.stringify(props, (key, value) =>
        key === "ref" ? undefined : value,
      )}
    />
  ),
}));

const { DitherFill, DitherShader, lightenHex, monochrome, SHADER_TRANSPARENT } =
  await import("@/primitives/dither");

afterEach(cleanup);

describe("colour helpers", () => {
  it("keeps greys and extremes under the mono ink", () => {
    expect(monochrome("#ffffff")).toBe("#ffffff");
    expect(monochrome("#000000")).toBe("#000000");
    expect(monochrome("#808080")).toBe("#808080");
  });

  it("drops chroma but keeps OKLab lightness", () => {
    const grey = monochrome("#778abd");
    expect(grey.slice(1, 3)).toBe(grey.slice(3, 5));
    expect(
      Math.abs(Number.parseInt(grey.slice(1, 3), 16) - 0x8c),
    ).toBeLessThanOrEqual(1);
  });

  it("lightens toward white like Capy's fabric", () => {
    expect(lightenHex("#000000", 0.18)).toBe("#2e2e2e");
    expect(lightenHex("#ffffff", 0.5)).toBe("#ffffff");
  });

  it("uses a fully transparent back colour", () => {
    expect(SHADER_TRANSPARENT).toBe("#00000000");
  });
});

describe("DitherFill", () => {
  it("renders a decorative canvas in the primary text colour", () => {
    const { container } = render(
      <DitherFill fractions={[0.2, null, 0.8]} className="h-8" />,
    );
    const canvas = container.querySelector("canvas");
    expect(canvas?.dataset.slot).toBe("dither-fill");
    expect(canvas?.getAttribute("aria-hidden")).toBe("true");
    expect(canvas?.className).toBe("w-full text-primary h-8");
  });
});

describe("DitherShader", () => {
  it("mounts Paper's Dithering with Capy's fixed settings", () => {
    const { container, getByTestId } = render(
      <DitherShader
        animate={false}
        frame={40000}
        animationSpeed={0.5}
        size={3}
        scale={2}
        shape="simplex"
        type="8x8"
        colorBack={SHADER_TRANSPARENT}
        colorFront="#ffffff"
      />,
    );
    expect(
      container.querySelector("[data-slot=dither-shader]")?.className,
    ).toBe("ph-no-capture h-full w-full");
    const props = JSON.parse(getByTestId("dithering").dataset.props ?? "{}");
    expect(props).toMatchObject({
      width: "100%",
      height: "100%",
      minPixelRatio: 1,
      maxPixelCount: 1,
      speed: 0,
      frame: 40000,
      size: 3,
      scale: 2,
      shape: "simplex",
      type: "8x8",
      className: "[&_canvas]:[image-rendering:pixelated]",
    });
    expect(props.webGlContextAttributes).toMatchObject({
      alpha: true,
      antialias: false,
    });
  });
});
