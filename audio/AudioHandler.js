export default class AudioHandler {

  constructor() {

    this.ctx = null
    this.buffer = null
    this.source = null
    this.analyser = null
    this.data = null

    this.startTime = 0
    this.pauseOffset = 0
  }


  // ─────────────────────────────
  // INIT CONTEXT
  // ─────────────────────────────
  async initContext() {

    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)()
    }

    if (this.ctx.state === "suspended") {
      await this.ctx.resume()
    }
  }


  // ─────────────────────────────
  // LOAD (File or URL)
  // ─────────────────────────────
  async load(fileOrUrl) {

    await this.initContext()

    // Kill previous graph
    this.stop(true)

    let arrayBuffer

    if (fileOrUrl instanceof File) {
      arrayBuffer = await fileOrUrl.arrayBuffer()
    } else {
      const res = await fetch(fileOrUrl)
      arrayBuffer = await res.arrayBuffer()
    }

    this.buffer = await this.ctx.decodeAudioData(arrayBuffer)

    // Create analyser once
    if (!this.analyser) {
      this.analyser = this.ctx.createAnalyser()
      this.analyser.fftSize = 512
      this.data = new Uint8Array(this.analyser.frequencyBinCount)
      this.analyser.connect(this.ctx.destination)
    }

    this.pauseOffset = 0
  }


  // ─────────────────────────────
  // BUILD SOURCE
  // ─────────────────────────────
  buildSource(offset=0) {

    if (!this.buffer) return

    this.source = this.ctx.createBufferSource()
    this.source.buffer = this.buffer

    this.source.connect(this.analyser)

    this.startTime = this.ctx.currentTime - offset

    this.source.start(0, offset)
  }


  // ─────────────────────────────
  // PLAY
  // ─────────────────────────────
  async play() {

    if (!this.buffer) return

    await this.initContext()

    this.buildSource(this.pauseOffset)
  }


  // ─────────────────────────────
  // PAUSE
  // ─────────────────────────────
  pause() {

    if (!this.source) return

    this.pauseOffset = this.ctx.currentTime - this.startTime

    try { this.source.stop() } catch {}

    this.source.disconnect()
    this.source = null
  }


  // ─────────────────────────────
  // STOP (internal reset)
  // ─────────────────────────────
  stop(silent=false) {

    if (this.source) {
      try { this.source.stop() } catch {}
      this.source.disconnect()
      this.source = null
    }

    this.pauseOffset = 0

    if (!silent)
      console.log("Audio stopped")
  }


  // ─────────────────────────────
  // RESET
  // ─────────────────────────────
  reset() {
    this.stop()
  }

// ─────────────────────────────
// INTERNAL — Frequenzdaten holen
// ─────────────────────────────
_updateData() {
  if (!this.analyser || !this.data) return false
  this.analyser.getByteFrequencyData(this.data)
  return true
}


// ─────────────────────────────
// BASS
// ─────────────────────────────
getBass() {
  if (!this._updateData()) return 0

  let sum = 0
  const count = 15

  for (let i = 0; i < count; i++) {
    sum += this.data[i]
  }

  return Math.min(1.0, (sum / count) / 240)
}


// ─────────────────────────────
// MID
// ─────────────────────────────
getMid() {
  if (!this._updateData()) return 0

  let sum = 0
  for (let i = 20; i < 80; i++)
    sum += this.data[i]

  return (sum / 60) / 255
}


// ─────────────────────────────
// HIGH
// ─────────────────────────────
getHigh() {
  if (!this._updateData()) return 0

  let sum = 0
  const start = 80
  const end = 200

  for (let i = start; i < end; i++) {
    sum += this.data[i]
  }

  const norm = (sum / (end - start)) / 255

  return Math.min(
    1.0,
    Math.pow(norm * 1.6, 1.2)
  )
}


// ─────────────────────────────
// ENERGY (Gesamtlautheit)
// ─────────────────────────────
getEnergy() {
  if (!this._updateData()) return 0

  let sum = 0
  for (let i = 0; i < this.data.length; i++)
    sum += this.data[i]

  return (sum / this.data.length) / 255
}
}
