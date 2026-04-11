import { SimulationController } from "./systems/SimulationController.js";
import { SIMULATION_TUNING } from "./config/tuning.js";
import { WorldRenderer } from "./render/WorldRenderer.js";

const HEADLESS_STEPS_PER_FRAME = 12;
const BATCH_MAX_STEPS_PER_FRAME = 240;
const BATCH_CPU_BUDGET_MS = 12;

async function boot() {
  const container = document.querySelector("#app");
  if (!container) {
    throw new Error("Missing #app container");
  }

  const simulation = new SimulationController();
  const renderer = new WorldRenderer(simulation);
  await renderer.initialize(container);

  const scentToggleButton = document.querySelector("#toggle-food-scent");
  const seasonChip = document.querySelector("#season-chip");
  const simulationModeButtons = Array.from(document.querySelectorAll("[data-sim-mode]"));
  let showFoodScentMap = false;
  let simulationMode = "normal";
  let previousTime = performance.now();

  function syncToggleButton() {
    if (!scentToggleButton) {
      return;
    }

    scentToggleButton.classList.toggle("is-active", showFoodScentMap);
    scentToggleButton.setAttribute("aria-pressed", String(showFoodScentMap));
  }

  function syncSimulationModeButtons() {
    for (const button of simulationModeButtons) {
      const isActive = button.dataset.simMode === simulationMode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    }
  }

  function syncCanvasVisibility() {
    const showCanvas = simulationMode === "normal";
    if (renderer.app?.view) {
      renderer.app.view.style.visibility = showCanvas ? "visible" : "hidden";
    }
  }

  function syncSeasonChip() {
    if (!seasonChip) {
      return;
    }

    seasonChip.textContent = "Season " + String(simulation.currentSeason?.index ?? 1);
  }

  if (scentToggleButton) {
    scentToggleButton.addEventListener("click", () => {
      showFoodScentMap = !showFoodScentMap;
      simulation.setFoodScentOverlayEnabled(showFoodScentMap);
      renderer.setShowFoodScentMap(showFoodScentMap);
      syncToggleButton();
    });
  }

  for (const button of simulationModeButtons) {
    button.addEventListener("click", () => {
      simulationMode = button.dataset.simMode ?? "normal";
      previousTime = performance.now();
      syncSimulationModeButtons();
      syncCanvasVisibility();
      if (simulationMode === "normal") {
        renderer.render(simulation.elapsedTime);
      }
    });
  }

  syncToggleButton();
  syncSimulationModeButtons();
  syncCanvasVisibility();
  syncSeasonChip();

  function frame(now) {
    const deltaTime = (now - previousTime) / 1000;
    previousTime = now;

    if (simulationMode === "headless") {
      for (let step = 0; step < HEADLESS_STEPS_PER_FRAME; step += 1) {
        simulation.update(SIMULATION_TUNING.fixedTimeStep);
      }
    } else if (simulationMode === "batch") {
      const batchStart = performance.now();
      let steps = 0;

      while (steps < BATCH_MAX_STEPS_PER_FRAME && performance.now() - batchStart < BATCH_CPU_BUDGET_MS) {
        simulation.update(SIMULATION_TUNING.fixedTimeStep);
        steps += 1;
      }
    } else {
      simulation.update(deltaTime);
    }

    syncSeasonChip();

    if (simulationMode === "normal") {
      renderer.render(simulation.elapsedTime);
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

boot();
