import GUI from "lil-gui";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import * as animations from "./helpers/animations";
import { resizeRendererToDisplaySize } from "./helpers/responsiveness";
import "./style.css";

//Postprocessing imports
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
//@ts-ignore
import { NoiseShader } from "./NoiseShader";

//Shader imports
//@ts-ignore
import outerSphereFragmentShader from "./shaders/outerSphereFragment.glsl";
//@ts-ignore
import outerSphereVertexShader from "./shaders/outerSphereVertex.glsl";
//@ts-ignore
import innerSphereFragmentShader from "./shaders/innerSphereFragment.glsl";
//@ts-ignore
import innerSphereVertexShader from "./shaders/innerSphereVertex.glsl";
//@ts-ignore
import smallSphereFragmentShader from "./shaders/smallSphereFragment.glsl";
//@ts-ignore
import smallSphereVertexShader from "./shaders/smallSphereVertex.glsl";
//@ts-ignore
import particlesFragmentShader from "./shaders/particlesFragmentShader.glsl";
//@ts-ignore
import particlesVertexShader from "./shaders/particlesVertexShader.glsl";

//Animation imports
import { gsap } from "gsap";

const CANVAS_ID = "scene";

//lights
const lights = {
  a: {
    intensity: 15.0,
    color: {
      value: "#025464",
      instance: new THREE.Color(),
    },
    spherical: new THREE.Spherical(),
  },
  b: {
    intensity: 15.0,
    color: {
      value: "#E57C23",
      instance: new THREE.Color(),
    },
    spherical: new THREE.Spherical(),
  },
  accent: {
    color: {
      value: "#E8AA42",
      instance: new THREE.Color(),
    },
  },
};

lights.a.color.instance.set(lights.a.color.value);
lights.a.spherical = new THREE.Spherical(1, 0.615, 2.049);

lights.b.color.instance.set(lights.b.color.value);
lights.b.spherical = new THREE.Spherical(1, 2.561, -1.844);

lights.accent.color.instance.set(lights.accent.color.value);

//Scene
let canvas: HTMLElement;
let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let cubeRenderTarget: THREE.WebGLCubeRenderTarget;

//Meshes
const globalUniforms = {
  uTime: { value: 0 },
};

const outerSphereUniforms = {
  uTime: globalUniforms.uTime,
  uNoiseScale: { value: 0.06 },
  uSpeed: { value: 0.2 },
  uColor1: { value: new THREE.Color(lights.a.color.instance) },
  uColor2: { value: new THREE.Color(lights.accent.color.instance) },
  uColor3: { value: new THREE.Color(lights.b.color.instance) },
  uPatternOneScale: { value: 0.244 },
  uPatternTwoScale: { value: 0.1 },
};
let outerSphereMesh: THREE.Mesh;

const innerSphereUniforms = {
  uTime: globalUniforms.uTime,
  tCube: { value: null as THREE.CubeTexture | null },
  uRefractionRatio: { value: 0.6 },
  uFresnelBias: { value: 0.191 },
  uFresnelScale: { value: 4.0 },
  uFresnelPower: { value: 4.509 },
  uSpeed: { value: 0.2 },
  uPower: { value: 0.0 },
};
let innerSphereMesh: THREE.Mesh;

const particlesUniforms = {
  uTime: globalUniforms.uTime,
  uSize: { value: 500 },
  uPower: innerSphereUniforms.uPower,
  uColorLeft: { value: new THREE.Color(lights.a.color.instance) },
  uColorRight: { value: new THREE.Color(lights.b.color.instance) },
  uSphereCenter: { value: new THREE.Vector3() },
  uSphereRadius: { value: null as number | null },
  uOpacity: { value: 1.0 },
};
let particles: THREE.Points;

//Offset
const offset = {
  spherical: new THREE.Spherical(),
  direction: new THREE.Vector3(),
};
offset.spherical = new THREE.Spherical(
  1,
  Math.random() * Math.PI,
  Math.random() * Math.PI * 2
);
offset.direction = new THREE.Vector3();
offset.direction.setFromSpherical(offset.spherical);

const smallSphereUniforms = {
  uDistortionFrequency: { value: 1 },
  uDistortionStrength: { value: 0 },
  uDisplacementFrequency: { value: 4.846 },
  uDisplacementStrength: { value: 0.043 },
  uOffset: { value: new THREE.Vector3() },
  uSubdivision: {
    value: new THREE.Vector2(),
  },
  uSize: { value: 1.0 },
  uTime: globalUniforms.uTime,
  uSpeed: { value: 0.1 },
  uFresnelOffset: { value: -1.059 },
  uFresnelMultiplier: { value: 3 },
  uFresnelPower: { value: 2.252 },
  uLightAColor: { value: new THREE.Color(lights.a.color.instance) },
  uLightAPosition: { value: new THREE.Vector3(1, 1, 0) },
  uLightAIntensity: { value: lights.a.intensity },

  uLightBColor: { value: new THREE.Color(lights.b.color.instance) },
  uLightBPosition: { value: new THREE.Vector3(-1, -1, 0) },
  uLightBIntensity: { value: lights.b.intensity },

  uLightAccentColor: { value: new THREE.Color("#014350") },
};
let smallSphereMesh: THREE.Mesh;
let smallSphereMaterial: THREE.ShaderMaterial;

//Camera
let camera: THREE.PerspectiveCamera;
let cameraControls: OrbitControls;
let cubeCamera: THREE.CubeCamera;

//Postprocessing
let composer: EffectComposer;
let renderPass: RenderPass;
const bloomPassParams = {
  threshold: 0.559,
  strength: 0.3,
  radius: 0,
  tintColor: lights.accent.color.instance,
};
let bloomPass: UnrealBloomPass;
let noisePass: ShaderPass;

//Utilities
let loadingManager: THREE.LoadingManager;
let axesHelper: THREE.AxesHelper;
let gridHelper: THREE.GridHelper;
let clock: THREE.Clock;

//Debugging
let stats: Stats;
let gui: GUI;

const animation = { enabled: false, play: true };

init();
animate();

function init() {
  // ===== 🖼️ CANVAS, RENDERER, & SCENE =====
  {
    canvas = document.querySelector(`canvas#${CANVAS_ID}`)!;
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene = new THREE.Scene();
  }

  // ===== 👨🏻‍💼 LOADING MANAGER =====
  {
    loadingManager = new THREE.LoadingManager();

    loadingManager.onStart = () => {
      console.log("loading started");
    };
    loadingManager.onProgress = (url, loaded, total) => {
      console.log("loading in progress:");
      console.log(`${url} -> ${loaded} / ${total}`);
    };
    loadingManager.onLoad = () => {
      console.log("loaded!");
    };
    loadingManager.onError = () => {
      console.log("❌ error while loading");
    };
  }

  // ===== 📦 OBJECTS =====
  {
    cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
      format: THREE.RGBAFormat,
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
      colorSpace: THREE.SRGBColorSpace,
    });

    cubeCamera = new THREE.CubeCamera(0.001, 10, cubeRenderTarget);

    const outerSphereRadius = 1.5;
    const outerSphereSegments = 32;
    const outerSphere = new THREE.SphereGeometry(
      outerSphereRadius,
      outerSphereSegments,
      outerSphereSegments
    );

    const outerSphereMaterial = new THREE.ShaderMaterial({
      vertexShader: outerSphereVertexShader,
      fragmentShader: outerSphereFragmentShader,
      uniforms: outerSphereUniforms,
      side: THREE.DoubleSide,
    });
    outerSphereMesh = new THREE.Mesh(outerSphere, outerSphereMaterial);

    const innerSphereRadius = 0.4;
    const innerSphere = new THREE.IcosahedronGeometry(innerSphereRadius, 0);
    // innerSphere.rotateX(Math.PI / 2);

    const innerSphereMaterial = new THREE.ShaderMaterial({
      vertexShader: innerSphereVertexShader,
      fragmentShader: innerSphereFragmentShader,
      uniforms: innerSphereUniforms,
      side: THREE.DoubleSide,
      // wireframe: true,
    });
    innerSphereMesh = new THREE.Mesh(innerSphere, innerSphereMaterial);
    // innerSphereMesh.position.set(0.5, 0.1, 0);

    const smallSphereRadius = 0.2;
    const smallSphereSegments = 128;
    const smallSphere = new THREE.SphereGeometry(
      smallSphereRadius,
      smallSphereSegments,
      smallSphereSegments
    );
    smallSphere.computeTangents();
    smallSphereMaterial = new THREE.ShaderMaterial({
      vertexShader: smallSphereVertexShader,
      fragmentShader: smallSphereFragmentShader,
      uniforms: smallSphereUniforms,
      defines: {
        USE_TANGENT: "",
      },
      // side: THREE.DoubleSide,
    });
    smallSphereMaterial.uniforms.uSubdivision.value.x =
      smallSphere.parameters.widthSegments;
    smallSphereMaterial.uniforms.uSubdivision.value.y =
      smallSphere.parameters.heightSegments;
    smallSphereMaterial.uniforms.uLightAPosition.value.setFromSpherical(
      lights.a.spherical
    );
    smallSphereMaterial.uniforms.uLightBPosition.value.setFromSpherical(
      lights.b.spherical
    );
    smallSphereMesh = new THREE.Mesh(smallSphere, smallSphereMaterial);

    /**
     * Particles
     */
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 150;
    const sphereRadius = 0.45;
    const innerRadius = 0.44; // Radius of the empty space in the middle
    const sphereCenter = new THREE.Vector3(0, 0, 0);

    const posArray = new Float32Array(particlesCount * 3);
    const scales = new Float32Array(particlesCount * 1);
    const randomness = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i += 3) {
      let radius, theta, phi, x, y, z;

      // Generate random positions until a position outside the inner radius is obtained
      do {
        radius = Math.cbrt(Math.random()) * sphereRadius; // Random radius within the sphere
        theta = Math.random() * 2 * Math.PI; // Random angle for longitude
        phi = Math.random() * Math.PI; // Random angle for latitude

        x = sphereCenter.x + radius * Math.sin(phi) * Math.cos(theta);
        y = sphereCenter.y + radius * Math.sin(phi) * Math.sin(theta);
        z = sphereCenter.z + radius * Math.cos(phi);
      } while (Math.sqrt(x ** 2 + y ** 2 + z ** 2) < innerRadius);

      posArray[i] = x;
      posArray[i + 1] = y;
      posArray[i + 2] = z;

      // Randomness
      const randomX = Math.random() * 2 - 1;
      const randomY = Math.random() * 2 - 1;
      const randomZ = Math.random() * 2 - 1;

      randomness[i] = randomX;
      randomness[i + 1] = randomY;
      randomness[i + 2] = randomZ;

      // Scale
      scales[i] = 0.5 + Math.random() * 0.5;
    }

    particlesGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(posArray, 3)
    );
    particlesGeometry.setAttribute(
      "aScale",
      new THREE.BufferAttribute(scales, 1)
    );
    particlesGeometry.setAttribute(
      "aRandomness",
      new THREE.BufferAttribute(randomness, 3)
    );

    const particlesRawMaterial = new THREE.ShaderMaterial({
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      vertexShader: particlesVertexShader,
      fragmentShader: particlesFragmentShader,
      uniforms: particlesUniforms,
    });
    particlesRawMaterial.uniforms.uSphereCenter = { value: sphereCenter };
    particlesRawMaterial.uniforms.uSphereRadius = { value: sphereRadius };

    particles = new THREE.Points(particlesGeometry, particlesRawMaterial);

    scene.add(outerSphereMesh, smallSphereMesh, innerSphereMesh, particles);
  }

  // ===== 🎥 CAMERA =====
  {
    camera = new THREE.PerspectiveCamera(
      50,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 1.3);
  }

  // ===== 🕹️ CONTROLS =====
  {
    cameraControls = new OrbitControls(camera, canvas);
    // cameraControls.target = planeMesh.position.clone();
    cameraControls.enableDamping = true;
    cameraControls.autoRotate = false;
    cameraControls.enabled = false;
    cameraControls.update();
  }
  // ===== 🌞 POSTPROCESSING =====
  {
    composer = new EffectComposer(renderer);
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    composer.setSize(canvas.clientWidth, canvas.clientHeight);

    renderPass = new RenderPass(scene, camera);

    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(canvas.clientWidth, canvas.clientWidth),
      1.5,
      0.4,
      0.85
    );
    bloomPass.threshold = bloomPassParams.threshold;
    bloomPass.strength = bloomPassParams.strength;
    bloomPass.radius = bloomPassParams.radius;
    // bloomPass.enabled = false;

    noisePass = new ShaderPass(NoiseShader);
    noisePass.uniforms.uTintColor.value = new THREE.Color(
      bloomPassParams.tintColor
    );
    noisePass.uniforms.uTintStrength.value = 0.2;

    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.addPass(noisePass);
  }
  // ===== 🪄 HELPERS =====
  {
    axesHelper = new THREE.AxesHelper(4);
    axesHelper.visible = false;
    scene.add(axesHelper);

    gridHelper = new THREE.GridHelper(20, 20, "teal", "darkgray");
    gridHelper.position.y = -0.01;
    gridHelper.visible = false;
    scene.add(gridHelper);
  }

  // ===== 📈 STATS & CLOCK =====
  {
    clock = new THREE.Clock();
    stats = new Stats();
    // document.body.appendChild(stats.dom);
  }

  // ===== 🎛️ ANIMATION =====
  {
    let canRotate = true;

    /**
     * Follow mouse
     */
    const followMouse = () => {
      const mouse = new THREE.Vector2();

      function onMouseMove(event: { clientX: number; clientY: number }) {
        mouse.x = (event.clientX / canvas.clientWidth) * 2 - 1;
        mouse.y = -(event.clientY / canvas.clientHeight) * 2 + 1;

        gsap.to(camera.position, {
          duration: 1,
          x: mouse.x * 0.5,
          y: mouse.y * 0.5,
        });
      }
      window.addEventListener("mousemove", onMouseMove, false);
    };

    const sphereOpens = () => {
      const innerSphereScale = 0.8;

      gsap.to(innerSphereMesh.scale, {
        x: innerSphereScale,
        y: innerSphereScale,
        z: innerSphereScale,
        duration: 3,
        ease: "power2.inOut",
        onStart: () => {
          gsap.to(particlesUniforms.uOpacity, {
            value: 0.8,
            duration: 3,
            ease: "expo.inOut",
          });
        },
        onComplete: () => {
          gsap.to(innerSphereMesh.rotation, {
            y: Math.PI * 2,
            duration: 3,
            ease: "elastic.inOut(1.2, 0.75)",
          });
          gsap.to(innerSphereMesh.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 3,
            ease: "elastic.inOut(1.2, 0.75)",
          });
          gsap.to(innerSphereUniforms.uPower, {
            value: 3,
            duration: 3,
            ease: "expo.inOut",
          });
          gsap.to(camera, {
            fov: 90,
            duration: 3,
            ease: "expo.inOut",
          });
          gsap.to(particlesUniforms.uOpacity, {
            value: 1.0,
            duration: 3,
            ease: "expo.inOut",
            onComplete: () => {
              rotation();
              innerSphere();
            },
          });
        },
      });
    };

    const rotation = () => {
      let randomAxis = Math.random();
      let randomRotation = Math.floor(Math.random() * 9) - 4;
      let randomDuration = Math.random() * 2 + 1;

      if (canRotate) {
        if (randomAxis < 0.33) {
          gsap.to(innerSphereMesh.rotation, {
            x: "+=" + randomRotation,
            duration: randomDuration,
            ease: "power2.inOut",
            onComplete: () => {
              rotation();
            },
          });
        }
        if (randomAxis > 0.33 && randomAxis < 0.66) {
          gsap.to(innerSphereMesh.rotation, {
            y: "+=" + randomRotation,
            duration: randomDuration,
            ease: "power2.inOut",
            onComplete: () => {
              rotation();
            },
          });
        }
        if (randomAxis > 0.66) {
          gsap.to(innerSphereMesh.rotation, {
            z: "+=" + randomRotation,
            duration: randomDuration,
            ease: "power2.inOut",
            onComplete: () => {
              rotation();
            },
          });
        }
      } else {
        gsap.to(innerSphereMesh.rotation, {
          x: 0,
          y: 0,
          z: 0,
          duration: 3,
          ease: "power2.inOut",
          onComplete: () => {
            canRotate = true;
            gsap.set(innerSphereMesh.rotation, {
              x: 0,
              delay: 5,
              onComplete: () => {
                sphereOpens();
              },
            });
          },
        });
      }
    };

    const innerSphere = () => {
      gsap.to(smallSphereUniforms.uSize, {
        value: 1.2,
        duration: 3,
        ease: "power2.inOut",
      });
      gsap.to(smallSphereUniforms.uDisplacementStrength, {
        value: 0.2,
        duration: 6,
        ease: "power2.inOut",
        onComplete: () => {
          gsap.to(innerSphereUniforms.uPower, {
            value: 2,
            duration: 1,
            ease: "power2.inOut",
          });
          gsap.to(smallSphereUniforms.uDisplacementStrength, {
            value: 0.0,
            duration: 1,
            ease: "expo.inOut",
            onComplete: () => {
              gsap.to(innerSphereUniforms.uPower, {
                value: 3,
                duration: 6,
                ease: "power2.inOut",
              });
              gsap.to(smallSphereUniforms.uDisplacementStrength, {
                value: 0.043,
                duration: 6,
                ease: "power2.inOut",
                onComplete: () => {
                  gsap.to(smallSphereUniforms.uDistortionStrength, {
                    value: 1,
                    duration: 8,
                    ease: "power2.inOut",
                    onComplete: () => {
                      gsap.to(innerSphereUniforms.uPower, {
                        value: 4,
                        duration: 6,
                        ease: "power2.inOut",
                      });
                      gsap.to(smallSphereUniforms.uDisplacementStrength, {
                        value: 0.2,
                        duration: 6,
                        ease: "power2.inOut",
                        onComplete: () => {
                          gsap.to(smallSphereUniforms.uDisplacementStrength, {
                            value: 0.043,
                            duration: 1,
                            ease: "power2.inOut",
                          });
                          gsap.to(smallSphereUniforms.uDistortionStrength, {
                            value: 0,
                            duration: 1,
                            ease: "power2.inOut",
                          });
                          gsap.to(innerSphereUniforms.uPower, {
                            value: 0,
                            duration: 1,
                            ease: "power2.inOut",
                          });
                          gsap.to(camera, {
                            fov: 50,
                            duration: 1,
                            ease: "power2.inOut",
                            onComplete: () => {
                              canRotate = false;
                            },
                          });
                          gsap.to(smallSphereUniforms.uSize, {
                            value: 1,
                            duration: 1,
                            ease: "power2.inOut",
                          });
                        },
                      });
                    },
                  });
                },
              });
            },
          });
        },
      });
    };

    followMouse();
    sphereOpens();
  }
  // ==== 🐞 DEBUG GUI ====
  {
    gui = new GUI({ title: "🐞 Debug GUI", width: 300 });

    /**
     * Plane
     */
    const planeFolder = gui.addFolder("Plane");
    planeFolder.add(outerSphereMesh.material, "wireframe");

    /**
     * Background
     */
    const backgroundFolder = gui.addFolder("Background");
    backgroundFolder
      .add(outerSphereUniforms.uNoiseScale, "value")
      .min(0.01)
      .max(1)
      .step(0.01)
      .name("noise scale");
    backgroundFolder
      .add(outerSphereUniforms.uSpeed, "value")
      .min(0)
      .max(3)
      .step(0.01)
      .name("speed");
    backgroundFolder
      .addColor(outerSphereUniforms.uColor1, "value")
      .name("color 1")
      .onChange(() => {
        outerSphereUniforms.uColor1.value = new THREE.Color(
          outerSphereUniforms.uColor1.value
        );
        smallSphereUniforms.uLightAColor.value = new THREE.Color(
          outerSphereUniforms.uColor1.value
        );
        particlesUniforms.uColorLeft.value = new THREE.Color(
          outerSphereUniforms.uColor1.value
        );
      });
    backgroundFolder
      .addColor(outerSphereUniforms.uColor2, "value")
      .name("color 2")
      .onChange(() => {
        outerSphereUniforms.uColor2.value = new THREE.Color(
          outerSphereUniforms.uColor2.value
        );
        smallSphereUniforms.uLightAccentColor.value = new THREE.Color(
          outerSphereUniforms.uColor2.value
        );
        noisePass.uniforms.uTintColor.value = new THREE.Color(
          outerSphereUniforms.uColor2.value
        );
      });
    backgroundFolder
      .addColor(outerSphereUniforms.uColor3, "value")
      .name("color 3")
      .onChange(() => {
        outerSphereUniforms.uColor3.value = new THREE.Color(
          outerSphereUniforms.uColor3.value
        );
        smallSphereUniforms.uLightBColor.value = new THREE.Color(
          outerSphereUniforms.uColor3.value
        );
        particlesUniforms.uColorRight.value = new THREE.Color(
          outerSphereUniforms.uColor3.value
        );
      });
    backgroundFolder
      .add(outerSphereUniforms.uPatternOneScale, "value", 0, 3, 0.001)
      .name("pattern 1 scale");
    backgroundFolder
      .add(outerSphereUniforms.uPatternTwoScale, "value", 0, 3, 0.001)
      .name("pattern 2 scale");

    /**
     * Icosahedron
     */
    const IcosahedronFolder = gui.addFolder("Icosahedron");
    IcosahedronFolder.add(
      innerSphereUniforms.uFresnelBias,
      "value",
      0,
      1,
      0.001
    ).name("bias");
    IcosahedronFolder.add(
      innerSphereUniforms.uFresnelPower,
      "value",
      0.01,
      10,
      0.001
    ).name("power");
    IcosahedronFolder.add(
      innerSphereUniforms.uFresnelScale,
      "value",
      1,
      10,
      0.001
    ).name("scale");
    IcosahedronFolder.add(
      innerSphereUniforms.uRefractionRatio,
      "value",
      0,
      1.2,
      0.001
    ).name("refraction ratio");
    IcosahedronFolder.add(
      innerSphereUniforms.uPower,
      "value",
      0,
      3,
      0.001
    ).name("power");
    // Sun
    const sunFolder = gui.addFolder("Sun");
    sunFolder
      .add(smallSphereUniforms.uDisplacementFrequency, "value", 0, 20, 0.001)
      .name("Displacement Frequency");
    sunFolder
      .add(smallSphereUniforms.uDisplacementStrength, "value", 0, 0.2, 0.001)
      .name("Displacement Strength");
    sunFolder
      .add(smallSphereUniforms.uDistortionFrequency, "value", 0, 20, 0.001)
      .name("Distortion Frequency");
    sunFolder
      .add(smallSphereUniforms.uDistortionStrength, "value", 0, 5, 0.001)
      .name("Distortion Strength");
    sunFolder
      .add(smallSphereUniforms.uLightAIntensity, "value", 0, 15, 0.001)
      .name("Light A Intensity");
    sunFolder
      .add(smallSphereUniforms.uLightBIntensity, "value", 0, 15, 0.001)
      .name("Light B Intensity");
    sunFolder
      .add(smallSphereUniforms.uFresnelOffset, "value", -2, 2, 0.001)
      .name("Fresnel Offset");
    sunFolder
      .add(smallSphereUniforms.uFresnelPower, "value", 0, 5, 0.001)
      .name("Fresnel Power");
    sunFolder
      .add(smallSphereUniforms.uFresnelMultiplier, "value", 0, 5, 0.001)
      .name("Fresnel Multiplier");

    /**
     * Bloom
     */
    const bloomFolder = gui.addFolder("Bloom");
    bloomFolder
      .add(bloomPass, "threshold", 0, 1, 0.001)
      .name("threshold")
      .onChange(() => {
        bloomPassParams.threshold = bloomPass.threshold;
      });
    bloomFolder
      .add(bloomPass, "strength", 0, 3, 0.001)
      .name("strength")
      .onChange(() => {
        bloomPassParams.strength = bloomPass.strength;
      });
    bloomFolder
      .add(bloomPass, "radius", 0, 1, 0.001)
      .name("radius")
      .onChange(() => {
        bloomPassParams.radius = bloomPass.radius;
      });
    bloomFolder.add(bloomPass, "enabled").name("bloomPass enabled");

    /**
     * noise
     */
    const noiseFolder = gui.addFolder("Noise");
    noiseFolder
      .add(noisePass.uniforms.uTintStrength, "value", 0, 1, 0.001)
      .name("tint strength");

    /**
     * Helpers
     */
    const helpersFolder = gui.addFolder("Helpers");
    helpersFolder.add(gridHelper, "visible").name("grid");
    helpersFolder.add(axesHelper, "visible").name("axes");

    const cameraFolder = gui.addFolder("Camera");
    cameraFolder.add(camera, "fov").min(0).max(140).step(1).name("fov");
    cameraFolder.add(cameraControls, "autoRotate");

    gui.close();
    gui.hide();
  }
}

function animate() {
  requestAnimationFrame(animate);

  if (animation.enabled && animation.play) {
    animations.rotate(outerSphereMesh, clock, Math.PI / 3);
    animations.bounce(outerSphereMesh, clock, 1, 0.5, 0.5);
  }

  if (resizeRendererToDisplaySize(renderer, composer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
  // Update uniforms
  globalUniforms.uTime.value = clock.getElapsedTime();

  // Offset
  const offsetTime = clock.getElapsedTime() * 0.3;
  offset.spherical.phi =
    (Math.sin(offsetTime * 0.001) * Math.sin(offsetTime * 0.00321) * 0.5 +
      0.5) *
    Math.PI;
  offset.spherical.theta =
    (Math.sin(offsetTime * 0.0001) * Math.sin(offsetTime * 0.000321) * 0.5 +
      0.5) *
    Math.PI *
    2;
  offset.direction.setFromSpherical(offset.spherical);
  offset.direction.multiplyScalar(0.0003 * 2);

  smallSphereMaterial.uniforms.uOffset.value.add(offset.direction);

  cubeCamera.update(renderer, scene);
  innerSphereUniforms.tCube.value = cubeCamera.renderTarget.texture;

  cameraControls.update();

  // renderer.render(scene, camera);
  camera.updateProjectionMatrix();
  composer.render();
  stats.update();
}
