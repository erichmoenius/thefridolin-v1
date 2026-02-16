import * as THREE from "three";

export function setupScene() {

  const scene = new THREE.Scene();

  const camera = new THREE.OrthographicCamera(
    -1, 1, 1, -1,
    0.1,   // near > 0 !!!
    10     // far deutlich größer
  );

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false
  });

  renderer.setClearColor(0x000000, 1);

  return { scene, camera, renderer };
}
