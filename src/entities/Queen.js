export class Queen {
  constructor(position) {
    this.position = { x: position.x, y: position.y };
    this.foodReceived = 0;
    this.deliveryCount = 0;
    this.spawnedAntCount = 0;
    this.lastFedAmount = 0;
    this.lastFedTimer = 0;
  }
}
