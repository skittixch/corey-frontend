<script>
  export let progressData;
  export let imageLoaded;
</script>

{#if progressData && imageLoaded}
  <div class="progress-container">
    <p>Progress: {progressData.progress * 100}%</p>
  </div>
{/if}
