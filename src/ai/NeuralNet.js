function createWeightMatrix(inputCount, outputCount, random) {
  const scale = inputCount > 0 ? Math.sqrt(2 / inputCount) : 1;
  return Array.from({ length: outputCount }, () =>
    Array.from({ length: inputCount }, () => (random() * 2 - 1) * scale)
  );
}

function createBiasVector(count, random) {
  return Array.from({ length: count }, () => (random() * 2 - 1) * 0.1);
}

function applyActivation(value, activation) {
  if (activation === "sigmoid") {
    return 1 / (1 + Math.exp(-value));
  }
  return Math.tanh(value);
}

function cloneLayers(layers) {
  return layers.map((layer) => ({
    activation: layer.activation,
    weights: layer.weights.map((row) => [...row]),
    biases: [...layer.biases],
  }));
}

export class NeuralNet {
  constructor({
    inputCount = 0,
    hiddenLayers = [],
    outputCount = 0,
    outputActivations = [],
    random = Math.random,
    layers = null,
  } = {}) {
    this.inputCount = inputCount;
    this.hiddenLayers = [...hiddenLayers];
    this.outputCount = outputCount;
    this.outputActivations = outputActivations.length > 0
      ? [...outputActivations]
      : Array.from({ length: outputCount }, (_, index) => (index === 0 ? "tanh" : "sigmoid"));
    this.layers = layers ? cloneLayers(layers) : this.#createLayers(random);
  }

  forward(inputs = []) {
    let values = Array.from({ length: this.inputCount }, (_, index) => inputs[index] ?? 0);

    for (let layerIndex = 0; layerIndex < this.layers.length; layerIndex += 1) {
      const layer = this.layers[layerIndex];
      const isOutputLayer = layerIndex === this.layers.length - 1;
      values = layer.weights.map((row, nodeIndex) => {
        let sum = layer.biases[nodeIndex];
        for (let inputIndex = 0; inputIndex < row.length; inputIndex += 1) {
          sum += row[inputIndex] * values[inputIndex];
        }

        if (isOutputLayer) {
          return applyActivation(sum, this.outputActivations[nodeIndex] ?? "tanh");
        }

        return Math.tanh(sum);
      });
    }

    return values;
  }

  clone() {
    return new NeuralNet({
      inputCount: this.inputCount,
      hiddenLayers: this.hiddenLayers,
      outputCount: this.outputCount,
      outputActivations: this.outputActivations,
      layers: this.layers,
    });
  }

  mutate({ rate = 0.08, magnitude = 0.18, random = Math.random } = {}) {
    for (const layer of this.layers) {
      for (const row of layer.weights) {
        for (let index = 0; index < row.length; index += 1) {
          if (random() < rate) {
            row[index] += (random() * 2 - 1) * magnitude;
          }
        }
      }

      for (let index = 0; index < layer.biases.length; index += 1) {
        if (random() < rate) {
          layer.biases[index] += (random() * 2 - 1) * magnitude;
        }
      }
    }

    return this;
  }

  #createLayers(random) {
    const sizes = [this.inputCount, ...this.hiddenLayers, this.outputCount];
    const layers = [];

    for (let index = 0; index < sizes.length - 1; index += 1) {
      layers.push({
        activation: index === sizes.length - 2 ? "output" : "tanh",
        weights: createWeightMatrix(sizes[index], sizes[index + 1], random),
        biases: createBiasVector(sizes[index + 1], random),
      });
    }

    return layers;
  }
}
