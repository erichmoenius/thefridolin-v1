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
   SCENE
========================================================= */

const { scene, camera, renderer } = setupScene();

camera.position.z = 1;

renderer.setPixelRatio(window.devicePixelRatio);

renderer.domElement.style.position = "fixed";
renderer.domElement.style.inset = "0";
renderer.domElement.style.pointerEvents = "none"; // IMPORTANT
renderer.domElement.style.zIndex = "0";

document.body.appendChild(renderer.domElement);

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

  /* Smooth mouse */
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
  const rawEnergy = audio.getEnergy() || 0;
  smoothedEnergy += (rawEnergy - smoothedEnergy) * 0.05;

  if (material.uniforms.uEnergy)
    material.uniforms.uEnergy.value = smoothedEnergy;

  renderer.render(scene, camera);
}

animate();
