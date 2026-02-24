import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key");
const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash"];
const TRACK_MODE = (process.env.MOCK_TRACK_MODE || "vocal_only").toLowerCase();

const themeMap = {
  Rock: "rock",
  "Hip-hop": "hiphop",
  "K-Pop": "kpop",
  Lullaby: "lullaby",
  Jazz: "jazz",
};
const VALID_THEMES = new Set(Object.keys(themeMap));

const hasVocalTag = (track) => {
  if (track?.vocal === true) return true;
  const merged = `${track?.title || ""} ${track?.file || ""} ${(track?.tags || []).join(" ")}`.toLowerCase();
  return /\bvocal\b|\bsinger\b|\bvoice\b|\blyrics?\b/.test(merged);
};

const hashString = (s) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const parseAiJson = (text) => {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in AI response");
  return JSON.parse(jsonMatch[0]);
};

const fileExistsInPublic = (urlPath) => {
  if (!urlPath || typeof urlPath !== "string" || !urlPath.startsWith("/")) return false;
  const fullPath = path.join(process.cwd(), "public", urlPath.replace(/^\//, ""));
  return fs.existsSync(fullPath);
};

function loadTracksSafe() {
  try {
    const tracksDir = path.join(process.cwd(), "public", "tracks");
    const orderedCandidates =
      TRACK_MODE === "vocal_only"
        ? ["tracks_real.json", "tracks.json"]
        : TRACK_MODE === "real"
          ? ["tracks_real.json", "tracks.json"]
          : ["tracks.json", "tracks_real.json"];

    for (const fileName of orderedCandidates) {
      const fullPath = path.join(tracksDir, fileName);
      if (!fs.existsSync(fullPath)) continue;
      const parsed = JSON.parse(fs.readFileSync(fullPath, "utf8"));
      if (!Array.isArray(parsed) || parsed.length === 0) continue;

      const filtered = TRACK_MODE === "vocal_only" ? parsed.filter((t) => hasVocalTag(t)) : parsed;
      if (filtered.length > 0) return { tracks: filtered, sourceFile: fileName };
    }
  } catch (error) {
    console.error("loadTracksSafe error:", error);
  }

  return { tracks: [], sourceFile: "fallback" };
}

async function generateOrchestrationWithGemini(systemPrompt, fallbackData) {
  let lastError = null;

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(systemPrompt);
      const aiResponseText = result.response.text().trim();
      return parseAiJson(aiResponseText);
    } catch (err) {
      lastError = err;
    }
  }

  console.warn("Gemini Error. Returning fallback orchestration.", lastError);
  return fallbackData;
}

function pickTrack({ prompt, theme, tracks }) {
  if (!Array.isArray(tracks) || tracks.length === 0) return null;

  const themeId = themeMap[theme] || "jazz";
  const pool = tracks.filter((t) => t.theme === themeId);
  const scoped = pool.length > 0 ? pool : tracks;
  const idx = hashString(`${theme}|${prompt}`) % scoped.length;

  return scoped[idx] || null;
}

function pickAudioUrl(track, tracks) {
  if (track?.file && fileExistsInPublic(track.file)) {
    return { audioUrl: track.file, trackId: track.id || "unknown" };
  }

  if (Array.isArray(tracks)) {
    const firstExisting = tracks.find((t) => t?.file && fileExistsInPublic(t.file));
    if (firstExisting) {
      return { audioUrl: firstExisting.file, trackId: firstExisting.id || "fallback-track" };
    }
  }

  if (fileExistsInPublic("/fallback.wav")) {
    return { audioUrl: "/fallback.wav", trackId: "fallback-wav" };
  }

  return { audioUrl: "", trackId: "missing-audio" };
}

export async function POST(req) {
  try {
    const { prompt, genre } = await req.json();

    const isRandom = !prompt || prompt.trim() === "";
    const userRequest = isRandom ? "Generate random music" : prompt;
    const effectiveGenre = VALID_THEMES.has(genre) ? genre : "Jazz";

    const systemPrompt = `You are an expert music prompt orchestrator. Build a detailed and production-ready prompt for text-to-music demos. Return JSON only.\n\n{\n  \"original_input\": \"${userRequest}\",\n  \"refined_prompt\": \"[Genre, Mood, Instrumentation, BPM, Mixing style] english string\",\n  \"target_theme\": \"${effectiveGenre}\",\n  \"color_code\": \"[Hex Code matching the mood]\",\n  \"bpm\": [number]\n}`;

    const orchestrationData = await generateOrchestrationWithGemini(systemPrompt, {
      original_input: userRequest,
      refined_prompt: `[${effectiveGenre}] high quality, studio recording, trending style, upbeat`,
      target_theme: effectiveGenre,
      color_code:
        effectiveGenre === "Rock"
          ? "#ff4500"
          : effectiveGenre === "Hip-hop"
            ? "#b967ff"
            : "#01cdfe",
      bpm: 120,
    });

    const { tracks, sourceFile } = loadTracksSafe();
    const selectedTrack = pickTrack({
      prompt: orchestrationData.refined_prompt || userRequest,
      theme: effectiveGenre,
      tracks,
    });
    const { audioUrl, trackId } = pickAudioUrl(selectedTrack, tracks);

    return new Response(
      JSON.stringify({
        ...orchestrationData,
        target_theme: effectiveGenre,
        bpm: selectedTrack?.bpm || orchestrationData.bpm || 120,
        audio_url: audioUrl,
        provider: "preset_pool",
        is_mock_audio: true,
        mock_track_mode: TRACK_MODE,
        track_source_file: sourceFile,
        selected_track: trackId,
        warning: "Portfolio demo mode: track selected from theme-based preset pool.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Orchestration API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
