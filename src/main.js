import { SimulationController } from "./systems/SimulationController.js";
import { WorldRenderer } from "./render/WorldRenderer.js";

async function boot() {
  const container = document.querySelector("#app");
  if (!container) {
    throw new Error("Missing #app container");
  }

  const simulation = new SimulationController();
  const renderer = new WorldRenderer(simulation);
  await renderer.initialize(container);

  const scentToggleButton = document.querySelector("#toggle-food-scent");
  let showFoodScentMap = false;

  function syncToggleButton() {
    if (!scentToggleButton) {
      return;
    }

    scentToggleButton.classList.toggle("is-active", showFoodScentMap);
    scentToggleButton.setAttribute("aria-pressed", String(showFoodScentMap));
  }

  if (scentToggleButton) {
    scentToggleButton.addEventListener("click", () => {
      showFoodScentMap = !showFoodScentMap;
      simulation.setFoodScentOverlayEnabled(showFoodScentMap);
      renderer.setShowFoodScentMap(showFoodScentMap);
      syncToggleButton();
    });
  }

  syncToggleButton();

  let previousTime = performance.now();

  function frame(now) {
    const deltaTime = (now - previousTime) / 1000;
    previousTime = now;

    simulation.update(deltaTime);
    renderer.render(simulation.elapsedTime);

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

boot();
