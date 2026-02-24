import * as THREE from "three";
import vertex from "./vertex.glsl?raw";
import fragment from "./fragment.glsl?raw";

export function createNebulaMaterial() {

  const uniforms = {

    /* ================================
       CORE
    ================================= */

    uTime: { value: 0.0 },

    uResolution: {
      value: new THREE.Vector2(
        window.innerWidth,
        window.innerHeight
      )
    },

    uMouse: {
      value: new THREE.Vector2(0, 0)
    },

    /* ================================
       SCROLL STATES
    ================================= */

    uGas:       { value: 1.0 },
    uWater:     { value: 0.0 },
    uSolid:     { value: 0.0 },
    uFire:      { value: 0.0 },
    uStillness: { value: 0.0 },

    /* ================================
       AUDIO
    ================================= */

    uEnergy:    { value: 0.0 }

  };

  return new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: uniforms,
    depthTest: false,
    depthWrite: false
  });
}
