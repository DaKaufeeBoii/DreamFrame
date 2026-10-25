import { execSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, copyFileSync, statSync } from "node:fs";
import { join, resolve, basename, dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

/**
 * Builds a dynamic HyperFrames cinematic HTML composition from story scenes,
 * room background, and ambient audio loop.
 */
export function buildCompositionHtml({ story, imageRelativePath, audioFilename }) {
  const durationPerScene = 5;
  const totalDuration = story.scenes.length * durationPerScene;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;1,400&display=swap" rel="stylesheet">
    <style>
      :root {
        --bg-dark: #07090e;
        --text-gold: #f6d365;
        --text-primary: #f0f4fc;
        --text-muted: #94a3b8;
        --accent-glow: rgba(88, 166, 255, 0.25);
      }
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      html, body {
        width: 1920px;
        height: 1080px;
        overflow: hidden;
        background: var(--bg-dark);
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      }
      #root {
        position: relative;
        width: 1920px;
        height: 1080px;
        overflow: hidden;
      }
      /* Cinematic Background Photo Layer with Ken Burns scale */
      .bg-layer {
        position: absolute;
        top: -40px;
        left: -40px;
        width: 2000px;
        height: 1160px;
        background-size: cover;
        background-position: center;
        filter: brightness(0.72) contrast(1.05);
        transform-origin: center center;
      }
      /* Dark vignette and atmospheric mood overlay */
      .vignette-overlay {
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at center, rgba(10, 14, 24, 0.2) 0%, rgba(5, 7, 12, 0.85) 100%),
                    linear-gradient(to top, rgba(5, 7, 12, 0.95) 0%, rgba(5, 7, 12, 0.1) 40%, rgba(5, 7, 12, 0.4) 100%);
        pointer-events: none;
      }
      /* Header Banner */
      .header-badge {
        position: absolute;
        top: 60px;
        left: 80px;
        display: flex;
        align-items: center;
        gap: 14px;
        background: rgba(15, 23, 42, 0.65);
        backdrop-filter: blur(16px);
        padding: 12px 24px;
        border-radius: 9999px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      .brand-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #58a6ff;
        box-shadow: 0 0 12px #58a6ff;
      }
      .brand-text {
        font-size: 18px;
        font-weight: 600;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #e2e8f0;
      }
      .mood-tag {
        font-size: 15px;
        color: #94a3b8;
        border-left: 1px solid rgba(255, 255, 255, 0.15);
        padding-left: 14px;
      }
      /* Title Card */
      .story-title-card {
        position: absolute;
        top: 140px;
        left: 80px;
        font-family: 'Playfair Display', serif;
        font-size: 52px;
        font-weight: 600;
        color: #ffffff;
        text-shadow: 0 4px 24px rgba(0, 0, 0, 0.7);
        letter-spacing: -0.01em;
        max-width: 1200px;
      }
      /* Cinematic Captions Container */
      .captions-container {
        position: absolute;
        bottom: 80px;
        left: 80px;
        right: 80px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
      }
      .scene-card {
        position: absolute;
        bottom: 0;
        left: 0;
        max-width: 1300px;
        background: rgba(13, 17, 23, 0.75);
        backdrop-filter: blur(24px);
        border: 1px solid rgba(255, 255, 255, 0.12);
        padding: 36px 48px;
        border-radius: 24px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
        opacity: 0;
      }
      .scene-index {
        font-size: 16px;
        font-weight: 700;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: #58a6ff;
        margin-bottom: 12px;
      }
      .scene-heading {
        font-family: 'Playfair Display', serif;
        font-size: 34px;
        font-weight: 600;
        color: #f8fafc;
        margin-bottom: 14px;
      }
      .scene-narration {
        font-size: 26px;
        font-weight: 300;
        line-height: 1.6;
        color: #cbd5e1;
        letter-spacing: -0.01em;
      }
      /* Progress Timeline Bar */
      .progress-track {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 6px;
        background: rgba(255, 255, 255, 0.08);
      }
      .progress-bar {
        width: 0%;
        height: 100%;
        background: linear-gradient(90deg, #58a6ff, #93c5fd);
        box-shadow: 0 0 10px #58a6ff;
      }
    </style>
  </head>
  <body>
    <div
      id="root"
      data-composition-id="main"
      data-start="0"
      data-duration="${totalDuration}"
      data-width="1920"
      data-height="1080"
    >
      <!-- Background Ambient Audio Track -->
      <audio
        id="ambient-audio"
        class="clip"
        src="${audioFilename}"
        data-start="0"
        data-duration="${totalDuration}"
        data-track-index="0"
        preload="auto"
      ></audio>

      <!-- Background Image Layer -->
      <div
        id="bg-photo"
        class="bg-layer clip"
        style="background-image: url('${imageRelativePath}');"
        data-start="0"
        data-duration="${totalDuration}"
        data-track-index="1"
      ></div>

      <!-- Vignette Overlay -->
      <div class="vignette-overlay"></div>

      <!-- Branding Header -->
      <div class="header-badge clip" data-start="0" data-duration="${totalDuration}" data-track-index="2">
        <span class="brand-dot"></span>
        <span class="brand-text">DreamFrame · DigitalOcean Gemma 4</span>
        <span class="mood-tag">${story.mood || "Wind-Down"}</span>
      </div>

      <!-- Story Title -->
      <h1 id="story-title" class="story-title-card clip" data-start="0" data-duration="${totalDuration}" data-track-index="3">
        ${story.title}
      </h1>

      <!-- Captions Container with Scenes -->
      <div class="captions-container">
        ${story.scenes.map((scene, idx) => `
        <div
          id="scene-${idx + 1}"
          class="scene-card clip"
          data-start="${idx * durationPerScene}"
          data-duration="${durationPerScene}"
          data-track-index="${4 + idx}"
        >
          <div class="scene-index">Scene ${idx + 1} of ${story.scenes.length}</div>
          <div class="scene-heading">${scene.heading}</div>
          <div class="scene-narration">${scene.narration}</div>
        </div>
        `).join("")}
      </div>

      <!-- Progress Line -->
      <div class="progress-track clip" data-start="0" data-duration="${totalDuration}" data-track-index="10">
        <div id="progress-bar" class="progress-bar"></div>
      </div>
    </div>

    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });

      // Subtle Ken Burns slow pan and zoom on background
      tl.fromTo("#bg-photo", 
        { scale: 1.0, x: 0, y: 0 }, 
        { scale: 1.14, x: -30, y: -20, duration: ${totalDuration}, ease: "none" }, 
        0
      );

      // Title subtle reveal
      tl.fromTo("#story-title",
        { opacity: 0, y: -20 },
        { opacity: 0.95, y: 0, duration: 1.2, ease: "power2.out" },
        0.3
      );

      // Progress bar fill across full duration
      tl.fromTo("#progress-bar",
        { width: "0%" },
        { width: "100%", duration: ${totalDuration}, ease: "none" },
        0
      );

      // Scene transitions
      ${story.scenes.map((scene, idx) => {
        const start = idx * durationPerScene;
        const inStart = start + 0.2;
        const outStart = start + durationPerScene - 0.4;
        return `
        // Scene ${idx + 1}
        tl.fromTo("#scene-${idx + 1}",
          { opacity: 0, y: 30, filter: "blur(6px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6, ease: "power3.out" },
          ${inStart}
        );
        tl.to("#scene-${idx + 1}",
          { opacity: 0, y: -15, filter: "blur(4px)", duration: 0.4, ease: "power2.in" },
          ${outStart}
        );
        `;
      }).join("\n")}

      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>`;
}

/**
 * Render a finished MP4 video for a given story and room image.
 * 
 * @param {Object} options
 * @param {Object} options.story - Validated bedtime story
 * @param {string} options.imageAbsolutePath - Path to bedroom/desk photo
 * @param {string} options.audioFilename - Ambient audio filename (e.g. "rain-window.mp3")
 * @param {string} options.workDirRoot - Working directory for renders
 * @param {string} options.publicOutputDir - Final public directory for finished videos
 * @returns {Promise<{videoFilename: string, videoUrl: string, durationSeconds: number}>}
 */
export async function renderStoryVideo({
  story,
  imageAbsolutePath,
  audioFilename = "rain-window.mp3",
  workDirRoot,
  publicOutputDir
}) {
  const jobId = randomUUID().slice(0, 8);
  const projectDir = join(workDirRoot, `job-${jobId}`);
  mkdirSync(projectDir, { recursive: true });
  mkdirSync(publicOutputDir, { recursive: true });

  // Copy ambient audio and image locally into project directory for HyperFrames
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  let audioSrcPath = resolve(moduleDir, "../public/audio", audioFilename);
  if (!existsSync(audioSrcPath)) {
    audioSrcPath = resolve("dreamframe/public/audio", audioFilename);
  }
  if (!existsSync(audioSrcPath)) {
    audioSrcPath = resolve("public/audio", audioFilename);
  }
  const localAudioName = `audio.mp3`;
  copyFileSync(audioSrcPath, join(projectDir, localAudioName));

  let resolvedImage = imageAbsolutePath;
  if (!existsSync(resolvedImage)) {
    resolvedImage = resolve(moduleDir, "../public", imageAbsolutePath.replace(/^\//, ""));
  }
  const imageExt = resolvedImage.endsWith(".png") ? ".png" : ".jpg";
  const localImageName = `room${imageExt}`;
  copyFileSync(resolvedImage, join(projectDir, localImageName));

  // Write index.html composition
  const compositionHtml = buildCompositionHtml({
    story,
    imageRelativePath: localImageName,
    audioFilename: localAudioName
  });
  writeFileSync(join(projectDir, "index.html"), compositionHtml, "utf-8");

  // Output filename
  const outputFileName = `dreamframe-${jobId}.mp4`;
  const tempOutputFile = join(projectDir, outputFileName);
  const finalPublicFile = join(publicOutputDir, outputFileName);

  console.log(`[DreamFrame:HyperFrames] Starting render for Job ${jobId}...`);

  return new Promise((resolvePromise, rejectPromise) => {
    const localCachedCmd = "C:\\Users\\user\\AppData\\Local\\npm-cache\\_npx\\702923228c2ce1e6\\node_modules\\.bin\\hyperframes.cmd";
    const executable = process.env.HYPERFRAMES_BIN || (existsSync(localCachedCmd) ? localCachedCmd : "hyperframes");
    const child = spawn(executable, [
      "render",
      projectDir,
      "-o",
      tempOutputFile,
      "--low-memory-mode",
      "-f",
      "30",
      "-q",
      "standard"
    ], {
      shell: true,
      cwd: projectDir,
      env: { ...process.env, CI: "1" }
    });

    let logs = "";
    child.stdout.on("data", (data) => {
      const line = data.toString();
      logs += line;
      if (line.includes("%") || line.includes("Render")) {
        process.stdout.write(`[HF:${jobId}] ${line.trim()}\n`);
      }
    });

    child.stderr.on("data", (data) => {
      logs += data.toString();
    });

    child.on("close", (code) => {
      if (code === 0 && existsSync(tempOutputFile)) {
        copyFileSync(tempOutputFile, finalPublicFile);
        const stats = statSync(finalPublicFile);
        const durationSeconds = story.scenes.length * 5;
        console.log(`[DreamFrame:HyperFrames] Render completed! Output: ${finalPublicFile} (${(stats.size / 1024).toFixed(1)} KB)`);
        resolvePromise({
          jobId,
          videoFilename: outputFileName,
          videoUrl: `/output/${outputFileName}`,
          durationSeconds,
          sizeBytes: stats.size
        });
      } else {
        console.error(`[DreamFrame:HyperFrames] Render failed with exit code ${code}. Logs:\n${logs}`);
        rejectPromise(new Error(`HyperFrames render exited with code ${code}`));
      }
    });

    child.on("error", (err) => {
      rejectPromise(err);
    });
  });
}
