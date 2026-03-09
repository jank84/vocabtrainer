<script>
  import ProgressRing from './ProgressRing.svelte';
  import { appState } from '../stores/appState.svelte.js';

  let { onSkipWord, onOpenStats, onOpenFilePicker } = $props();

  function getMasteryColor(pct) {
    if (pct <= 33) {
      const t = pct / 33;
      const r = Math.round(239 + (245 - 239) * t);
      const g = Math.round(68 + (158 - 68) * t);
      const b = Math.round(68 + (11 - 68) * t);
      return `rgb(${r},${g},${b})`;
    } else if (pct <= 66) {
      const t = (pct - 33) / 33;
      const r = Math.round(245 + (34 - 245) * t);
      const g = Math.round(158 + (197 - 158) * t);
      const b = Math.round(11 + (94 - 11) * t);
      return `rgb(${r},${g},${b})`;
    } else {
      return '#22c55e';
    }
  }

  const batchMastery = $derived(appState.calculateBatchMastery());
  const masteryColor = $derived(getMasteryColor(batchMastery));
  const batchLabel = $derived(appState.currentBatch.length + '/' + appState.vocabulary.length);
  const activeFileName = $derived(appState.getActiveFileName());
  const resultClass = $derived(
    appState.isShowingResult
      ? (appState.lastCheckResult?.isCorrect ? 'result-correct' : 'result-wrong')
      : ''
  );
</script>

<div class="prompt-bar {resultClass}">
  <button class="prompt-label" onclick={onOpenFilePicker} title={activeFileName}>
    {activeFileName}
  </button>
  <span class="prompt-word">
    {appState.currentVocab?.prompt ?? ''}
  </span>
  <span class="batch-indicator">{batchLabel}</span>
  <ProgressRing percentage={batchMastery} color={masteryColor} />
  {#if !appState.isShowingResult}
    <button class="btn-skip-word" onclick={onSkipWord} title="Skip this word">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>
    </button>
  {/if}
  <button class="btn-icon prompt-stats-btn" onclick={onOpenStats} title="Stats">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="12" width="4" height="9"></rect><rect x="10" y="7" width="4" height="14"></rect><rect x="17" y="3" width="4" height="18"></rect></svg>
  </button>
</div>

<style>
  .prompt-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--surface);
    border-radius: 12px;
    box-shadow: var(--shadow);
    padding: 8px 12px;
    flex-shrink: 0;
    transition: background 0.4s ease;
    min-height: 44px;
  }

  .prompt-bar.result-correct {
    background: var(--success-bg);
  }

  .prompt-bar.result-wrong {
    background: var(--danger-bg);
  }

  .prompt-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-muted);
    white-space: nowrap;
    flex-shrink: 0;
    cursor: pointer;
    padding: 4px 6px;
    border: none;
    background: none;
    font-family: inherit;
    border-radius: 6px;
    transition: background 0.15s, color 0.15s;
    position: relative;
  }

  .prompt-label:hover, .prompt-label:active {
    background: var(--bg);
    color: var(--text);
  }

  .prompt-word {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.3px;
    line-height: 1.1;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .batch-indicator {
    font-size: 10px;
    font-weight: 600;
    color: var(--text-muted);
    white-space: nowrap;
    flex-shrink: 0;
    letter-spacing: 0.3px;
  }

  .btn-skip-word {
    width: 36px;
    height: 36px;
    border: none;
    background: var(--surface);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-muted);
    font-size: 18px;
    transition: background 0.15s, color 0.15s;
    box-shadow: var(--shadow);
    flex-shrink: 0;
  }

  .btn-skip-word:hover, .btn-skip-word:active {
    background: #f59e0b;
    color: #fff;
  }

  .btn-icon {
    width: 36px;
    height: 36px;
    border: none;
    background: var(--surface);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-muted);
    font-size: 18px;
    transition: background 0.15s, color 0.15s;
    box-shadow: var(--shadow);
  }

  .btn-icon:hover, .btn-icon:active {
    background: var(--primary);
    color: #fff;
  }

  .prompt-stats-btn {
    flex-shrink: 0;
  }
</style>
