import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key");
const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash"];

const TRACKS_PATH = path.join(process.cwd(), "public", "tracks", "tracks.json");
const TRACKS = JSON.parse(fs.readFileSync(TRACKS_PATH, "utf8"));

const themeMap = {
  Rock: "rock",
  "Hip-hop": "hiphop",
  "K-Pop": "kpop",
  Lullaby: "lullaby",
  Jazz: "jazz",
};

const hashString = (s) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
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

function pickTrack({ prompt, theme }) {
  const themeId = themeMap[theme] || "jazz";
  const pool = TRACKS.filter((t) => t.theme === themeId);
  if (pool.length === 0) {
    return TRACKS[0];
  }
  const idx = hashString(`${theme}|${prompt}`) % pool.length;
  return pool[idx];
}

export async function POST(req) {
  try {
    const { prompt, genre } = await req.json();

    const isRandom = !prompt || prompt.trim() === "";
    const userRequest = isRandom ? "Generate random music" : prompt;
    const effectiveGenre = genre || "Jazz";

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

    const selectedTrack = pickTrack({
      prompt: orchestrationData.refined_prompt || userRequest,
      theme: orchestrationData.target_theme || effectiveGenre,
    });

    return new Response(
      JSON.stringify({
        ...orchestrationData,
        bpm: selectedTrack.bpm || orchestrationData.bpm,
        audio_url: selectedTrack.file,
        provider: "preset_pool",
        is_mock_audio: true,
        selected_track: selectedTrack.id,
        warning: "Portfolio demo mode: track selected from theme-based preset pool.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Orchestration API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
