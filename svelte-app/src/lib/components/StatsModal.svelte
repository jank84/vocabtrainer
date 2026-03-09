<script>
  import { appState, MASTERY_SCORES } from '../stores/appState.svelte.js';
  import ProgressRing from './ProgressRing.svelte';

  let { open = false, onClose } = $props();

  let batchListOpen = $state(false);
  let importStatus = $state({ message: '', type: '' });
  let importFileInput;

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

  const stats = $derived(appState.loadStats());
  const batchSize = $derived(appState.getBatchSize());
  const batch = $derived(appState.currentBatch);
  const vocabulary = $derived(appState.vocabulary);
  const overallProgress = $derived(appState.calculateOverallProgress());

  const batchStats = $derived.by(() => {
    let totalAttempts = 0, totalAgain = 0, totalHard = 0, totalGood = 0, totalEasy = 0;
    for (const v of batch) {
      const s = stats[v.id];
      if (s) {
        totalAttempts += s.attempts;
        totalAgain += s.again || 0;
        totalHard += s.hard || 0;
        totalGood += s.good || 0;
        totalEasy += s.easy || 0;
      }
    }
    return { totalAttempts, totalAgain, totalHard, totalGood, totalEasy };
  });

  const progressColor = $derived(getMasteryColor(overallProgress.totalMastery));
  const masteredPct = $derived(overallProgress.total > 0 ? (overallProgress.mastered / overallProgress.total * 100) : 0);
  const learningPct = $derived(overallProgress.total > 0 ? (overallProgress.learning / overallProgress.total * 100) : 0);

  function handleBatchSizeChange(e) {
    const newSize = appState.setBatchSize(parseInt(e.target.value) || 20);
    e.target.value = newSize;
  }

  function handleSkipBatch() {
    appState.skipCurrentBatch();
    onClose();
  }

  function handleClearStats() {
    if (confirm('Are you sure you want to reset all statistics?')) {
      appState.clearStats();
    }
  }

  function handleExport() {
    appState.exportStats();
  }

  function handleImportClick() {
    importFileInput?.click();
  }

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const doReplace = confirm(
      'Import mode:\n\nOK = Replace all stats with backup\nCancel = Merge (keep best stats per word)'
    );
    const mode = doReplace ? 'replace' : 'merge';
    try {
      const wordCount = await appState.importStats(file, mode);
      importStatus = { message: `Imported ${wordCount} word stats (${mode} mode).`, type: 'success' };
      setTimeout(() => { importStatus = { message: '', type: '' }; }, 3000);
    } catch (err) {
      importStatus = { message: typeof err === 'string' ? err : 'Import failed.', type: 'error' };
    }
    importFileInput.value = '';
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="modal-overlay" class:open onclick={handleOverlayClick} role="presentation">
  <div class="modal">
    <div class="modal-header">
      <h2>Statistics</h2>
      <button class="btn-icon" onclick={onClose} aria-label="Close">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
    <div class="modal-body">
      <!-- Overall Progress -->
      <div class="progress-overview">
        <h3>Overall Progress</h3>
        <div class="progress-hero">
          <ProgressRing size={80} radius={34} strokeWidth={5} percentage={overallProgress.totalMastery} color={progressColor} />
          <div class="progress-categories">
            <div class="progress-cat">
              <span class="dot mastered"></span>
              <span class="cat-label">Mastered</span>
              <span class="cat-count">{overallProgress.mastered}</span>
            </div>
            <div class="progress-cat">
              <span class="dot learning"></span>
              <span class="cat-label">Learning</span>
              <span class="cat-count">{overallProgress.learning}</span>
            </div>
            <div class="progress-cat">
              <span class="dot unseen"></span>
              <span class="cat-label">Unseen</span>
              <span class="cat-count">{overallProgress.unseen}</span>
            </div>
          </div>
        </div>
        <div class="progress-segmented-bar">
          <div class="seg mastered" style="width:{masteredPct}%"></div>
          <div class="seg learning" style="width:{learningPct}%"></div>
        </div>
      </div>

      <!-- Batch Settings -->
      <div class="settings-section">
        <h3>Batch Settings</h3>
        <div class="setting-row">
          <label for="batchSizeInput">Words per batch</label>
          <input type="number" id="batchSizeInput" min="1" max={vocabulary.length} value={batchSize} onchange={handleBatchSizeChange} />
        </div>
        <button class="btn-skip-batch" onclick={handleSkipBatch}>Skip Batch (get new words)</button>
        <div class="batch-toggle" class:open={batchListOpen} onclick={() => batchListOpen = !batchListOpen} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); batchListOpen = !batchListOpen; } }} role="button" tabindex="0">
          <span>View Current Batch ({batch.length} words)</span>
          <svg class="toggle-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        {#if batchListOpen}
          <div class="batch-word-list open">
            {#each batch as v (v.id)}
              <div class="batch-word-item">
                <div>
                  <span class="bw-prompt">{v.prompt}</span>
                  <span class="bw-answer"> — {v.answerDisplay}</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Batch Statistics -->
      <h3 class="section-title">Batch Statistics</h3>
      <div class="stats-summary">
        <div class="stat-box">
          <div class="number">{batchStats.totalAttempts}</div>
          <div class="label">Total</div>
        </div>
        <div class="stat-box">
          <div class="number" style="color:#ef4444;">{batchStats.totalAgain}</div>
          <div class="label">Again</div>
        </div>
        <div class="stat-box">
          <div class="number" style="color:#f59e0b;">{batchStats.totalHard}</div>
          <div class="label">Hard</div>
        </div>
        <div class="stat-box">
          <div class="number" style="color:#22c55e;">{batchStats.totalGood}</div>
          <div class="label">Good</div>
        </div>
        <div class="stat-box">
          <div class="number" style="color:#3b82f6;">{batchStats.totalEasy}</div>
          <div class="label">Easy</div>
        </div>
      </div>

      <!-- Per-word stats -->
      <div class="vocab-stats-list">
        {#each batch as v (v.id)}
          {@const s = stats[v.id]}
          {@const attempts = s ? s.attempts : 0}
          {@const again = s ? (s.again || 0) : 0}
          {@const hard = s ? (s.hard || 0) : 0}
          {@const good = s ? (s.good || 0) : 0}
          {@const easy = s ? (s.easy || 0) : 0}
          <div class="vocab-stat-item">
            <div>
              <div class="word">{v.prompt}</div>
              <div class="translation">{v.answerDisplay}</div>
            </div>
            <div class="ratio">
              <span style="color:#ef4444;">{again}</span> /
              <span style="color:#f59e0b;">{hard}</span> /
              <span style="color:#22c55e;">{good}</span> /
              <span style="color:#3b82f6;">{easy}</span>
              <span class="ratio-total">({attempts})</span>
            </div>
          </div>
        {/each}
      </div>

      <!-- Data Management -->
      <div class="data-section">
        <h3>Data Management</h3>
        <div class="data-btn-row">
          <button class="btn-export" onclick={handleExport}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export Backup
          </button>
          <button class="btn-import" onclick={handleImportClick}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Import Backup
          </button>
        </div>
        <input type="file" bind:this={importFileInput} accept=".json" style="display:none;" onchange={handleImport} />
        {#if importStatus.message}
          <div class="import-status" class:success={importStatus.type === 'success'} class:error={importStatus.type === 'error'}>
            {importStatus.message}
          </div>
        {/if}
      </div>

      <button class="btn-clear-stats" onclick={handleClearStats}>Reset All Statistics</button>
    </div>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    backdrop-filter: blur(4px);
    z-index: 100;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s;
  }

  .modal-overlay.open {
    opacity: 1;
    pointer-events: auto;
  }

  .modal {
    background: var(--surface);
    border-radius: 20px 20px 0 0;
    width: 100%;
    max-width: 500px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    transform: translateY(100%);
    transition: transform 0.3s ease;
  }

  .modal-overlay.open .modal {
    transform: translateY(0);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px 10px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .modal-header h2 {
    font-size: 18px;
    font-weight: 700;
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

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px 24px;
    -webkit-overflow-scrolling: touch;
  }

  /* Progress Overview */
  .progress-overview {
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border);
  }

  .progress-overview h3, .section-title {
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 10px;
  }

  .progress-hero {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 14px;
  }

  .progress-categories {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }

  .progress-cat {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .dot.mastered { background: #22c55e; }
  .dot.learning { background: #f59e0b; }
  .dot.unseen { background: var(--border); }

  .cat-label { flex: 1; font-weight: 500; }
  .cat-count { font-weight: 700; min-width: 28px; text-align: right; }

  .progress-segmented-bar {
    display: flex;
    height: 10px;
    border-radius: 5px;
    overflow: hidden;
    background: var(--border);
  }

  .seg { height: 100%; transition: width 0.6s ease; }
  .seg.mastered { background: #22c55e; }
  .seg.learning { background: #f59e0b; }

  /* Settings */
  .settings-section {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border);
  }

  .settings-section h3 {
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 10px;
  }

  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
  }

  .setting-row label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
  }

  .setting-row input[type="number"] {
    width: 70px;
    height: 36px;
    border: 1.5px solid var(--border);
    border-radius: 8px;
    text-align: center;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    background: var(--bg);
    outline: none;
    transition: border-color 0.15s;
  }

  .setting-row input[type="number"]:focus {
    border-color: var(--primary);
  }

  .btn-skip-batch {
    width: 100%;
    height: 44px;
    border: 2px solid #f59e0b;
    border-radius: 10px;
    background: transparent;
    color: #f59e0b;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
    margin-bottom: 4px;
  }

  .btn-skip-batch:hover { background: #fef3c7; }

  .batch-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    background: var(--bg);
    border-radius: 10px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    margin-top: 8px;
    transition: background 0.15s;
    user-select: none;
  }

  .batch-toggle:hover { background: var(--border); }

  .toggle-icon {
    transition: transform 0.2s;
    color: var(--text-muted);
  }

  .batch-toggle.open .toggle-icon {
    transform: rotate(180deg);
  }

  .batch-word-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 6px;
  }

  .batch-word-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 7px 12px;
    background: var(--bg);
    border-radius: 8px;
    font-size: 13px;
  }

  .bw-prompt { font-weight: 600; }
  .bw-answer { color: var(--text-muted); font-size: 12px; }

  /* Stats */
  .stats-summary {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
    gap: 8px;
    margin-bottom: 16px;
  }

  .stat-box {
    background: var(--bg);
    border-radius: 10px;
    padding: 10px;
    text-align: center;
  }

  .stat-box .number {
    font-size: 24px;
    font-weight: 700;
    line-height: 1;
  }

  .stat-box .label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-muted);
    margin-top: 3px;
  }

  .vocab-stats-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .vocab-stat-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    background: var(--bg);
    border-radius: 8px;
    font-size: 13px;
  }

  .word { font-weight: 600; }
  .translation { color: var(--text-muted); font-size: 12px; }

  .ratio {
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: 600;
    font-size: 12px;
  }

  .ratio-total {
    color: var(--text-muted);
    font-weight: 400;
  }

  /* Data Management */
  .data-section {
    margin-top: 12px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
  }

  .data-section h3 {
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 10px;
  }

  .data-btn-row {
    display: flex;
    gap: 8px;
  }

  .btn-export, .btn-import {
    flex: 1;
    height: 44px;
    border: 2px solid var(--primary);
    border-radius: 10px;
    background: transparent;
    color: var(--primary);
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .btn-export:hover { background: var(--primary); color: #fff; }

  .btn-import {
    border-color: #8b5cf6;
    color: #8b5cf6;
  }

  .btn-import:hover { background: #8b5cf6; color: #fff; }

  .import-status {
    margin-top: 8px;
    font-size: 12px;
    font-weight: 500;
    padding: 8px 12px;
    border-radius: 8px;
  }

  .import-status.success {
    background: var(--success-bg);
    color: #16a34a;
  }

  .import-status.error {
    background: var(--danger-bg);
    color: var(--danger);
  }

  .btn-clear-stats {
    margin-top: 12px;
    width: 100%;
    height: 44px;
    border: 2px solid var(--danger);
    border-radius: 10px;
    background: transparent;
    color: var(--danger);
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  }

  .btn-clear-stats:hover { background: var(--danger-bg); }
</style>
