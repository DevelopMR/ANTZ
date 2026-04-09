import { FOOD_SCENT_TUNING, WORLD_HEIGHT, WORLD_WIDTH } from "../config/tuning.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createField(length) {
  return new Float32Array(length);
}

export class FoodScentSystem {
  constructor(random = Math.random) {
    this.random = random;
    this.cellSize = FOOD_SCENT_TUNING.gridCellSize;
    this.columns = Math.ceil(WORLD_WIDTH / this.cellSize);
    this.rows = Math.ceil(WORLD_HEIGHT / this.cellSize);
    this.field = createField(this.columns * this.rows);
    this.scratch = createField(this.columns * this.rows);
    this.overlayEnabled = false;
    this.elapsedTime = 0;
    this.wind = this.#createWindState();
  }

  update(mapSystem, deltaTime) {
    this.elapsedTime += deltaTime;
    this.#diffuseDecayAndTransport(deltaTime);
    this.#emitFoodSources(mapSystem, deltaTime);
  }

  sampleIntensityAt(position) {
    const cellX = clamp(position.x / this.cellSize, 0, this.columns - 1.001);
    const cellY = clamp(position.y / this.cellSize, 0, this.rows - 1.001);
    return clamp(this.#sampleField(this.field, cellX, cellY), 0, FOOD_SCENT_TUNING.sampleClamp);
  }

  setOverlayEnabled(enabled) {
    this.overlayEnabled = enabled;
  }

  getOverlayState() {
    return {
      enabled: this.overlayEnabled,
      field: this.field,
      columns: this.columns,
      rows: this.rows,
      cellSize: this.cellSize,
      wind: this.wind,
    };
  }

  #createWindState() {
    const baseDirection = FOOD_SCENT_TUNING.windBaseDirectionRadians;
    const baseSpeed = FOOD_SCENT_TUNING.windBaseSpeed;
    const directionOffset = (this.random() * 2 - 1) * FOOD_SCENT_TUNING.windDirectionVarianceRadians;
    const speedScale = 1 + (this.random() * 2 - 1) * FOOD_SCENT_TUNING.windVarianceRatio;
    return {
      baseDirection,
      baseSpeed: baseSpeed * speedScale,
      phase: this.random() * Math.PI * 2,
      x: 0,
      y: 0,
      direction: baseDirection + directionOffset,
      speed: baseSpeed * speedScale,
    };
  }

  #updateWind() {
    const oscillation = Math.sin((this.elapsedTime / FOOD_SCENT_TUNING.windOscillationSeconds) * Math.PI * 2 + this.wind.phase);
    const directionOffset = oscillation * FOOD_SCENT_TUNING.windDirectionVarianceRadians * FOOD_SCENT_TUNING.windVarianceRatio;
    const speedScale = 1 + oscillation * FOOD_SCENT_TUNING.windVarianceRatio;
    this.wind.direction = this.wind.baseDirection + directionOffset;
    this.wind.speed = this.wind.baseSpeed * speedScale;
    this.wind.x = Math.cos(this.wind.direction) * this.wind.speed;
    this.wind.y = Math.sin(this.wind.direction) * this.wind.speed;
  }

  #diffuseDecayAndTransport(deltaTime) {
    this.#updateWind();
    const decayFactor = Math.max(0, 1 - FOOD_SCENT_TUNING.decayPerSecond * deltaTime);
    const driftX = this.wind.x * deltaTime;
    const driftY = this.wind.y * deltaTime;

    for (let row = 0; row < this.rows; row += 1) {
      for (let column = 0; column < this.columns; column += 1) {
        const sampleX = clamp(column - driftX, 0, this.columns - 1.001);
        const sampleY = clamp(row - driftY, 0, this.rows - 1.001);
        const center = this.#sampleField(this.field, sampleX, sampleY);
        const left = this.#sampleField(this.field, sampleX - 1, sampleY);
        const right = this.#sampleField(this.field, sampleX + 1, sampleY);
        const up = this.#sampleField(this.field, sampleX, sampleY - 1);
        const down = this.#sampleField(this.field, sampleX, sampleY + 1);
        const neighborAverage = (left + right + up + down) * 0.25;
        const blended = center + (neighborAverage - center) * FOOD_SCENT_TUNING.diffusionRate;
        this.scratch[this.#index(column, row)] = clamp(blended * decayFactor, 0, FOOD_SCENT_TUNING.sampleClamp);
      }
    }

    [this.field, this.scratch] = [this.scratch, this.field];
  }

  #emitFoodSources(mapSystem, deltaTime) {
    const radius = FOOD_SCENT_TUNING.emissionRadius;
    const cellRadius = Math.ceil(radius / this.cellSize);

    for (const foodNode of mapSystem.foodNodes) {
      if (!foodNode.available || foodNode.radius <= 0) {
        continue;
      }

      const sourceColumn = Math.floor(foodNode.x / this.cellSize);
      const sourceRow = Math.floor(foodNode.y / this.cellSize);
      const strengthScale = foodNode.remainingTrips / Math.max(foodNode.maxTrips, 1);

      for (let row = sourceRow - cellRadius; row <= sourceRow + cellRadius; row += 1) {
        if (row < 0 || row >= this.rows) {
          continue;
        }

        for (let column = sourceColumn - cellRadius; column <= sourceColumn + cellRadius; column += 1) {
          if (column < 0 || column >= this.columns) {
            continue;
          }

          const centerX = column * this.cellSize + this.cellSize * 0.5;
          const centerY = row * this.cellSize + this.cellSize * 0.5;
          const distance = Math.hypot(centerX - foodNode.x, centerY - foodNode.y);
          if (distance > radius) {
            continue;
          }

          const falloff = 1 - distance / radius;
          const emission = FOOD_SCENT_TUNING.emissionStrength * strengthScale * falloff * deltaTime;
          const index = this.#index(column, row);
          this.field[index] = clamp(this.field[index] + emission, 0, FOOD_SCENT_TUNING.sampleClamp);
        }
      }
    }
  }

  #index(column, row) {
    return row * this.columns + column;
  }

  #sampleField(field, column, row) {
    const cellX = clamp(column, 0, this.columns - 1.001);
    const cellY = clamp(row, 0, this.rows - 1.001);
    const x0 = Math.floor(cellX);
    const y0 = Math.floor(cellY);
    const x1 = Math.min(this.columns - 1, x0 + 1);
    const y1 = Math.min(this.rows - 1, y0 + 1);
    const tx = cellX - x0;
    const ty = cellY - y0;
    const top = (field[this.#index(x0, y0)] ?? 0) * (1 - tx) + (field[this.#index(x1, y0)] ?? 0) * tx;
    const bottom = (field[this.#index(x0, y1)] ?? 0) * (1 - tx) + (field[this.#index(x1, y1)] ?? 0) * tx;
    return top * (1 - ty) + bottom * ty;
  }
}

