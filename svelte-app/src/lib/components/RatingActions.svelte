<script>
  let { isShowingResult = false, onRate } = $props();
</script>

{#if isShowingResult}
  <div class="bottom-actions rating-actions">
    <button class="btn btn-rating btn-again" onclick={() => onRate('again')}>
      <span class="rating-label">Again</span>
      <span class="rating-time">&lt;1min</span>
    </button>
    <button class="btn btn-rating btn-hard" onclick={() => onRate('hard')}>
      <span class="rating-label">Hard</span>
      <span class="rating-time">&lt;6min</span>
    </button>
    <button class="btn btn-rating btn-good" onclick={() => onRate('good')}>
      <span class="rating-label">Good</span>
      <span class="rating-time">&lt;10min</span>
    </button>
    <button class="btn btn-rating btn-easy" onclick={() => onRate('easy')}>
      <span class="rating-label">Easy</span>
      <span class="rating-time">3 days</span>
    </button>
  </div>
{/if}

<style>
  .bottom-actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }

  .rating-actions {
    gap: 4px;
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

  .btn-rating {
    flex-direction: column;
    gap: 1px;
    height: 46px;
    padding: 4px 2px;
    font-size: 12px;
    box-shadow: var(--shadow);
  }

  .rating-label {
    font-weight: 700;
    font-size: 13px;
    line-height: 1;
  }

  .rating-time {
    font-weight: 500;
    font-size: 10px;
    line-height: 1;
    opacity: 0.85;
  }

  .btn-again { background: #ef4444; color: #fff; }
  .btn-again:hover { background: #dc2626; }
  .btn-hard { background: #f59e0b; color: #fff; }
  .btn-hard:hover { background: #d97706; }
  .btn-good { background: #22c55e; color: #fff; }
  .btn-good:hover { background: #16a34a; }
  .btn-easy { background: #3b82f6; color: #fff; }
  .btn-easy:hover { background: #2563eb; }
</style>
