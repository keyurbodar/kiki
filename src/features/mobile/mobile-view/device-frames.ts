export type DeviceOs = "ios" | "android";

export type DeviceFold = "folded" | "unfolded";

export type DeviceFrameStyle = "device" | "panel";

export type DeviceSize = { width: number; height: number };

export type ScreenRect = DeviceSize & { x: number; y: number };

export type Corners = readonly [number, number, number, number];

type FrameSpec = {
  size: DeviceSize;
  screen: ScreenRect;
  corners: Corners;
  display: DeviceSize;
  landscape?: { size: DeviceSize; screen: ScreenRect };
  landscapeRotation?: number;
};

export type ResolvedFrame = {
  size: DeviceSize;
  screen: ScreenRect;
  corners: Corners;
};

const even = (radius: number): Corners => [radius, radius, radius, radius];

const iphone17ProMax: FrameSpec = {
  size: { width: 1470, height: 3000 },
  screen: { x: 75, y: 66, width: 1320, height: 2868 },
  corners: even(155),
  display: { width: 1320, height: 2868 },
};

const pixel7: FrameSpec = {
  size: { width: 1107, height: 2347 },
  screen: { x: 36, y: 47, width: 1035, height: 2253 },
  corners: even(60),
  display: { width: 1035, height: 2253 },
  landscape: {
    size: { width: 2347, height: 1107 },
    screen: { x: 61, y: 36, width: 2253, height: 1035 },
  },
};

export const deviceFrames: Record<DeviceOs, Record<string, FrameSpec>> = {
  ios: {
    "iPhone 15": {
      size: { width: 1530, height: 3036 },
      screen: { x: 120, y: 120, width: 1290, height: 2796 },
      corners: even(180),
      display: { width: 1290, height: 2796 },
    },
    "iPhone 16": {
      size: { width: 1359, height: 2736 },
      screen: { x: 90, y: 90, width: 1179, height: 2556 },
      corners: even(165),
      display: { width: 1179, height: 2556 },
    },
    "iPhone 17 Pro Max": iphone17ProMax,
    "iPhone 18 Pro": {
      ...iphone17ProMax,
      display: { width: 1206, height: 2622 },
    },
    "iPhone 18 Pro Max": iphone17ProMax,
    "iPhone Air": {
      size: { width: 1380, height: 2880 },
      screen: { x: 60, y: 72, width: 1260, height: 2736 },
      corners: even(160),
      display: { width: 1260, height: 2736 },
    },
    "iPad Pro 13-inch (M4)": {
      size: { width: 2300, height: 3000 },
      screen: { x: 118, y: 124, width: 2064, height: 2752 },
      corners: even(55),
      display: { width: 2064, height: 2752 },
    },
  },
  android: { "Pixel 7": pixel7 },
};

export const deviceFolds: readonly DeviceFold[] = ["folded", "unfolded"];

export const foldFrames: Record<DeviceFold, { id: number; frame: FrameSpec }> =
  {
    folded: {
      id: 1,
      frame: {
        size: { width: 1538, height: 2174 },
        screen: { x: 70, y: 70, width: 1398, height: 2034 },
        corners: [24, 177, 177, 24],
        display: { width: 1398, height: 2034 },
        landscapeRotation: -90,
      },
    },
    unfolded: {
      id: 3,
      frame: {
        size: { width: 2148, height: 2994 },
        screen: { x: 70, y: 70, width: 2008, height: 2854 },
        corners: even(165),
        display: { width: 2008, height: 2854 },
        landscape: {
          size: { width: 2994, height: 2148 },
          screen: { x: 70, y: 70, width: 2854, height: 2008 },
        },
      },
    },
  };

const foldScale = 3;

const aspect = (size: DeviceSize) =>
  Math.min(size.width, size.height) / Math.max(size.width, size.height);

export const isFoldableModel = (model: string | undefined) =>
  model?.includes("Duo") === true;

export function foldForDisplay(
  model: string | undefined,
  screenId: number | undefined,
  display: DeviceSize,
): DeviceFold | undefined {
  if (!isFoldableModel(model)) return undefined;
  return (
    deviceFolds.find((fold) => foldFrames[fold].id === screenId) ??
    deviceFolds.find(
      (fold) =>
        Math.abs(aspect(foldFrames[fold].frame.display) - aspect(display)) <=
        0.008,
    )
  );
}

export function foldViewport(fold: DeviceFold, landscape: boolean) {
  const display = foldFrames[fold].frame.display;
  const width = Math.round(display.width / foldScale);
  const height = Math.round(display.height / foldScale);
  return landscape ? { width: height, height: width } : { width, height };
}

export function rotateCorners(corners: Corners, quarterTurns: number): Corners {
  const turns = ((quarterTurns % 4) + 4) % 4;
  const at = (index: number) => corners[(index - turns + 4) % 4] ?? 0;
  return [at(0), at(1), at(2), at(3)];
}

export function resolveDeviceFrame(
  os: DeviceOs,
  model: string | undefined,
  fold: DeviceFold | undefined,
  landscape: boolean,
): ResolvedFrame {
  const spec = isFoldableModel(model)
    ? foldFrames[fold ?? "folded"].frame
    : ((model === undefined ? undefined : deviceFrames[os][model]) ??
      (os === "ios" ? iphone17ProMax : pixel7));
  if (!landscape)
    return { size: spec.size, screen: spec.screen, corners: spec.corners };
  if (spec.landscape !== undefined) {
    const android = os === "android";
    const { size, screen } = spec.landscape;
    return {
      size,
      screen: android
        ? {
            x: size.width - screen.x - screen.width,
            y: size.height - screen.y - screen.height,
            width: screen.width,
            height: screen.height,
          }
        : screen,
      corners: rotateCorners(spec.corners, android ? 3 : 1),
    };
  }
  const rotation = spec.landscapeRotation ?? 90;
  const { screen, size } = spec;
  return {
    size: { width: size.height, height: size.width },
    screen:
      rotation === 90
        ? {
            x: size.height - screen.y - screen.height,
            y: screen.x,
            width: screen.height,
            height: screen.width,
          }
        : {
            x: screen.y,
            y: size.width - screen.x - screen.width,
            width: screen.height,
            height: screen.width,
          },
    corners: rotateCorners(spec.corners, rotation / 90),
  };
}

export const percentOf = (value: number, total: number) =>
  `${(value / total) * 100}%`;

export function pointToDevice(
  rect: { left: number; top: number; width: number; height: number },
  device: DeviceSize,
  clientX: number,
  clientY: number,
  clamp = false,
) {
  if (rect.width === 0 || rect.height === 0) return undefined;
  const scale = Math.min(
    rect.width / device.width,
    rect.height / device.height,
  );
  const left = rect.left + (rect.width - device.width * scale) / 2;
  const top = rect.top + (rect.height - device.height * scale) / 2;
  const x = (clientX - left) / scale;
  const y = (clientY - top) / scale;
  const inside = x >= 0 && y >= 0 && x <= device.width && y <= device.height;
  if (!inside && !clamp) return undefined;
  return {
    x: Math.round(Math.min(Math.max(x, 0), device.width)),
    y: Math.round(Math.min(Math.max(y, 0), device.height)),
  };
}
