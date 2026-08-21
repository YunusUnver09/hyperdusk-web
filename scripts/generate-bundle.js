import fs from 'fs';
import path from 'path';

const htmlPath = path.resolve('dist', 'index.html');
if (fs.existsSync(htmlPath)) {
  const html = fs.readFileSync(htmlPath, 'utf-8');
  // Escape backticks and dollar signs for template literal
  const escapedHtml = html.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\${/g, '\\${');
  const content = `// Auto-generated game bundle for Expo Native App
export const gameBundleHtml = \`${escapedHtml}\`;
export default gameBundleHtml;
`;
  fs.writeFileSync(path.resolve('gameBundle.js'), content, 'utf-8');
  console.log('Successfully generated gameBundle.js for Expo!');
} else {
  console.error('dist/index.html does not exist. Run npm run build first.');
}
