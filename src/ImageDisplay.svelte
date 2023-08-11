<script>
  export let imageData;
  export let imageLoaded;
</script>

{#if imageData}
  <div class="image-container">
    <img src={imageData} alt="" class={imageLoaded ? "fade-in" : ""} />
  </div>
{/if}
