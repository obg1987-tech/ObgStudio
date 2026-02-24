// src/lib/MusicEngine.js

// 간단한 보간(lerp) 함수
export const lerp = (start, end, amt) => {
  return (1 - amt) * start + amt * end;
};

/**
 * 장르에 맞춰 로봇 컨셉(귀엽고 미래지향적)의 가사를 생성합니다.
 * 실제 프로덕션 단계에서는 Gemini API, OpenAI API 등을 연동할 수 있습니다.
 */
export const generateLyrics = async (genre) => {
  // 실제 LLM 연동을 위한 모의 지연 (1초)
  await new Promise(resolve => setTimeout(resolve, 1000));

  const prompts = {
    "Rock": "🎸 위잉 파직! 내 심장은 티타늄 드럼\n기름칠 따윈 필요 없어, 메인보드에 불을 붙여!\n삐리비빅 전압을 높여, 내 볼트는 이미 풀렸다!\n일렉트릭 쇼크, 무한 루프 속에 날 던져!",
    "Hip-hop": "🎧 요! 비트 위를 미끄러지는 내 크롬 바디\n데이터 트래픽 다 뚫고 지나가는 쿼드코어 박자\n배터리 1프로라도 끝장 볼 때까지\n미래에서 온 내 플로우, 에러 따윈 없지!",
    "Pop": "🎤 안녕? 내 메모리엔 너의 미소가 가득해\n0과 1로 쓰인 하트, 깜빡이는 LED\n구름 서버 위로 우리 같이 날아볼까?\n삐빅, 사랑의 알고리즘은 이미 컴파일 완료!",
    "EDM": "🎧 시스템 풀가동! 레이저 빔 빰빰!\n에너지율 200퍼센트, 우주로 쏘아 올려!\n모든 코어가 춤을 춰, 클럭 수를 최대로!\n미래의 비트를 느껴봐, 드롭 온 더 클라우드!"
  };

  return prompts[genre] || prompts["Pop"];
};

/**
 * ElevenLabs Music API (또는 TTS)를 통해 노래를 생성하고 스트림 URL을 반환합니다.
 */
export const generateMusic = async (lyrics, genre) => {
  // ElevenLabs API 연동 스니펫 (환경변수에 ELEVENLABS_API_KEY가 필요합니다)
  /*
  const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID', {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: lyrics,
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    })
  });
  
  if (!response.ok) throw new Error("Audio generation failed");
  const arrayBuffer = await response.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
  return URL.createObjectURL(blob);
  */

  // 위 API 연동 전 테스트를 위한 모의(Mock) 오디오 객체 반환 로직
  // 실제 연동 시 위 주석을 풀고 아래 모의 로직을 대체하세요.
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 무료 저작권 오디오 샘플 URL을 사용하여 동작 테스트를 할 수 있도록 합니다.
  return "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"; 
};

/**
 * 오디오 분석기(Audio Analyzer) 셋업 및 립싱크 / 헤드바빙 컨트롤
 */
export class AudioAnalyzer {
  constructor(audioElement, onLipSyncUpdate, onHeadBobUpdate) {
    this.audioElement = audioElement;
    this.onLipSyncUpdate = onLipSyncUpdate;
    this.onHeadBobUpdate = onHeadBobUpdate;

    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    
    // 분석 설정
    this.analyser.fftSize = 512;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);

    // 오디오 소스 연결
    this.source = this.audioContext.createMediaElementSource(this.audioElement);
    this.source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    this.animationFrameId = null;
    this.isPlaying = false;
    
    // 보간을 위한 현재 상태값
    this.currentLipScale = 0;
    this.currentHeadAngle = 0;
  }

  start() {
    // AudioContext가 Suspended 상태일 때 깨우기 (브라우저 정책 대응)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    this.isPlaying = true;
    this.loop();
  }

  stop() {
    this.isPlaying = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.currentLipScale = 0;
    this.currentHeadAngle = 0;
    this.onLipSyncUpdate(this.currentLipScale);
    this.onHeadBobUpdate(this.currentHeadAngle);
  }

  loop = () => {
    if (!this.isPlaying) return;

    this.analyser.getByteFrequencyData(this.dataArray);

    // 샘플링 레이트 산출 (대략 44100Hz 기준)
    const sampleRate = this.audioContext.sampleRate;
    const hzPerBin = (sampleRate / 2) / this.bufferLength; 

    // 1. 보컬 영역 (200Hz ~ 2000Hz) 계산 -> 립싱크(입 스케일)에 사용
    const vocalStartBin = Math.floor(200 / hzPerBin);
    const vocalEndBin = Math.floor(2000 / hzPerBin);
    
    let vocalEnergy = 0;
    for (let i = vocalStartBin; i <= vocalEndBin; i++) {
        vocalEnergy += this.dataArray[i];
    }
    const avgVocalEnergy = vocalEnergy / (vocalEndBin - vocalStartBin + 1);
    
    // 0~255 값을 0.0 ~ 1.0 비율로 변환
    let targetLipScale = avgVocalEnergy / 255;
    
    // 노이즈 캔슬링: 에너지가 너무 작으면 0으로 무시
    if (targetLipScale < 0.1) targetLipScale = 0;
    // 입이 벌어지는 증폭률
    targetLipScale = Math.min(1.0, targetLipScale * 1.5); 

    // 부드러운 움직임을 위해 보간(lerp) 적용
    this.currentLipScale = lerp(this.currentLipScale, targetLipScale, 0.2);
    this.onLipSyncUpdate(this.currentLipScale);

    // 2. 베이스/저역대 영역 (20Hz ~ 150Hz) 계산 -> 고개 까딱이기(Head Bobbing)에 사용
    const bassEndBin = Math.floor(150 / hzPerBin);
    
    let bassEnergy = 0;
    for (let i = 0; i <= bassEndBin; i++) {
        bassEnergy += this.dataArray[i];
    }
    const avgBassEnergy = bassEnergy / (bassEndBin + 1);
    
    let targetHeadAngle = (avgBassEnergy / 255); // 0.0 ~ 1.0
    // 고개를 흔드는 강도 (최대 15도 ~ 20도 등 렌더러에 맞춰 보정)
    targetHeadAngle = targetHeadAngle * 0.5;

    this.currentHeadAngle = lerp(this.currentHeadAngle, targetHeadAngle, 0.15);
    this.onHeadBobUpdate(this.currentHeadAngle);

    // 다음 프레임 요청
    this.animationFrameId = requestAnimationFrame(this.loop);
  }
}
