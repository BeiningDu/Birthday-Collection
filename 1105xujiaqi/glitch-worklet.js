// 原声直通；仅在怪图出现期间，重复短切片、改变读取速度并降低采样精度。
// 不调整主音量，也不叠加第二条音轨。
class BirthdayGlitch extends AudioWorkletProcessor {
  constructor() {
    super();
    this.enabled = false;
    this.grainLength = Math.round(sampleRate * 0.082);
    this.polarityPeriod = Math.round(sampleRate / 52);
    this.ringLength = this.grainLength * 4;
    this.rings = [];
    this.grains = [];
    this.held = [];
    this.write = 0;
    this.available = 0;
    this.read = 0;
    this.repeats = 0;
    this.pattern = 0;
    this.age = 0;
    this.captureNeeded = true;
    this.rates = [0.78, 1.38, 0.94, 1.62, 0.66, 1.16];
    this.port.onmessage = ({ data }) => {
      this.enabled = Boolean(data.enabled);
      this.captureNeeded = true;
      this.read = this.repeats = this.pattern = this.age = 0;
      this.port.postMessage({ active: this.enabled });
    };
  }

  capture(channelCount) {
    const start = (this.write - this.grainLength + this.ringLength) % this.ringLength;
    for (let channel = 0; channel < channelCount; channel++) {
      const ring = this.rings[channel];
      const grain = this.grains[channel];
      for (let i = 0; i < this.grainLength; i++) grain[i] = ring[(start + i) % this.ringLength];
    }
    this.captureNeeded = false;
    this.read = 0;
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    if (!output?.length) return true;
    if (!input?.length) {
      output.forEach((channel) => channel.fill(0));
      return true;
    }
    const count = output.length;
    for (let channel = 0; channel < count; channel++) {
      if (!this.rings[channel]) {
        this.rings[channel] = new Float32Array(this.ringLength);
        this.grains[channel] = new Float32Array(this.grainLength);
        this.held[channel] = 0;
      }
    }
    for (let i = 0; i < output[0].length; i++) {
      for (let channel = 0; channel < count; channel++) {
        this.rings[channel][this.write] = input[channel % input.length][i] || 0;
      }
      this.write = (this.write + 1) % this.ringLength;
      this.available = Math.min(this.available + 1, this.ringLength);
      if (!this.enabled || this.available < this.grainLength) {
        for (let channel = 0; channel < count; channel++) output[channel][i] = input[channel % input.length][i] || 0;
        continue;
      }
      if (this.captureNeeded) this.capture(count);
      const index = Math.floor(this.read);
      const next = (index + 1) % this.grainLength;
      const fraction = this.read - index;
      // 正负相位快速翻转带来电音质感，幅度保持不变。
      const polarity = Math.floor(this.age / this.polarityPeriod) % 2 ? -1 : 1;
      for (let channel = 0; channel < count; channel++) {
        if (this.age % 3 === 0) {
          const grain = this.grains[channel];
          const value = grain[index] * (1 - fraction) + grain[next] * fraction;
          this.held[channel] = Math.round(value * 128) / 128;
        }
        output[channel][i] = Math.max(-1, Math.min(1, this.held[channel] * polarity));
      }
      this.age++;
      this.read += this.rates[this.pattern % this.rates.length];
      if (this.read >= this.grainLength) {
        this.read %= this.grainLength;
        if (++this.repeats >= 2) {
          this.repeats = 0;
          this.pattern++;
          this.captureNeeded = true;
        }
      }
    }
    return true;
  }
}

registerProcessor('birthday-glitch', BirthdayGlitch);
