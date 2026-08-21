import fs from 'fs';
import path from 'path';

let audioPath = path.resolve('public', 'audio', 'crush_space.ogg');
let mimeType = 'audio/ogg';

if (!fs.existsSync(audioPath)) {
  audioPath = path.resolve('public', 'audio', 'crush_space.mp3');
  mimeType = 'audio/mp3';
}

if (fs.existsSync(audioPath)) {
  const buffer = fs.readFileSync(audioPath);
  const base64 = buffer.toString('base64');
  const dataUri = `data:${mimeType};base64,${base64}`;
  
  const fileContent = `// Auto-generated base64 BGM asset for Crush Space (Loop point: 28.0s)
export const BGM_DATA_URI = "${dataUri}";
export const BGM_LOOP_START = 28.0;
export default BGM_DATA_URI;
`;
  fs.writeFileSync(path.resolve('src', 'assets', 'bgmAsset.ts'), fileContent, 'utf-8');
  console.log(`Successfully generated src/assets/bgmAsset.ts (${(dataUri.length / 1024).toFixed(1)} KB, mime: ${mimeType})`);
} else {
  console.error('Audio file not found at', audioPath);
}
