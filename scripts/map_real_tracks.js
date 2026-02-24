const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const TRACKS_JSON = path.join(ROOT, "public", "tracks", "tracks_real.json");
const SOURCE_ROOT = path.join(ROOT, "public", "tracks_real_assets");
const AUDIO_EXT = new Set([".mp3", ".wav", ".m4a", ".ogg", ".aac"]);

function listAudioFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => {
      const full = path.join(dir, name);
      return fs.statSync(full).isFile() && AUDIO_EXT.has(path.extname(name).toLowerCase());
    })
    .sort((a, b) => a.localeCompare(b));
}

function main() {
  if (!fs.existsSync(TRACKS_JSON)) {
    throw new Error("Missing public/tracks/tracks_real.json");
  }

  const tracks = JSON.parse(fs.readFileSync(TRACKS_JSON, "utf8"));
  const themes = Array.from(new Set(tracks.map((t) => t.theme)));

  const poolByTheme = {};
  for (const theme of themes) {
    poolByTheme[theme] = listAudioFiles(path.join(SOURCE_ROOT, theme));
  }

  let updated = 0;
  let skipped = 0;
  const counters = {};
  for (const track of tracks) {
    const theme = track.theme;
    const pool = poolByTheme[theme] || [];
    if (pool.length === 0) {
      skipped += 1;
      continue;
    }
    counters[theme] = (counters[theme] || 0) + 1;
    const idx = (counters[theme] - 1) % pool.length;
    const fileName = pool[idx];
    track.file = `/tracks_real_assets/${theme}/${fileName}`;
    track.vocal = true;
    track.tags = Array.from(new Set([...(track.tags || []), "vocal", "real"]));
    updated += 1;
  }

  fs.writeFileSync(TRACKS_JSON, JSON.stringify(tracks, null, 2));

  const report = [
    "Mapped tracks_real.json",
    `source_root: ${SOURCE_ROOT}`,
    `updated: ${updated}`,
    `skipped(no source files): ${skipped}`,
  ];
  for (const theme of themes) {
    report.push(`${theme}: ${(poolByTheme[theme] || []).length} source files`);
  }
  console.log(report.join("\n"));
}

main();

