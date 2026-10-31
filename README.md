# 🌙 DreamFrame

> **Hacktoberfest Hack Day 2026** · Powered by **DigitalOcean Serverless Inference (Gemma 4)** + **HeyGen HyperFrames**
> 
> *A personalized, cinematic bedtime wind-down experience turning a developer's bedroom and workspace into an ambient story.*

---

## 🌟 Overview

Developers spend late nights staring at terminal glass and compiler logs. When it is time to disconnect, the transition from active problem-solving to restful sleep is often jarring.

**DreamFrame** creates a calming bridge between code and sleep. By combining your room's ambient lighting and workspace photo with **DigitalOcean's hosted Gemma 4 inference API (`digitalocean/gemma-4-31B-it`)**, DreamFrame crafts a structured, poetic three-scene bedtime story. It then compiles the narrative into dynamic, GPU-accelerated HTML compositions and renders a high-definition **1080p MP4 film with ambient audio loops** using **HyperFrames**.

```
   ┌──────────────────────────────────────────────────────────────┐
   │                     DREAMFRAME PIPELINE                      │
   └──────────────────────────────────────────────────────────────┘

   [ 📷 Room Photo / Preset ] + [ 🌧️ Wind-Down Vibe ]
                         │
                         ▼
        ┌──────────────────────────────────┐
        │   DigitalOcean Gemma 4 (31B-it)  │  Hosted Serverless Inference
        │   Structured JSON Generation     │  (Title, Mood, 3 Poetic Scenes)
        └──────────────────────────────────┘
                         │
                         ▼
        ┌──────────────────────────────────┐
        │    HyperFrames HTML Generator    │  Ken Burns CSS Pan/Zoom
        │    Dynamic Web Composition       │  GSAP Scene Typography
        └──────────────────────────────────┘
                         │
                         ▼
        ┌──────────────────────────────────┐
        │       HyperFrames Engine         │  Direct3D11 Headless Shell
        │       Audio Muxing (FFmpeg)      │  Rain / Lo-Fi / Starlit Loops
        └──────────────────────────────────┘
                         │
                         ▼
   [ 🎬 1080p Cinematic Bedtime Video + Transcript Player ]
```

---

## 🚀 Key Features

1. **DigitalOcean Gemma 4 Intelligence**:
   - Uses DigitalOcean's serverless inference endpoint (`https://inference.do-ai.run/v1/chat/completions`) with model `digitalocean/gemma-4-31B-it`.
   - Constrained JSON generation producing title, mood, and three sequential calming scenes (The Settling Room, Sensory Atmosphere, Drifting into Sleep).
   - Built-in graceful fallback engine for offline or low-connectivity demos.

2. **HyperFrames Headless Video Rendering Engine**:
   - Zero-overhead dynamic HTML generation with responsive Ken Burns camera motion.
   - Smooth typography reveals with GSAP 3 timelines.
   - Frame-accurate audio-video synchronization muxing custom ambient audio tracks (rain on window, midnight vinyl lo-fi, starlit celestial pads).

3. **Curated & Interactive Wind-Down Studio**:
   - Drag-and-drop custom bedroom/workspace photo uploader.
   - Pre-rendered photorealistic environment presets (Rainy City Lofi, Alpine Starlit).
   - Ambient audio loop test bar with real-time waveform preview.
   - Live multi-stage pipeline tracker reflecting AI inference, HTML composition, and headless render.
   - Native HTML5 video player with range-request streaming, download button, and interactive story transcript.

---

## 🤝 Upstream Open Source Contribution

As part of Hacktoberfest Hack Day, official upstream contributions were engineered and submitted to the **HyperFrames** core repository:

1. **Official Registry Block Contribution**:
   * **Pull Request**: [**HyperFrames PR #6877 (`feat(registry): add dreamframe-bedtime ambient bedtime story block`)**](https://github.com/heygen-com/hyperframes/pull/6877)
   * **Branch**: [`feat/block-dreamframe-bedtime`](https://github.com/DaKaufeeBoii/hyperframes/tree/feat/block-dreamframe-bedtime)
   * **Component**: Packaged DreamFrame's ambient bedtime story composition as an official HyperFrames registry block with schema variables, Ken Burns pan/zoom, GSAP 3 timeline, and responsive SVG assets. Passed `hyperframes lint` with 0 errors and 0 warnings.

2. **Core CLI Credentials Parser Fix**:
   * **Feature Branch**: [`fix/cli-dotenv-multiline-quoted-values`](https://github.com/DaKaufeeBoii/hyperframes/tree/fix/cli-dotenv-multiline-quoted-values)
   * **Target Issue**: [HyperFrames Issue #6075 (`bug(cli): quoted multiline .env credentials are truncated to the first line`)](https://github.com/heygen-com/hyperframes/issues/6075)
   * **Commit**: `99d57a9 fix(cli): parse multiline quoted .env credentials without truncating`
   * **Changes**:
     - Enhanced [`packages/cli/src/utils/dotEnv.ts`](file:///d:/Kaufee/projects/Hacktoberfest-2026/HacktoberfestXKramer's/hyperframes/packages/cli/src/utils/dotEnv.ts) to parse multiline double- and single-quoted `.env` values (such as multiline PEM private keys, multiline JSON credentials, and multiline secret strings) without truncating at the newline.
     - Added full test coverage in [`packages/cli/src/utils/dotEnv.test.ts`](file:///d:/Kaufee/projects/Hacktoberfest-2026/HacktoberfestXKramer's/hyperframes/packages/cli/src/utils/dotEnv.test.ts) covering unquoted values, multiline quoted values, and multiline JSON payloads.

---

## 🛠️ Architecture & Project Structure

```
HacktoberfestXKramer's/
├── dreamframe/                     # DreamFrame Application Root
│   ├── client/                     # Glassmorphic Frontend
│   │   ├── index.html              # Interactive Wind-Down UI & Stage
│   │   ├── style.css               # Modern dark-mode styling & micro-animations
│   │   └── app.js                  # Client controller & state machine
│   ├── src/                        # Backend Logic
│   │   ├── server.js               # Node.js HTTP API & static asset server
│   │   ├── gemma.js                # DigitalOcean Gemma 4 inference client
│   │   ├── storySchema.js          # Story validation schema & curated presets
│   │   └── hyperframesRender.js    # HyperFrames HTML generator & CLI runner
│   ├── public/                     # Static Assets
│   │   ├── audio/                  # Ambient loops (rain-window, lofi-night, starlit)
│   │   ├── presets/                # Photorealistic room environments & demo video
│   │   └── output/                 # Rendered 1080p MP4 stories
│   └── package.json                # Project configuration
├── hyperframes/                    # Upstream HyperFrames Fork (Contribution branch)
└── test-render/                    # HyperFrames baseline validation suite
```

---

## 🚦 Quick Start Guide

### Prerequisites
- **Node.js** v20+ (tested on Node v24.21.0)
- **FFmpeg** installed and accessible on your `PATH`
- **Git**

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/DaKaufeeBoii/HacktoberfestXKramer-s.git
   cd HacktoberfestXKramer-s/dreamframe
   ```

2. *(Optional)* Provide your DigitalOcean API key in a `.env` file or environment variable:
   ```bash
   # dreamframe/.env
   DIGITALOCEAN_API_KEY="dop_v1_your_digitalocean_token_here"
   ```
   > *Note: If no API key is set, DreamFrame automatically runs in fallback mode with curated story structures, allowing full offline testing.*

3. Start the DreamFrame wind-down server:
   ```bash
   npm start
   ```

4. Open your browser:
   ```
   http://localhost:3000
   ```

### Quick Demo
- Click **"⚡ Watch Instant Demo Story"** to immediately stream the pre-rendered 1080p story video with ambient rain audio and review the three-scene transcript.
- Or click **"Generate Bedtime Experience"** to invoke the end-to-end pipeline (DigitalOcean Gemma 4 generation → HyperFrames composition → 1080p MP4 render).

---

## 🔬 DigitalOcean Gemma 4 Inference Integration

DreamFrame connects to DigitalOcean's serverless inference service:

* **Endpoint**: `https://inference.do-ai.run/v1/chat/completions`
* **Model**: `digitalocean/gemma-4-31B-it`
* **Temperature**: `0.7`
* **System Prompt Strategy**:
  Enforces a strict JSON contract requiring 3 scenes written with sensory imagery (dimming screens, gentle rain, cool air) designed to lower heart rate and reduce developer cognitive fatigue.

Example Generated Scene Payload:
```json
{
  "title": "Raindrops on the Terminal Glass",
  "mood": "Rain Against Windowpane",
  "scenes": [
    {
      "heading": "1. The Terminal Settles",
      "narration": "A dim cursor blinks quietly against the cool screen. Outside the window, a gentle rhythm of raindrops taps the sill. The day's commits are pushed; the machine begins to rest.",
      "visualFocus": "blinking cursor, soft monitor glow"
    },
    {
      "heading": "2. Warm Light and Rain",
      "narration": "Amber desk lamp light reflects off raindrops tracing winding pathways down glass. The hum of the city dissolves into soft, steady rain.",
      "visualFocus": "water droplets on glass with warm bokeh"
    },
    {
      "heading": "3. Drifting to Stillness",
      "narration": "Your monitors dim to black. The night is cool, peaceful, and complete. Breathe in the damp night air, let your shoulders drop, and drift asleep.",
      "visualFocus": "dark room, soft moonlight through window"
    }
  ]
}
```

---

## 📄 License

This project is licensed under the Apache 2.0 License. Built with ❤️ for Hacktoberfest 2026.
