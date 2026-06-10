import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const logoPath = path.join(root, "public/brand/pitch-patch-logo-v4.png");
const outputPath = path.join(root, "public/brand/pitch-patch-grow.gif");

const size = 560;
const groundY = 412;
const frameCount = 42;
const delay = 48;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const easeOutBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function baseSvg(progress) {
  const sprout = clamp((progress - 0.12) / 0.48);
  const leaf = clamp((progress - 0.34) / 0.34);
  const bloom = clamp((progress - 0.42) / 0.42);
  const stemTop = groundY - 40 - 142 * easeInOut(sprout);
  const leafScale = easeOutBack(leaf);
  const glowOpacity = 0.06 + bloom * 0.18;

  return Buffer.from(`
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="skyGlow" cx="50%" cy="38%" r="55%">
          <stop offset="0%" stop-color="#fff7ed"/>
          <stop offset="60%" stop-color="#fff1f2"/>
          <stop offset="100%" stop-color="#ffe4e6"/>
        </radialGradient>
        <linearGradient id="stem" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#34d399"/>
          <stop offset="100%" stop-color="#16a34a"/>
        </linearGradient>
        <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="9"/>
          <feOffset dx="0" dy="12" result="offset"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.16"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <rect width="560" height="560" rx="0" fill="url(#skyGlow)"/>
      <circle cx="280" cy="250" r="${130 + 26 * bloom}" fill="#fda4af" opacity="${glowOpacity}"/>
      <ellipse cx="280" cy="426" rx="${68 + 30 * sprout}" ry="16" fill="#881337" opacity="0.12"/>
      <path d="M280 ${groundY + 6} C275 ${groundY - 32}, 277 ${stemTop + 54}, 280 ${stemTop}"
        fill="none" stroke="url(#stem)" stroke-width="18" stroke-linecap="round" filter="url(#softShadow)"/>
      <g transform="translate(280 ${stemTop + 68}) scale(${leafScale})">
        <path d="M-7 8 C-76 -34, -98 -86, -22 -62 C20 -50, 19 -11, -7 8Z" fill="#86efac"/>
        <path d="M10 6 C82 -38, 105 -84, 27 -63 C-17 -51, -17 -10, 10 6Z" fill="#4ade80"/>
      </g>
    </svg>
  `);
}

function soilSvg(progress) {
  const crack = clamp((progress - 0.04) / 0.28);

  return Buffer.from(`
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="soil" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#92400e"/>
          <stop offset="58%" stop-color="#78350f"/>
          <stop offset="100%" stop-color="#451a03"/>
        </linearGradient>
      </defs>
      <path d="M0 416 C82 389, 139 419, 219 397 C306 374, 374 398, 459 390 C501 386, 535 395, 560 405 L560 560 L0 560 Z"
        fill="url(#soil)"/>
      <path d="M122 438 C163 428, 192 446, 231 432" fill="none" stroke="#fbbf24" stroke-width="6" stroke-linecap="round" opacity="0.26"/>
      <path d="M356 432 C395 421, 431 439, 476 424" fill="none" stroke="#fbbf24" stroke-width="6" stroke-linecap="round" opacity="0.2"/>
      <path d="M244 407 C263 ${405 - 13 * crack}, 299 ${405 - 14 * crack}, 318 407"
        fill="none" stroke="#3f0f1f" stroke-width="${4 + 4 * crack}" stroke-linecap="round" opacity="${0.18 + 0.42 * crack}"/>
    </svg>
  `);
}

async function makeFrame(index) {
  const progress = index / (frameCount - 1);
  const logoProgress = clamp((progress - 0.24) / 0.62);
  const logoEase = easeOutBack(logoProgress);
  const logoSize = Math.round(52 + 278 * logoEase);
  const logoTop = Math.round(groundY + 54 - logoSize - 188 * easeInOut(logoProgress));
  const logoLeft = Math.round((size - logoSize) / 2);
  const opacity = clamp((progress - 0.18) / 0.24);

  const logo = await sharp(logoPath)
    .resize(logoSize, logoSize, { fit: "contain" })
    .modulate({ brightness: 1 + 0.04 * logoProgress, saturation: 1.03 })
    .ensureAlpha(opacity)
    .png()
    .toBuffer();

  return sharp(baseSvg(progress))
    .composite([
      { input: logo, left: logoLeft, top: logoTop },
      { input: soilSvg(progress), left: 0, top: 0 },
    ])
    .png()
    .toBuffer();
}

await mkdir(path.dirname(outputPath), { recursive: true });

const frames = [];
for (let index = 0; index < frameCount; index += 1) {
  frames.push(await makeFrame(index));
}

await sharp(frames, { join: { animated: true } })
  .gif({
    delay: Array.from({ length: frames.length }, () => delay),
    dither: 0.72,
    effort: 7,
    loop: 0,
  })
  .toFile(outputPath);

console.log(`Generated ${outputPath}`);
