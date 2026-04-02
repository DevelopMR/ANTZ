import { SIMULATION_TUNING } from "./config/tuning.js";
import { SimulationController } from "./systems/SimulationController.js";
import { WorldRenderer } from "./render/WorldRenderer.js";

function createRuntimeSettings() {
  return {
    animationMode: "animated",
    simulationMode: "running",
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

function bindControls(runtimeSettings, simulation, metrics) {
  const animationSelect = document.querySelector("#animation-mode");
  const simulationSelect = document.querySelector("#simulation-mode");
  const stepButton = document.querySelector("#step-button");
  const resetMetricsButton = document.querySelector("#reset-metrics");
  const fpsStat = document.querySelector("#stat-fps");
  const frameMsStat = document.querySelector("#stat-frame-ms");
  const animationModeStat = document.querySelector("#stat-animation-mode");
  const simModeStat = document.querySelector("#stat-sim-mode");
  const antCountStat = document.querySelector("#stat-ant-count");
  const sampleWindowStat = document.querySelector("#stat-sample-window");

  animationSelect.value = runtimeSettings.animationMode;
  simulationSelect.value = runtimeSettings.simulationMode;
  antCountStat.textContent = String(simulation.ants.length);

  animationSelect.addEventListener("change", () => {
    runtimeSettings.animationMode = animationSelect.value;
  });

  simulationSelect.addEventListener("change", () => {
    runtimeSettings.simulationMode = simulationSelect.value;
  });

  stepButton.addEventListener("click", () => {
    simulation.update(SIMULATION_TUNING.fixedTimeStep);
  });

  resetMetricsButton.addEventListener("click", () => {
    resetMetrics(metrics);
  });

  return () => {
    fpsStat.textContent = metrics.fps.toFixed(1);
    frameMsStat.textContent = metrics.averageFrameMs.toFixed(2);
    animationModeStat.textContent = runtimeSettings.animationMode === "animated" ? "Animated" : "Static";
    simModeStat.textContent = runtimeSettings.simulationMode === "running" ? "Running" : "Paused";
    sampleWindowStat.textContent = `${metrics.sampleElapsed.toFixed(1)}s`;
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

  const refreshStats = bindControls(runtimeSettings, simulation, metrics);
  let previousTime = performance.now();
  let statsRefreshTimer = 0;

  function frame(now) {
    const deltaTime = (now - previousTime) / 1000;
    previousTime = now;

    if (runtimeSettings.simulationMode === "running") {
      simulation.update(deltaTime);
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
