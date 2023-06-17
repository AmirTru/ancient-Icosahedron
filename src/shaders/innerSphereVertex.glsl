varying vec3 vReflect;
varying vec3 vRefract[3];
varying float vReflectionFactor;
varying vec3 vPosition;

uniform float uRefractionRatio;
uniform float uFresnelBias;
uniform float uFresnelScale;
uniform float uFresnelPower;
uniform float uTime;
uniform float uSpeed;
uniform float uPower;

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

void main() {
    float displacementFactor = 1.5; // Adjust the displacement factor as desired
    // Calculate the displacement value using the noise function
    float n = sin(noise(position * displacementFactor * uTime * uSpeed) * 0.2);

    // Apply the displacement to the vertex position
    vec3 displacedPosition = position + normal * n * uPower * 1.2;

    // Calculate the transformed position
    vec4 mvPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
    vec4 worldPosition = modelMatrix * 1.3 * vec4(displacedPosition, 1.0);

    vec3 worldNormal = normalize(mat3(modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz) * normal);

    vec3 I = worldPosition.xyz - cameraPosition;

    vReflect = reflect(I, worldNormal);
    vRefract[0] = refract(normalize(I), worldNormal, uRefractionRatio * 0.986);
    vRefract[1] = refract(normalize(I), worldNormal, uRefractionRatio * 0.987);
    vRefract[2] = refract(normalize(I), worldNormal, uRefractionRatio * 0.988);
    vReflectionFactor = uFresnelBias + uFresnelScale * pow(1.0 + dot(normalize(I), worldNormal), uFresnelPower);

    gl_Position = projectionMatrix * mvPosition;
}

// void main() {

//     float n = noise(vPosition + uTime * uSpeed);

//     // Calculate distortion factor
//     float distortionFactor = 0.1; // Adjust the distortion factor as desired

//     // Apply distortion to vertex positions
//     vec3 distortedPosition = position + normal * n * distortionFactor;

//     vec4 mvPosition = modelViewMatrix * vec4(distortedPosition, 1.0);
//     vec4 worldPosition = modelMatrix * vec4(distortedPosition, 1.0);

//     vec3 worldNormal = normalize(mat3(modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz) * normal);

//     vec3 I = worldPosition.xyz - cameraPosition;

//     vReflect = reflect(I, worldNormal);
//     vRefract[0] = refract(normalize(I), worldNormal, uRefractionRatio);
//     vRefract[1] = refract(normalize(I), worldNormal, uRefractionRatio * 0.99);
//     vRefract[2] = refract(normalize(I), worldNormal, uRefractionRatio * 0.98);
//     vReflectionFactor = uFresnelBias + uFresnelScale * pow(1.0 + dot(normalize(I), worldNormal), uFresnelPower);

//     gl_Position = projectionMatrix * mvPosition;

// }