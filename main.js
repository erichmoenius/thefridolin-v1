import * as THREE from "three";
import { setupScene } from "./core/SceneSetup.js";
import { createNebulaMaterial } from "./graphics/NebulaMaterial.js";
import { calculateStateWeights } from "./ScrollEngine.js";
import AudioHandler from "./audio/AudioHandler.js";

/* =========================================================
   BASIC
========================================================= */

document.body.style.margin = "0";

/* =========================================================
   SCROLL
========================================================= */

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

const gainSlider = document.getElementById("gain");
const smoothSlider = document.getElementById("smooth");

gainSlider?.addEventListener("input", (e) => {
  const value = parseFloat(e.target.value);

  if (audio.gainNode) {
    audio.gainNode.gain.value = value;
  }
});  

loadBtn?.addEventListener("click", () => {
  fileInput.click();
});

fileInput?.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    await audio.load(file);
    trackLoaded = true;
    console.log("Audio loaded:", file.name);
  } catch (err) {
    console.error("Audio load failed:", err);
  }

  fileInput.value = "";
});

playBtn?.addEventListener("click", async () => {
  if (!trackLoaded) return;

  await audio.initContext();
  await audio.play();
});

pauseBtn?.addEventListener("click", () => {
  audio.pause();
});

resetBtn?.addEventListener("click", () => {
  audio.reset();
});

/* =========================================================
   DEV PANEL TOGGLE (CTRL + D)
========================================================= */

window.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === "d") {
    e.preventDefault();

    const panel = document.getElementById("devPanel");
    if (panel) {
      panel.classList.toggle("hidden");
    }
  }
});

/* =========================================================
   SCENE
========================================================= */

const { scene, camera, renderer } = setupScene();

camera.position.z = 1;

renderer.setPixelRatio(window.devicePixelRatio);

// Canvas styling
renderer.domElement.style.position = "absolute";
renderer.domElement.style.inset = "0";
renderer.domElement.style.pointerEvents = "none"; // wichtig für Parallax
renderer.domElement.style.zIndex = "0";

// Canvas in hero-root einfügen (NICHT body!)
const heroRoot = document.getElementById("hero-root");
heroRoot.appendChild(renderer.domElement);

/* =========================================================
   MATERIAL
========================================================= */

const geometry = new THREE.PlaneGeometry(2, 2);
const material = createNebulaMaterial();
window.material = material;

const quad = new THREE.Mesh(geometry, material);
scene.add(quad);

/* =========================================================
   RESIZE
========================================================= */

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  renderer.setSize(w, h);

  if (material.uniforms.uResolution)
    material.uniforms.uResolution.value.set(w, h);
}

resize();
window.addEventListener("resize", resize);

/* =========================================================
   MOUSE PARALLAX
========================================================= */

let mouse = new THREE.Vector2(0, 0);
let targetMouse = new THREE.Vector2(0, 0);

window.addEventListener("mousemove", (e) => {
  targetMouse.x = (e.clientX / window.innerWidth - 0.5);
  targetMouse.y = (e.clientY / window.innerHeight - 0.5);
});

/* =========================================================
   LOOP
========================================================= */
function animate(time) {
  requestAnimationFrame(animate);

  const t = time * 0.001;

  /* Time */
  if (material.uniforms.uTime)
    material.uniforms.uTime.value = t;

  /* Smooth mouse (BLEIBT!) */
  mouse.lerp(targetMouse, 0.08);

  if (material.uniforms.uMouse)
    material.uniforms.uMouse.value.copy(mouse);

  /* Scroll */
  const scroll = getScrollProgress();
  const weights = calculateStateWeights(scroll);

  material.uniforms.uGas.value       = weights.gas;
  material.uniforms.uWater.value     = weights.water;
  material.uniforms.uSolid.value     = weights.solid;
  material.uniforms.uFire.value      = weights.fire;
  material.uniforms.uStillness.value = weights.stillness;

  /* Audio */
  /* -----------------------
   Audio → Visual Energy
----------------------- */

const rawEnergy = audio.getEnergy() || 0;

// Gain beeinflusst visuelle Stärke
const gainValue = parseFloat(gainSlider?.value || 1);

// Visuelle Energie
const visualEnergy = rawEnergy * gainValue;

// Smooth Faktor (kann später vom Smooth-Slider kommen)
const smoothValue = parseFloat(smoothSlider?.value || 0.4);

// Mapping: Slider 0–1 → smoothing 0.01–0.25
const smoothFactor = 0.01 + smoothValue * 0.24;

smoothedEnergy += (visualEnergy - smoothedEnergy) * smoothFactor;

// Begrenzen (optional, aber sauber)
smoothedEnergy = Math.min(smoothedEnergy, 2.0);

if (material.uniforms.uEnergy) {
  material.uniforms.uEnergy.value = smoothedEnergy;
}

  /* DEV PANEL METERS (NEU) */
  const bass = audio.getBass();
  const mid  = audio.getMid();
  const high = audio.getHigh();

  const meterBass   = document.getElementById("meterBass");
  const meterMid    = document.getElementById("meterMid");
  const meterHigh   = document.getElementById("meterHigh");
  const meterEnergy = document.getElementById("meterEnergy");

  if (meterBass)   meterBass.style.width   = (bass * 100) + "%";
  if (meterMid)    meterMid.style.width    = (mid * 100) + "%";
  if (meterHigh)   meterHigh.style.width   = (high * 100) + "%";
  if (meterEnergy) meterEnergy.style.width = (rawEnergy * 100) + "%";

  renderer.render(scene, camera);
}

animate();
