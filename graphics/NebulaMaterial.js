import * as THREE from "three";
import vertex from "./vertex.glsl?raw";
import fragment from "./fragment.glsl?raw";

export function createNebulaMaterial() {

  const uniforms = {

    // Core
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },


    uResolution: {
      value: new THREE.Vector2(
        window.innerWidth,
        window.innerHeight
      )
    },

    // Scroll States
    uGas:       { value: 1.0 },
    uWater:     { value: 0.0 },
    uSolid:     { value: 0.0 },
    uFire:      { value: 0.0 },
    uStillness: { value: 0.0 }

  };

  return new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms,
    depthTest: false,
    depthWrite: false
  });

}
