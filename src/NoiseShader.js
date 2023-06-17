import { Vector2, Vector3 } from "three";

/**
 * Dot screen shader
 * based on glfx.js sepia shader
 * https://github.com/evanw/glfx.js
 */

const NoiseShader = {
  name: "NoiseShader",

  uniforms: {
    tDiffuse: { value: null },
    tSize: { value: new Vector2(256, 256) },
    center: { value: new Vector2(0.5, 0.5) },
    angle: { value: 1.57 },
    scale: { value: 1.0 },
    uTintColor: { value: new Vector3(1, 1, 1) },
    uTintStrength: { value: 0.0 },
  },

  vertexShader: /* glsl */ `

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,

  fragmentShader: /* glsl */ `

		uniform vec2 center;
		uniform float angle;
		uniform float scale;
		uniform vec2 tSize;
		uniform vec3 uTintColor;
		uniform float uTintStrength;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		float pattern() {

			float s = sin( angle ), c = cos( angle );

			vec2 tex = vUv * tSize - center;
			vec2 point = vec2( c * tex.x - s * tex.y, s * tex.x + c * tex.y ) * scale;

			return ( sin( point.x ) * sin( point.y ) ) * 4.0;

		}

		float random( vec2 p )
			{
				vec2 K1 = vec2(
					23.14069263277926, // e^pi (Gelfond's constant)
					2.665144142690225 // 2^sqrt(2) (Gelfondâ€“Schneider constant)
				);
				return fract( cos( dot(p,K1) ) * 12345.6789 );
			}

		void main() {

			vec4 color = texture2D( tDiffuse, vUv );

			vec2 uvRandom = vUv;
			uvRandom.y *= random(vec2(uvRandom.y, 0.4));
			color.rgb += random(uvRandom) * 0.09;

			vec3 color1 = vec3(2.0, 84.0, 100.0) / 255.0;
			
			color.rgb = mix(color.rgb, color1, uTintStrength);

			gl_FragColor = color;
		}`,
};

export { NoiseShader };
