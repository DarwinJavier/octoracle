export const omittedRuntimeAssets = new Set(["aquarium-glass-overlay.png"]);

const mascot = [
  "octopus-idle-front.png",
  "octopus-idle-alt.png",
  "octopus-inspect-left.png",
  "octopus-inspect-right.png",
  "octopus-thinking.png",
  "octopus-hesitate-center.png",
  "octopus-reconsider-turn.png",
  "octopus-draw-shrug.png",
  "octopus-swim-left.png",
  "octopus-swim-right.png",
  "octopus-swim-center.png",
  "octopus-select-left.png",
  "octopus-select-right.png",
  "octopus-open-reveal.png",
  "octopus-celebrate.png",
];

const props = [
  "prediction-box-closed.png",
  "prediction-box-open.png",
  "draw-shell-closed.png",
  "draw-shell-open.png",
  "soccer-ball-bait.png",
];

const effects = [
  "bubbles-small.png",
  "bubbles-medium.png",
  "bubbles-stream.png",
  "prediction-reveal-burst.png",
];

const overlays = ["aquarium-glass-overlay.png"];

function entries(files, directory, width, height, transparency) {
  return files.map((filename) => ({
    filename,
    directory,
    sourceWidth:
      directory === "backgrounds" || directory === "overlays" ? 1672 : 1254,
    sourceHeight:
      directory === "backgrounds" || directory === "overlays" ? 941 : 1254,
    runtimeMaxWidth: width,
    runtimeMaxHeight: height,
    transparency,
  }));
}

export const assetConfig = [
  ...entries(mascot, "mascot", 768, 768, "transparent"),
  ...entries(props, "props", 512, 512, "transparent"),
  ...entries(
    effects.filter((filename) => filename !== "bubbles-stream.png"),
    "effects",
    256,
    256,
    "transparent",
  ),
  ...entries(["bubbles-stream.png"], "effects", 256, 512, "transparent"),
  ...entries(
    ["aquarium-far-background.png"],
    "backgrounds",
    1600,
    900,
    "opaque",
  ),
  ...entries(
    ["aquarium-midground-ruins.png"],
    "backgrounds",
    1600,
    900,
    "transparent",
  ),
  ...entries(overlays, "overlays", 1600, 900, "transparent"),
];
