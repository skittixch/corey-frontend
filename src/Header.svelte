<script>
  import { onMount } from "svelte";
  let modal;

  function openModal() {
    modal.style.display = "block";
  }

  function closeModal() {
    modal.style.display = "none";
  }

  onMount(() => {
    window.onclick = (event) => {
      if (event.target === modal) {
        closeModal();
      }
    };
  });
</script>

<div class="header">
  <div class="info">crai-0.0.x</div>
  <a href="javascript:void(0);" class="header-link" on:click={openModal}
    >What is this?</a
  >
</div>

<div class="modal" bind:this={modal}>
  <div class="modal-content">
    <span class="close" on:click={closeModal}>&times;</span>
    <p>
      My best friend Corey passed away on April 15th, 2023. He left me a whole
      bunch of computer shit, and this is what I'm doing with it to keep his
      memory alive. Miss you bro.
    </p>
  </div>
</div>
