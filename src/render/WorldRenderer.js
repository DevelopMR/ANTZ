import { Application, Container, Graphics } from "https://cdn.jsdelivr.net/npm/pixi.js@7.4.2/dist/pixi.mjs";
import { WORLD_HEIGHT, WORLD_WIDTH } from "../config/tuning.js";
import { AntView } from "./AntView.js";

export class WorldRenderer {
  constructor(simulation) {
    this.simulation = simulation;
    this.antViews = [];
    this.app = null;
  }

  async initialize(container) {
    this.app = new Application({
      width: WORLD_WIDTH,
      height: WORLD_HEIGHT,
      antialias: true,
      backgroundAlpha: 0,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    container.appendChild(this.app.view);
    this.app.view.style.width = "100%";
    this.app.view.style.height = "100%";

    this.worldContainer = new Container();
    this.app.stage.addChild(this.worldContainer);

    this.#drawWorldBackdrop();
    this.#createQueenMarker();
    this.#createAntViews();
  }

  render() {
    for (const antView of this.antViews) {
      antView.sync();
    }
  }

  destroy() {
    this.app.destroy(true, { children: true });
  }

  #drawWorldBackdrop() {
    const backdrop = new Graphics();
    backdrop.beginFill(0xe3d0aa);
    backdrop.drawRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    backdrop.endFill();

    backdrop.lineStyle(2, 0xc0a06f, 0.25);
    for (let x = 0; x <= WORLD_WIDTH; x += 128) {
      backdrop.moveTo(x, 0);
      backdrop.lineTo(x, WORLD_HEIGHT);
    }
    for (let y = 0; y <= WORLD_HEIGHT; y += 128) {
      backdrop.moveTo(0, y);
      backdrop.lineTo(WORLD_WIDTH, y);
    }

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

  #createAntViews() {
    const antLayer = new Container();
    this.worldContainer.addChild(antLayer);

    this.antViews = this.simulation.ants.map((ant) => {
      const antView = new AntView(ant, () => new Graphics());
      antLayer.addChild(antView.graphics);
      antView.sync();
      return antView;
    });
  }
}