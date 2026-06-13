import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { assetConfig, omittedRuntimeAssets } from "./asset-config.mjs";

const root = process.cwd();
const sourceDirectory = path.join(root, "sprites");
const outputDirectory = path.join(root, "public", "assets");

async function removeSmallEdgeArtifacts(imagePath) {
  const { data, info } = await sharp(imagePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const alphaOffset = info.channels - 1;
  const pixelCount = info.width * info.height;
  const visited = new Uint8Array(pixelCount);
  const components = [];
  let visiblePixelCount = 0;

  for (let index = 0; index < pixelCount; index += 1) {
    visiblePixelCount += data[index * info.channels + alphaOffset] > 0 ? 1 : 0;
  }

  for (let start = 0; start < pixelCount; start += 1) {
    if (visited[start] || data[start * info.channels + alphaOffset] === 0) {
      continue;
    }

    const component = [];
    const queue = [start];
    let minimumX = info.width;
    let minimumY = info.height;
    let maximumX = 0;
    let maximumY = 0;
    visited[start] = 1;

    while (queue.length > 0) {
      const index = queue.pop();
      if (index === undefined) {
        continue;
      }

      component.push(index);
      const x = index % info.width;
      const y = Math.floor(index / info.width);
      minimumX = Math.min(minimumX, x);
      minimumY = Math.min(minimumY, y);
      maximumX = Math.max(maximumX, x);
      maximumY = Math.max(maximumY, y);

      for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
        for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
          const neighborX = x + xOffset;
          const neighborY = y + yOffset;
          if (
            (xOffset === 0 && yOffset === 0) ||
            neighborX < 0 ||
            neighborY < 0 ||
            neighborX >= info.width ||
            neighborY >= info.height
          ) {
            continue;
          }

          const neighbor = neighborY * info.width + neighborX;
          if (
            !visited[neighbor] &&
            data[neighbor * info.channels + alphaOffset] > 0
          ) {
            visited[neighbor] = 1;
            queue.push(neighbor);
          }
        }
      }
    }

    const edgeMarginX = info.width * 0.05;
    const edgeMarginY = info.height * 0.05;
    const nearEdge =
      minimumX < edgeMarginX ||
      minimumY < edgeMarginY ||
      maximumX > info.width - edgeMarginX ||
      maximumY > info.height - edgeMarginY;
    components.push({ nearEdge, pixels: component });
  }

  let removedPixelCount = 0;
  for (const component of components) {
    if (
      component.nearEdge &&
      component.pixels.length < visiblePixelCount * 0.05
    ) {
      for (const index of component.pixels) {
        data[index * info.channels + alphaOffset] = 0;
      }
      removedPixelCount += component.pixels.length;
    }
  }

  if (removedPixelCount > 0) {
    await sharp(data, {
      raw: {
        channels: info.channels,
        height: info.height,
        width: info.width,
      },
    })
      .png({ compressionLevel: 9, palette: false })
      .toFile(`${imagePath}.cleaned.png`);
    await rm(imagePath);
    await import("node:fs/promises").then(({ rename }) =>
      rename(`${imagePath}.cleaned.png`, imagePath),
    );
  }

  return removedPixelCount;
}

await rm(outputDirectory, { force: true, recursive: true });

let cleanedPixelCount = 0;
for (const asset of assetConfig) {
  if (omittedRuntimeAssets.has(asset.filename)) {
    continue;
  }

  const targetDirectory = path.join(outputDirectory, asset.directory);
  await mkdir(targetDirectory, { recursive: true });

  const targetPath = path.join(targetDirectory, asset.filename);
  await sharp(path.join(sourceDirectory, asset.filename))
    .resize({
      width: asset.runtimeMaxWidth,
      height: asset.runtimeMaxHeight,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png({ compressionLevel: 9, palette: false })
    .toFile(targetPath);

  if (asset.transparency === "transparent" && asset.directory === "mascot") {
    cleanedPixelCount += await removeSmallEdgeArtifacts(targetPath);
  }
}

console.log(
  `Built ${assetConfig.length - omittedRuntimeAssets.size} runtime assets; removed ${cleanedPixelCount} stray border pixels; omitted ${[...omittedRuntimeAssets].join(", ")}.`,
);
