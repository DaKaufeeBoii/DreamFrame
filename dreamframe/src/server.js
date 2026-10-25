import { createServer } from "node:http";
import { existsSync, readFileSync, createReadStream, statSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve, extname } from "node:path";
import { generateBedtimeStory } from "./gemma.js";
import { renderStoryVideo } from "./hyperframesRender.js";
import { PRESET_STORIES } from "./storySchema.js";
import { randomUUID } from "node:crypto";

import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PORT = process.env.PORT || 3000;
const DREAMFRAME_ROOT = resolve(__dirname, "..");
const PUBLIC_DIR = join(DREAMFRAME_ROOT, "public");
const CLIENT_DIR = join(DREAMFRAME_ROOT, "client");
const WORK_DIR = join(DREAMFRAME_ROOT, ".renders");

mkdirSync(WORK_DIR, { recursive: true });
mkdirSync(join(PUBLIC_DIR, "uploads"), { recursive: true });
mkdirSync(join(PUBLIC_DIR, "output"), { recursive: true });

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 25 * 1024 * 1024) {
        reject(new Error("Payload too large (max 25MB)"));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function serveStaticFile(req, res, filePath) {
  if (!existsSync(filePath)) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 Not Found");
    return;
  }

  const stat = statSync(filePath);
  const ext = extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  // Support range requests for video/audio streaming and smooth seeking
  const range = req.headers.range;
  if (range && (ext === ".mp4" || ext === ".mp3")) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunkSize = end - start + 1;
    const fileStream = createReadStream(filePath, { start, end });

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${stat.size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
    });
    fileStream.pipe(res);
    return;
  }

  res.writeHead(200, {
    "Content-Length": stat.size,
    "Content-Type": contentType,
    "Accept-Ranges": "bytes",
    "Access-Control-Allow-Origin": "*",
  });
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  createReadStream(filePath).pipe(res);
}

const server = createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;

  // --- API Endpoints ---
  if (pathname === "/api/status" && req.method === "GET") {
    const hasDoKey = !!(process.env.DIGITALOCEAN_INFERENCE_KEY || 
                        process.env.DIGITALOCEAN_API_KEY || 
                        process.env.DO_API_KEY);
    return sendJson(res, 200, {
      app: "DreamFrame",
      version: "1.0.0",
      hackathon: "Hacktoberfest Hack Day 2026",
      aiProvider: "DigitalOcean Serverless Inference",
      model: "gemma-4-31B-it",
      hasDigitalOceanApiKey: hasDoKey,
      hyperframesVersion: "0.8.195",
      presets: [
        {
          id: "bedroom-rain",
          name: "Rainy Bedroom (Lofi City)",
          image: "/presets/cozy_lofi_bedroom.jpg",
          audio: "rain-window.mp3",
          defaultMood: "Cozy rainy night with warm tea and distant city reflections"
        },
        {
          id: "starry-sky",
          name: "Starlit Panorama (Alpine Sanctuary)",
          image: "/presets/starry_bedroom.jpg",
          audio: "starlit-breeze.mp3",
          defaultMood: "Tranquil celestial starry night and quiet moonlit valley"
        }
      ],
      ambientTracks: [
        { id: "rain-window.mp3", name: "Rain Against Windowpane", file: "/audio/rain-window.mp3" },
        { id: "lofi-night.mp3", name: "Midnight Vinyl Lo-Fi", file: "/audio/lofi-night.mp3" },
        { id: "starlit-breeze.mp3", name: "Starlit Celestial Drone", file: "/audio/starlit-breeze.mp3" }
      ]
    });
  }

  // Generate bedtime story via DigitalOcean Gemma 4
  if (pathname === "/api/generate-story" && req.method === "POST") {
    try {
      const body = await parseJsonBody(req);
      const result = await generateBedtimeStory({
        roomDescription: body.roomDescription || "",
        mood: body.mood || "rainy",
        imageBase64: body.imageBase64 || null
      });
      return sendJson(res, 200, result);
    } catch (err) {
      console.error("[API:generate-story]", err);
      return sendJson(res, 500, { error: err.message });
    }
  }

  // Render video via HyperFrames
  if (pathname === "/api/render-video" && req.method === "POST") {
    try {
      const body = await parseJsonBody(req);
      if (!body.story) {
        return sendJson(res, 400, { error: "Missing required story object" });
      }

      // Determine image to use
      let imagePath = join(PUBLIC_DIR, "presets", "cozy_lofi_bedroom.jpg");
      if (body.customImagePath && existsSync(body.customImagePath)) {
        imagePath = body.customImagePath;
      } else if (body.presetImage) {
        const potential = join(PUBLIC_DIR, body.presetImage.replace(/^\//, ""));
        if (existsSync(potential)) imagePath = potential;
      }

      const audioFilename = body.audioFilename || body.story.ambientAudio || "rain-window.mp3";
      const result = await renderStoryVideo({
        story: body.story,
        imageAbsolutePath: imagePath,
        audioFilename,
        workDirRoot: WORK_DIR,
        publicOutputDir: join(PUBLIC_DIR, "output")
      });

      return sendJson(res, 200, result);
    } catch (err) {
      console.error("[API:render-video]", err);
      return sendJson(res, 500, { error: err.message });
    }
  }

  // Upload custom room photo
  if (pathname === "/api/upload-photo" && req.method === "POST") {
    try {
      const body = await parseJsonBody(req);
      if (!body.imageData) {
        return sendJson(res, 400, { error: "imageData base64 required" });
      }
      const matches = body.imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      const base64Data = matches ? matches[2] : body.imageData;
      const buffer = Buffer.from(base64Data, "base64");
      const filename = `upload-${randomUUID().slice(0, 8)}.jpg`;
      const uploadPath = join(PUBLIC_DIR, "uploads", filename);
      writeFileSync(uploadPath, buffer);

      return sendJson(res, 200, {
        success: true,
        imageUrl: `/uploads/${filename}`,
        absolutePath: uploadPath
      });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // Complete end-to-end wind-down workflow
  if (pathname === "/api/wind-down" && req.method === "POST") {
    try {
      const body = await parseJsonBody(req);
      console.log(`[API:wind-down] Starting complete wind-down flow for mood "${body.mood}"...`);

      // 1. Generate story with DigitalOcean Gemma 4
      const storyResult = await generateBedtimeStory({
        roomDescription: body.roomDescription || "",
        mood: body.mood || "rainy",
        imageBase64: body.imageBase64 || null
      });

      // 2. Select image
      let imagePath = join(PUBLIC_DIR, "presets", "cozy_lofi_bedroom.jpg");
      if (body.customImagePath && existsSync(body.customImagePath)) {
        imagePath = body.customImagePath;
      } else if (body.presetImage) {
        const potential = join(PUBLIC_DIR, body.presetImage.replace(/^\//, ""));
        if (existsSync(potential)) imagePath = potential;
      }

      // 3. Render with HyperFrames
      const audioFilename = body.audioFilename || storyResult.story.ambientAudio || "rain-window.mp3";
      const renderResult = await renderStoryVideo({
        story: storyResult.story,
        imageAbsolutePath: imagePath,
        audioFilename,
        workDirRoot: WORK_DIR,
        publicOutputDir: join(PUBLIC_DIR, "output")
      });

      return sendJson(res, 200, {
        success: true,
        story: storyResult.story,
        aiMeta: {
          source: storyResult.source,
          model: storyResult.model,
          durationMs: storyResult.durationMs,
          isFallback: storyResult.isFallback
        },
        video: renderResult
      });
    } catch (err) {
      console.error("[API:wind-down] Flow error:", err);
      return sendJson(res, 500, { error: err.message });
    }
  }

  // --- Static Asset Serving ---
  if (pathname === "/" || pathname === "/index.html") {
    return serveStaticFile(req, res, join(CLIENT_DIR, "index.html"));
  }
  if (pathname === "/style.css") {
    return serveStaticFile(req, res, join(CLIENT_DIR, "style.css"));
  }
  if (pathname === "/app.js") {
    return serveStaticFile(req, res, join(CLIENT_DIR, "app.js"));
  }
  if (pathname.startsWith("/audio/")) {
    return serveStaticFile(req, res, join(PUBLIC_DIR, "audio", pathname.replace("/audio/", "")));
  }
  if (pathname.startsWith("/presets/")) {
    return serveStaticFile(req, res, join(PUBLIC_DIR, "presets", pathname.replace("/presets/", "")));
  }
  if (pathname.startsWith("/uploads/")) {
    return serveStaticFile(req, res, join(PUBLIC_DIR, "uploads", pathname.replace("/uploads/", "")));
  }
  if (pathname.startsWith("/output/")) {
    return serveStaticFile(req, res, join(PUBLIC_DIR, "output", pathname.replace("/output/", "")));
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("404 Not Found");
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  🌙 DreamFrame Wind-Down Server is running!`);
  console.log(`  URL: http://localhost:${PORT}`);
  console.log(`  Inference Provider: DigitalOcean (Gemma 4 31B Instruct)`);
  console.log(`  Renderer: HyperFrames HTML-to-MP4 Engine`);
  console.log(`======================================================\n`);
});
