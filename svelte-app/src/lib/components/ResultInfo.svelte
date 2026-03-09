<script>
  let { ocrText = '', correctAnswerText = '', isCorrect = false, visible = false } = $props();
</script>

<div class="result-info" class:visible>
  {#if visible}
    <span>
      <span class="label">You: </span>
      <span class="ocr-text" class:wrong-answer={!isCorrect}>{ocrText}</span>
    </span>
    <span>
      <span class="label">Answer: </span>
      <span class="correct-answer">{correctAnswerText}</span>
    </span>
  {/if}
</div>

<style>
  .result-info {
    display: none;
    background: var(--surface);
    border-radius: 10px;
    padding: 6px 12px;
    flex-shrink: 0;
    font-size: 13px;
    box-shadow: var(--shadow);
  }

  .result-info.visible {
    display: flex;
    gap: 16px;
    align-items: center;
    flex-wrap: wrap;
  }

  .label {
    color: var(--text-muted);
    font-weight: 400;
  }

  .ocr-text {
    font-weight: 600;
  }

  .correct-answer {
    font-weight: 600;
    color: var(--success);
  }

  .wrong-answer {
    color: var(--danger);
  }
</style>
