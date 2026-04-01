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
