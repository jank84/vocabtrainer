<script>
  import { appState } from '../stores/appState.svelte.js';

  let { open = false, onClose } = $props();

  let vocabFileInput;

  const files = $derived(appState.getFileRegistry());

  async function handleFileClick(slug) {
    if (slug === appState.activeFileSlug) {
      onClose();
      return;
    }
    onClose();
    await appState.switchVocabFile(slug);
  }

  async function handleDelete(e, slug) {
    e.stopPropagation();
    const file = files.find(f => f.slug === slug);
    if (!confirm(`Delete "${file ? file.name : slug}" and its statistics?`)) return;
    await appState.deleteFile(slug);
  }

  function handleImportClick() {
    vocabFileInput?.click();
  }

  async function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const success = await appState.importVocabFile(file);
      if (success) onClose();
    } catch (err) {
      console.error('Failed to import vocab file:', err);
      alert('Failed to import file: ' + err.message);
    }
    vocabFileInput.value = '';
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="file-picker-overlay" class:open onclick={handleOverlayClick} role="presentation">
  <div class="file-picker-dropdown">
    <h3>Vocabulary Files</h3>
    <div class="file-picker-list">
      {#each files as f (f.slug)}
        <div
          class="file-picker-item"
          class:active={f.slug === appState.activeFileSlug}
          onclick={() => handleFileClick(f.slug)}
          onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFileClick(f.slug); } }}
          role="button"
          tabindex="0"
        >
          <span class="fp-name">{f.name}</span>
          {#if files.length > 1}
            <button class="fp-delete" onclick={(e) => handleDelete(e, f.slug)} title="Delete this file">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M5 6l1 14h12l1-14"/></svg>
            </button>
          {/if}
        </div>
      {/each}
    </div>
    <div class="file-picker-import" onclick={handleImportClick} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleImportClick(); } }} role="button" tabindex="0">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Import .txt file
    </div>
    <input type="file" bind:this={vocabFileInput} accept=".txt" style="display:none;" onchange={handleFileImport} />
  </div>
</div>

<style>
  .file-picker-overlay {
    position: fixed;
    inset: 0;
    z-index: 90;
    background: rgba(0,0,0,0.3);
    backdrop-filter: blur(2px);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;
  }

  .file-picker-overlay.open {
    opacity: 1;
    pointer-events: auto;
  }

  .file-picker-dropdown {
    position: fixed;
    top: 60px;
    left: 8px;
    right: 8px;
    max-width: 400px;
    background: var(--surface);
    border-radius: 14px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.15);
    z-index: 91;
    padding: 8px;
    transform: translateY(-10px);
    opacity: 0;
    pointer-events: none;
    transition: transform 0.2s ease, opacity 0.2s ease;
    max-height: 70vh;
    overflow-y: auto;
  }

  .file-picker-overlay.open .file-picker-dropdown {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }

  .file-picker-dropdown h3 {
    font-size: 13px;
    font-weight: 700;
    padding: 6px 10px 4px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .file-picker-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: var(--text);
    transition: background 0.15s;
    gap: 8px;
  }

  .file-picker-item:hover { background: var(--bg); }
  .file-picker-item.active { background: var(--primary); color: #fff; }

  .fp-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .fp-delete {
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    flex-shrink: 0;
    transition: background 0.15s, color 0.15s;
  }

  .fp-delete:hover { background: var(--danger-bg); color: var(--danger); }
  .file-picker-item.active .fp-delete { color: rgba(255,255,255,0.6); }
  .file-picker-item.active .fp-delete:hover { background: rgba(255,255,255,0.2); color: #fff; }

  .file-picker-import {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 12px;
    margin-top: 4px;
    border: 2px dashed var(--border);
    border-radius: 10px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-muted);
    transition: border-color 0.15s, color 0.15s, background 0.15s;
  }

  .file-picker-import:hover {
    border-color: var(--primary);
    color: var(--primary);
    background: rgba(108, 127, 248, 0.05);
  }
</style>
