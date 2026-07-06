// One-off: build labeled contact sheets of every image in the Site Files
// folder so each photo can be visually reviewed. Outputs to the scratchpad.
import sharp from 'sharp';
import { readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SRC = String.raw`C:\Users\domgo\Downloads\Site Files`;
const OUT = process.argv[2];
if (!OUT) throw new Error('pass output dir');
await mkdir(OUT, { recursive: true });

const exts = new Set(['.jpg', '.jpeg', '.png', '.avif', '.heic', '.webp']);
const files = (await readdir(SRC)).filter((f) => exts.has(path.extname(f).toLowerCase())).sort();

const CELL_W = 440;
const IMG_H = 300;
const LABEL_H = 34;
const CELL_H = IMG_H + LABEL_H;
const COLS = 2;
const ROWS = 3;

const meta = [];
const cells = [];
for (let i = 0; i < files.length; i++) {
  const f = files[i];
  const p = path.join(SRC, f);
  try {
    const m = await sharp(p).metadata();
    // account for EXIF rotation
    const rotated = (m.orientation || 1) >= 5;
    const w = rotated ? m.height : m.width;
    const h = rotated ? m.width : m.height;
    meta.push({ idx: i, file: f, width: w, height: h, orientation: w >= h ? 'landscape' : 'portrait' });
    const thumb = await sharp(p)
      .rotate()
      .resize(CELL_W, IMG_H, { fit: 'contain', background: '#222' })
      .jpeg({ quality: 70 })
      .toBuffer();
    const label = Buffer.from(
      `<svg width="${CELL_W}" height="${LABEL_H}"><rect width="100%" height="100%" fill="#000"/><text x="6" y="23" font-family="Arial" font-size="17" fill="#fff">#${i} ${f.slice(0, 40)} ${w}x${h}</text></svg>`
    );
    cells.push({ idx: i, thumb, label });
  } catch (e) {
    meta.push({ idx: i, file: f, error: String(e.message).slice(0, 120) });
  }
}

let sheetNo = 0;
for (let s = 0; s < cells.length; s += COLS * ROWS) {
  const batch = cells.slice(s, s + COLS * ROWS);
  const composites = [];
  batch.forEach((c, j) => {
    const x = (j % COLS) * CELL_W;
    const y = Math.floor(j / COLS) * CELL_H;
    composites.push({ input: c.thumb, left: x, top: y });
    composites.push({ input: c.label, left: x, top: y + IMG_H });
  });
  await sharp({
    create: { width: COLS * CELL_W, height: ROWS * CELL_H, channels: 3, background: '#222' },
  })
    .composite(composites)
    .jpeg({ quality: 72 })
    .toFile(path.join(OUT, `sheet-${String(sheetNo++).padStart(2, '0')}.jpg`));
}

await writeFile(path.join(OUT, 'meta.json'), JSON.stringify(meta, null, 1));
console.log(`files: ${files.length}, sheets: ${sheetNo}`);
console.log(meta.filter((m) => m.error).map((m) => `${m.file}: ${m.error}`).join('\n') || 'no read errors');
