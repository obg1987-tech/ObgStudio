import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key");

export async function POST(req) {
    try {
        const { prompt, genre } = await req.json();

        // 1. LLM (Gemini) 프롬프트 구조화 및 컬러/BPM 변환 로직
        const isRandom = !prompt || prompt.trim() === '';
        const userRequest = isRandom ? "랜덤 곡 생성해줘" : prompt;

        const systemPrompt = `너는 전문 음악 프로듀서이자 Stable Audio API / MusicGen 전용 프롬프트 엔지니어다.
사용자의 한국어 요청을 분석 또는 랜덤(테마: ${genre})일 경우 가장 트렌디하고 완성도 높은 음악을 위한 영문 상세 프롬프트를 작성해라.
반드시 아래 JSON 형식 그대로만 출력할 것 (마크다운 백틱 없이 순수 JSON만 출력).

{
  "original_input": "${userRequest}",
  "refined_prompt": "[Genre, Mood, Instrumentation, BPM, Mixing style] format english string",
  "target_theme": "${genre}",
  "color_code": "[Hex Code matching the mood]",
  "bpm": [number]
}`;

        let orchestrationData = {};

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(systemPrompt);
            const aiResponseText = result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
            orchestrationData = JSON.parse(aiResponseText);
        } catch (err) {
            // Fallback for missing API Key or Model Error
            console.warn("Gemini Error or missing Key. Returning mock JSON.", err);
            orchestrationData = {
                "original_input": userRequest,
                "refined_prompt": `[${genre}] high quality, studio recording, trending style, upbeat`,
                "target_theme": genre,
                "color_code": genre === 'Rock' ? '#ff4500' : genre === 'Hip-hop' ? '#b967ff' : '#01cdfe',
                "bpm": 120
            };
        }

        // 2. MusicGen (Hugging Face) 또는 Stable Audio API 호출 (예시)
        // 실제 오디오 생성을 위한 부분입니다. 
        // const hfResponse = await fetch("https://api-inference.huggingface.co/models/facebook/musicgen-small", {
        //   headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` },
        //   method: "POST",
        //   body: JSON.stringify({ inputs: orchestrationData.refined_prompt }),
        // });
        // const audioBlob = await hfResponse.blob();
        // const audioUrl = ...

        // 이 과제는 '시스템 구축' 목적이므로, 무료 저작권 모의(Mock) URL로 대신 처리합니다.
        await new Promise(r => setTimeout(r, 1000));
        const mockAudioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

        return new Response(JSON.stringify({
            ...orchestrationData,
            audio_url: mockAudioUrl
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error("Orchestration API Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
