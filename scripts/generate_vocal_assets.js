const fs = require('fs');
const path = require('path');

const sampleRate = 22050;
const durationSec = 10;
const totalSamples = sampleRate * durationSec;

const themes = [
  { id: 'rock', bpm: [118, 146], roots: [40, 43, 45, 38], scale: [0,2,3,5,7,10,12], drive: 0.9, vowel: [700,1200,2600] },
  { id: 'hiphop', bpm: [76, 98], roots: [33, 36, 31, 29], scale: [0,3,5,7,10,12], drive: 0.75, vowel: [500,1100,2300] },
  { id: 'kpop', bpm: [104, 132], roots: [48, 53, 55, 46], scale: [0,2,4,5,7,9,11,12], drive: 0.82, vowel: [800,1400,2900] },
  { id: 'lullaby', bpm: [66, 86], roots: [45, 48, 50, 43], scale: [0,2,4,7,9,12], drive: 0.45, vowel: [600,1000,2200] },
  { id: 'jazz', bpm: [92, 126], roots: [48, 53, 55, 50], scale: [0,2,3,5,7,10,12], drive: 0.68, vowel: [650,1250,2550] },
];

function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }
function rng(seed){ let s=seed>>>0; return ()=>{ s=(1664525*s+1013904223)>>>0; return s/4294967296; }; }

function writeWav(filePath, floatSamples) {
  const bitsPerSample = 16;
  const channels = 1;
  const blockAlign = channels * bitsPerSample / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = floatSamples.length * 2;
  const buf = Buffer.alloc(44 + dataSize);
  let o = 0;
  const ws = (v) => { buf.write(v, o); o += v.length; };
  const u32 = (v) => { buf.writeUInt32LE(v, o); o += 4; };
  const u16 = (v) => { buf.writeUInt16LE(v, o); o += 2; };
  ws('RIFF'); u32(36 + dataSize); ws('WAVE');
  ws('fmt '); u32(16); u16(1); u16(channels);
  u32(sampleRate); u32(byteRate); u16(blockAlign); u16(bitsPerSample);
  ws('data'); u32(dataSize);
  for (let i = 0; i < floatSamples.length; i++) {
    const s = Math.max(-1, Math.min(1, floatSamples[i]));
    buf.writeInt16LE(Math.round(s * 32767), o);
    o += 2;
  }
  fs.writeFileSync(filePath, buf);
}

function genThemeTrack(theme, index){
  const r = rng((theme.id.length * 971 + index * 6151) >>> 0);
  const bpm = Math.floor(theme.bpm[0] + r() * (theme.bpm[1] - theme.bpm[0]));
  const beat = 60 / bpm;
  const out = new Float32Array(totalSamples);

  const steps = Math.floor(durationSec / (beat / 2));
  const melody = [];
  let ni = Math.floor(r()*theme.scale.length);
  for(let s=0;s<steps;s++){
    const k=r();
    if(k<0.22) ni+=2; else if(k<0.5) ni+=1; else if(k<0.75) ni-=1; else if(k<0.88) ni-=2;
    while(ni<0) ni+=theme.scale.length;
    ni%=theme.scale.length;
    melody.push(ni);
  }

  for(let i=0;i<totalSamples;i++){
    const t=i/sampleRate;
    const b=t/beat;
    const bar=Math.floor(b/4);
    const step=Math.floor(b*2)%steps;
    const root=theme.roots[bar%theme.roots.length];

    // backing
    const bass = Math.sin(2*Math.PI*midiToFreq(root-12)*t)*0.16*theme.drive;
    const leadFreq = midiToFreq(root + theme.scale[melody[step]] + (theme.id==='kpop'?12:0));
    const saw = ((t*leadFreq)%1)*2-1;
    const tri = 2*Math.abs(2*((t*(leadFreq/2))%1)-1)-1;
    const gate=(step%2===0?0.12:0.075)*theme.drive;
    out[i]+=bass + (0.65*saw+0.35*tri)*gate;

    // vocal-like carrier + formants (stronger than before)
    const phraseStep=Math.floor(b*1.25)%steps;
    const vocalMidi = root + 7 + theme.scale[melody[phraseStep]];
    const f0 = midiToFreq(vocalMidi) * (1 + Math.sin(2*Math.PI*5.2*t)*0.01);
    const syllable = Math.max(0, Math.sin(Math.PI * ((t/beat*0.75)%1)));
    const pulse = (Math.floor((t/beat))%2===0?1:0.55);

    const c = Math.sin(2*Math.PI*f0*t);
    const f1 = Math.sin(2*Math.PI*theme.vowel[0]*t) * c;
    const f2 = Math.sin(2*Math.PI*theme.vowel[1]*t) * c;
    const f3 = Math.sin(2*Math.PI*theme.vowel[2]*t) * c;
    out[i] += (0.45*c + 0.28*f1 + 0.18*f2 + 0.12*f3) * 0.22 * syllable * pulse;
  }

  // drums
  const kickLen = Math.floor(sampleRate*0.15);
  const snLen = Math.floor(sampleRate*0.12);
  const hhLen = Math.floor(sampleRate*0.025);
  const beats=Math.floor(durationSec/beat);
  for(let bi=0;bi<beats;bi++){
    const bs=Math.floor(bi*beat*sampleRate);
    for(let n=0;n<kickLen;n++){
      const tt=n/sampleRate; const env=Math.exp(-tt*(theme.id==='lullaby'?12:19));
      const f=110-tt*65; const idx=bs+n; if(idx<totalSamples) out[idx]+=Math.sin(2*Math.PI*f*tt)*env*0.5;
    }
    if(bi%4===1 || bi%4===3){
      for(let n=0;n<snLen;n++){
        const tt=n/sampleRate; const env=Math.exp(-tt*24); const idx=bs+n;
        if(idx<totalSamples) out[idx]+=(r()*2-1)*env*(theme.id==='lullaby'?0.07:0.18);
      }
    }
    for(let hh=0;hh<2;hh++){
      const hs=bs+Math.floor(hh*beat*0.5*sampleRate);
      for(let n=0;n<hhLen;n++){
        const tt=n/sampleRate; const env=Math.exp(-tt*110); const idx=hs+n;
        if(idx<totalSamples) out[idx]+=(r()*2-1)*env*(theme.id==='lullaby'?0.025:0.07);
      }
    }
  }

  for(let i=0;i<totalSamples;i++){
    const fi=Math.min(1, i/(sampleRate*0.08));
    const fo=i>totalSamples-sampleRate*0.2 ? (totalSamples-i)/(sampleRate*0.2) : 1;
    out[i]=Math.tanh(out[i]*1.25)*0.72*fi*fo;
  }

  return { samples: out, bpm };
}

const root = path.join(process.cwd(), 'public', 'tracks_real_assets');
fs.mkdirSync(root, { recursive: true });

for(const theme of themes){
  const dir=path.join(root, theme.id);
  fs.mkdirSync(dir, { recursive: true });
  for(let i=1;i<=20;i++){
    const {samples} = genThemeTrack(theme, i);
    const name=`${theme.id}-vocal-${String(i).padStart(2,'0')}.wav`;
    writeWav(path.join(dir,name), samples);
  }
}

console.log('Generated vocal assets: 100');
