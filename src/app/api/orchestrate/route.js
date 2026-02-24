import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key");

const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash"];
const REPLICATE_MODEL = "minimax/music-1.5";
const REPLICATE_POLL_INTERVAL_MS = 2200;
const REPLICATE_MAX_POLLS = 40;

const SAMPLE_RATE = 22050;
const FALLBACK_SECONDS = 45;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

  console.warn("Gemini Error. Returning mock JSON.", lastError);
  return fallbackData;
}

function buildFallbackVoiceText({ prompt, genre }) {
  const base = (prompt || "We make a new sound tonight").replace(/\s+/g, " ").trim();
  return `${genre || "Music"} vibe, here we go. ${base}. Feel the rhythm, feel the night. ${base}.`;
}

function buildReplicateLyrics({ userInput, genre, bpm }) {
  const seedLine = (userInput || "We move under city lights").replace(/\s+/g, " ").trim();
  const short = seedLine.length > 180 ? seedLine.slice(0, 180) : seedLine;
  return [
    "[Verse]",
    `In this ${genre} pulse at ${bpm} bpm, ${short}.`,
    "We rise with the drums and neon skies, no fear tonight.",
    "[Chorus]",
    "Sing it loud, we ride this sound, hearts in overdrive.",
    "Hands up high, we stay alive, in this midnight light.",
    "[Bridge]",
    "One more breath, one more spark, turn the silence into fire.",
    "[Outro]",
    "Fade the stars but keep the beat, we are still on fire.",
  ].join("\n");
}

async function createReplicatePrediction({ token, prompt, lyrics }) {
  const res = await fetch(`https://api.replicate.com/v1/models/${REPLICATE_MODEL}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: {
        prompt,
        lyrics,
        sample_rate: 44100,
        bitrate: 256000,
        audio_format: "mp3",
      },
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Replicate create error [${res.status}]: ${text.slice(0, 400)}`);
  }
  return JSON.parse(text);
}

async function pollReplicatePrediction({ token, getUrl }) {
  let last = null;
  for (let i = 0; i < REPLICATE_MAX_POLLS; i += 1) {
    await sleep(REPLICATE_POLL_INTERVAL_MS);

    const res = await fetch(getUrl, {
      headers: { Authorization: `Token ${token}` },
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Replicate poll error [${res.status}]: ${text.slice(0, 300)}`);
    }
    const data = JSON.parse(text);
    last = data;

    if (data.status === "succeeded") return data;
    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(`Replicate prediction ${data.status}: ${data.error || "unknown"}`);
    }
  }

  throw new Error(`Replicate prediction timed out. Last status: ${last?.status || "unknown"}`);
}

async function generateAudioWithReplicate({ prompt, lyrics, token }) {
  const created = await createReplicatePrediction({ token, prompt, lyrics });
  const finalPred = await pollReplicatePrediction({ token, getUrl: created.urls.get });
  const output = finalPred.output;

  let audioUrl = null;
  if (Array.isArray(output)) audioUrl = output[0];
  else if (typeof output === "string") audioUrl = output;

  if (!audioUrl) {
    throw new Error("Replicate succeeded but did not return audio URL");
  }

  const audioRes = await fetch(audioUrl);
  if (!audioRes.ok) {
    throw new Error(`Replicate audio fetch failed [${audioRes.status}]`);
  }
  const contentType = audioRes.headers.get("content-type") || "audio/mpeg";
  const arrayBuffer = await audioRes.arrayBuffer();
  return {
    audioDataUrl: `data:${contentType};base64,${Buffer.from(arrayBuffer).toString("base64")}`,
    predictionId: finalPred.id,
  };
}

function midiToFreq(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

function hashStringToSeed(text) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function createRng(seed) {
  let state = seed || 1;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function buildWavBase64FromFloat(samples, sampleRate) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  let o = 0;
  const ws = (s) => {
    buffer.write(s, o);
    o += s.length;
  };
  const u32 = (v) => {
    buffer.writeUInt32LE(v, o);
    o += 4;
  };
  const u16 = (v) => {
    buffer.writeUInt16LE(v, o);
    o += 2;
  };

  ws("RIFF");
  u32(36 + dataSize);
  ws("WAVE");
  ws("fmt ");
  u32(16);
  u16(1);
  u16(numChannels);
  u32(sampleRate);
  u32(byteRate);
  u16(blockAlign);
  u16(bitsPerSample);
  ws("data");
  u32(dataSize);

  for (let i = 0; i < samples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(s * 32767), o);
    o += 2;
  }

  return buffer.toString("base64");
}

function renderProceduralSong({ genre, bpm, prompt }) {
  const seconds = FALLBACK_SECONDS;
  const total = SAMPLE_RATE * seconds;
  const mix = new Float32Array(total);
  const beatSec = 60 / Math.max(80, Math.min(170, bpm || 120));
  const seed = hashStringToSeed(`${genre}|${bpm}|${prompt || ""}`);
  const rnd = createRng(seed);

  const progressionByGenre = {
    Jazz: [60, 65, 67, 62],
    Rock: [52, 55, 57, 50],
    "Hip-hop": [45, 48, 43, 41],
    "K-Pop": [57, 62, 64, 55],
    Lullaby: [53, 57, 60, 55],
  };
  const defaultRoots = [60, 57, 65, 62];
  const roots = (progressionByGenre[genre] || defaultRoots).map((r) => r + (rnd() > 0.7 ? 2 : 0));
  const scales = [
    [0, 2, 3, 5, 7, 10, 12],
    [0, 2, 4, 5, 7, 9, 12],
    [0, 3, 5, 7, 10, 12],
  ];
  const scale = scales[Math.floor(rnd() * scales.length)];
  const phraseShift = Math.floor(rnd() * 4);
  const stepsTotal = Math.floor((seconds / beatSec) * 2);
  const melodySteps = new Array(stepsTotal);
  let idx = Math.floor(rnd() * scale.length);
  for (let s = 0; s < stepsTotal; s += 1) {
    const jump = rnd();
    if (jump < 0.2) idx += 2;
    else if (jump < 0.45) idx += 1;
    else if (jump < 0.7) idx -= 1;
    else if (jump < 0.82) idx -= 2;
    if (s % 16 === 0) idx = Math.floor(rnd() * scale.length);
    while (idx < 0) idx += scale.length;
    idx %= scale.length;
    melodySteps[s] = idx;
  }

  const addAt = (sampleIndex, value) => {
    if (sampleIndex >= 0 && sampleIndex < total) mix[sampleIndex] += value;
  };

  for (let i = 0; i < total; i += 1) {
    const t = i / SAMPLE_RATE;
    const beat = t / beatSec;
    const bar = Math.floor(beat / 4);
    const step = Math.floor(beat * 2);
    const rootMidi = roots[(bar + phraseShift) % roots.length];

    const bassFreq = midiToFreq(rootMidi - 12);
    const bassLfo = 0.95 + Math.sin(2 * Math.PI * 0.22 * t) * 0.05;
    mix[i] += Math.sin(2 * Math.PI * bassFreq * t) * 0.17 * bassLfo;

    const noteIndex = melodySteps[step % stepsTotal];
    const leadMidi = rootMidi + scale[noteIndex];
    const leadFreq = midiToFreq(leadMidi);
    const saw = ((t * leadFreq) % 1) * 2 - 1;
    const tri = 2 * Math.abs(2 * ((t * (leadFreq / 2)) % 1) - 1) - 1;
    const gate = (step % 2 === 0 ? 1 : 0.55) * 0.09;
    mix[i] += (0.7 * saw + 0.3 * tri) * gate;

    const vocalStep = Math.floor(beat * 1.5);
    const vocalMidi = rootMidi + 12 + scale[(melodySteps[vocalStep % stepsTotal] + 1) % scale.length];
    const vibrato = Math.sin(2 * Math.PI * 5.3 * t) * 0.012;
    const vocalFreq = midiToFreq(vocalMidi) * (1 + vibrato);
    const phrasePos = (t % (beatSec * 4)) / (beatSec * 4);
    const syllableEnv = Math.max(0, Math.sin(Math.PI * Math.min(1, (phrasePos * 4) % 1)));
    const carrier = Math.sin(2 * Math.PI * vocalFreq * t);
    const f1 = Math.sin(2 * Math.PI * (vocalFreq * 2.2) * t) * 0.35;
    const f2 = Math.sin(2 * Math.PI * (vocalFreq * 3.1) * t) * 0.2;
    mix[i] += (carrier + f1 + f2) * syllableEnv * 0.05;
  }

  const kickLen = Math.floor(SAMPLE_RATE * 0.18);
  const snareLen = Math.floor(SAMPLE_RATE * 0.16);
  const hatLen = Math.floor(SAMPLE_RATE * 0.03);
  const totalBeats = Math.floor(seconds / beatSec);
  for (let b = 0; b < totalBeats; b += 1) {
    const beatStart = Math.floor(b * beatSec * SAMPLE_RATE);

    for (let n = 0; n < kickLen; n += 1) {
      const tt = n / SAMPLE_RATE;
      const env = Math.exp(-tt * 20);
      const f = 120 - tt * 80;
      addAt(beatStart + n, Math.sin(2 * Math.PI * f * tt) * env * 0.7);
    }

    if (b % 4 === 1 || b % 4 === 3) {
      for (let n = 0; n < snareLen; n += 1) {
        const tt = n / SAMPLE_RATE;
        const env = Math.exp(-tt * 28);
        addAt(beatStart + n, (rnd() * 2 - 1) * env * 0.35);
      }
    }

    for (let hh = 0; hh < 2; hh += 1) {
      const hatStart = beatStart + Math.floor(hh * beatSec * 0.5 * SAMPLE_RATE);
      for (let n = 0; n < hatLen; n += 1) {
        const tt = n / SAMPLE_RATE;
        const env = Math.exp(-tt * 120);
        addAt(hatStart + n, (rnd() * 2 - 1) * env * 0.11);
      }
    }
  }

  for (let i = 0; i < total; i += 1) {
    const fade = i > total - SAMPLE_RATE ? (total - i) / SAMPLE_RATE : 1;
    mix[i] = Math.tanh(mix[i] * 1.4) * 0.65 * fade;
  }

  return `data:audio/wav;base64,${buildWavBase64FromFloat(mix, SAMPLE_RATE)}`;
}

export async function POST(req) {
  try {
    const { prompt, genre } = await req.json();

    const isRandom = !prompt || prompt.trim() === "";
    const userRequest = isRandom ? "Generate random music" : prompt;
    const effectiveGenre = genre || "Jazz";

    const systemPrompt = `You are an expert music prompt orchestrator. Build a detailed and production-ready prompt for text-to-music models. Return JSON only.\n\n{\n  \"original_input\": \"${userRequest}\",\n  \"refined_prompt\": \"[Genre, Mood, Instrumentation, BPM, Mixing style] english string\",\n  \"target_theme\": \"${effectiveGenre}\",\n  \"color_code\": \"[Hex Code matching the mood]\",\n  \"bpm\": [number]\n}`;

    const orchestrationData = await generateOrchestrationWithGemini(systemPrompt, {
      original_input: userRequest,
      refined_prompt: `[${effectiveGenre}] high quality, studio recording, trending style, upbeat, vocal song`,
      target_theme: effectiveGenre,
      color_code:
        effectiveGenre === "Rock"
          ? "#ff4500"
          : effectiveGenre === "Hip-hop"
            ? "#b967ff"
            : "#01cdfe",
      bpm: 120,
    });

    const replicateToken = (process.env.REPLICATE_API_TOKEN || "").trim();
    if (!replicateToken) {
      throw new Error("REPLICATE_API_TOKEN is missing");
    }

    const replicateLyrics = buildReplicateLyrics({
      userInput: orchestrationData.original_input,
      genre: orchestrationData.target_theme,
      bpm: orchestrationData.bpm,
    });

    try {
      const rep = await generateAudioWithReplicate({
        prompt: orchestrationData.refined_prompt,
        lyrics: replicateLyrics,
        token: replicateToken,
      });

      return new Response(
        JSON.stringify({
          ...orchestrationData,
          audio_url: rep.audioDataUrl,
          generated_lyrics: replicateLyrics,
          is_mock_audio: false,
          provider: "replicate",
          prediction_id: rep.predictionId,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (repErr) {
      console.error("Replicate generation failed. Returning procedural fallback song.", repErr);
      const repErrorMessage = repErr instanceof Error ? repErr.message : String(repErr);
      const warning = repErrorMessage.includes("Insufficient credit")
        ? "Replicate credit is insufficient. Add billing credit to generate real songs."
        : "Replicate generation failed; procedural fallback song returned.";
      return new Response(
        JSON.stringify({
          ...orchestrationData,
          audio_url: renderProceduralSong({
            genre: orchestrationData.target_theme,
            bpm: orchestrationData.bpm,
            prompt: orchestrationData.refined_prompt,
          }),
          voice_text: buildFallbackVoiceText({
            prompt: orchestrationData.original_input,
            genre: orchestrationData.target_theme,
          }),
          is_mock_audio: true,
          warning,
          provider: "fallback",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Orchestration API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
