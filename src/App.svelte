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
      imageLoaded = true;
      setTimeout(fetchProgress, 1000);
    }
  }

  async function sendData() {
    console.log("sendData called, initial imageLoaded:", imageLoaded);
    imageLoaded = false;
    dataSent = true;
    let tempPrompt = prompt.replace(
      /corey/gi,
      "<lora:crzx_v09:1> (ohwx:1.4) man"
    );
    tempPrompt +=
      " (excited:.1), epic composition, renaissance composition, rule of thirds, clarity, award winning, blonde curly hair and beard <lora:actionshot:1>";

    // ADDED: Moved the fetch operation into a separate variable
    const responsePromise = fetch("https://ai.ericbacus.com/sdapi/v1/txt2img", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      mode: "cors",
      body: JSON.stringify({
        cfg_scale: 7,
        prompt: tempPrompt,
        negative_prompt:
          "nsfw CyberRealistic_Negative-neg realisticvision-negative-embedding, nsfw, canvas frame, cartoon, 3d, ((disfigured)), ((bad art)), ((deformed)),((extra limbs)),((close up)),((b&w)), wierd colors, blurry, (((duplicate))), ((morbid)), ((mutilated)), [out of frame], extra fingers, mutated hands, ((poorly drawn hands)), ((poorly drawn face)), (((mutation))), (((deformed))), ((ugly)), blurry, ((bad anatomy)), (((bad proportions))), ((extra limbs)), cloned face, (((disfigured))), out of frame, ugly, extra limbs, (bad anatomy), gross proportions, (malformed limbs), ((missing arms)), ((missing legs)), (((extra arms))), (((extra legs))), mutated hands, (fused fingers), (too many fingers), (((long neck))), Photoshop, video game, ugly, tiling, poorly drawn hands, poorly drawn feet, poorly drawn face, out of frame, mutation, mutated, extra limbs, extra legs, extra arms, disfigured, deformed, cross-eye, body out of frame, blurry, bad art, bad anatomy, 3d render, (skinny:1.3), muscular, eyeliner, defined curls, mullet, quaffed, stylish, sharp pointy teeth, bow in hair, vampire, fade, flat top, cheek crease, dimples, (closeup:1.5), portrait, old, handsome",
        steps: 50,
        sampler_name: "DPM++ 2M SDE Karras",
        restore_faces: true,
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
    imageLoaded = true;
    console.log("Data Sent, imageLoaded:", imageLoaded);
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

<head>
  <link rel="stylesheet" href="./AppStyle.css" />
</head>

<!--this section is where the image will load-->
<div class={dataSent ? "container sent" : "container"}>
  <div class="input-container">
    <input
      bind:value={prompt}
      placeholder="Corey..."
      on:click={() => {
        if (!prompt) prompt = "Corey ";
      }}
    />
    <button
      class="send-button"
      on:click={sendData}
      disabled={dataSent && !imageLoaded}
      ><img src="/send.svg" alt="Send" class="arrow-icon" /></button
    >
  </div>
  <!-- Here is the corrected change -->
</div>
{#if imageData}
  <div class="image-container">
    <img src={imageData} alt="" class={imageLoaded ? "fade-in" : ""} />
  </div>
{/if}

<!--version-->
<p>alpha v0.0.3</p>

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
