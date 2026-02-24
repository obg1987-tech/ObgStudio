export const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

export class AudioAnalyzer {
  constructor(audioElement, onLipSyncUpdate, onHeadBobUpdate) {
    this.audioElement = audioElement;
    this.onLipSyncUpdate = onLipSyncUpdate;
    this.onHeadBobUpdate = onHeadBobUpdate;

    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 512;

    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);

    this.source = this.audioContext.createMediaElementSource(this.audioElement);
    this.source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    this.animationFrameId = null;
    this.isPlaying = false;
    this.currentLipScale = 0;
    this.currentHeadAngle = 0;
  }

  start() {
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

    const sampleRate = this.audioContext.sampleRate;
    const hzPerBin = (sampleRate / 2) / this.bufferLength;

    const vocalStartBin = Math.floor(200 / hzPerBin);
    const vocalEndBin = Math.floor(2000 / hzPerBin);

    let vocalEnergy = 0;
    for (let i = vocalStartBin; i <= vocalEndBin; i++) {
      vocalEnergy += this.dataArray[i];
    }
    const avgVocalEnergy = vocalEnergy / (vocalEndBin - vocalStartBin + 1);

    let targetLipScale = avgVocalEnergy / 255;
    if (targetLipScale < 0.1) targetLipScale = 0;
    targetLipScale = Math.min(1.0, targetLipScale * 1.5);

    this.currentLipScale = lerp(this.currentLipScale, targetLipScale, 0.2);
    this.onLipSyncUpdate(this.currentLipScale);

    const bassEndBin = Math.floor(150 / hzPerBin);

    let bassEnergy = 0;
    for (let i = 0; i <= bassEndBin; i++) {
      bassEnergy += this.dataArray[i];
    }
    const avgBassEnergy = bassEnergy / (bassEndBin + 1);

    let targetHeadAngle = avgBassEnergy / 255;
    targetHeadAngle *= 0.5;

    this.currentHeadAngle = lerp(this.currentHeadAngle, targetHeadAngle, 0.15);
    this.onHeadBobUpdate(this.currentHeadAngle);

    this.animationFrameId = requestAnimationFrame(this.loop);
  };
}
