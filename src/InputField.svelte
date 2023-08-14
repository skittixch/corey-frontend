<script>
  export let prompt;
  export let dataSent;
  export let imageLoaded;
  let inputRef;
  let inputWidth = "175px";

  // Function to resize the input based on the text inside
  $: if (inputRef && prompt) {
    const tempSpan = document.createElement("span");
    tempSpan.style.fontSize = window
      .getComputedStyle(inputRef)
      .getPropertyValue("font-size");
    tempSpan.style.fontFamily = window
      .getComputedStyle(inputRef)
      .getPropertyValue("font-family");
    tempSpan.style.visibility = "hidden";
    tempSpan.innerHTML = prompt;
    document.body.appendChild(tempSpan);
    const newWidth = Math.min(Math.max(tempSpan.offsetWidth + 40, 175), 300);
    inputWidth = newWidth + "px";
    document.body.removeChild(tempSpan);
  }
  if (inputRef) {
    inputRef.blur();
  }
  console.log("imageLoaded is", imageLoaded);
</script>

<div class="input-container">
  <input
    bind:this={inputRef}
    bind:value={prompt}
    placeholder="Corey..."
    style="width: {inputWidth};"
    on:click={() => {
      if (!prompt) prompt = "Corey ";
    }}
  />
  <button class="send-button" type="submit" disabled={dataSent && !imageLoaded}>
    <img src="./send.svg" alt="Send" class="arrow-icon" />
  </button>
</div>
