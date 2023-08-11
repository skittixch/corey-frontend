<script>
  export let imageData;
  export let currentImageData; // Added this line
  export let imageLoaded;
</script>

{#if imageData}
  <div class="image-container">
    <img src={imageData} alt="" class={imageLoaded ? "fade-in" : ""} />
  </div>
{/if}

{#if currentImageData}
  <div class="current-image-container">
    <img
      src={currentImageData}
      alt="output"
      class={imageLoaded ? "fade-in" : ""}
      on:error={() => (currentImageData = null)}
    />
  </div>
{/if}
