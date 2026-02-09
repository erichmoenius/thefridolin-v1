precision highp float;

uniform float uTime;
uniform vec2 uResolution;

uniform float uBass;
uniform float uMid;
uniform float uHigh;
uniform float uEnergy;


// --------------------------------------------------
float hash(vec2 p){
    return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123);
}

float noise(vec2 p){
    vec2 i = floor(p);
    vec2 f = fract(p);

    vec2 u = f*f*(3.0-2.0*f);

    return mix(
        mix(hash(i+vec2(0,0)), hash(i+vec2(1,0)), u.x),
        mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x),
        u.y
    );
}

float fbm(vec2 p){
    float v = 0.0;
    float a = 0.5;

    for(int i=0;i<5;i++){
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}


// --------------------------------------------------
void main(){

    float bass   = uBass   * 0.35;
    float mid    = uMid    * 0.25;
    float high   = uHigh   * 0.20;
    float energy = uEnergy * 0.30;

    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    uv -= 0.5;
    uv.x *= uResolution.x / uResolution.y;

    uv.x += uTime * (0.03 + bass * 0.03);

    float scale =
        1.8
        + bass * 0.6;

    float base =
        fbm(uv * scale + uTime * 0.04);

    float structure =
        fbm(uv * (2.8 + mid * 1.5) + base);

    float cirrus =
        fbm(uv * (7.0 + high * 3.0) - uTime * 0.15);

    float nebula =
        base * 0.65 +
        structure * 0.25 +
        cirrus * 0.10;

    float glow =
        smoothstep(0.4, 0.75, nebula);

    glow *= 0.2 + energy * 0.2
    ;

    vec3 background = vec3(0.045,0.048,0.05);
    vec3 cloud      = vec3(0.82,0.84,0.86);

    vec3 color =
        mix(background, cloud, nebula * 0.85);

    color += glow * 0.18;

    gl_FragColor = vec4(color,1.0);
}
