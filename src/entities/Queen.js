export class Queen {
  constructor(position) {
    this.position = { x: position.x, y: position.y };
    this.foodDelivered = 0;
    this.foodReceived = 0;
    this.deliveryCount = 0;
    this.spawnedAntCount = 0;
    this.lastFedAmount = 0;
    this.lastFedTimer = 0;
    this.mealQueue = [];
    this.mealCooldown = 0;
    this.pendingSpawnQueue = [];
    this.pendingGenomePool = [];
    this.spawnCooldown = 0;
    this.pendingSpawnCount = 0;
    this.spawnHistory = [];
  }
}
