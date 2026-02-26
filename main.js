import * as THREE from "three";
import { setupScene } from "./core/SceneSetup.js";
import { createNebulaMaterial } from "./graphics/NebulaMaterial.js";
import { calculateStateWeights } from "./ScrollEngine.js";
import AudioHandler from "./audio/AudioHandler.js";

/* =========================================================
   BASIC
========================================================= */

document.body.style.margin = "0";
document.body.style.height = "500vh";

function getScrollProgress() {
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  return Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
}

/* =========================================================
   AUDIO
========================================================= */

const audio = new AudioHandler();
window.audio = audio;

let smoothedEnergy = 0;
let trackLoaded = false;

const loadBtn   = document.getElementById("loadBtn");
const playBtn   = document.getElementById("playBtn");
const pauseBtn  = document.getElementById("pauseBtn");
const resetBtn  = document.getElementById("resetBtn");
const fileInput = document.getElementById("fileInput");

const gainSlider   = document.getElementById("gain");
const smoothSlider = document.getElementById("smooth");
const fxSlider     = document.getElementById("fx");
const masterSlider = document.getElementById("master");

/* Gain → Volume */
gainSlider?.addEventListener("input", (e) => {
  const value = parseFloat(e.target.value);
  if (audio.gainNode) {
    audio.gainNode.gain.value = value;
  }
});

/* Load */
loadBtn?.addEventListener("click", () => fileInput.click());

fileInput?.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  await audio.load(file);
  trackLoaded = true;
  fileInput.value = "";
});

/* Play */
playBtn?.addEventListener("click", async () => {
  if (!trackLoaded) return;
  await audio.initContext();
  await audio.play();
});

/* Pause */
pauseBtn?.addEventListener("click", () => audio.pause());

/* Reset */
resetBtn?.addEventListener("click", () => audio.reset());

/* =========================================================
   DEV PANEL (CTRL + D)
========================================================= */

const devPanel = document.getElementById("devPanel");

window.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === "d") {
    e.preventDefault();
    devPanel?.classList.toggle("hidden");
  }
});

/* =========================================================
   SCENE
========================================================= */

const { scene, camera, renderer } = setupScene();

camera.position.z = 1;

renderer.setPixelRatio(window.devicePixelRatio);
renderer.domElement.style.position = "absolute";
renderer.domElement.style.inset = "0";
renderer.domElement.style.pointerEvents = "none";
renderer.domElement.style.zIndex = "0";

document.getElementById("hero-root").appendChild(renderer.domElement);

/* =========================================================
   MATERIAL
========================================================= */

const geometry = new THREE.PlaneGeometry(2, 2);
const material = createNebulaMaterial();
scene.add(new THREE.Mesh(geometry, material));

/* =========================================================
   RESIZE
========================================================= */

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  material.uniforms.uResolution.value.set(w, h);
}

resize();
window.addEventListener("resize", resize);

/* =========================================================
   MOUSE PARALLAX
========================================================= */

let mouse = new THREE.Vector2();
let targetMouse = new THREE.Vector2();

window.addEventListener("mousemove", (e) => {
  targetMouse.x = (e.clientX / window.innerWidth - 0.5);
  targetMouse.y = (e.clientY / window.innerHeight - 0.5);
});

/* =========================================================
   DEV METERS (cached)
========================================================= */

const meterBass   = document.getElementById("meterBass");
const meterMid    = document.getElementById("meterMid");
const meterHigh   = document.getElementById("meterHigh");
const meterEnergy = document.getElementById("meterEnergy");

/* =========================================================
   LOOP
========================================================= */

function animate(time) {
  requestAnimationFrame(animate);

  const t = time * 0.001;
  material.uniforms.uTime.value = t;

  /* Mouse smoothing */
  mouse.lerp(targetMouse, 0.08);
  material.uniforms.uMouse.value.copy(mouse);

  /* Scroll states */
  const scroll = getScrollProgress();
  const weights = calculateStateWeights(scroll);

  material.uniforms.uGas.value       = weights.gas;
  material.uniforms.uWater.value     = weights.water;
  material.uniforms.uSolid.value     = weights.solid;
  material.uniforms.uFire.value      = weights.fire;
  material.uniforms.uStillness.value = weights.stillness;

  /* ===========================
     AUDIO → VISUAL
  =========================== */

  const rawEnergy = audio.getEnergy() || 0;

  // leichte Kompression → weniger Zappeln
  const compressed = Math.pow(rawEnergy, 0.6);

  const gainValue = parseFloat(gainSlider?.value || 1);
  const visualEnergy = compressed * gainValue;

  const smoothValue = parseFloat(smoothSlider?.value || 0.4);
  const smoothFactor = 0.01 + smoothValue * 0.24;

  smoothedEnergy += (visualEnergy - smoothedEnergy) * smoothFactor;
  smoothedEnergy = Math.min(smoothedEnergy, 2.0);

  material.uniforms.uEnergy.value = smoothedEnergy;
  material.uniforms.uFX.value     = parseFloat(fxSlider?.value || 0.5);
  material.uniforms.uMaster.value = parseFloat(masterSlider?.value || 0.6);

  /* DEV PANEL METERS */
  const bass = audio.getBass();
  const mid  = audio.getMid();
  const high = audio.getHigh();

  if (meterBass)   meterBass.style.width   = bass * 100 + "%";
  if (meterMid)    meterMid.style.width    = mid * 100 + "%";
  if (meterHigh)   meterHigh.style.width   = high * 100 + "%";
  if (meterEnergy) meterEnergy.style.width = rawEnergy * 100 + "%";

  renderer.render(scene, camera);
}

animate();