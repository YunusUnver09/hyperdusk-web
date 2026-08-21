import fs from 'fs';
import path from 'path';

const audioPath = path.resolve('public', 'audio', 'crush_space.mp3');
if (fs.existsSync(audioPath)) {
  const buffer = fs.readFileSync(audioPath);
  const base64 = buffer.toString('base64');
  const dataUri = `data:audio/mp3;base64,${base64}`;
  
  const fileContent = `// Auto-generated base64 BGM asset for Crush Space (Universal MP3)
export const BGM_DATA_URI = "${dataUri}";
export const BGM_LOOP_START = 28.0;
export default BGM_DATA_URI;
`;
  fs.writeFileSync(path.resolve('src', 'assets', 'bgmAsset.ts'), fileContent, 'utf-8');
  console.log(`Successfully encoded clean MP3 bgmAsset.ts (${(dataUri.length / 1024).toFixed(1)} KB)`);
} else {
  console.error('MP3 file not found');
}
