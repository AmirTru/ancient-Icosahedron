#define PI 3.1415926535897932384626433832795

varying vec2 vUv;
varying vec3 vPosition;

uniform float uTime;

uniform samplerCube tCube;
varying vec3 vReflect;
varying vec3 vRefract[3];
varying float vReflectionFactor;

void main() {
    vec4 reflectedColor = textureCube(tCube, vec3(-vReflect.x, vReflect.yz));
    vec4 refractedColor = vec4(0.97);

    refractedColor.r = textureCube(tCube, vec3(vRefract[0].x, vRefract[0].yz)).r;
    refractedColor.g = textureCube(tCube, vec3(vRefract[1].x, vRefract[1].yz)).g;
    refractedColor.b = textureCube(tCube, vec3(vRefract[2].x, vRefract[2].yz)).b;

    gl_FragColor = mix(refractedColor * 0.94, reflectedColor, clamp(vReflectionFactor, 0.8, 0.15));

    // gl_FragColor = refractedColor;
}
