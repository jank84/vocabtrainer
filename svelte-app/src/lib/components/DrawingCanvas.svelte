<script>
  import { appState } from '../stores/appState.svelte.js';

  let { hasDrawn = $bindable(false), isShowingResult } = $props();

  let canvasEl;
  let wrapperEl;
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;

  export function getCanvasElement() {
    return canvasEl;
  }

  export function clearCanvas() {
    if (!canvasEl || !wrapperEl) return;
    const ctx = canvasEl.getContext('2d');
    const rect = wrapperEl.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    drawGuideLines(ctx, rect.width, rect.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#1a1a2e';
    hasDrawn = false;
  }

  function resizeCanvas() {
    if (!canvasEl || !wrapperEl) return;
    const ctx = canvasEl.getContext('2d');
    const rect = wrapperEl.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvasEl.width = rect.width * dpr;
    canvasEl.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    drawGuideLines(ctx, rect.width, rect.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#1a1a2e';
  }

  function drawGuideLines(ctx, w, h) {
    ctx.save();
    ctx.strokeStyle = '#e8ecf0';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    const midY = Math.round(h * 0.55);
    ctx.beginPath();
    ctx.moveTo(20, midY);
    ctx.lineTo(w - 20, midY);
    ctx.stroke();
    const topY = Math.round(h * 0.2);
    ctx.strokeStyle = '#eff1f5';
    ctx.beginPath();
    ctx.moveTo(20, topY);
    ctx.lineTo(w - 20, topY);
    ctx.stroke();
    const bottomY = Math.round(h * 0.8);
    ctx.beginPath();
    ctx.moveTo(20, bottomY);
    ctx.lineTo(w - 20, bottomY);
    ctx.stroke();
    ctx.restore();
  }

  function getPos(e) {
    const rect = canvasEl.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function startDraw(e) {
    if (isShowingResult) return;
    e.preventDefault();
    isDrawing = true;
    const pos = getPos(e);
    lastX = pos.x;
    lastY = pos.y;
    const ctx = canvasEl.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos.x + 0.1, pos.y + 0.1);
    ctx.stroke();
    if (!hasDrawn) {
      hasDrawn = true;
    }
  }

  function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvasEl.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastX = pos.x;
    lastY = pos.y;
  }

  function endDraw(e) {
    if (e) e.preventDefault();
    isDrawing = false;
  }

  let resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeCanvas();
      hasDrawn = false;
    }, 150);
  }

  $effect(() => {
    if (canvasEl && wrapperEl) {
      resizeCanvas();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }
  });
</script>

<div class="canvas-wrapper" bind:this={wrapperEl}>
  <canvas
    bind:this={canvasEl}
    onmousedown={startDraw}
    onmousemove={draw}
    onmouseup={endDraw}
    onmouseleave={endDraw}
    ontouchstart={startDraw}
    ontouchmove={draw}
    ontouchend={endDraw}
    ontouchcancel={endDraw}
  ></canvas>
  {#if !hasDrawn}
    <div class="canvas-placeholder">Write your<br>answer here</div>
  {/if}
</div>

<style>
  .canvas-wrapper {
    flex: 1;
    background: var(--surface);
    border-radius: 12px;
    box-shadow: var(--shadow);
    overflow: hidden;
    position: relative;
    min-height: 0;
  }

  .canvas-wrapper canvas {
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
    cursor: crosshair;
  }

  .canvas-placeholder {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    color: var(--border);
    font-size: 17px;
    font-weight: 500;
    text-align: center;
    line-height: 1.3;
  }
</style>
