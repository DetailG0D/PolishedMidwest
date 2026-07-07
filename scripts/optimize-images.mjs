/**
 * Optimizes photos from the owner's originals folder into src/assets/photos.
 * Originals are never modified. Re-run with:  node scripts/optimize-images.mjs
 *
 * Output files are sized ~1.5–2x their largest display size, then Astro's
 * <Picture> generates responsive WebP (+ JPG fallback) variants at build time.
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = String.raw`C:\Users\domgo\Downloads\Site Files`;
const OUT = fileURLToPath(new URL('../src/assets/photos/', import.meta.url));
const PUB = fileURLToPath(new URL('../public/images/', import.meta.url));

// dest name (SEO keywords — Astro keeps the name in hashed output), source file, max width px
const MANIFEST = [
  // Heroes
  ['hero-detailed-white-toyota-supra.jpg', 'White Supra.JPEG', 2000],
  ['ceramic-gloss-black-cadillac-escalade.jpg', 'IMG_3012.JPEG', 2000],
  // Before/after pairs (originals)
  ['before-dirty-black-honda-civic.jpg', 'IMG_2881.JPEG', 1200],
  ['after-detailed-black-honda-civic.jpg', 'IMG_2882.JPEG', 1200],
  ['before-back-seat-interior.jpg', 'IMG_2008.JPEG', 1000],
  ['after-back-seat-interior.jpg', 'IMG_2026.JPEG', 1000],
  // Owner-made before/after composites
  ['before-after-hard-water-spot-removal.jpg', 'B63CBC07-DDB4-4C44-BAC2-5F13C54FA654.JPEG', 1200],
  ['before-after-wheel-cleaning-bmw.jpg', '196D03D8-E448-485C-B920-F10C59ACC0A1.JPEG', 1200],
  ['before-after-headlight-restoration.jpg', '65AF1F08-5A14-4F36-AB80-263064A5CBC7.jpeg', 1200],
  ['before-after-engine-bay-detail-mercedes.jpg', 'E2E5E5BB-630D-4E32-8E9D-5F09944F92E2_edited.jpg', 1200],
  ['before-after-truck-interior-detail.jpg', 'EB5FB878-BFAF-4FAE-A120-CEE593B8E129.jpeg', 1200],
  ['before-after-gloss-black-wheels-bmw.jpg', 'IMG_9125.jpeg', 1160],
  // Service cards / section imagery
  ['ceramic-coated-hyundai-palisade.jpg', '{E51BA689-0648-4C4C-BE5F-5E1B58485FC1}_edited.jpg', 1423],
  ['luxury-suv-interior-after-detail.jpg', 'IMG_7318_edited.jpg', 1200],
  ['foam-wash-bmw-x7-mobile-detailing.jpg', 'IMG_9103.jpeg', 1000],
  ['detailer-cleaning-bmw-x7-wheel.jpg', 'IMG_9092.jpeg', 1000],
  ['washing-blue-ram-trx.jpg', 'IMG_7054.jpeg', 1000],
  ['polished-midwest-mobile-detailing-van.jpg', 'IMG_0004_edited.png', 1200],
  ['detailed-ram-trx-with-detailing-van.jpg', 'IMG_2564 (1)_edited_edited.jpg', 1536],
  ['ceramic-coated-black-hood-gloss.jpg', '833d17_0214f668304642fd8eec982c2c48df50~mv2.avif', 860],
  ['ceramic-genesis-gv80-gloss.jpg', 'IMG_6907.jpeg', 1200],
  ['ceramic-mercedes-gle-gloss.jpg', 'IMG_0146.JPEG', 1200],
  // Gallery
  ['gallery-red-ford-raptor-detailed.jpg', 'IMG_0081.JPEG', 1200],
  ['gallery-blue-bmw-alpina-b7-detailed.jpg', 'IMG_2497.JPEG', 1200],
  ['gallery-yellow-corvette-stingray-detailed.jpg', 'IMG_2789_edited.jpg', 1200],
  ['gallery-vw-jetta-gli-detailed.jpg', 'IMG_0175_edited_edited.jpg', 1200],
  ['gallery-white-tesla-model-y-detailed.jpg', 'IMG_7657.jpeg', 1200],
  ['gallery-black-ford-expedition-detailed.jpg', 'IMG_0560(1)_edited.jpg', 1200],
  ['gallery-black-ford-f350-detailed.jpg', 'IMG_1769.JPEG', 1200],
  ['gallery-white-bmw-x3-detailed.jpg', 'IMG_7308_edited.jpg', 1200],
  ['gallery-black-mercedes-gle-detailed.jpg', 'IMG_0140.JPEG', 1200],
  ['gallery-black-kia-sorento-detailed.jpg', 'IMG_1644.JPEG', 1200],
];

await mkdir(OUT, { recursive: true });
await mkdir(PUB, { recursive: true });

let total = 0;
for (const [dest, src, maxW] of MANIFEST) {
  const buf = await sharp(path.join(SRC, src))
    .rotate() // bake in EXIF orientation
    .resize({ width: maxW, withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
  await sharp(buf).toFile(path.join(OUT, dest));
  total += buf.length;
  console.log(`${dest}  ${(buf.length / 1024).toFixed(0)}KB`);
}

// ---- Logo (badge PNG with transparency → trimmed WebP for the header/footer)
const LOGO_SRC = String.raw`C:\Users\domgo\Downloads\Untitled design (3)_edited.png`;
const logo = await sharp(LOGO_SRC)
  .trim() // remove transparent padding around the badge
  .resize({ height: 240, withoutEnlargement: true }) // 2x of ~120px max display height
  .webp({ quality: 88, alphaQuality: 90 })
  .toBuffer();
await sharp(logo).toFile(path.join(PUB, 'polished-midwest-logo.webp'));
console.log(`polished-midwest-logo.webp  ${(logo.length / 1024).toFixed(0)}KB`);

// ---- Favicons (from the transparent badge; apple-touch gets a solid dark bg)
const PUB_ROOT = fileURLToPath(new URL('../public/', import.meta.url));
const squareBadge = await sharp(LOGO_SRC).trim().toBuffer();
const bm = await sharp(squareBadge).metadata();
const pad = Math.ceil(Math.max(bm.width, bm.height) * 0.04);
const squared = await sharp(squareBadge)
  .extend({
    top: pad + Math.floor(Math.max(0, bm.width - bm.height) / 2),
    bottom: pad + Math.ceil(Math.max(0, bm.width - bm.height) / 2),
    left: pad + Math.floor(Math.max(0, bm.height - bm.width) / 2),
    right: pad + Math.ceil(Math.max(0, bm.height - bm.width) / 2),
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .toBuffer();
for (const size of [16, 32]) {
  await sharp(squared).resize(size, size).png().toFile(path.join(PUB_ROOT, `logo_${size}.png`));
}
// apple-touch-icon: iOS fills transparency with black arbitrarily — bake in brand-dark bg
await sharp(squared)
  .resize(160, 160)
  .flatten({ background: '#0a0d12' })
  .extend({ top: 10, bottom: 10, left: 10, right: 10, background: '#0a0d12' })
  .png()
  .toFile(path.join(PUB_ROOT, 'logo_180.png'));
// favicon.svg: scalable wrapper around a crisp 192px render of the badge
const fav192 = await sharp(squared).resize(192, 192).png().toBuffer();
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><image width="192" height="192" href="data:image/png;base64,${fav192.toString('base64')}"/></svg>`;
await (await import('node:fs/promises')).writeFile(path.join(PUB_ROOT, 'favicon.svg'), svg);
console.log('favicons: logo_16.png logo_32.png logo_180.png favicon.svg');

// ---- Mobile hero crops (art direction: portrait focal crops for phones)
// Crop boxes are in original-pixel coords; tweak here if the framing needs adjusting.
// 4:5 crops — shown as an in-flow aspect-[4/5] block under the hero text on
// mobile, so what you see here is exactly what renders (no object-fit surprises).
const HERO_CROPS = [
  {
    dest: 'hero-detailed-white-toyota-supra-mobile.jpg',
    src: 'White Supra.JPEG', // 4032x3024, car spans most of the width, front at left-center
    box: { left: 380, top: 560, width: 1970, height: 2464 },
  },
  {
    dest: 'ceramic-gloss-black-cadillac-escalade-mobile.jpg',
    src: 'IMG_3012.JPEG', // 4032x3024, grille/front at left-center
    box: { left: 220, top: 400, width: 2100, height: 2624 },
  },
];
for (const { dest, src, box } of HERO_CROPS) {
  const buf = await sharp(path.join(SRC, src))
    .rotate()
    .extract(box)
    .resize({ width: 900, withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
  await sharp(buf).toFile(path.join(OUT, dest));
  console.log(`${dest}  ${(buf.length / 1024).toFixed(0)}KB`);
}

// Social share image (1200x630) from the hero shot
const og = await sharp(path.join(SRC, 'White Supra.JPEG'))
  .rotate()
  .resize(1200, 630, { fit: 'cover', position: 'attention' })
  .jpeg({ quality: 78, mozjpeg: true })
  .toBuffer();
await sharp(og).toFile(path.join(PUB, 'og-default.jpg'));
console.log(`og-default.jpg  ${(og.length / 1024).toFixed(0)}KB`);
console.log(`\n${MANIFEST.length + 1} files, total ${(total / 1024 / 1024).toFixed(1)}MB in src/assets/photos`);
