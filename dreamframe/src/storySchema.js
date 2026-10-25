/**
 * Schema and preset fallbacks for DreamFrame bedtime stories.
 */

export const PRESET_STORIES = {
  rainy: {
    title: "Raindrops on the Terminal Glass",
    mood: "Deep Calm & Rain Reflections",
    ambientAudio: "rain-window.mp3",
    scenes: [
      {
        id: "scene-1",
        heading: "The Screen Cools Down",
        narration: "The last commit is pushed into the silence of the night. Outside, rain beads gently against the high glass window, blurring city lights into warm amber bokeh.",
        visualFocus: "desk-glow",
        cameraMotion: "slow-zoom-in",
        duration: 5,
      },
      {
        id: "scene-2",
        heading: "The Unburdening of Thought",
        narration: "Steam curls from the herbal tea upon the wooden table. The hum of servers and deadlines fades into the steady, rhythmic cadence of rainfall.",
        visualFocus: "window-pan",
        cameraMotion: "gentle-pan-right",
        duration: 5,
      },
      {
        id: "scene-3",
        heading: "Into Peaceful Slumber",
        narration: "The soft weight of the blanket settles over tired shoulders. Tomorrow holds new frontiers, but tonight, rest claims the quiet sanctuary.",
        visualFocus: "bed-resting",
        cameraMotion: "slow-zoom-out",
        duration: 5,
      },
    ],
  },
  starry: {
    title: "The Quiet Constellation",
    mood: "Celestial Serenity & Infinite Space",
    ambientAudio: "starlit-breeze.mp3",
    scenes: [
      {
        id: "scene-1",
        heading: "A Horizon of Stars",
        narration: "Beyond the wide panorama window, towering alpine ridges dissolve beneath a river of stars and the pale crescent of the moon.",
        visualFocus: "sky-crescent",
        cameraMotion: "slow-zoom-in",
        duration: 5,
      },
      {
        id: "scene-2",
        heading: "Still Waters, Still Mind",
        narration: "The valley below mirrors the tranquil cosmos. Every problem solved today rests quietly in memory; every unsolved loop sleeps.",
        visualFocus: "valley-reflection",
        cameraMotion: "gentle-pan-left",
        duration: 5,
      },
      {
        id: "scene-3",
        heading: "Breath of the Night",
        narration: "Soft architectural light dims to a comforting ember. Inhale tranquility, exhale tension, and drift into deep, restorative dreams.",
        visualFocus: "pillows-glow",
        cameraMotion: "slow-zoom-out",
        duration: 5,
      },
    ],
  },
  lofi: {
    title: "Midnight Code & Warm Glow",
    mood: "Cozy Lofi Solitude",
    ambientAudio: "lofi-night.mp3",
    scenes: [
      {
        id: "scene-1",
        heading: "Closing the Workspace",
        narration: "The IDE closes with a soft click. The mechanical keyboard rests beneath the gentle, honeyed light of the desk lamp.",
        visualFocus: "monitor-warmth",
        cameraMotion: "slow-zoom-in",
        duration: 5,
      },
      {
        id: "scene-2",
        heading: "A Haven of Peace",
        narration: "Lo-fi vinyl warmth whispers in the corners of the room. The room breathes in unison with the quiet pulse of the sleeping city.",
        visualFocus: "room-center",
        cameraMotion: "gentle-pan-right",
        duration: 5,
      },
      {
        id: "scene-3",
        heading: "Soft Landing",
        narration: "Heavy eyelids welcome the gentle dark. Let your thoughts settle like dust in sunbeams, drifting softly into peaceful sleep.",
        visualFocus: "bedside-fade",
        cameraMotion: "slow-zoom-out",
        duration: 5,
      },
    ],
  },
};

export function validateStory(story) {
  if (!story || typeof story !== "object") return false;
  if (!story.title || typeof story.title !== "string") return false;
  if (!Array.isArray(story.scenes) || story.scenes.length === 0) return false;
  for (const scene of story.scenes) {
    if (!scene.narration || typeof scene.narration !== "string") return false;
  }
  return true;
}
