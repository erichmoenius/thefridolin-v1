export default class AudioHandler {

  constructor() {
    this.ctx = null;
    this.buffer = null;
    this.source = null;

    this.analyser = null;
    this.gainNode = null;
    this.data = null;

    this.startTime = 0;
    this.pauseOffset = 0;
  }

  /* -------------------------------------------------- */
  async initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
  }

  /* -------------------------------------------------- */
  async load(fileOrUrl) {

    await this.initContext();
    this.stop(true);

    let arrayBuffer;

    if (fileOrUrl instanceof File) {
      arrayBuffer = await fileOrUrl.arrayBuffer();
    } else {
      const res = await fetch(fileOrUrl);
      arrayBuffer = await res.arrayBuffer();
    }

    this.buffer = await this.ctx.decodeAudioData(arrayBuffer);

    if (!this.analyser) {

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;

      this.gainNode = this.ctx.createGain();

      this.data = new Uint8Array(this.analyser.frequencyBinCount);

      // source → analyser → gain → destination
      this.analyser.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);
    }

    this.pauseOffset = 0;
  }

  /* -------------------------------------------------- */
  buildSource(offset = 0) {

    if (!this.buffer) return;

    this.source = this.ctx.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.loop = true;

    this.source.connect(this.analyser);

    this.startTime = this.ctx.currentTime - offset;
    this.source.start(0, offset);
  }

  /* -------------------------------------------------- */
  async play() {
    if (!this.buffer) return;
    await this.initContext();
    this.buildSource(this.pauseOffset);
  }

  /* -------------------------------------------------- */
  pause() {
    if (!this.source) return;

    this.pauseOffset = this.ctx.currentTime - this.startTime;

    try { this.source.stop(); } catch {}
    this.source.disconnect();
    this.source = null;
  }

  /* -------------------------------------------------- */
  stop(silent = false) {

    if (this.source) {
      try { this.source.stop(); } catch {}
      this.source.disconnect();
      this.source = null;
    }

    this.pauseOffset = 0;

    if (!silent)
      console.log("Audio stopped");
  }

  reset() {
    this.stop();
  }

  /* -------------------------------------------------- */
  _updateData() {
    if (!this.analyser || !this.data) return false;
    this.analyser.getByteFrequencyData(this.data);
    return true;
  }

  /* -------------------------------------------------- */
  getEnergy() {
    if (!this._updateData()) return 0;

    let sum = 0;
    for (let i = 0; i < this.data.length; i++)
      sum += this.data[i];

    return (sum / this.data.length) / 255;
  }

  getBass() {
    if (!this._updateData()) return 0;

    let sum = 0;
    for (let i = 0; i < 15; i++)
      sum += this.data[i];

    return (sum / 15) / 255;
  }

  getMid() {
    if (!this._updateData()) return 0;

    let sum = 0;
    for (let i = 20; i < 80; i++)
      sum += this.data[i];

    return (sum / 60) / 255;
  }

  getHigh() {
    if (!this._updateData()) return 0;

    let sum = 0;
    for (let i = 80; i < 200; i++)
      sum += this.data[i];

    return (sum / 120) / 255;
  }
}
