// DreamFrame Client Controller
document.addEventListener("DOMContentLoaded", () => {
  // State
  let presets = [];
  let selectedPresetId = "bedroom-rain";
  let customUploadedImage = null; // { imageUrl, absolutePath, base64 }
  let selectedMood = "Rain Against Windowpane";
  let isGenerating = false;
  let isAudioPlaying = false;

  // DOM Elements
  const presetContainer = document.getElementById("preset-cards");
  const uploadDropzone = document.getElementById("upload-dropzone");
  const roomFileInput = document.getElementById("room-file-input");
  const uploadPreview = document.getElementById("upload-preview");
  const previewImg = document.getElementById("preview-img");
  const btnClearUpload = document.getElementById("btn-clear-upload");
  const roomNotesInput = document.getElementById("room-notes");
  const moodChips = document.querySelectorAll(".mood-chip");
  const ambientSelect = document.getElementById("ambient-select");
  const btnAudioPreview = document.getElementById("btn-audio-preview");
  const audioPreviewPlayer = document.getElementById("audio-preview-player");
  const btnGenerate = document.getElementById("btn-generate");
  const btnQuickDemo = document.getElementById("btn-quick-demo");

  const stagePlaceholder = document.getElementById("stage-placeholder");
  const stageLoading = document.getElementById("stage-loading");
  const videoContainer = document.getElementById("video-container");
  const storyVideo = document.getElementById("story-video");
  const videoStoryTitle = document.getElementById("video-story-title");
  const videoModelTag = document.getElementById("video-model-tag");
  const downloadVideoBtn = document.getElementById("download-video-btn");

  const transcriptCard = document.getElementById("transcript-card");
  const transcriptAudioTag = document.getElementById("transcript-audio-tag");
  const transcriptScenes = document.getElementById("transcript-scenes");

  const aiStatusBadge = document.getElementById("ai-status-badge");
  const aiStatusText = document.getElementById("ai-status-text");

  // Step Indicators
  const pStep1 = document.getElementById("p-step-1");
  const pStep2 = document.getElementById("p-step-2");
  const pStep3 = document.getElementById("p-step-3");
  const loadingTitle = document.getElementById("loading-title");
  const loadingDesc = document.getElementById("loading-desc");

  // Fetch Server & Engine Status
  async function initApp() {
    try {
      const res = await fetch("/api/status");
      if (!res.ok) throw new Error("Failed to load status");
      const data = await res.json();
      presets = data.presets || [];

      if (data.hasDigitalOceanApiKey) {
        aiStatusText.textContent = "DigitalOcean Gemma 4: Connected";
      } else {
        aiStatusText.textContent = "Gemma 4: Fallback Ready";
      }

      renderPresets();
    } catch (err) {
      console.warn("Status fetch failed; initializing with default presets", err);
      presets = [
        {
          id: "bedroom-rain",
          name: "Rainy Bedroom (Lofi City)",
          image: "/presets/cozy_lofi_bedroom.jpg",
          audio: "rain-window.mp3",
          defaultMood: "Rain Against Windowpane"
        },
        {
          id: "starry-sky",
          name: "Starlit Panorama (Alpine)",
          image: "/presets/starry_bedroom.jpg",
          audio: "starlit-breeze.mp3",
          defaultMood: "Celestial Starry Night"
        }
      ];
      renderPresets();
    }
  }

  // Render Preset Cards
  function renderPresets() {
    presetContainer.innerHTML = "";
    presets.forEach((preset) => {
      const card = document.createElement("div");
      card.className = `preset-card ${preset.id === selectedPresetId && !customUploadedImage ? "active" : ""}`;
      card.dataset.id = preset.id;
      card.innerHTML = `
        <img src="${preset.image}" alt="${preset.name}" loading="lazy">
        <div class="preset-meta">
          <div class="preset-name">${preset.name}</div>
        </div>
      `;
      card.addEventListener("click", () => selectPreset(preset.id));
      presetContainer.appendChild(card);
    });
  }

  function selectPreset(id) {
    selectedPresetId = id;
    customUploadedImage = null;
    uploadPreview.classList.add("hidden");
    document.querySelector(".dropzone-content").classList.remove("hidden");
    
    document.querySelectorAll(".preset-card").forEach((card) => {
      card.classList.toggle("active", card.dataset.id === id);
    });

    const preset = presets.find((p) => p.id === id);
    if (preset) {
      if (preset.audio) ambientSelect.value = preset.audio;
      if (preset.defaultMood) {
        moodChips.forEach(chip => {
          if (chip.dataset.mood.toLowerCase().includes(preset.id.split("-")[0])) {
            setMood(chip.dataset.mood);
          }
        });
      }
    }
  }

  // Mood selection
  function setMood(mood) {
    selectedMood = mood;
    moodChips.forEach(chip => {
      chip.classList.toggle("active", chip.dataset.mood === mood);
    });
  }

  moodChips.forEach(chip => {
    chip.addEventListener("click", () => setMood(chip.dataset.mood));
  });

  // Photo Upload Handling
  uploadDropzone.addEventListener("click", (e) => {
    if (e.target !== btnClearUpload) {
      roomFileInput.click();
    }
  });

  uploadDropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadDropzone.classList.add("dragover");
  });

  uploadDropzone.addEventListener("dragleave", () => {
    uploadDropzone.classList.remove("dragover");
  });

  uploadDropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadDropzone.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  roomFileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  });

  btnClearUpload.addEventListener("click", (e) => {
    e.stopPropagation();
    customUploadedImage = null;
    roomFileInput.value = "";
    uploadPreview.classList.add("hidden");
    document.querySelector(".dropzone-content").classList.remove("hidden");
    selectPreset(selectedPresetId);
  });

  function handleFileSelected(file) {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (JPG, PNG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target.result;
      previewImg.src = base64Data;
      uploadPreview.classList.remove("hidden");
      document.querySelector(".dropzone-content").classList.add("hidden");
      
      // Deactivate presets
      document.querySelectorAll(".preset-card").forEach(c => c.classList.remove("active"));

      // Send to server
      try {
        const res = await fetch("/api/upload-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageData: base64Data })
        });
        const data = await res.json();
        if (data.success) {
          customUploadedImage = {
            imageUrl: data.imageUrl,
            absolutePath: data.absolutePath,
            base64: base64Data
          };
          console.log("Photo uploaded successfully:", data.imageUrl);
        }
      } catch (err) {
        console.warn("Upload failed; using client-side base64 preview:", err);
      }
    };
    reader.readAsDataURL(file);
  }

  // Audio Preview Toggle
  btnAudioPreview.addEventListener("click", () => {
    if (isAudioPlaying) {
      audioPreviewPlayer.pause();
      btnAudioPreview.textContent = "🔊 Test";
      isAudioPlaying = false;
    } else {
      const audioFile = ambientSelect.value;
      audioPreviewPlayer.src = `/audio/${audioFile}`;
      audioPreviewPlayer.play();
      btnAudioPreview.textContent = "⏹ Stop";
      isAudioPlaying = true;
    }
  });

  audioPreviewPlayer.addEventListener("ended", () => {
    btnAudioPreview.textContent = "🔊 Test";
    isAudioPlaying = false;
  });

  // Quick Demo: Instant playback of pre-rendered story
  btnQuickDemo.addEventListener("click", () => {
    stagePlaceholder.classList.add("hidden");
    stageLoading.classList.add("hidden");
    videoContainer.classList.remove("hidden");
    transcriptCard.classList.remove("hidden");

    storyVideo.src = "/presets/demo-story.mp4";
    storyVideo.load();
    storyVideo.play().catch(() => {});

    const demoStory = {
      title: "Raindrops on the Terminal Glass",
      mood: "Rain Against Windowpane",
      scenes: [
        {
          heading: "1. The Terminal Settles",
          narration: "A dim cursor blinks quietly against the cool screen. Outside the window, a gentle rhythm of raindrops taps the sill. The day's commits are pushed; the machine begins to rest."
        },
        {
          heading: "2. Warm Light and Rain",
          narration: "Amber desk lamp light reflects off raindrops tracing winding pathways down glass. The hum of the city dissolves into soft, steady rain."
        },
        {
          heading: "3. Drifting to Stillness",
          narration: "Your monitors dim to black. The night is cool, peaceful, and complete. Breathe in the damp night air, let your shoulders drop, and drift asleep."
        }
      ]
    };

    videoStoryTitle.textContent = demoStory.title;
    videoModelTag.textContent = "DigitalOcean · Gemma 4 · Pre-Rendered (4.5 MB)";
    downloadVideoBtn.href = "/presets/demo-story.mp4";
    downloadVideoBtn.setAttribute("download", "dreamframe-demo.mp4");

    renderTranscript(demoStory);
  });

  // Generate Bedtime Experience Flow
  btnGenerate.addEventListener("click", () => startGenerationFlow());

  async function startGenerationFlow() {
    if (isGenerating) return;
    isGenerating = true;
    btnGenerate.disabled = true;

    // UI State: switch to loading
    stagePlaceholder.classList.add("hidden");
    videoContainer.classList.add("hidden");
    transcriptCard.classList.add("hidden");
    stageLoading.classList.remove("hidden");

    // Reset steps
    setStepState(pStep1, "active");
    setStepState(pStep2, "pending");
    setStepState(pStep3, "pending");
    loadingTitle.textContent = "Calling DigitalOcean Gemma 4...";
    loadingDesc.textContent = "Structuring 3 sensory, calming wind-down scenes...";

    try {
      const activePreset = presets.find(p => p.id === selectedPresetId);
      const payload = {
        roomDescription: roomNotesInput.value.trim() || "A developer bedroom at night with soft ambient lighting.",
        mood: selectedMood,
        audioFilename: ambientSelect.value,
        presetImage: customUploadedImage ? null : (activePreset?.image || "/presets/cozy_lofi_bedroom.jpg"),
        customImagePath: customUploadedImage?.absolutePath || null,
        imageBase64: customUploadedImage?.base64 || null
      };

      // 1. Generate Story with DigitalOcean Gemma 4
      const storyRes = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const storyData = await storyRes.json();
      if (!storyData.story) throw new Error(storyData.error || "Failed to generate story");

      setStepState(pStep1, "done");
      setStepState(pStep2, "active");
      loadingTitle.textContent = "Composing HyperFrames HTML...";
      loadingDesc.textContent = `Drafted "${storyData.story.title}". Building GSAP timelines & Ken Burns layers...`;

      // 2. Render Video with HyperFrames
      setStepState(pStep2, "done");
      setStepState(pStep3, "active");
      loadingTitle.textContent = "HyperFrames Headless Render...";
      loadingDesc.textContent = "Capturing 1080p frames and mixing ambient audio loop into MP4...";

      const renderRes = await fetch("/api/render-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          story: storyData.story,
          presetImage: payload.presetImage,
          customImagePath: payload.customImagePath,
          audioFilename: payload.audioFilename
        })
      });
      const renderData = await renderRes.json();
      if (!renderData.videoUrl) throw new Error(renderData.error || "Failed to render video");

      setStepState(pStep3, "done");

      // Reveal Video & Story Transcript
      setTimeout(() => {
        stageLoading.classList.add("hidden");
        videoContainer.classList.remove("hidden");
        transcriptCard.classList.remove("hidden");

        storyVideo.src = renderData.videoUrl;
        storyVideo.load();
        storyVideo.play().catch(() => {
          // Autoplay policy fallback: user can click play
        });

        videoStoryTitle.textContent = storyData.story.title;
        videoModelTag.textContent = `${storyData.source} · ${(renderData.sizeBytes / 1024).toFixed(0)} KB`;
        downloadVideoBtn.href = renderData.videoUrl;
        downloadVideoBtn.setAttribute("download", renderData.videoFilename || "dreamframe.mp4");

        renderTranscript(storyData.story);

        isGenerating = false;
        btnGenerate.disabled = false;
      }, 500);

    } catch (err) {
      console.error("Generation error:", err);
      alert(`Generation Error: ${err.message}. Retrying or using fallback.`);
      stageLoading.classList.add("hidden");
      stagePlaceholder.classList.remove("hidden");
      isGenerating = false;
      btnGenerate.disabled = false;
    }
  }

  function setStepState(element, state) {
    element.classList.remove("active", "done");
    if (state === "active") element.classList.add("active");
    if (state === "done") element.classList.add("done");
  }

  function renderTranscript(story) {
    transcriptAudioTag.textContent = story.mood || "Wind-Down";
    transcriptScenes.innerHTML = "";
    story.scenes.forEach((scene, i) => {
      const item = document.createElement("div");
      item.className = "transcript-scene-item";
      item.innerHTML = `
        <div class="scene-num">Scene ${i + 1}</div>
        <div class="scene-title">${scene.heading}</div>
        <div class="scene-body">${scene.narration}</div>
      `;
      transcriptScenes.appendChild(item);
    });
  }

  initApp();
});
