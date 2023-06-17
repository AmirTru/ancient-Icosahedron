#define PI 3.1415926535897932384626433832795

varying vec2 vUv;
varying vec3 vPosition;

uniform float uTime;
uniform float uSpeed;
uniform float uNoiseScale;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uPatternOneScale;
uniform float uPatternTwoScale;

//NOISE
float mod289(float x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec4 perm(vec4 x) {
    return mod289(((x * 34.0) + 1.0) * x);
}

float noise(vec3 p) {
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

    return o4.y * d.y + o4.x * (1.0 - d.y);
}

mat2 rotate2D(float angle) {
    return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

float lines(vec2 uv, float offset) {
    return smoothstep(//
    0.0,//
    0.5 + offset * 0.5,//
    abs(0.5 * (sin(uv.x * 30.0) + offset * 2.0))//
    );
}

void main() {

    float n = noise(vPosition + uTime * uSpeed);

    vec2 baseUV = rotate2D(n) * vPosition.xy * uNoiseScale;
    float basePatter = lines(baseUV, uPatternOneScale);
    float secondPatter = lines(baseUV, uPatternTwoScale);

    vec3 color1 = vec3(2.0, 84.0, 100.0) / 255.0;
    vec3 color2 = vec3(232., 170., 66.) / 255.0;
    vec3 color3 = vec3(229., 124., 35.) / 255.0;

    vec3 baseColor = mix(color3, color2, basePatter);
    vec3 secondBaseColor = mix(baseColor, color1, secondPatter);

    gl_FragColor = vec4(vec3(secondBaseColor), 1.0);
}