<script>
  import { appState } from './lib/stores/appState.svelte.js';
  import { initOCR, recognizeText } from './lib/utils/ocr.js';
  import { normalizeText, levenshtein } from './lib/utils/text.js';

  import LoadingOverlay from './lib/components/LoadingOverlay.svelte';
  import PromptBar from './lib/components/PromptBar.svelte';
  import ResultInfo from './lib/components/ResultInfo.svelte';
  import DrawingCanvas from './lib/components/DrawingCanvas.svelte';
  import BottomActions from './lib/components/BottomActions.svelte';
  import RatingActions from './lib/components/RatingActions.svelte';
  import StatsModal from './lib/components/StatsModal.svelte';
  import FilePicker from './lib/components/FilePicker.svelte';

  let canvasComponent;
  let hasDrawn = $state(false);
  let ocrResultText = $state('');
  let isChecking = $state(false);

  // ---- Actions ----
  async function checkAnswer() {
    if (isChecking || appState.isShowingResult || !hasDrawn) return;
    isChecking = true;
    appState.isChecking = true;

    try {
      const canvasEl = canvasComponent.getCanvasElement();
      const recognized = await recognizeText(canvasEl);
      const expected = normalizeText(appState.currentVocab.answer);
      const dist = levenshtein(recognized, expected);
      const threshold = expected.length >= 7 ? 2 : expected.length >= 4 ? 1 : 0;
      const isCorrect = recognized.length > 0 && dist <= threshold;

      ocrResultText = recognized || '(nothing)';
      appState.setCheckResult(recognized, isCorrect);
    } catch (err) {
      console.error('OCR error:', err);
    }

    isChecking = false;
    appState.isChecking = false;
  }

  function handleShowAnswer() {
    if (appState.isShowingResult) return;
    ocrResultText = '(peeked)';
    appState.showAnswer();
  }

  function handleClear() {
    if (!appState.isShowingResult) {
      canvasComponent.clearCanvas();
      hasDrawn = false;
    }
  }

  function handleRate(rating) {
    appState.nextWord(rating);
    canvasComponent.clearCanvas();
    hasDrawn = false;
    ocrResultText = '';
  }

  function handleSkipWord() {
    if (isChecking) return;
    if (appState.currentVocab) {
      appState.skipWordInBatch(appState.currentVocab.id);
    }
    appState.showNextWord();
    canvasComponent.clearCanvas();
    hasDrawn = false;
    ocrResultText = '';
  }

  function handleOpenStats() {
    appState.statsModalOpen = true;
  }

  function handleCloseStats() {
    appState.statsModalOpen = false;
  }

  function handleOpenFilePicker() {
    appState.filePickerOpen = true;
  }

  function handleCloseFilePicker() {
    appState.filePickerOpen = false;
  }

  // ---- Init ----
  $effect(() => {
    (async () => {
      await appState.init();
      await initOCR((status, progress) => {
        appState.loadingStatus = status;
        appState.loadingProgress = progress;
      });
      setTimeout(() => {
        appState.isLoading = false;
      }, 400);
    })();
  });

  // ---- Service Worker Registration ----
  $effect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW registered, scope:', reg.scope))
        .catch(err => console.log('SW registration failed:', err));
    }
  });
</script>

<LoadingOverlay
  isLoading={appState.isLoading}
  status={appState.loadingStatus}
  progress={appState.loadingProgress}
/>

<main class="main">
  <PromptBar
    onSkipWord={handleSkipWord}
    onOpenStats={handleOpenStats}
    onOpenFilePicker={handleOpenFilePicker}
  />

  <ResultInfo
    visible={appState.isShowingResult}
    ocrText={ocrResultText}
    correctAnswerText={appState.currentVocab?.answerDisplay ?? ''}
    isCorrect={appState.lastCheckResult?.isCorrect ?? false}
  />

  <div class="drawing-area">
    <DrawingCanvas
      bind:this={canvasComponent}
      bind:hasDrawn
      isShowingResult={appState.isShowingResult}
    />
    <div class="check-btn-wrapper">
      <button class="btn-check" onclick={checkAnswer} disabled={isChecking}>
        {#if isChecking}
          <div class="spinner"></div>
        {:else}
          CHECK
        {/if}
      </button>
    </div>
  </div>

  <BottomActions
    isShowingResult={appState.isShowingResult}
    onShowAnswer={handleShowAnswer}
    onClear={handleClear}
    onCheck={checkAnswer}
    {isChecking}
  />

  <RatingActions
    isShowingResult={appState.isShowingResult}
    onRate={handleRate}
  />
</main>

<StatsModal
  open={appState.statsModalOpen}
  onClose={handleCloseStats}
/>

<FilePicker
  open={appState.filePickerOpen}
  onClose={handleCloseFilePicker}
/>

<style>
  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 8px;
    gap: 6px;
  }

  .drawing-area {
    flex: 1;
    display: flex;
    gap: 6px;
    min-height: 0;
  }

  .check-btn-wrapper {
    flex-shrink: 0;
    display: flex;
    align-items: stretch;
  }

  .btn-check {
    width: 56px;
    border: none;
    border-radius: 12px;
    background: var(--primary);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow);
    transition: background 0.15s, transform 0.1s;
    letter-spacing: 0.5px;
    writing-mode: vertical-rl;
    text-orientation: mixed;
  }

  .btn-check:hover {
    background: var(--primary-hover);
  }

  .btn-check:active {
    transform: scale(0.97);
  }

  .btn-check:disabled {
    background: var(--border);
    cursor: not-allowed;
  }

  .spinner {
    width: 22px;
    height: 22px;
    border: 3px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
</style>
