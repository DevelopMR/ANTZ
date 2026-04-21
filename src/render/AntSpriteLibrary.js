import { BaseTexture, Rectangle, Texture } from "https://cdn.jsdelivr.net/npm/pixi.js@7.4.2/dist/pixi.mjs";
import { ANT_TUNING } from "../config/tuning.js";

function createFrameCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = ANT_TUNING.spriteWidth;
  canvas.height = ANT_TUNING.spriteHeight;
  return canvas;
}

function setupContext(ctx) {
  ctx.clearRect(0, 0, ANT_TUNING.spriteWidth, ANT_TUNING.spriteHeight);
  ctx.fillStyle = "#0f0d0b";
  ctx.strokeStyle = "#0f0d0b";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

function drawEllipse(ctx, x, y, radiusX, radiusY, rotation = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, radiusX, radiusY, rotation, 0, Math.PI * 2);
  ctx.fill();
}

function drawLine(ctx, fromX, fromY, toX, toY, width = 1.55) {
  ctx.beginPath();
  ctx.lineWidth = width;
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
}

function strokeEllipseHighlight(ctx, x, y, radiusX, radiusY, rotation = 0) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.46)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(
    x - 0.95,
    y - 0.95,
    Math.max(1, radiusX - 1.15),
    Math.max(1, radiusY - 1.15),
    rotation,
    Math.PI * 1.01,
    Math.PI * 1.67
  );
  ctx.stroke();
  ctx.restore();
}

function drawBodyHighlight(ctx, head, thorax, abdomen) {
  strokeEllipseHighlight(ctx, head.x, head.y, head.rx, head.ry, head.rot || 0);
  strokeEllipseHighlight(ctx, thorax.x, thorax.y, thorax.rx, thorax.ry, thorax.rot || 0);
  strokeEllipseHighlight(ctx, abdomen.x, abdomen.y, abdomen.rx, abdomen.ry, abdomen.rot || 0);
}

function drawSideBody(ctx, bodyLift = 0, abdomenTilt = 0.05, headLift = 0) {
  const head = { x: 15.4, y: 23.6 - bodyLift * 0.35 - headLift, rx: 5.15, ry: 4.75, rot: 0 };
  const thorax = { x: 26.6, y: 24.8 - bodyLift * 0.16 - headLift * 0.28, rx: 4.45, ry: 3.55, rot: 0.08 };
  const abdomen = { x: 40.6, y: 26.7 - bodyLift, rx: 9.2, ry: 5.75, rot: abdomenTilt };

  drawEllipse(ctx, head.x, head.y, head.rx, head.ry, head.rot);
  drawEllipse(ctx, thorax.x, thorax.y, thorax.rx, thorax.ry, thorax.rot);
  drawEllipse(ctx, abdomen.x, abdomen.y, abdomen.rx, abdomen.ry, abdomen.rot);
  drawBodyHighlight(ctx, head, thorax, abdomen);
}

function drawSideAntennae(ctx, spread = 0, headLift = 0) {
  drawLine(ctx, 11.1, 21.0 - headLift, 5.7, 16.1 - spread - headLift * 1.1, 1.35);
  drawLine(ctx, 12.0, 23.0 - headLift, 4.8, 21.1 + spread * 0.18 - headLift * 0.5, 1.35);
}

function renderFrame(drawFn) {
  const canvas = createFrameCanvas();
  const ctx = canvas.getContext("2d");
  setupContext(ctx);
  drawFn(ctx);
  return canvas;
}

function makeStandingFrame(rock) {
  return renderFrame((ctx) => {
    drawSideBody(ctx, rock * 0.45, 0.035 + rock * 0.01, 0.18 + rock * 0.12);
    drawSideAntennae(ctx, rock * 0.4, 0.18 + rock * 0.12);

    drawLine(ctx, 21.2, 27.7, 18.1, 38.0 + rock * 0.2, 1.55);
    drawLine(ctx, 26.3, 27.5, 25.8, 39.0 - rock * 0.15, 1.55);
    drawLine(ctx, 33.5, 27.8, 39.1, 38.0 + rock * 0.22, 1.55);
    drawLine(ctx, 24.0, 27.5, 21.2, 38.6 - rock * 0.15, 1.45);
    drawLine(ctx, 29.3, 27.5, 29.7, 39.2 + rock * 0.08, 1.45);
    drawLine(ctx, 36.2, 27.6, 45.0, 38.0 - rock * 0.18, 1.45);
  });
}

function makeWalkingFrame(step) {
  return renderFrame((ctx) => {
    drawSideBody(ctx, 0.15, 0.045, 0);
    drawSideAntennae(ctx, step * 0.16, 0);

    drawLine(ctx, 20.7, 27.6, 16.4, 37.8 + step * 0.82, 1.55);
    drawLine(ctx, 26.0, 27.7, 24.4, 39.7 - step * 0.6, 1.55);
    drawLine(ctx, 33.2, 27.6, 40.1, 37.6 + step * 0.75, 1.55);
    drawLine(ctx, 23.4, 27.6, 19.2, 38.7 - step * 0.62, 1.45);
    drawLine(ctx, 29.5, 27.6, 29.8, 39.7 + step * 0.42, 1.45);
    drawLine(ctx, 36.5, 27.6, 46.3, 38.0 - step * 0.78, 1.45);
  });
}

function makeReachingFrame(reach) {
  return renderFrame((ctx) => {
    const headLift = 4.2 + reach * 1.0;
    drawSideBody(ctx, 1.1, 0.03, headLift);
    drawSideAntennae(ctx, reach * 0.25, headLift + 0.2);

    drawLine(ctx, 18.6, 20.6 - headLift * 0.82, 10.0, 10.0 - reach * 2.35 - headLift * 0.8, 1.55);
    drawLine(ctx, 22.8, 19.0 - headLift * 0.72, 16.0, 4.8 - reach * 1.85 - headLift * 0.88, 1.55);

    drawLine(ctx, 24.8, 27.9, 21.4, 39.6, 1.55);
    drawLine(ctx, 29.9, 27.9, 29.5, 40.0, 1.55);
    drawLine(ctx, 34.0, 27.7, 38.7, 38.5, 1.45);
    drawLine(ctx, 37.2, 27.4, 46.4, 35.2 + reach * 0.22, 1.45);
  });
}

function makeGraspingFrame(tension) {
  return renderFrame((ctx) => {
    const head = { x: 28, y: 11.6, rx: 5.8, ry: 5.15, rot: 0 };
    const thorax = { x: 28, y: 24.7, rx: 5.8, ry: 5.25, rot: 0 };
    const abdomen = { x: 28, y: 39.6, rx: 7.4, ry: 11.3, rot: 0 };
    drawEllipse(ctx, abdomen.x, abdomen.y, abdomen.rx, abdomen.ry);
    drawEllipse(ctx, thorax.x, thorax.y, thorax.rx, thorax.ry);
    drawEllipse(ctx, head.x, head.y, head.rx, head.ry);
    drawBodyHighlight(ctx, head, thorax, abdomen);

    drawLine(ctx, 25.9, 7.4, 19.2, 2.8 - tension * 0.7, 1.35);
    drawLine(ctx, 30.1, 7.4, 36.8, 2.8 - tension * 0.7, 1.35);

    drawLine(ctx, 28.0, 22.8, 12.2, 15.7 + tension, 1.55);
    drawLine(ctx, 28.0, 22.8, 43.8, 15.7 + tension, 1.55);
    drawLine(ctx, 28.0, 26.0, 9.8, 29.6 - tension * 0.75, 1.55);
    drawLine(ctx, 28.0, 26.0, 46.2, 29.6 - tension * 0.75, 1.55);
    drawLine(ctx, 27.3, 31.3, 15.0, 48.0 + tension * 0.85, 1.55);
    drawLine(ctx, 28.7, 31.3, 41.0, 48.0 + tension * 0.85, 1.55);
  });
}

function makeDeadFrame() {
  return renderFrame((ctx) => {
    const head = { x: 16.2, y: 37.2, rx: 4.8, ry: 4.4, rot: 0 };
    const thorax = { x: 27.4, y: 36.5, rx: 4.7, ry: 3.9, rot: -0.06 };
    const abdomen = { x: 41.0, y: 35.9, rx: 8.8, ry: 5.5, rot: -0.05 };

    drawEllipse(ctx, head.x, head.y, head.rx, head.ry, head.rot);
    drawEllipse(ctx, thorax.x, thorax.y, thorax.rx, thorax.ry, thorax.rot);
    drawEllipse(ctx, abdomen.x, abdomen.y, abdomen.rx, abdomen.ry, abdomen.rot);
    drawBodyHighlight(ctx, head, thorax, abdomen);

    drawLine(ctx, 12.1, 34.4, 7.3, 27.2, 1.35);
    drawLine(ctx, 13.0, 36.0, 6.1, 33.4, 1.35);

    drawLine(ctx, 21.0, 35.0, 16.7, 24.6, 1.55);
    drawLine(ctx, 26.2, 35.2, 24.8, 23.0, 1.55);
    drawLine(ctx, 33.1, 35.1, 39.5, 25.1, 1.55);
    drawLine(ctx, 23.5, 36.1, 20.0, 25.8, 1.45);
    drawLine(ctx, 29.2, 36.0, 30.0, 24.1, 1.45);
    drawLine(ctx, 36.4, 35.8, 45.1, 27.0, 1.45);
  });
}

function makeDecayingFrame() {
  return renderFrame((ctx) => {
    ctx.fillStyle = "#31422b";
    ctx.strokeStyle = "#31422b";

    const head = { x: 16.2, y: 37.2, rx: 4.8, ry: 4.4, rot: 0 };
    const thorax = { x: 27.4, y: 36.5, rx: 4.7, ry: 3.9, rot: -0.06 };
    const abdomen = { x: 41.0, y: 35.9, rx: 8.8, ry: 5.5, rot: -0.05 };

    drawEllipse(ctx, head.x, head.y, head.rx, head.ry, head.rot);
    drawEllipse(ctx, thorax.x, thorax.y, thorax.rx, thorax.ry, thorax.rot);
    drawEllipse(ctx, abdomen.x, abdomen.y, abdomen.rx, abdomen.ry, abdomen.rot);
    drawBodyHighlight(ctx, head, thorax, abdomen);

    drawLine(ctx, 12.1, 34.4, 7.3, 27.2, 1.35);
    drawLine(ctx, 13.0, 36.0, 6.1, 33.4, 1.35);

    drawLine(ctx, 21.0, 35.0, 16.7, 24.6, 1.55);
    drawLine(ctx, 26.2, 35.2, 24.8, 23.0, 1.55);
    drawLine(ctx, 33.1, 35.1, 39.5, 25.1, 1.55);
    drawLine(ctx, 23.5, 36.1, 20.0, 25.8, 1.45);
    drawLine(ctx, 29.2, 36.0, 30.0, 24.1, 1.45);
    drawLine(ctx, 36.4, 35.8, 45.1, 27.0, 1.45);
  });
}

function buildFrames() {

  return {
    standing: [
      makeStandingFrame(-0.75),
      makeStandingFrame(0),
      makeStandingFrame(0.75),
    ],
    walking: [
      makeWalkingFrame(-1.15),
      makeWalkingFrame(-0.3),
      makeWalkingFrame(0.55),
      makeWalkingFrame(1.15),
    ],
    reaching: [
      makeReachingFrame(-0.6),
      makeReachingFrame(0),
      makeReachingFrame(0.65),
      makeReachingFrame(1.05),
    ],
    grasping: [
      makeGraspingFrame(-0.55),
      makeGraspingFrame(0),
      makeGraspingFrame(0.55),
    ],
    dead: [
      makeDeadFrame(),
    ],
    decaying: [
      makeDecayingFrame(),
    ],
  };
}

function flattenFrames(frameMap) {
  const entries = [];
  for (const [state, frames] of Object.entries(frameMap)) {
    for (const frame of frames) {
      entries.push({ state, frame });
    }
  }
  return entries;
}

export function createAntSpriteLibrary() {
  const frameMap = buildFrames();
  const frameEntries = flattenFrames(frameMap);
  const atlasCanvas = document.createElement("canvas");
  atlasCanvas.width = ANT_TUNING.spriteWidth * frameEntries.length;
  atlasCanvas.height = ANT_TUNING.spriteHeight;

  const atlasContext = atlasCanvas.getContext("2d");
  frameEntries.forEach((entry, index) => {
    atlasContext.drawImage(entry.frame, index * ANT_TUNING.spriteWidth, 0);
  });

  const baseTexture = BaseTexture.from(atlasCanvas);
  const spriteLibrary = {};
  let frameIndex = 0;

  for (const [state, frames] of Object.entries(frameMap)) {
    spriteLibrary[state] = frames.map(() => {
      const texture = new Texture(
        baseTexture,
        new Rectangle(
          frameIndex * ANT_TUNING.spriteWidth,
          0,
          ANT_TUNING.spriteWidth,
          ANT_TUNING.spriteHeight
        )
      );
      frameIndex += 1;
      return texture;
    });
  }

  return spriteLibrary;
}
