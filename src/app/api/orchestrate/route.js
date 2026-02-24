import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key");

export async function POST(req) {
    try {
        const { prompt, genre } = await req.json();

        // 1. LLM (Gemini) 프롬프트 구조화 및 컬러/BPM 변환 로직
        const isRandom = !prompt || prompt.trim() === '';
        const userRequest = isRandom ? "랜덤 곡 생성해줘" : prompt;
        const effectiveGenre = genre || 'Jazz';

        const systemPrompt = `너는 전문 음악 프로듀서이자 Stable Audio API / MusicGen 전용 프롬프트 엔지니어다.
사용자의 한국어 요청을 분석 또는 랜덤(테마: ${effectiveGenre})일 경우 가장 트렌디하고 완성도 높은 음악을 위한 영문 상세 프롬프트를 작성해라.
반드시 아래 JSON 형식 그대로만 출력할 것 (마크다운 백틱 없이 순수 JSON만 출력).

{
  "original_input": "${userRequest}",
  "refined_prompt": "[Genre, Mood, Instrumentation, BPM, Mixing style] format english string",
  "target_theme": "${effectiveGenre}",
  "color_code": "[Hex Code matching the mood]",
  "bpm": [number]
}`;

        let orchestrationData = {};

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(systemPrompt);
            const aiResponseText = result.response.text().trim();

            // JSON만 추출하기 위한 정규표현식
            const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                orchestrationData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("No JSON found in AI response");
            }
        } catch (err) {
            console.warn("Gemini Error. Returning mock JSON.", err);
            orchestrationData = {
                "original_input": userRequest,
                "refined_prompt": `[${effectiveGenre}] high quality, studio recording, trending style, upbeat`,
                "target_theme": effectiveGenre,
                "color_code": effectiveGenre === 'Rock' ? '#ff4500' : effectiveGenre === 'Hip-hop' ? '#b967ff' : '#01cdfe',
                "bpm": 120
            };
        }

        // 2. MusicGen (Hugging Face) API 호출
        const hfToken = (process.env.HF_API_KEY || "").trim();
        const hfResponse = await fetch("https://router.huggingface.co/hf-inference/models/facebook/musicgen-small", {
            headers: {
                "Authorization": `Bearer ${hfToken}`,
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify({ inputs: orchestrationData.refined_prompt }),
        });

        if (!hfResponse.ok) {
            const errorText = await hfResponse.text();
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.error && errorJson.error.includes("currently loading") && errorJson.estimated_time) {
                    return new Response(JSON.stringify({
                        status: 'loading',
                        estimated_time: errorJson.estimated_time,
                        message: "🎵 AI 작곡 엔진 부팅 중..."
                    }), { status: 503, headers: { 'Content-Type': 'application/json' } });
                }
            } catch (e) { }
            throw new Error(`Hugging Face API Error: ${errorText}`);
        }

        const arrayBuffer = await hfResponse.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');
        const audioDataUrl = `data:audio/wav;base64,${base64Audio}`;

        return new Response(JSON.stringify({
            ...orchestrationData,
            audio_url: audioDataUrl
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error("Orchestration API Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
