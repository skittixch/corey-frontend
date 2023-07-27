<script>
  import { onMount, afterUpdate } from "svelte";
  let prompt = "";
  let imageData = "";
  let imageLoaded = false;
  let dataSent = false;

  async function sendData() {
    dataSent = true;
    let tempPrompt = prompt.replace(/corey/gi, "<lora:crzx_v09:1> ohwx man");

    /* 
		let args = [img_base64, true, '0', '/usr/src/app/models/roop/inswapper_128.onnx', 'CodeFormer', 1, null, 1, 'None', false, true];
		#let alwayson_scripts = { "roop": { "args": args } };
		*/

    const response = await fetch("https://ai.ericbacus.com/sdapi/v1/txt2img", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      mode: "cors",
      body: JSON.stringify({
        prompt: tempPrompt,
        steps: 64 /*, 
				alwayson_scripts: alwayson_scripts
				*/,
      }),
    });

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
  <input bind:value={prompt} placeholder="Corey..." />
  <button on:click={sendData}>Send</button>
</div>
<p>alpha v0.01</p>
{#if imageData}
  <div class="image-container">
    <img src={imageData} alt="" class={imageLoaded ? "fade-in" : ""} />
    <!-- ideally, alt tag would be replaced by the prompt -->
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

  .image-container {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
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
