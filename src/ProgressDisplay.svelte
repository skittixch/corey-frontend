<script>
  export let progressData;
  export let imageLoading;
</script>

{#if progressData && imageLoading}
  <div class="progress-container">
    <p>Progress: {progressData.progress * 100}%</p>
  </div>
{/if}
