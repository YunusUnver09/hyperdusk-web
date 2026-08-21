import fs from 'fs';
import path from 'path';

const srcPath = 'C:/Users/Gaming/Desktop/CS theme/Spacell _Madness(Looping).ogg';
const destPublic = path.resolve('public', 'audio', 'spacell_madness.ogg');

if (fs.existsSync(srcPath)) {
  fs.copyFileSync(srcPath, destPublic);
  const buffer = fs.readFileSync(srcPath);
  const base64 = buffer.toString('base64');
  const dataUri = `data:audio/ogg;base64,${base64}`;

  const content = `// Auto-generated base64 BGM asset for Spacell Madness Looping
export const BGM_DATA_URI = "${dataUri}";
export const BGM_LOOP_START = 28.0;
export default BGM_DATA_URI;
`;
  fs.writeFileSync(path.resolve('src', 'assets', 'bgmAsset.ts'), content, 'utf-8');
  console.log(`Successfully encoded Spacell Madness (${(buffer.length / 1024).toFixed(1)} KB)`);
} else {
  console.error('Source audio not found:', srcPath);
}
