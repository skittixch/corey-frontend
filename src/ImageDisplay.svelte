<script>
  export let imageData;
  export let currentImageData; // Added this line
  export let imageLoading;
</script>

{#if imageData}
  <div class="image-container">
    <img src={imageData} alt="" class={imageLoading ? "fade-in" : ""} />
  </div>
{/if}

{#if currentImageData}
  <div class="current-image-container">
    <img
      src={currentImageData}
      alt="output"
      class={imageLoading ? "fade-in" : ""}
      on:error={() => (currentImageData = null)}
    />
  </div>
{/if}
