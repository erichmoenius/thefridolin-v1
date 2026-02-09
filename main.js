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


// ---------- Load Button ----------
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


// ---------- Controls ----------
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
// LOOP
// ============================================================

startLoop(({ time }) => {

  material.uniforms.uTime.value = time

  const b = audio.getBass()   || 0
  const m = audio.getMid()    || 0
  const h = audio.getHigh()   || 0
  const e = audio.getEnergy() || 0

  const params = readUI()

  // FAST
  fast.bass   += (b - fast.bass) * params.fastSmooth
  fast.mid    += (m - fast.mid) * params.fastSmooth
  fast.high   += (h - fast.high) * params.fastSmooth
  fast.energy += (e - fast.energy) * params.fastSmooth

  // SLOW
  slow.bass   += (b - slow.bass) * params.slowSmooth
  slow.mid    += (m - slow.mid) * params.slowSmooth
  slow.high   += (h - slow.high) * params.slowSmooth
  slow.energy += (e - slow.energy) * params.slowSmooth

  // MIX
  const mixBass   = (slow.bass*0.8 + fast.bass*0.4) * params.gain
  const mixMid    = (slow.mid*0.7  + fast.mid*0.5)  * params.gain
  const mixHigh   = (slow.high*0.6 + fast.high*0.7) * params.gain
  const mixEnergy = (slow.energy*0.7 + fast.energy*0.3) * params.gain

  // FINAL SMOOTH
  material.uniforms.uBass.value +=
    (mixBass - material.uniforms.uBass.value) * params.masterSmooth

  material.uniforms.uMid.value +=
    (mixMid - material.uniforms.uMid.value) * params.masterSmooth

  material.uniforms.uHigh.value +=
    (mixHigh - material.uniforms.uHigh.value) * params.masterSmooth

  material.uniforms.uEnergy.value +=
    (mixEnergy - material.uniforms.uEnergy.value) * params.masterSmooth

  renderer.render(scene, camera)

})

