console.log("MAIN LOADED")

import * as THREE from "three"
import { setupScene } from "./core/SceneSetup.js"
import { startLoop } from "./core/Loop.js"
import AudioHandler from "./audio/AudioHandler.js"
import { createNebulaMaterial } from "./graphics/NebulaMaterial.js"


// ============================================================
// UI REFERENCES
// ============================================================

const ui = {
  gain: document.getElementById("gain"),
  fx: document.getElementById("fx"),
  smooth: document.getElementById("smooth"),
  master: document.getElementById("master"),

  loadBtn: document.getElementById("loadBtn"),
  playBtn: document.getElementById("playBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  resetBtn: document.getElementById("resetBtn"),

  fileInput: document.getElementById("fileInput")
}

const meters = {
  bass: document.getElementById("meterBass"),
  mid: document.getElementById("meterMid"),
  high: document.getElementById("meterHigh"),
  energy: document.getElementById("meterEnergy")
}

const devPanel = document.getElementById("devPanel")


// ============================================================
// DEV PANEL CONTROL
// ============================================================

// Auto show locally
if (location.hostname === "localhost") {
  devPanel?.classList.remove("hidden")
}

// CTRL + D toggle
window.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === "d") {
    e.preventDefault()
    devPanel?.classList.toggle("hidden")
  }
})


// ============================================================
// SCENE SETUP
// ============================================================

const { scene, camera, renderer } = setupScene()

document
  .getElementById("hero-root")
  .appendChild(renderer.domElement)

camera.position.z = 1
renderer.setSize(window.innerWidth, window.innerHeight)


// ============================================================
// NEBULA QUAD
// ============================================================

const material = createNebulaMaterial()

const quad = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  material
)

scene.add(quad)


// ============================================================
// AUDIO SYSTEM
// ============================================================

const audio = new AudioHandler()
let trackLoaded = false

ui.loadBtn?.addEventListener("click", () => {
  ui.fileInput.click()
})

ui.fileInput?.addEventListener("change", async (e) => {

  const file = e.target.files[0]
  if (!file) return

  try {
    await audio.load(file)
    trackLoaded = true
    console.log("Track loaded:", file.name)
  }
  catch(err){
    console.error("Audio load failed:", err)
  }

  ui.fileInput.value = ""
})


ui.playBtn?.addEventListener("click", async () => {
  if (!trackLoaded) return
  try { await audio.play() }
  catch(err){ console.warn(err.message) }
})

ui.pauseBtn?.addEventListener("click", () => {
  if (trackLoaded) audio.pause()
})

ui.resetBtn?.addEventListener("click", () => {
  if (trackLoaded) audio.reset()
})


// ============================================================
// RESIZE
// ============================================================

window.addEventListener("resize", () => {

  renderer.setSize(window.innerWidth, window.innerHeight)

  material.uniforms.uResolution.value.set(
    window.innerWidth,
    window.innerHeight
  )
})

// ============================================================
// RESPONSE STATE
// ============================================================

const fast = { bass:0, mid:0, high:0, energy:0 }
const slow = { bass:0, mid:0, high:0, energy:0 }

// ============================================================
// BEAT ENGINE (CINEMATIC SOFT)
// ============================================================

let energyAvg = 0
let beatPulse = 0

const BEAT = {
  adapt: 0.02,        // moving average speed
  threshold: 1.35,    // trigger sensitivity
  decay: 0.92,        // pulse fade
  boost: 1.2          // pulse strength
}

// ============================================================
// UI READ
// ============================================================

function readUI(){
  return {
    gain: parseFloat(ui.gain?.value ?? 1),
    fastSmooth: parseFloat(ui.smooth?.value ?? 0.35),
    slowSmooth: parseFloat(ui.fx?.value ?? 0.05),
    masterSmooth: parseFloat(ui.master?.value ?? 0.06)
  }
}


// ============================================================
// RENDER LOOP
// ============================================================

startLoop(({ time }) => {

  material.uniforms.uTime.value = time

  // ---------- AUDIO SAMPLE ----------
  const b = audio.getBass()   || 0
  const m = audio.getMid()    || 0
  const h = audio.getHigh()   || 0
  const e = audio.getEnergy() || 0

  // Moving average
  energyAvg += (e - energyAvg) * BEAT.adapt

  // Beat trigger
  if (e > energyAvg * BEAT.threshold) {
  beatPulse = BEAT.boost
}

  // Pulse decay
  beatPulse *= BEAT.decay


  // ---------- METERS ----------
  meters.bass && (meters.bass.style.width = (b*100)+"%")
  meters.mid && (meters.mid.style.width = (m*100)+"%")
  meters.high && (meters.high.style.width = (h*100)+"%")
  meters.energy && (meters.energy.style.width = (e*100)+"%")

  const params = readUI()

  // ---------- FAST RESPONSE ----------
  fast.bass   += (b - fast.bass) * params.fastSmooth
  fast.mid    += (m - fast.mid) * params.fastSmooth
  fast.high   += (h - fast.high) * params.fastSmooth
  fast.energy += (e - fast.energy) * params.fastSmooth

  // ---------- SLOW RESPONSE ----------
  slow.bass   += (b - slow.bass) * params.slowSmooth
  slow.mid    += (m - slow.mid) * params.slowSmooth
  slow.high   += (h - slow.high) * params.slowSmooth
  slow.energy += (e - slow.energy) * params.slowSmooth

  // ---------- MIX ----------
  const mixBass   = (slow.bass*0.8 + fast.bass*0.4) * params.gain
  const mixMid    = (slow.mid*0.7  + fast.mid*0.5)  * params.gain
  const mixHigh   = (slow.high*0.6 + fast.high*0.7) * params.gain
  const mixEnergy = (slow.energy*0.7 + fast.energy*0.3) * params.gain

  // ---------- FINAL SMOOTH TO SHADER ----------
  material.uniforms.uBass.value +=
    (mixBass - material.uniforms.uBass.value) * params.masterSmooth

  material.uniforms.uMid.value +=
    (mixMid - material.uniforms.uMid.value) * params.masterSmooth

  material.uniforms.uHigh.value +=
    (mixHigh - material.uniforms.uHigh.value) * params.masterSmooth

  material.uniforms.uEnergy.value +=
    (mixEnergy - material.uniforms.uEnergy.value) * params.masterSmooth

  material.uniforms.uEnergy.value += beatPulse * 0.25

  renderer.render(scene, camera)
})
