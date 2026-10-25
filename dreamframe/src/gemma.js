import { PRESET_STORIES, validateStory } from "./storySchema.js";

const DO_INFERENCE_URL = process.env.DIGITALOCEAN_INFERENCE_URL || "https://inference.do-ai.run/v1/chat/completions";
const DO_MODEL = process.env.DIGITALOCEAN_MODEL || "digitalocean/gemma-4-31B-it";

/**
 * Generate a bedtime wind-down story using DigitalOcean's Gemma 4 Inference API.
 * 
 * @param {Object} options
 * @param {string} options.roomDescription - Description of the room or photo tags
 * @param {string} options.mood - User-selected mood or story preference
 * @param {string} [options.imageBase64] - Optional base64 image data if multimodal
 * @returns {Promise<{story: Object, source: string, model: string, durationMs: number}>}
 */
export async function generateBedtimeStory({ roomDescription = "", mood = "rainy", imageBase64 = null }) {
  const startTime = Date.now();
  const apiKey = process.env.DIGITALOCEAN_INFERENCE_KEY || 
                 process.env.DIGITALOCEAN_API_KEY || 
                 process.env.DO_API_KEY;

  const systemPrompt = `You are DreamFrame, an AI bedtime storyteller for tired software developers.
Your goal is to turn the user's room and evening mood into a calming, cinematic 3-scene wind-down story.
The language should be lyrical, sensory, slow-paced, and gently guide the mind toward restorative sleep.

You must respond ONLY with valid, raw JSON (no markdown formatting, no backticks, no code blocks) following this exact schema:
{
  "title": "Short poetic title (4-7 words)",
  "mood": "Atmospheric mood description",
  "ambientAudio": "rain-window.mp3" | "lofi-night.mp3" | "starlit-breeze.mp3",
  "scenes": [
    {
      "id": "scene-1",
      "heading": "Scene 1 Heading (2-4 words)",
      "narration": "2 sentences describing the transition from work to evening in the room.",
      "visualFocus": "Specific element in the room (e.g. laptop light, tea steam, window rain)",
      "cameraMotion": "slow-zoom-in" | "slow-zoom-out" | "gentle-pan-right" | "gentle-pan-left",
      "duration": 5
    },
    {
      "id": "scene-2",
      "heading": "Scene 2 Heading (2-4 words)",
      "narration": "2 sentences releasing mental tension, deadlines, and active thoughts.",
      "visualFocus": "Warm background element (e.g. bed blankets, quiet skyline, amber lamp)",
      "cameraMotion": "slow-zoom-in" | "slow-zoom-out" | "gentle-pan-right" | "gentle-pan-left",
      "duration": 5
    },
    {
      "id": "scene-3",
      "heading": "Scene 3 Heading (2-4 words)",
      "narration": "2 sentences welcoming slumber, deep breath, and calm restorative dreams.",
      "visualFocus": "Full room sanctuary softly dimming into rest",
      "cameraMotion": "slow-zoom-in" | "slow-zoom-out" | "gentle-pan-right" | "gentle-pan-left",
      "duration": 5
    }
  ]
}`;

  const userContent = [];
  let userText = `Room description: ${roomDescription || "A developer's bedroom at night with glowing monitor, soft lamp light, and a cozy bed by the window."}\nDesired Mood: ${mood || "peaceful rain"}. Please generate a soothing 3-scene bedtime story JSON.`;
  userContent.push({ type: "text", text: userText });

  if (imageBase64) {
    userContent.push({
      type: "image_url",
      image_url: {
        url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
      }
    });
  }

  // Attempt live inference via DigitalOcean Gemma 4
  if (apiKey) {
    try {
      console.log(`[DreamFrame:DO] Calling DigitalOcean Serverless Inference (${DO_MODEL})...`);
      const response = await fetch(DO_INFERENCE_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "User-Agent": "DreamFrame/1.0.0 (Hacktoberfest-2026; DigitalOcean-Gemma-4)"
        },
        body: JSON.stringify({
          model: DO_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: imageBase64 ? userContent : userText }
          ],
          temperature: 0.7,
          max_tokens: 800
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[DreamFrame:DO] Inference HTTP ${response.status}: ${errorText}`);
      } else {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) {
          // Parse JSON, stripping any potential markdown backticks
          const cleanJson = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
          const parsed = JSON.parse(cleanJson);
          if (validateStory(parsed)) {
            const elapsed = Date.now() - startTime;
            console.log(`[DreamFrame:DO] Successfully generated story with Gemma 4 in ${elapsed}ms.`);
            return {
              story: parsed,
              source: "DigitalOcean Gemma 4 Inference API",
              model: DO_MODEL,
              durationMs: elapsed,
              isFallback: false
            };
          }
        }
      }
    } catch (err) {
      console.warn(`[DreamFrame:DO] Inference call failed or timed out: ${err.message}. Engaging graceful fallback.`);
    }
  } else {
    console.log(`[DreamFrame:DO] No DIGITALOCEAN_API_KEY detected in env; utilizing structured fallback engine.`);
  }

  // Fallback preset tailored to selected mood
  const moodKey = (mood && mood.toLowerCase().includes("star")) ? "starry" :
                  (mood && mood.toLowerCase().includes("lofi")) ? "lofi" : "rainy";
  const fallback = JSON.parse(JSON.stringify(PRESET_STORIES[moodKey]));
  if (roomDescription) {
    fallback.scenes[0].narration = `The quiet of the evening settles across your room. ${fallback.scenes[0].narration}`;
  }

  const elapsed = Date.now() - startTime;
  return {
    story: fallback,
    source: apiKey ? "DigitalOcean Gemma 4 (Validated Fallback Engine)" : "DreamFrame Intelligent Fallback Engine",
    model: DO_MODEL,
    durationMs: elapsed,
    isFallback: true
  };
}
