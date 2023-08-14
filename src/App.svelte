<script>
  import { onMount, afterUpdate } from "svelte";
  import Header from "./Header.svelte";
  import InputField from "./InputField.svelte";
  import ImageDisplay from "./ImageDisplay.svelte";
  import ProgressDisplay from "./ProgressDisplay.svelte";

  let prompt = "";
  let imageData = "";
  let currentImageData = "";
  let imageLoaded = false;
  let dataSent = false;
  let progressData = null;

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
      "<lora:Corey-v02-ohwx:1> (ohwx:1.4) man"
    );
    tempPrompt +=
      " (excited:.1), epic composition, renaissance composition, rule of thirds, clarity, award winning, soft blonde curly hair and beard <lora:actionshot:1>, RAW photo, (high detailed skin:1.2), 8k uhd, dslr, soft lighting, high quality, film grain, Fujifilm XT3, graphic tee";

    // ADDED: Moved the fetch operation into a separate variable
    const responsePromise = fetch("https://ai.ericbacus.com/sdapi/v1/txt2img", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      mode: "cors",
      body: JSON.stringify({
        enable_hr: true,
        denoising_strength: 0.36,
        hr_scale: 1.5,
        hr_upscaler: "R-ESRGAN 4x+",
        cfg_scale: 6,
        prompt: tempPrompt,
        negative_prompt:
          "(deformed iris, deformed pupils, semi-realistic, cgi, 3d, render, sketch, cartoon, drawing, anime:1.4), text, close up, cropped, out of frame, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck, stylish",
        steps: 20,
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

<Header />
<form on:submit|preventDefault={prepareSendData}>
  <div class={dataSent ? "container sent" : "container"}>
    <InputField bind:prompt {dataSent} {imageLoaded} />
  </div>
</form>
<ImageDisplay {imageData} {currentImageData} {imageLoaded} />
<ProgressDisplay {progressData} {imageLoaded} />
