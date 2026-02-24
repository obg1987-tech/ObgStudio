const fs = require('fs');
const path = require('path');

const sampleRate = 22050;
const durationSec = 8;
const totalSamples = sampleRate * durationSec;

const themes = [
  { id: 'rock', bpm: [120, 150], roots: [40, 43, 45, 38], scale: [0,2,3,5,7,10,12], drive: 0.9 },
  { id: 'hiphop', bpm: [78, 100], roots: [33, 36, 31, 29], scale: [0,3,5,7,10,12], drive: 0.75 },
  { id: 'kpop', bpm: [105, 132], roots: [48, 53, 55, 46], scale: [0,2,4,5,7,9,11,12], drive: 0.8 },
  { id: 'lullaby', bpm: [68, 88], roots: [45, 48, 50, 43], scale: [0,2,4,7,9,12], drive: 0.45 },
  { id: 'jazz', bpm: [95, 128], roots: [48, 53, 55, 50], scale: [0,2,3,5,7,10,12], drive: 0.65 },
];

function midiToFreq(m) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

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
    let s = Math.max(-1, Math.min(1, floatSamples[i]));
    buf.writeInt16LE(Math.round(s * 32767), o);
    o += 2;
  }

  fs.writeFileSync(filePath, buf);
}

function generateTrack(theme, index) {
  const seed = (theme.id.length * 131 + index * 7919) >>> 0;
  const rnd = makeRng(seed);
  const bpm = Math.floor(theme.bpm[0] + rnd() * (theme.bpm[1] - theme.bpm[0]));
  const beat = 60 / bpm;

  const mix = new Float32Array(totalSamples);
  const stepCount = Math.floor(durationSec / (beat / 2));
  const melody = new Array(stepCount);
  let noteIdx = Math.floor(rnd() * theme.scale.length);
  for (let s = 0; s < stepCount; s++) {
    const r = rnd();
    if (r < 0.2) noteIdx += 2;
    else if (r < 0.5) noteIdx += 1;
    else if (r < 0.75) noteIdx -= 1;
    else if (r < 0.88) noteIdx -= 2;
    while (noteIdx < 0) noteIdx += theme.scale.length;
    noteIdx %= theme.scale.length;
    melody[s] = noteIdx;
  }

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const b = t / beat;
    const bar = Math.floor(b / 4);
    const step = Math.floor(b * 2) % stepCount;
    const rootMidi = theme.roots[bar % theme.roots.length];

    const bassFreq = midiToFreq(rootMidi - 12);
    const bass = Math.sin(2 * Math.PI * bassFreq * t) * 0.17 * theme.drive;
    mix[i] += bass;

    const leadMidi = rootMidi + theme.scale[melody[step]];
    const leadFreq = midiToFreq(leadMidi + (theme.id === 'kpop' ? 12 : 0));
    const saw = ((t * leadFreq) % 1) * 2 - 1;
    const tri = 2 * Math.abs(2 * ((t * (leadFreq / 2)) % 1) - 1) - 1;
    const gate = (step % 2 === 0 ? 0.12 : 0.07) * theme.drive;
    mix[i] += (0.65 * saw + 0.35 * tri) * gate;

    if (theme.id !== 'lullaby') {
      const vocalFreq = midiToFreq(leadMidi + 5);
      const vib = Math.sin(2 * Math.PI * 5 * t) * 0.012;
      const carrier = Math.sin(2 * Math.PI * vocalFreq * (1 + vib) * t);
      const form = Math.sin(2 * Math.PI * (vocalFreq * 2.3) * t) * 0.3;
      mix[i] += (carrier + form) * 0.028;
    }
  }

  const kickLen = Math.floor(sampleRate * 0.15);
  const snareLen = Math.floor(sampleRate * 0.12);
  const hatLen = Math.floor(sampleRate * 0.025);
  const totalBeats = Math.floor(durationSec / beat);

  for (let bi = 0; bi < totalBeats; bi++) {
    const beatStart = Math.floor(bi * beat * sampleRate);
    for (let n = 0; n < kickLen; n++) {
      const tt = n / sampleRate;
      const env = Math.exp(-tt * (theme.id === 'lullaby' ? 14 : 20));
      const f = 115 - tt * 70;
      const idx = beatStart + n;
      if (idx < totalSamples) mix[idx] += Math.sin(2 * Math.PI * f * tt) * env * 0.55;
    }

    if (bi % 4 === 1 || bi % 4 === 3) {
      for (let n = 0; n < snareLen; n++) {
        const tt = n / sampleRate;
        const env = Math.exp(-tt * 24);
        const idx = beatStart + n;
        if (idx < totalSamples) mix[idx] += (rnd() * 2 - 1) * env * (theme.id === 'lullaby' ? 0.08 : 0.2);
      }
    }

    for (let hh = 0; hh < 2; hh++) {
      const hs = beatStart + Math.floor(hh * beat * 0.5 * sampleRate);
      for (let n = 0; n < hatLen; n++) {
        const tt = n / sampleRate;
        const env = Math.exp(-tt * 110);
        const idx = hs + n;
        if (idx < totalSamples) mix[idx] += (rnd() * 2 - 1) * env * (theme.id === 'lullaby' ? 0.03 : 0.08);
      }
    }
  }

  for (let i = 0; i < totalSamples; i++) {
    const fadeIn = Math.min(1, i / (sampleRate * 0.08));
    const fadeOut = i > totalSamples - sampleRate * 0.2 ? (totalSamples - i) / (sampleRate * 0.2) : 1;
    mix[i] = Math.tanh(mix[i] * 1.3) * 0.68 * fadeIn * fadeOut;
  }

  return { samples: mix, bpm };
}

const root = path.join(process.cwd(), 'public', 'tracks');
fs.mkdirSync(root, { recursive: true });

const metadata = [];
for (const theme of themes) {
  const dir = path.join(root, theme.id);
  fs.mkdirSync(dir, { recursive: true });
  for (let i = 1; i <= 20; i++) {
    const { samples, bpm } = generateTrack(theme, i);
    const name = `${theme.id}-${String(i).padStart(2, '0')}.wav`;
    const filePath = path.join(dir, name);
    writeWav(filePath, samples);
    metadata.push({
      id: `${theme.id}-${String(i).padStart(2, '0')}`,
      theme: theme.id,
      title: `${theme.id.toUpperCase()} Track ${String(i).padStart(2, '0')}`,
      bpm,
      file: `/tracks/${theme.id}/${name}`,
      license: 'Generated by ObgStudio script (original asset)'
    });
  }
}

fs.writeFileSync(path.join(root, 'tracks.json'), JSON.stringify(metadata, null, 2));
fs.writeFileSync(path.join(root, 'LICENSE.md'), [
  '# Track License',
  '',
  'All files in this folder were generated programmatically by project scripts.',
  'They are original assets for this portfolio project.',
  'No third-party copyrighted audio is included.',
].join('\n'));

console.log('Generated tracks:', metadata.length);
