uniform float uSize;
uniform float uTime;
uniform float uPower;
uniform vec3 uColorLeft;
uniform vec3 uColorRight;
uniform vec3 uSphereCenter;
uniform float uSphereRadius;

attribute vec3 aRandomness;
attribute float aScale;

varying vec3 vColor;

void main() {
    // Time-based offset
    float timeOffset = uTime * 0.006; // Adjust the multiplier to control the speed of movement

    vec3 newPosition = position + aRandomness * timeOffset;

    float radius = length(newPosition);
    float radiusOffset = mix(0.1, radius, pow(uPower, 1.));

    newPosition *= radiusOffset; // Scale the position based on the modified radius

    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    gl_PointSize = uSize * aScale;
    gl_PointSize *= (1.0 / -viewPosition.z);

    // Calculate the x-coordinate relative to the center of the scene
    float relativeX = (newPosition.x - uSphereCenter.x) / uSphereRadius;

    vec3 mixedColor = mix(uColorRight, uColorLeft, (relativeX + 1.0) / 2.0);
    vColor = mixedColor;

    // Back and forth movement
    float movementOffset = sin(timeOffset * 0.02) * 0.002; // Adjust the multiplier to control the movement range
    movementOffset += cos(timeOffset * 0.02) * 0.002; // Adjust the multiplier to control the movement range
    vec3 finalPosition = newPosition + aRandomness * movementOffset;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(vec3(finalPosition), 1.0);
}
