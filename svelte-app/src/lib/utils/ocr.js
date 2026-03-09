import { createWorker, PSM } from 'tesseract.js';
import { normalizeText } from './text.js';
import { preprocessForOCR, getCroppedCanvas } from './imageProcessing.js';

let worker = null;

/**
 * Initialize the Tesseract OCR worker.
 * @param {(status: string, progress: number) => void} onProgress - Progress callback
 */
export async function initOCR(onProgress) {
  if (onProgress) onProgress('Loading OCR engine...', 0.2);

  worker = await createWorker('pol+eng', 1, {
    logger: (m) => {
      if (!onProgress) return;
      if (m.status === 'recognizing text') {
        onProgress('Recognizing...', 0.2 + m.progress * 0.6);
      } else if (m.status === 'loading language traineddata') {
        onProgress('Loading language data...', 0.1 + m.progress * 0.1);
      }
    }
  });

  await worker.setParameters({
    tessedit_pageseg_mode: PSM.SINGLE_LINE,
  });

  if (onProgress) onProgress('Ready!', 1.0);
}

/**
 * Recognize text from a canvas element.
 * @param {HTMLCanvasElement} canvas - The drawing canvas
 * @returns {Promise<string>} Normalized recognized text
 */
export async function recognizeText(canvas) {
  if (!worker) return '';
  const cropped = getCroppedCanvas(canvas);
  if (!cropped) return '';
  const processed = preprocessForOCR(cropped);
  const dataUrl = processed.toDataURL('image/png');
  const result = await worker.recognize(dataUrl);
  return normalizeText(result.data.text);
}
