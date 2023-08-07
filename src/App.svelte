<script>
  import { onMount, afterUpdate } from "svelte";
  let prompt = "";
  let imageData = "";
  let currentImageData = ""; // ADDED: Variable to hold the current image data
  let imageLoaded = false;
  let dataSent = false;
  let progressData = null;

  async function fetchProgress() {
    const response = await fetch("https://ai.ericbacus.com/sdapi/v1/progress", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      mode: "cors",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    progressData = result;

    // ADDED: Update currentImageData with the current_image data
    currentImageData = `data:image/png;base64,${result.current_image}`;

    // If progress is not complete, fetch again
    if (result.progress < 100) {
      setTimeout(fetchProgress, 1000);
    }
  }

  async function sendData() {
    dataSent = true;
    let tempPrompt = prompt.replace(/corey/gi, "<lora:crzx_v09:1> ohwx man");

    // ADDED: Moved the fetch operation into a separate variable
    const responsePromise = fetch("https://ai.ericbacus.com/sdapi/v1/txt2img", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      mode: "cors",
      body: JSON.stringify({
        prompt: tempPrompt,
        steps: 64,
      }),
    });

    // ADDED: Start fetching progress immediately after sending the request
    fetchProgress();

    // ADDED: Await the response after starting the progress fetching
    const response = await responsePromise;

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log(result);
    imageData = `data:image/png;base64,${result.images[0]}`;
  }

  afterUpdate(() => {
    if (imageData) {
      const img = new Image();
      img.src = imageData;
      img.onload = () => {
        imageLoaded = true;
      };
    }
  });
</script>

<div class={dataSent ? "container sent" : "container"}>
  <input
    bind:value={prompt}
    placeholder="Corey..."
    on:click={() => {
      if (!prompt) prompt = "Corey ";
    }}
  />
  <button on:click={sendData} disabled={dataSent && !imageLoaded}>Send</button>
  <!-- Here is the corrected change -->
</div>
<p>alpha v0.02</p>
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

{#if progressData && !imageLoaded}
  <!-- Added !imageLoaded condition -->
  <div class="progress-container">
    <p>Progress: {progressData.progress * 100}%</p>
    <!-- Multiply progress by 100 -->
    <!-- Display more progress data as needed -->
  </div>
{/if}

<style>
  .container {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translateX(-50%);
    transition: top 0.5s ease-in-out;
  }

  .container.sent {
    top: calc(50% + (512px / 2 + 32px));
  }

  input {
    border-radius: 25px;
    width: 200px;
    height: 25px;
    text-align: center;
  }

  .image-container,
  .progress-container,
  .current-image-container {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .current-image-container img {
    width: 512px;
    height: 512px;
    object-fit: cover;
  }

  img {
    opacity: 0;
    animation: fadeIn 1s ease-in-out forwards;
  }

  @keyframes fadeIn {
    to {
      opacity: 1;
    }
  }
</style>
