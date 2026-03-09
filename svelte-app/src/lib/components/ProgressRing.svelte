<script>
  let { size = 36, radius = 15, strokeWidth = 3, percentage = 0, color = '#22c55e' } = $props();

  const circumference = $derived(2 * Math.PI * radius);
  const offset = $derived(circumference - (percentage / 100) * circumference);
</script>

<div class="progress-ring-container" style="width:{size}px; height:{size}px;" title="Batch mastery">
  <svg viewBox="0 0 {size} {size}" style="width:{size}px; height:{size}px;">
    <circle class="progress-ring-bg" cx={size/2} cy={size/2} r={radius}
      stroke-width={strokeWidth} />
    <circle class="progress-ring-fill" cx={size/2} cy={size/2} r={radius}
      stroke-dasharray={circumference} stroke-dashoffset={offset} stroke={color}
      stroke-width={strokeWidth} />
  </svg>
  <div class="progress-ring-text" style="font-size:{size <= 40 ? 9 : 20}px;">
    {percentage}%
  </div>
</div>

<style>
  .progress-ring-container {
    position: relative;
    flex-shrink: 0;
  }

  .progress-ring-container svg {
    transform: rotate(-90deg);
  }

  .progress-ring-bg {
    fill: none;
    stroke: var(--border);
  }

  .progress-ring-fill {
    fill: none;
    stroke-linecap: round;
    transition: stroke-dashoffset 0.6s ease, stroke 0.4s ease;
  }

  .progress-ring-text {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: var(--text);
    pointer-events: none;
  }
</style>
