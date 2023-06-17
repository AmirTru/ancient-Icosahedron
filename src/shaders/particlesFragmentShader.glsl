varying vec3 vColor;
uniform float uOpacity;

void main() {

    //ligth point
    float strength = distance(gl_PointCoord, vec2(0.5));
    strength = 1.0 - strength;
    strength = pow(strength, 50.0);

    //final color
    vec3 color = mix(vec3(0.0), vColor, strength);

    gl_FragColor = vec4(color, uOpacity);
}