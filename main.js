import * as THREE from "three";
import { setupScene } from "./core/SceneSetup.js";
import { createNebulaMaterial } from "./graphics/NebulaMaterial.js";
import { calculateStateWeights } from "./ScrollEngine.js";

// ------------------------------------------------------------
// BODY RESET
// ------------------------------------------------------------

document.body.style.margin = "0";
document.documentElement.style.margin = "0";

// ------------------------------------------------------------
// SCROLL STAGE
// ------------------------------------------------------------

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

// ------------------------------------------------------------
// SCENE SETUP
// ------------------------------------------------------------

const { scene, camera, renderer } = setupScene();

camera.position.z = 1;
camera.lookAt(0, 0, 0);

renderer.setPixelRatio(window.devicePixelRatio);

const heroRoot = document.getElementById("hero-root");

renderer.domElement.style.position = "absolute";
renderer.domElement.style.inset = "0";
renderer.domElement.style.zIndex = "0";

heroRoot.appendChild(renderer.domElement);

// ------------------------------------------------------------
// MATERIAL + QUAD
// ------------------------------------------------------------

const geometry = new THREE.PlaneGeometry(2, 2);
const material = createNebulaMaterial();

const quad = new THREE.Mesh(geometry, material);
scene.add(quad);

// ------------------------------------------------------------
// RESIZE
// ------------------------------------------------------------

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer.setSize(width, height);

  material.uniforms.uResolution.value.set(width, height);
}

resize();
window.addEventListener("resize", resize);

// ------------------------------------------------------------
// MOUSE PARALLAX
// ------------------------------------------------------------

let mouse = { x: 0, y: 0 };
let targetMouse = { x: 0, y: 0 };

window.addEventListener("mousemove", (e) => {
  targetMouse.x = (e.clientX / window.innerWidth - 0.5);
  targetMouse.y = (e.clientY / window.innerHeight - 0.5);
});

// ------------------------------------------------------------
// RENDER LOOP
// ------------------------------------------------------------

function animate(time) {

  requestAnimationFrame(animate);

  // Time uniform
  material.uniforms.uTime.value = time * 0.001;

  // Smooth mouse interpolation
  mouse.x += (targetMouse.x - mouse.x) * 0.05;
  mouse.y += (targetMouse.y - mouse.y) * 0.05;

  material.uniforms.uMouse.value.set(mouse.x, mouse.y);

  // Scroll states
  const scroll = getScrollProgress();
  const weights = calculateStateWeights(scroll);

  material.uniforms.uGas.value       = weights.gas;
  material.uniforms.uWater.value     = weights.water;
  material.uniforms.uSolid.value     = weights.solid;
  material.uniforms.uFire.value      = weights.fire;
  material.uniforms.uStillness.value = weights.stillness;

  renderer.render(scene, camera);
}

animate();
