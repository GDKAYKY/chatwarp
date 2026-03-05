<script>
  import { onMount } from "svelte";
  import * as THREE from "three";
  import FluidDynamics from "./fluid-dynamics.svelte";

  let container;
  let fluidCanvas = null;
  let sceneRef = null;

  onMount(() => {
    if (!container) return;

    // Vertex shader
    const vertexShader = `
      void main() {
        gl_Position = vec4( position, 1.0 );
      }
    `;

    // Fragment shader
    const fragmentShader = `
      #define TWO_PI 6.2831853072
      #define PI 3.14159265359

      precision highp float;
      uniform vec2 resolution;
      uniform float time;
      uniform sampler2D distortionMap;

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        vec2 texUv = gl_FragCoord.xy / resolution.xy;
        vec4 fluid = texture2D(distortionMap, vec2(texUv.x, 1.0 - texUv.y));
        
        float dist = fluid.r;
        vec2 dir = normalize(uv + 0.0001);
        uv -= dir * dist * 0.4; // Black hole distortion pulls the UVs

        float t = time*0.05;
        float lineWidth = 0.002;

        vec3 color = vec3(0.0);
        for(int j = 0; j < 3; j++){
          for(int i=0; i < 5; i++){
            color[j] += lineWidth*float(i*i) / abs(fract(t - 0.01*float(j)+float(i)*0.01)*5.0 - length(uv) + mod(uv.x+uv.y, 0.2));
          }
        }
        
        // Dim the light near the event horizon
        color *= (1.0 - dist * 0.8);
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const camera = new THREE.Camera();
    camera.position.z = 1;

    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);

    const uniforms = {
      time: { type: "f", value: 1.0 },
      resolution: { type: "v2", value: new THREE.Vector2() },
      distortionMap: { type: "t", value: null },
    };

    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);

    container.appendChild(renderer.domElement);

    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      uniforms.resolution.value.x = renderer.domElement.width;
      uniforms.resolution.value.y = renderer.domElement.height;
    });

    resizeObserver.observe(container);

    const animate = () => {
      const animationId = requestAnimationFrame(animate);
      uniforms.time.value += 0.05;

      if (fluidCanvas && !uniforms.distortionMap.value) {
        const texture = new THREE.CanvasTexture(fluidCanvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        uniforms.distortionMap.value = texture;
      }
      if (uniforms.distortionMap.value) {
        uniforms.distortionMap.value.needsUpdate = true;
      }

      renderer.render(scene, camera);

      if (sceneRef) {
        sceneRef.animationId = animationId;
      }
    };

    sceneRef = {
      camera,
      scene,
      renderer,
      uniforms,
      animationId: 0,
    };

    animate();

    return () => {
      resizeObserver.disconnect();

      if (sceneRef) {
        cancelAnimationFrame(sceneRef.animationId);

        if (container && sceneRef.renderer.domElement) {
          container.removeChild(sceneRef.renderer.domElement);
        }

        sceneRef.renderer.dispose();
        geometry.dispose();
        material.dispose();
      }
    };
  });
</script>

<div class="relative w-full h-screen overflow-hidden">
  <div
    bind:this={container}
    class="absolute inset-0 w-full h-full"
    style="background: #000; overflow: hidden;"
  ></div>
  <FluidDynamics
    bind:canvasRef={fluidCanvas}
    class="absolute inset-0 w-full h-full opacity-0 pointer-events-auto"
  />
</div>
