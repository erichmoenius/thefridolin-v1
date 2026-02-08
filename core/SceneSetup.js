import * as THREE from "three";

export function setupScene() {

  const scene = new THREE.Scene();

  const camera = new THREE.OrthographicCamera(
    -1, 1, 1, -1, 0, 1
  );

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  return { scene, camera, renderer };
}
