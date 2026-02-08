import * as THREE from "three";

import vertex from "./vertex.glsl?raw";
import fragment from "./fragment.glsl?raw";

export function createNebulaMaterial() {

  return new THREE.ShaderMaterial({

    vertexShader: vertex,
    fragmentShader: fragment,

    uniforms: {

      uTime: { value: 0 },

      uResolution: {
        value: new THREE.Vector2(
          window.innerWidth,
          window.innerHeight
        )
      },

      uBass:   { value: 0 },
      uMid:    { value: 0 },
      uHigh:   { value: 0 },
      uEnergy: { value: 0 }

    }

  });

}
