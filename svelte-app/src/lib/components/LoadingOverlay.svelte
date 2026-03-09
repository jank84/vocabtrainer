<script>
  let { isLoading = false, status = 'Ready!', progress = 1.0 } = $props();
</script>

{#if isLoading}
  <div class="loading-overlay" class:hidden={!isLoading}>
    <h2>Anki Scribe</h2>
    <p>{status}</p>
    <div class="loading-bar">
      <div class="loading-bar-inner" style="width: {progress * 100}%"></div>
    </div>
  </div>
{/if}

<style>
  .loading-overlay {
    position: fixed;
    inset: 0;
    background: var(--bg);
    z-index: 200;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    transition: opacity 0.4s;
  }

  .loading-overlay.hidden {
    opacity: 0;
    pointer-events: none;
  }

  .loading-overlay h2 {
    font-size: 22px;
    font-weight: 700;
    color: var(--primary);
  }

  .loading-overlay p {
    color: var(--text-muted);
    font-size: 14px;
  }

  .loading-bar {
    width: 200px;
    height: 4px;
    background: var(--border);
    border-radius: 2px;
    overflow: hidden;
  }

  .loading-bar-inner {
    height: 100%;
    width: 0%;
    background: var(--primary);
    border-radius: 2px;
    transition: width 0.3s;
  }
</style>
