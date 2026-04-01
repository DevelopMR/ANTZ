export class NeuralNet {
  constructor({
    inputCount = 0,
    hiddenLayers = [],
    outputCount = 0,
  } = {}) {
    this.inputCount = inputCount;
    this.hiddenLayers = [...hiddenLayers];
    this.outputCount = outputCount;
  }

  forward() {
    return new Array(this.outputCount).fill(0);
  }

  clone() {
    return new NeuralNet({
      inputCount: this.inputCount,
      hiddenLayers: this.hiddenLayers,
      outputCount: this.outputCount,
    });
  }

  mutate() {
    return this;
  }
}
