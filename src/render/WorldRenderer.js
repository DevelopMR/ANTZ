import { Application, Container, Graphics, ParticleContainer } from "https://cdn.jsdelivr.net/npm/pixi.js@7.4.2/dist/pixi.mjs";
import { SIMULATION_TUNING, WORLD_HEIGHT, WORLD_WIDTH } from "../config/tuning.js";
import { AntView } from "./AntView.js";
import { createAntSpriteLibrary } from "./AntSpriteLibrary.js";

export class WorldRenderer {
  constructor(simulation) {
    this.simulation = simulation;
    this.antViews = [];
    this.app = null;
    this.antSpriteLibrary = null;
  }

  async initialize(container) {
    this.app = new Application({
      width: WORLD_WIDTH,
      height: WORLD_HEIGHT,
      antialias: false,
      backgroundAlpha: 0,
      resolution: 1,
      autoDensity: true,
    });

    container.appendChild(this.app.view);
    this.app.view.style.width = "100%";
    this.app.view.style.height = "100%";

    this.worldContainer = new Container();
    this.app.stage.addChild(this.worldContainer);
    this.antSpriteLibrary = createAntSpriteLibrary();

    this.#drawWorldBackdrop();
    this.#createGoalMarker();
    this.#createQueenMarker();
    this.#createAntViews();
  }

  render(elapsedTime) {
    for (const antView of this.antViews) {
      antView.sync(elapsedTime);
    }
  }

  destroy() {
    this.app.destroy(true, { children: true });
  }

  #drawWorldBackdrop() {
    const backdrop = new Graphics();
    backdrop.beginFill(0xe8d8b8);
    backdrop.drawRoundedRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 22);
    backdrop.endFill();

    backdrop.lineStyle(2, 0xc89d62, 0.13);
    for (let x = 0; x <= WORLD_WIDTH; x += 128) {
      backdrop.moveTo(x, 0);
      backdrop.lineTo(x, WORLD_HEIGHT);
    }
    for (let y = 0; y <= WORLD_HEIGHT; y += 96) {
      backdrop.moveTo(0, y);
      backdrop.lineTo(WORLD_WIDTH, y);
    }

    backdrop.beginFill(0xd0ae79);
    backdrop.drawRect(0, SIMULATION_TUNING.groundY + 10, WORLD_WIDTH, WORLD_HEIGHT - (SIMULATION_TUNING.groundY + 10));
    backdrop.endFill();

    backdrop.lineStyle(5, 0x8f6a3d, 0.85);
    backdrop.moveTo(0, SIMULATION_TUNING.groundY + 8);
    backdrop.lineTo(WORLD_WIDTH, SIMULATION_TUNING.groundY + 8);

    backdrop.lineStyle(4, 0x9d7749, 0.8);
    backdrop.moveTo(292, SIMULATION_TUNING.groundY + 8);
    backdrop.lineTo(292, 470);
    backdrop.moveTo(580, SIMULATION_TUNING.groundY + 8);
    backdrop.lineTo(580, 360);
    backdrop.moveTo(860, SIMULATION_TUNING.groundY + 8);
    backdrop.lineTo(860, 250);
    backdrop.moveTo(1092, SIMULATION_TUNING.groundY + 8);
    backdrop.lineTo(1092, 182);

    this.worldContainer.addChild(backdrop);
  }

  #createQueenMarker() {
    const queenMarker = new Graphics();
    queenMarker.lineStyle(3, 0xfce0a7, 1);
    queenMarker.beginFill(0x8d2a1e);
    queenMarker.drawCircle(0, 0, 18);
    queenMarker.endFill();
    queenMarker.position.set(
      this.simulation.queen.position.x,
      this.simulation.queen.position.y
    );

    this.worldContainer.addChild(queenMarker);
  }

  #createGoalMarker() {
    const goalMarker = new Graphics();
    goalMarker.lineStyle(3, 0xf9f1c8, 1);
    goalMarker.beginFill(0x496c42);
    goalMarker.drawRoundedRect(-24, -20, 48, 40, 10);
    goalMarker.endFill();
    goalMarker.moveTo(-12, 0);
    goalMarker.lineTo(12, 0);
    goalMarker.moveTo(0, -10);
    goalMarker.lineTo(0, 10);
    goalMarker.position.set(
      this.simulation.goal.position.x,
      this.simulation.goal.position.y
    );

    this.worldContainer.addChild(goalMarker);
  }

  #createAntViews() {
    const antLayer = new ParticleContainer(this.simulation.ants.length, {
      position: true,
      scale: true,
      uvs: true,
    });
    this.worldContainer.addChild(antLayer);

    this.antViews = this.simulation.ants.map((ant) => {
      const antView = new AntView(ant, this.antSpriteLibrary);
      antLayer.addChild(antView.sprite);
      antView.sync(this.simulation.elapsedTime);
      return antView;
    });
  }
}
