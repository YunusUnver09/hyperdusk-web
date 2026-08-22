import fs from 'fs';
import path from 'path';

const srcPaths = [
  'C:/Users/Gaming/Desktop/sfx/orbital strike.mp3',
  'C:/Users/Gaming/Desktop/sfx/yörünge darbesi.mp3',
  path.resolve('../sfx/orbital strike.mp3'),
  path.resolve('../sfx/yörünge darbesi.mp3')
];

let src = null;
for (const p of srcPaths) {
  if (fs.existsSync(p)) {
    src = p;
    break;
  }
}

if (!src) {
  console.error('Source sound file not found!');
  process.exit(1);
}

console.log('Found source file at:', src);

// 1. Copy to public/audio
fs.mkdirSync(path.resolve('public/audio'), { recursive: true });
fs.copyFileSync(src, path.resolve('public/audio/orbital_strike.mp3'));

// 2. Copy to docs/audio
fs.mkdirSync(path.resolve('docs/audio'), { recursive: true });
fs.copyFileSync(src, path.resolve('docs/audio/orbital_strike.mp3'));

// 3. Generate base64 asset
const buf = fs.readFileSync(src);
const b64 = buf.toString('base64');
const assetContent = `// Auto-generated Orbital Strike Sound Asset
export const ORBITAL_STRIKE_SFX_DATA_URI = "data:audio/mp3;base64,${b64}";
export default ORBITAL_STRIKE_SFX_DATA_URI;
`;

fs.mkdirSync(path.resolve('src/assets'), { recursive: true });
fs.writeFileSync(path.resolve('src/assets/orbitalStrikeAsset.ts'), assetContent, 'utf-8');

console.log(`Successfully generated orbitalStrikeAsset.ts (${(b64.length / 1024).toFixed(1)} KB)`);
