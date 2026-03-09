<script>
  let { isShowingResult = false, onShowAnswer, onClear, onCheck, isChecking = false } = $props();
</script>

{#if !isShowingResult}
  <div class="bottom-actions">
    <button class="btn btn-secondary" onclick={onShowAnswer}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
      Show
    </button>
    <button class="btn btn-secondary" onclick={onClear}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M5 6l1 14h12l1-14"></path></svg>
      Clear
    </button>
  </div>
{/if}

<style>
  .bottom-actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }

  .btn {
    flex: 1;
    height: 46px;
    border: none;
    border-radius: 12px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: background 0.15s, transform 0.1s;
  }

  .btn:active {
    transform: scale(0.97);
  }

  .btn-secondary {
    background: var(--surface);
    color: var(--text);
    box-shadow: var(--shadow);
  }

  .btn-secondary:hover {
    background: #f0f0f5;
  }
</style>
