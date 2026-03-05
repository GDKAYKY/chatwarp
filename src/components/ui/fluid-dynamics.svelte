<script>
  import { onMount, onDestroy } from "svelte";

  export let width = 300;
  export let height = 300;
  export let iterations = 3;
  export let strength = 100;
  export let radius = 1;
  export let viscosity = 0.0;
  export let diffusion = 0.0;
  export let showVelocity = false;
  export let showDensity = true;
  export let addVelocity = true;
  export let addDensity = true;
  export let animate = true;
  export let circle = true;
  let className = "";
  export { className as class };

  export let canvasRef = null;
  let hiddenCanvasRef;
  let animationRef;
  let stateRef;

  const generateColorArrays = () => {
    const ncol = 500;
    const red = new Array(ncol);
    const grn = new Array(ncol);
    const blu = new Array(ncol);

    for (let i = 0; i < ncol; i++) {
      const val = Math.floor((i / (ncol - 1)) * 255);
      red[i] = val;
      grn[i] = val;
      blu[i] = val;
    }
    return { red, grn, blu };
  };

  const IX = (i, j, w) => j * w + i;

  const setBoundary = (b, x, w, h) => {
    for (let i = 1; i <= h; i++) {
      x[IX(0, i, w)] = 0;
      x[IX(w + 1, i, w)] = 0;
      x[IX(i, 0, w)] = 0;
      x[IX(i, w + 1, w)] = 0;
    }
    x[IX(0, 0, w)] = 0.5 * (x[IX(1, 0, w)] + x[IX(0, 1, w)]);
    x[IX(0, w + 1, w)] = 0.5 * (x[IX(1, w + 1, w)] + x[IX(0, h, w)]);
    x[IX(w + 1, 0, w)] = 0.5 * (x[IX(w, 0, w)] + x[IX(w + 1, 1, w)]);
    x[IX(w + 1, h + 1, w)] = 0.5 * (x[IX(w, h + 1, w)] + x[IX(w + 1, w, w)]);
  };

  const diffuse = (b, x, x0, diff, dt, iter, w, h) => {
    const a = dt * diff * w * w;
    for (let k = 0; k < iter; k++) {
      for (let i = 1; i <= w; i++) {
        for (let j = 1; j <= h; j++) {
          x[IX(i, j, w)] =
            (x0[IX(i, j, w)] +
              a *
                (x[IX(i - 1, j, w)] +
                  x[IX(i + 1, j, w)] +
                  x[IX(i, j - 1, w)] +
                  x[IX(i, j + 1, w)])) /
            (1 + 4 * a);
        }
      }
      setBoundary(b, x, w, h);
    }
  };

  const advect = (b, d, d0, u, v, dt, w, h) => {
    const dt0 = dt * w;
    for (let i = 1; i <= w; i++) {
      for (let j = 1; j <= h; j++) {
        let x = i - dt0 * u[IX(i, j, w)];
        let y = j - dt0 * v[IX(i, j, w)];

        if (x < 0.5) x = 0.5;
        if (x > w + 0.5) x = w + 0.5;
        const i0 = Math.floor(x);
        const i1 = i0 + 1;

        if (y < 0.5) y = 0.5;
        if (y > h + 0.5) y = h + 0.5;
        const j0 = Math.floor(y);
        const j1 = j0 + 1;

        const s1 = x - i0;
        const s0 = 1 - s1;
        const t1 = y - j0;
        const t0 = 1 - t1;

        d[IX(i, j, w)] =
          s0 * (t0 * d0[IX(i0, j0, w)] + t1 * d0[IX(i0, j1, w)]) +
          s1 * (t0 * d0[IX(i1, j0, w)] + t1 * d0[IX(i1, j1, w)]);
      }
    }
    setBoundary(b, d, w, h);
  };

  const project = (u, v, p, div, iter, w, h) => {
    const h_val = 1.0 / w;

    for (let i = 1; i <= w; i++) {
      for (let j = 1; j <= h; j++) {
        div[IX(i, j, w)] =
          -0.5 *
          h_val *
          (u[IX(i + 1, j, w)] -
            u[IX(i - 1, j, w)] +
            v[IX(i, j + 1, w)] -
            v[IX(i, j - 1, w)]);
        p[IX(i, j, w)] = 0;
      }
    }

    setBoundary(0, div, w, h);
    setBoundary(0, p, w, h);

    for (let k = 0; k < iter; k++) {
      for (let i = 1; i <= w; i++) {
        for (let j = 1; j <= h; j++) {
          p[IX(i, j, w)] =
            (div[IX(i, j, w)] +
              p[IX(i - 1, j, w)] +
              p[IX(i + 1, j, w)] +
              p[IX(i, j - 1, w)] +
              p[IX(i, j + 1, w)]) /
            4;
        }
      }
      setBoundary(0, p, w, h);
    }

    for (let i = 1; i <= w; i++) {
      for (let j = 1; j <= h; j++) {
        u[IX(i, j, w)] -=
          (0.5 * (p[IX(i + 1, j, w)] - p[IX(i - 1, j, w)])) / h_val;
        v[IX(i, j, w)] -=
          (0.5 * (p[IX(i, j + 1, w)] - p[IX(i, j - 1, w)])) / h_val;
      }
    }
    setBoundary(1, u, w, h);
    setBoundary(2, v, w, h);
  };

  const velStep = (u, v, u0, v0, visc, dt, iter, w, h) => {
    let tmp = u0;
    u0 = u;
    u = tmp;
    diffuse(1, u, u0, visc, dt, iter, w, h);
    tmp = v0;
    v0 = v;
    v = tmp;
    diffuse(2, v, v0, visc, dt, iter, w, h);
    project(u, v, u0, v0, iter, w, h);
    tmp = u0;
    u0 = u;
    u = tmp;
    tmp = v0;
    v0 = v;
    v = tmp;
    advect(1, u, u0, u0, v0, dt, w, h);
    advect(2, v, v0, u0, v0, dt, w, h);
    project(u, v, u0, v0, iter, w, h);
  };

  const densStep = (x, x0, u, v, diff, dt, iter, w, h) => {
    let tmp = x0;
    x0 = x;
    x = tmp;
    diffuse(0, x, x0, diff, dt, iter, w, h);
    tmp = x0;
    x0 = x;
    x = tmp;
    advect(0, x, x0, u, v, dt, w, h);
  };

  const addDensityAt = (x, y, amount, w, h) => {
    if (!stateRef) return;
    for (let j = y - radius; j < y + radius; j++) {
      for (let k = x - radius; k < x + radius; k++) {
        if (j > radius && j < h - radius && k > radius && k < w - radius) {
          stateRef.dens[j * w + k] += amount;
        }
      }
    }
  };

  const addVelocityAt = (x, y, amountX, amountY, w, h) => {
    if (!stateRef) return;
    for (let j = y - radius; j < y + radius; j++) {
      for (let k = x - radius; k < x + radius; k++) {
        if (j > radius && j < h - radius && k > radius && k < w - radius) {
          stateRef.u[j * w + k] += amountX;
          stateRef.v[j * w + k] += amountY;
        }
      }
    }
  };

  const drawTexture = (ctx, w, h) => {
    if (!stateRef) return;
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const { u, v, dens, red, grn, blu } = stateRef;

    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        const i = y * w + x;
        let value = 0;

        if (showVelocity) {
          value = Math.abs(Math.sqrt(u[i] * u[i] + v[i] * v[i]));
        }
        if (showDensity) {
          value = dens[i];
        }

        const frac = Math.max(0.01, Math.min(0.99, value / 100));
        const icol = Math.floor(frac * (red.length - 1));

        const pxl = (x + y * w) * 4;
        data[pxl] = red[icol];
        data[pxl + 1] = grn[icol];
        data[pxl + 2] = blu[icol];
        data[pxl + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const getMousePos = (canvas, e) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const scaleX = width / canvas.width;
    const scaleY = height / canvas.height;

    return {
      x: Math.round((clientX - rect.left) * scaleX),
      y: Math.round((clientY - rect.top) * scaleY),
    };
  };

  const handleInteraction = (x, y, prevX, prevY) => {
    if (!stateRef) return;
    if (addDensity) {
      addDensityAt(x, y, strength, width, height);
    }
    if (addVelocity && prevX !== undefined && prevY !== undefined) {
      addVelocityAt(
        x,
        y,
        strength * (x - prevX),
        strength * (y - prevY),
        width,
        height,
      );
    }
  };

  const animate_loop = () => {
    if (!canvasRef || !hiddenCanvasRef || !stateRef) return;

    const ctx = canvasRef.getContext("2d", { alpha: true });
    const hiddenCtx = hiddenCanvasRef.getContext("2d", { alpha: true });

    if (!ctx || !hiddenCtx) return;

    if (animate && circle && stateRef.isAnimating) {
      stateRef.time += 0.02;
      const x = Math.round(width / 2 + (width / 4) * Math.cos(stateRef.time));
      const y = Math.round(height / 2 + (height / 4) * Math.sin(stateRef.time));

      handleInteraction(x, y, stateRef.lastX, stateRef.lastY);
      stateRef.lastX = x;
      stateRef.lastY = y;
    }

    velStep(
      stateRef.u,
      stateRef.v,
      stateRef.u_old,
      stateRef.v_old,
      viscosity,
      0.0001,
      iterations,
      width,
      height,
    );

    densStep(
      stateRef.dens,
      stateRef.dens_old,
      stateRef.u,
      stateRef.v,
      diffusion,
      0.0001,
      iterations,
      width,
      height,
    );

    drawTexture(hiddenCtx, width, height);

    ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
    ctx.drawImage(hiddenCanvasRef, 0, 0, canvasRef.width, canvasRef.height);

    animationRef = requestAnimationFrame(animate_loop);
  };

  onMount(() => {
    if (!canvasRef || !hiddenCanvasRef) return;

    const size = (width + 2) * (height + 2);
    const colors = generateColorArrays();

    stateRef = {
      u: new Array(size).fill(0),
      v: new Array(size).fill(0),
      u_old: new Array(size).fill(0),
      v_old: new Array(size).fill(0),
      dens: new Array(size).fill(0),
      dens_old: new Array(size).fill(0),
      isAnimating: true,
      isHovering: false,
      lastX: -1,
      lastY: -1,
      time: 0,
      ...colors,
    };

    const updateCanvasSize = () => {
      canvasRef.width = window.innerWidth;
      canvasRef.height = window.innerHeight;
      hiddenCanvasRef.width = width;
      hiddenCanvasRef.height = height;
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    const handleMouseEnter = () => {
      if (!stateRef) return;
      stateRef.isHovering = true;
      stateRef.isAnimating = false;
    };

    const handleMouseMove = (e) => {
      if (!stateRef || !stateRef.isHovering) return;
      const pos = getMousePos(canvasRef, e);
      handleInteraction(pos.x, pos.y, stateRef.lastX, stateRef.lastY);
      stateRef.lastX = pos.x;
      stateRef.lastY = pos.y;
    };

    const handleMouseLeave = () => {
      if (!stateRef) return;
      stateRef.isHovering = false;
      stateRef.isAnimating = true;
      stateRef.lastX = -1;
      stateRef.lastY = -1;
    };

    const handleTouchStart = (e) => {
      e.preventDefault();
      if (!stateRef) return;
      stateRef.isAnimating = false;
      const pos = getMousePos(canvasRef, e);
      handleInteraction(pos.x, pos.y);
      stateRef.lastX = pos.x;
      stateRef.lastY = pos.y;
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      if (!stateRef) return;
      const pos = getMousePos(canvasRef, e);
      handleInteraction(pos.x, pos.y, stateRef.lastX, stateRef.lastY);
      stateRef.lastX = pos.x;
      stateRef.lastY = pos.y;
    };

    const handleTouchEnd = (e) => {
      e.preventDefault();
      if (!stateRef) return;
      stateRef.isAnimating = true;
      stateRef.lastX = -1;
      stateRef.lastY = -1;
    };

    canvasRef.addEventListener("mouseenter", handleMouseEnter);
    canvasRef.addEventListener("mousemove", handleMouseMove);
    canvasRef.addEventListener("mouseleave", handleMouseLeave);
    canvasRef.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    canvasRef.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    canvasRef.addEventListener("touchend", handleTouchEnd, { passive: false });
    canvasRef.addEventListener("touchcancel", handleTouchEnd, {
      passive: false,
    });

    animate_loop();

    return () => {
      if (animationRef) {
        cancelAnimationFrame(animationRef);
      }
      window.removeEventListener("resize", updateCanvasSize);
      if (canvasRef) {
        canvasRef.removeEventListener("mouseenter", handleMouseEnter);
        canvasRef.removeEventListener("mousemove", handleMouseMove);
        canvasRef.removeEventListener("mouseleave", handleMouseLeave);
        canvasRef.removeEventListener("touchstart", handleTouchStart);
        canvasRef.removeEventListener("touchmove", handleTouchMove);
        canvasRef.removeEventListener("touchend", handleTouchEnd);
        canvasRef.removeEventListener("touchcancel", handleTouchEnd);
      }
    };
  });
</script>

<div class={`fixed inset-0 w-full h-full overflow-hidden ${className}`}>
  <canvas
    bind:this={canvasRef}
    class="block w-full h-full"
    style="display: block; background: transparent;"
  ></canvas>
  <canvas bind:this={hiddenCanvasRef} style="display: none;"></canvas>
  <slot></slot>
</div>
