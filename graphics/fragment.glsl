precision highp float;

uniform float uTime;
uniform vec2  uResolution;
uniform vec2 uMouse;


uniform float uGas;
uniform float uWater;
uniform float uSolid;
uniform float uFire;
uniform float uStillness;
uniform float uEnergy;

varying vec2 vUv;

// --------------------------------------------------

float hash(vec2 p){
    return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123);
}

float noise(vec2 p){
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);

    return mix(
        mix(hash(i), hash(i+vec2(1.0,0.0)), u.x),
        mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), u.x),
        u.y
    );
}

float fbm(vec2 p){
    float v = 0.0;
    float a = 0.5;
    for(int i=0;i<6;i++){
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}

// --------------------------------------------------

void main(){

    vec2 uv = vUv;
    vec2 p = uv - 0.5;
    p += uMouse * (0.18 + uEnergy * 0.1);


    p.x *= uResolution.x / uResolution.y;

    float time = uTime * 0.06 + uEnergy * 0.4;

    // Base noise
    float n = fbm(p * 3.0 + vec2(time, time * 0.4));

    // Secondary detail layer
    float detail = fbm(p * 6.0 - vec2(time * 0.3));

    // Combine layers for richer structure
    float density = mix(n, detail, 0.5);

    // Increase contrast
    density = pow(density, 1.8);
    density *= 1.0 + uEnergy * 0.6;

    // Gentle radial falloff (NOT too strong)
    float radial = length(p);
    float depthMask = smoothstep(1.0, 0.2, radial);
    density *= depthMask;

    // Color palette
    vec3 deepBlue = vec3(0.02, 0.05, 0.12);
    vec3 violet   = vec3(0.4, 0.08, 0.6);
    vec3 cyan     = vec3(0.1, 0.6, 0.9);
    vec3 orange   = vec3(1.0, 0.35, 0.05);

    vec3 nebula = mix(deepBlue, violet, density);
    nebula = mix(nebula, cyan, density * 0.3);

    // Subtle glow only from high density
    nebula += pow(density, 4.0) * (0.18 + uEnergy * 0.25);

// Fire density vorberechnen
float fireDensity = pow(density, 1.5);

// State blending
vec3 finalColor =
      uGas       * nebula
    + uWater     * mix(nebula, cyan, 0.5)
    + uSolid     * mix(nebula, vec3(0.6), 0.4)
    + uFire      * (
        nebula * 1.2 +
        fireDensity * orange * 0.8
      )
    + uStillness * deepBlue;

    gl_FragColor = vec4(finalColor, 1.0);
}
