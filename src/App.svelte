<script>
  import { onMount, afterUpdate } from "svelte";
  let prompt = "";
  let imageData = "";
  let currentImageData = ""; // ADDED: Variable to hold the current image data
  let imageLoaded = false;
  let dataSent = false;
  let progressData = null;
  let inputRef;

  // "about" modal
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

  //next lines added in an attempt to get roop args set up

  async function loadImageAsBase64(imagePath) {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.readAsDataURL(blob);
    });
  }
  async function prepareSendData() {
    let imagePath = "./roop.png";
    let img_base64 = await loadImageAsBase64(imagePath);
    let args = [
      img_base64,
      true,
      "0",
      "/usr/src/app/models/roop/inswapper_128.onnx",
      "CodeFormer",
      1,
      "None",
      1,
      "None",
      false,
      true,
    ];
    sendData(args); // Call sendData with the prepared args

    if (inputRef) {
      inputRef.blur();
    }
  }

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

  async function sendData(args) {
    console.log("sendData called, initial imageLoaded:", imageLoaded);
    imageLoaded = false;
    dataSent = true;
    let tempPrompt = prompt.replace(
      /corey/gi,
      "an award winning portrait of <lora:crzx_v09:1> (ohwx:1.4) man, trending on artstation"
    );
    tempPrompt +=
      " (happy and excited:.2), epic composition, renaissance composition, rule of thirds, clarity, award winning, <lora:actionshot:.75>";

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
        alwayson_scripts: { roop: { args: args } },
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

<div class="header">
  <div class="info">alpha v0.0.5 ###GIT_HASH###</div>
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

<!--this section is where the image will load-->
<form on:submit|preventDefault={prepareSendData}>
  <div class={dataSent ? "container sent" : "container"}>
    <div class="input-container">
      <input
        bind:this={inputRef}
        bind:value={prompt}
        placeholder="Corey..."
        on:click={() => {
          if (!prompt) prompt = "Corey ";
        }}
      />
      <button
        class="send-button"
        type="submit"
        disabled={dataSent && !imageLoaded}
        ><img src="./send.svg" alt="Send" class="arrow-icon" /></button
      >
    </div>
    <!-- Here is the corrected change -->
  </div>
</form>

{#if imageData}
  <div class="image-container">
    <img src={imageData} alt="" class={imageLoaded ? "fade-in" : ""} />
  </div>
{/if}

<!--version-->

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
