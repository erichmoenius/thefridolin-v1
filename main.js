import * as THREE from "three";
import { setupScene } from "./core/SceneSetup.js";
import { createNebulaMaterial } from "./graphics/NebulaMaterial.js";
import { calculateStateWeights } from "./ScrollEngine.js";
import AudioHandler from "./audio/AudioHandler.js";

/* =========================================================
   BASIC SETUP
========================================================= */

document.body.style.margin = "0";

/* =========================================================
   SCROLL
========================================================= */

let scrollStage = document.getElementById("scroll-stage");

if (!scrollStage) {
  scrollStage = document.createElement("div");
  scrollStage.id = "scroll-stage";
  scrollStage.style.height = "500vh";
  document.body.appendChild(scrollStage);
}

function getScrollProgress() {
  const maxScroll = scrollStage.offsetHeight - window.innerHeight;
  return Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
}

/* =========================================================
   AUDIO
========================================================= */

const audio = new AudioHandler();
window.audio = audio; // debug

let smoothedEnergy = 0;
let trackLoaded = false;

const loadBtn   = document.getElementById("loadBtn");
const playBtn   = document.getElementById("playBtn");
const pauseBtn  = document.getElementById("pauseBtn");
const resetBtn  = document.getElementById("resetBtn");
const fileInput = document.getElementById("fileInput");

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
  if (audio.ctx.state === "suspended") {
    await audio.ctx.resume();
  }

  await audio.play();
});

pauseBtn?.addEventListener("click", () => {
  audio.pause();
});

resetBtn?.addEventListener("click", () => {
  audio.reset();
});

/* =========================================================
   SCENE
========================================================= */

const { scene, camera, renderer } = setupScene();

camera.position.z = 1;

renderer.setPixelRatio(window.devicePixelRatio);

const heroRoot = document.getElementById("hero-root");

renderer.domElement.style.position = "absolute";
renderer.domElement.style.inset = "0";

heroRoot.appendChild(renderer.domElement);

/* =========================================================
   MATERIAL
========================================================= */

const geometry = new THREE.PlaneGeometry(2, 2);
const material = createNebulaMaterial();
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
   LOOP
========================================================= */

function animate(time) {
  requestAnimationFrame(animate);

  const t = time * 0.001;

  if (material.uniforms.uTime)
    material.uniforms.uTime.value = t;

  /* Scroll states */
  const scroll = getScrollProgress();
  const weights = calculateStateWeights(scroll);

  material.uniforms.uGas.value       = weights.gas;
  material.uniforms.uWater.value     = weights.water;
  material.uniforms.uSolid.value     = weights.solid;
  material.uniforms.uFire.value      = weights.fire;
  material.uniforms.uStillness.value = weights.stillness;

  /* Audio Energy */
  const rawEnergy = audio.getEnergy() || 0;
  smoothedEnergy += (rawEnergy - smoothedEnergy) * 0.05;

  if (material.uniforms.uEnergy)
    material.uniforms.uEnergy.value = smoothedEnergy;

  renderer.render(scene, camera);
}

animate();
