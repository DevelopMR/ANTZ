import { SIMULATION_TUNING } from "./config/tuning.js";
import { SimulationController } from "./systems/SimulationController.js";
import { WorldRenderer } from "./render/WorldRenderer.js";

function createRuntimeSettings() {
  return {
    animationMode: "animated",
    simulationMode: "running",
    spreadMode: "grounded",
    simulationHz: 60,
    movementMode: "precompute",
    behaviorDetail: "full",
    sizeProfile: "original",
  };
}

function createMetrics() {
  return {
    sampleElapsed: 0,
    frameCount: 0,
    averageFrameMs: 0,
    fps: 0,
  };
}

function resetMetrics(metrics) {
  metrics.sampleElapsed = 0;
  metrics.frameCount = 0;
  metrics.averageFrameMs = 0;
  metrics.fps = 0;
}

function bindControls(runtimeSettings, simulation, renderer, metrics) {
  const animationSelect = document.querySelector("#animation-mode");
  const simulationSelect = document.querySelector("#simulation-mode");
  const spreadSelect = document.querySelector("#spread-mode");
  const simulationHzSelect = document.querySelector("#simulation-hz");
  const movementModeSelect = document.querySelector("#movement-mode");
  const behaviorDetailSelect = document.querySelector("#behavior-detail");
  const sizeProfileSelect = document.querySelector("#size-profile");
  const stepButton = document.querySelector("#step-button");
  const resetMetricsButton = document.querySelector("#reset-metrics");
  const respawnButton = document.querySelector("#respawn-button");
  const applyLayoutButton = document.querySelector("#apply-layout");
  const fpsStat = document.querySelector("#stat-fps");
  const frameMsStat = document.querySelector("#stat-frame-ms");
  const animationModeStat = document.querySelector("#stat-animation-mode");
  const simModeStat = document.querySelector("#stat-sim-mode");
  const antCountStat = document.querySelector("#stat-ant-count");
  const sampleWindowStat = document.querySelector("#stat-sample-window");
  const layoutModeStat = document.querySelector("#stat-layout-mode");
  const simHzStat = document.querySelector("#stat-sim-hz");
  const movementModeStat = document.querySelector("#stat-movement-mode");
  const detailModeStat = document.querySelector("#stat-detail-mode");
  const sizeModeStat = document.querySelector("#stat-size-mode");

  function refreshAntCount() {
    antCountStat.textContent = String(simulation.ants.length);
  }

  function applyRespawn() {
    simulation.respawn(runtimeSettings);
    renderer.rebuildAntViews(runtimeSettings);
    refreshAntCount();
  }

  animationSelect.value = runtimeSettings.animationMode;
  simulationSelect.value = runtimeSettings.simulationMode;
  spreadSelect.value = runtimeSettings.spreadMode;
  simulationHzSelect.value = String(runtimeSettings.simulationHz);
  movementModeSelect.value = runtimeSettings.movementMode;
  behaviorDetailSelect.value = runtimeSettings.behaviorDetail;
  sizeProfileSelect.value = runtimeSettings.sizeProfile;
  refreshAntCount();

  animationSelect.addEventListener("change", () => {
    runtimeSettings.animationMode = animationSelect.value;
  });

  simulationSelect.addEventListener("change", () => {
    runtimeSettings.simulationMode = simulationSelect.value;
  });

  spreadSelect.addEventListener("change", () => {
    runtimeSettings.spreadMode = spreadSelect.value;
  });

  simulationHzSelect.addEventListener("change", () => {
    runtimeSettings.simulationHz = Number(simulationHzSelect.value);
  });

  movementModeSelect.addEventListener("change", () => {
    runtimeSettings.movementMode = movementModeSelect.value;
  });

  behaviorDetailSelect.addEventListener("change", () => {
    runtimeSettings.behaviorDetail = behaviorDetailSelect.value;
  });

  sizeProfileSelect.addEventListener("change", () => {
    runtimeSettings.sizeProfile = sizeProfileSelect.value;
  });

  stepButton.addEventListener("click", () => {
    simulation.step(runtimeSettings);
  });

  respawnButton.addEventListener("click", applyRespawn);
  applyLayoutButton.addEventListener("click", applyRespawn);

  resetMetricsButton.addEventListener("click", () => {
    resetMetrics(metrics);
  });

  return () => {
    fpsStat.textContent = metrics.fps.toFixed(1);
    frameMsStat.textContent = metrics.averageFrameMs.toFixed(2);
    animationModeStat.textContent = runtimeSettings.animationMode === "animated" ? "Animated" : "Static";
    simModeStat.textContent = runtimeSettings.simulationMode === "running" ? "Running" : "Paused";
    sampleWindowStat.textContent = `${metrics.sampleElapsed.toFixed(1)}s`;
    layoutModeStat.textContent = runtimeSettings.spreadMode === "spread" ? "Spread" : "Grounded";
    simHzStat.textContent = `${runtimeSettings.simulationHz}`;
    movementModeStat.textContent = runtimeSettings.movementMode === "precompute" ? "Precompute" : "Simplify";
    detailModeStat.textContent = runtimeSettings.behaviorDetail === "full" ? "Full" : "Low";
    sizeModeStat.textContent = runtimeSettings.sizeProfile === "compact" ? "Compact" : "Original";
  };
}

async function boot() {
  const container = document.querySelector("#app");
  if (!container) {
    throw new Error("Missing #app container");
  }

  const runtimeSettings = createRuntimeSettings();
  const metrics = createMetrics();
  const simulation = new SimulationController();
  const renderer = new WorldRenderer(simulation);
  await renderer.initialize(container);

  const refreshStats = bindControls(runtimeSettings, simulation, renderer, metrics);
  let previousTime = performance.now();
  let statsRefreshTimer = 0;

  function frame(now) {
    const deltaTime = (now - previousTime) / 1000;
    previousTime = now;

    if (runtimeSettings.simulationMode === "running") {
      simulation.update(deltaTime, runtimeSettings);
    }

    renderer.render(simulation.elapsedTime, runtimeSettings);

    metrics.sampleElapsed += deltaTime;
    metrics.frameCount += 1;
    metrics.averageFrameMs += ((deltaTime * 1000) - metrics.averageFrameMs) / metrics.frameCount;
    metrics.fps = metrics.sampleElapsed > 0 ? metrics.frameCount / metrics.sampleElapsed : 0;

    statsRefreshTimer += deltaTime;
    if (statsRefreshTimer >= 0.2) {
      refreshStats();
      statsRefreshTimer = 0;
    }

    if (metrics.sampleElapsed >= 5) {
      resetMetrics(metrics);
    }

    requestAnimationFrame(frame);
  }

  refreshStats();
  requestAnimationFrame(frame);
}

boot();
