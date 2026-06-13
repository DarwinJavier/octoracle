import { readdir } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { assetConfig, omittedRuntimeAssets } from "./asset-config.mjs";

const root = process.cwd();
const sourceDirectory = path.join(root, "sprites");
const runtimeDirectory = path.join(root, "public", "assets");
const failures = [];

async function countVisibleBorderPixels(imagePath) {
  const { data, info } = await sharp(imagePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const alphaOffset = info.channels - 1;
  const alphaAt = (x, y) =>
    data[(y * info.width + x) * info.channels + alphaOffset];
  let visiblePixels = 0;

  for (let x = 0; x < info.width; x += 1) {
    visiblePixels += alphaAt(x, 0) > 0 ? 1 : 0;
    visiblePixels += alphaAt(x, info.height - 1) > 0 ? 1 : 0;
  }
  for (let y = 1; y < info.height - 1; y += 1) {
    visiblePixels += alphaAt(0, y) > 0 ? 1 : 0;
    visiblePixels += alphaAt(info.width - 1, y) > 0 ? 1 : 0;
  }

  return visiblePixels;
}

const expectedNames = assetConfig.map(({ filename }) => filename).sort();
const sourceNames = (await readdir(sourceDirectory))
  .filter((filename) => filename.endsWith(".png"))
  .sort();

if (JSON.stringify(sourceNames) !== JSON.stringify(expectedNames)) {
  failures.push(
    "Source sprite filenames do not exactly match the configured manifest inventory.",
  );
}

for (const asset of assetConfig) {
  const sourcePath = path.join(sourceDirectory, asset.filename);
  const sourceMetadata = await sharp(sourcePath).metadata();
  const sourceStats = await sharp(sourcePath).stats();

  if (
    sourceMetadata.width !== asset.sourceWidth ||
    sourceMetadata.height !== asset.sourceHeight
  ) {
    failures.push(
      `${asset.filename}: expected source ${asset.sourceWidth}x${asset.sourceHeight}, received ${sourceMetadata.width}x${sourceMetadata.height}.`,
    );
  }

  const sourceAlpha = sourceStats.channels[3];
  if (
    asset.transparency === "opaque" &&
    sourceMetadata.hasAlpha &&
    sourceAlpha?.min !== 255
  ) {
    failures.push(
      `${asset.filename}: opaque source contains transparent pixels.`,
    );
  }
  if (
    asset.transparency === "transparent" &&
    !omittedRuntimeAssets.has(asset.filename) &&
    (!sourceMetadata.hasAlpha || sourceAlpha?.min === 255)
  ) {
    failures.push(
      `${asset.filename}: transparent source has no transparent pixels.`,
    );
  }

  const runtimePath = path.join(
    runtimeDirectory,
    asset.directory,
    asset.filename,
  );
  if (omittedRuntimeAssets.has(asset.filename)) {
    try {
      await sharp(runtimePath).metadata();
      failures.push(
        `${asset.filename}: omitted asset unexpectedly exists in the runtime bundle.`,
      );
    } catch {
      // Expected until the overlay is repaired and approved.
    }
    continue;
  }

  let runtimeMetadata;
  let runtimeStats;
  try {
    runtimeMetadata = await sharp(runtimePath).metadata();
    runtimeStats = await sharp(runtimePath).stats();
  } catch {
    failures.push(
      `${asset.filename}: runtime export is missing or unreadable.`,
    );
    continue;
  }

  if (
    !runtimeMetadata.width ||
    !runtimeMetadata.height ||
    runtimeMetadata.width > asset.runtimeMaxWidth ||
    runtimeMetadata.height > asset.runtimeMaxHeight
  ) {
    failures.push(
      `${asset.filename}: runtime dimensions exceed the configured maximum.`,
    );
  }

  const sourceRatio = asset.sourceWidth / asset.sourceHeight;
  const runtimeRatio = runtimeMetadata.width / runtimeMetadata.height;
  if (Math.abs(sourceRatio - runtimeRatio) > 0.005) {
    failures.push(
      `${asset.filename}: runtime export changed the source aspect ratio.`,
    );
  }

  const runtimeAlpha = runtimeStats.channels[3];
  if (
    asset.transparency === "transparent" &&
    (!runtimeMetadata.hasAlpha || runtimeAlpha?.min === 255)
  ) {
    failures.push(`${asset.filename}: runtime export lost transparency.`);
  }
  if (
    asset.transparency === "transparent" &&
    asset.directory !== "backgrounds" &&
    (await countVisibleBorderPixels(runtimePath)) > 0
  ) {
    failures.push(
      `${asset.filename}: visible pixels touch the runtime image border.`,
    );
  }
  if (
    asset.transparency === "opaque" &&
    runtimeMetadata.hasAlpha &&
    runtimeAlpha?.min !== 255
  ) {
    failures.push(
      `${asset.filename}: opaque runtime export contains transparent pixels.`,
    );
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Validated ${assetConfig.length} source assets and ${assetConfig.length - omittedRuntimeAssets.size} runtime exports.`,
  );
}
