// Preprocess the canvas image for better OCR recognition:
// 1. Binarize (pure black/white, remove anti-aliasing)
// 2. Dilate (thicken strokes so Tesseract sees them clearly)
// 3. Scale up to a minimum height (Tesseract needs ~50-70px tall chars)
export function preprocessForOCR(sourceCanvas) {
  const sw = sourceCanvas.width;
  const sh = sourceCanvas.height;
  const srcCtx = sourceCanvas.getContext('2d');
  const srcData = srcCtx.getImageData(0, 0, sw, sh);
  const src = srcData.data;

  // --- Step 1: Binarize ---
  const gray = new Uint8Array(sw * sh);
  for (let i = 0; i < sw * sh; i++) {
    const r = src[i * 4], g = src[i * 4 + 1], b = src[i * 4 + 2];
    gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  const threshold = 180;
  const binary = new Uint8Array(sw * sh);
  for (let i = 0; i < sw * sh; i++) {
    binary[i] = gray[i] < threshold ? 0 : 255;
  }

  // --- Step 2: Dilate (thicken strokes) ---
  const dilated = new Uint8Array(sw * sh);
  dilated.set(binary);
  for (let pass = 0; pass < 2; pass++) {
    const input = pass === 0 ? binary : dilated.slice();
    for (let y = 1; y < sh - 1; y++) {
      for (let x = 1; x < sw - 1; x++) {
        const idx = y * sw + x;
        if (input[idx] === 0) {
          dilated[idx] = 0;
          continue;
        }
        let isNearInk = false;
        for (let dy = -1; dy <= 1 && !isNearInk; dy++) {
          for (let dx = -1; dx <= 1 && !isNearInk; dx++) {
            if (input[(y + dy) * sw + (x + dx)] === 0) {
              isNearInk = true;
            }
          }
        }
        dilated[idx] = isNearInk ? 0 : 255;
      }
    }
  }

  // --- Step 3: Scale up to minimum height ---
  const minHeight = 140;
  const scale = sh < minHeight ? minHeight / sh : 1;
  const dw = Math.round(sw * scale);
  const dh = Math.round(sh * scale);

  const binCanvas = document.createElement('canvas');
  binCanvas.width = sw;
  binCanvas.height = sh;
  const binCtx = binCanvas.getContext('2d');
  const outData = binCtx.createImageData(sw, sh);
  for (let i = 0; i < sw * sh; i++) {
    const v = dilated[i];
    outData.data[i * 4] = v;
    outData.data[i * 4 + 1] = v;
    outData.data[i * 4 + 2] = v;
    outData.data[i * 4 + 3] = 255;
  }
  binCtx.putImageData(outData, 0, 0);

  if (scale > 1) {
    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = dw;
    scaledCanvas.height = dh;
    const scaledCtx = scaledCanvas.getContext('2d');
    scaledCtx.imageSmoothingEnabled = false;
    scaledCtx.drawImage(binCanvas, 0, 0, dw, dh);
    return scaledCanvas;
  }

  return binCanvas;
}

// Crop to just the drawn region of the canvas
export function getCroppedCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const imgData = ctx.getImageData(0, 0, w, h);
  ctx.restore();
  const data = imgData.data;

  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (data[i] < 160 || data[i + 1] < 160 || data[i + 2] < 160) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (minX >= maxX || minY >= maxY) return null;

  const dpr = window.devicePixelRatio || 1;
  const pad = Math.round(40 * dpr);
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = cropW;
  cropCanvas.height = cropH;
  const cropCtx = cropCanvas.getContext('2d');
  cropCtx.fillStyle = '#ffffff';
  cropCtx.fillRect(0, 0, cropW, cropH);
  cropCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

  return cropCanvas;
}
