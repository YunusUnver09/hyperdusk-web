import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Pure Node.js PNG encoder with CRC32
function createCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c;
  }
  return table;
}

const crcTable = createCrcTable();

function crc32(buf, offset = 0, length = buf.length) {
  let c = 0xffffffff;
  for (let i = offset; i < offset + length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function encodePng(width, height, rgbaBuffer) {
  const rowBytes = width * 4;
  const rawData = Buffer.alloc(height * (rowBytes + 1));

  for (let y = 0; y < height; y++) {
    const rawOffset = y * (rowBytes + 1);
    rawData[rawOffset] = 0; // Filter: None
    rgbaBuffer.copy(rawData, rawOffset + 1, y * rowBytes, (y + 1) * rowBytes);
  }

  const compressedData = zlib.deflateSync(rawData, { level: 9 });

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(4 + 4 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// Create Windows/Browser ICO from PNG buffer
function createIco(pngBuffer, width, height) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(1, 4); // 1 image

  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(width >= 256 ? 0 : width, 0);
  dirEntry.writeUInt8(height >= 256 ? 0 : height, 1);
  dirEntry.writeUInt8(0, 2); // Color palette
  dirEntry.writeUInt8(0, 3); // Reserved
  dirEntry.writeUInt16LE(1, 4); // Color planes
  dirEntry.writeUInt16LE(32, 6); // Bits per pixel
  dirEntry.writeUInt32LE(pngBuffer.length, 8); // Size of PNG
  dirEntry.writeUInt32LE(22, 12); // Offset (6 + 16 = 22)

  return Buffer.concat([header, dirEntry, pngBuffer]);
}

// Point-in-polygon test
function isPointInPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Distance from point to line segment
function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

// Distance to polygon boundary
function distToPolyBoundary(px, py, poly) {
  let minDist = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const d = distToSegment(px, py, poly[i][0], poly[i][1], poly[j][0], poly[j][1]);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

// Color interpolation
function lerpColor(c1, c2, t) {
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * t),
    Math.round(c1[1] + (c2[1] - c1[1]) * t),
    Math.round(c1[2] + (c2[2] - c1[2]) * t),
    Math.round(c1[3] + (c2[3] - c1[3]) * t),
  ];
}

// Multi-stop gradient along diagonal (x: 0..100, y: 0..100)
function getShieldGradientColor(nx, ny) {
  const t = Math.max(0, Math.min(1, (nx + ny) / 2));
  const cyan = [0, 243, 255, 255];
  const purple = [112, 0, 255, 255];
  const magenta = [255, 0, 85, 255];

  if (t < 0.5) {
    return lerpColor(cyan, purple, t / 0.5);
  } else {
    return lerpColor(purple, magenta, (t - 0.5) / 0.5);
  }
}

// High-fidelity Supersampled Vector Renderer
function renderShieldLogo(size) {
  const ssaa = 4; // 4x supersampling
  const w = size;
  const h = size;
  const sw = w * ssaa;
  const sh = h * ssaa;

  const outerPoly = [
    [50, 5], [92, 22], [80, 72], [50, 95], [20, 72], [8, 22]
  ];
  const innerPoly = [
    [50, 18], [78, 32], [70, 66], [50, 82], [30, 66], [22, 32]
  ];
  const starPoly = [
    [50, 30], [55, 45], [70, 50], [55, 55], [50, 70], [45, 55], [30, 50], [45, 45]
  ];

  // High-res supersampled buffer
  const sampleBuf = new Float32Array(sw * sh * 4);

  for (let sy = 0; sy < sh; sy++) {
    const ny = (sy / sh) * 100;
    for (let sx = 0; sx < sw; sx++) {
      const nx = (sx / sw) * 100;
      const idx = (sy * sw + sx) * 4;

      let r = 0, g = 0, b = 0, a = 0;

      const inOuter = isPointInPoly(nx, ny, outerPoly);
      const distBorder = distToPolyBoundary(nx, ny, outerPoly);

      // Outer stroke (width 6 => radius 3 in 0..100 scale)
      if (distBorder <= 3.2) {
        const gradCol = getShieldGradientColor(nx / 100, ny / 100);
        r = gradCol[0]; g = gradCol[1]; b = gradCol[2]; a = 255;
      } else if (inOuter) {
        // Shield background dark titanium
        r = 7; g = 11; b = 25; a = 255;

        // Inner polygon translucent glow
        if (isPointInPoly(nx, ny, innerPoly)) {
          const inGrad = getShieldGradientColor(nx / 100, ny / 100);
          r = Math.round(r * 0.7 + inGrad[0] * 0.3);
          g = Math.round(g * 0.7 + inGrad[1] * 0.3);
          b = Math.round(b * 0.7 + inGrad[2] * 0.3);
        }

        // Center glowing cyan circle (cx=50, cy=50, r=14)
        const dCenter = Math.hypot(nx - 50, ny - 50);
        if (dCenter <= 14.5) {
          const circleAlpha = Math.max(0, 1 - Math.max(0, dCenter - 13.5));
          const cr = 0, cg = 243, cb = 255;
          r = Math.round(r * (1 - circleAlpha) + cr * circleAlpha);
          g = Math.round(g * (1 - circleAlpha) + cg * circleAlpha);
          b = Math.round(b * (1 - circleAlpha) + cb * circleAlpha);
        }

        // Center white starburst
        if (isPointInPoly(nx, ny, starPoly)) {
          r = 255; g = 255; b = 255;
        }
      }

      sampleBuf[idx] = r;
      sampleBuf[idx + 1] = g;
      sampleBuf[idx + 2] = b;
      sampleBuf[idx + 3] = a;
    }
  }

  // Downsample to target size with Box Filter
  const outBuf = Buffer.alloc(w * h * 4);
  const scale2 = ssaa * ssaa;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let tr = 0, tg = 0, tb = 0, ta = 0;
      for (let dy = 0; dy < ssaa; dy++) {
        for (let dx = 0; dx < ssaa; dx++) {
          const sidx = ((y * ssaa + dy) * sw + (x * ssaa + dx)) * 4;
          tr += sampleBuf[sidx];
          tg += sampleBuf[sidx + 1];
          tb += sampleBuf[sidx + 2];
          ta += sampleBuf[sidx + 3];
        }
      }
      const outIdx = (y * w + x) * 4;
      outBuf[outIdx] = Math.round(tr / scale2);
      outBuf[outIdx + 1] = Math.round(tg / scale2);
      outBuf[outIdx + 2] = Math.round(tb / scale2);
      outBuf[outIdx + 3] = Math.round(ta / scale2);
    }
  }

  return encodePng(w, h, outBuf);
}

// Generate OpenGraph Social Banner 1200x630
function renderOgBanner() {
  const w = 1200;
  const h = 630;
  const outBuf = Buffer.alloc(w * h * 4);

  // Render shield logo at 320x320
  const logoSize = 320;
  const logoPng = renderShieldLogo(logoSize);
  // Re-decode for compositing
  // Or render directly
  for (let y = 0; y < h; y++) {
    const ny = y / h;
    for (let x = 0; x < w; x++) {
      const nx = x / w;
      const idx = (y * w + x) * 4;

      // Dark space background radial glow
      const distCenter = Math.hypot(nx - 0.5, ny - 0.5);
      const glow = Math.max(0, 1 - distCenter * 1.5);
      const r = Math.round(6 + glow * 18);
      const g = Math.round(8 + glow * 25);
      const b = Math.round(22 + glow * 45);

      outBuf[idx] = r;
      outBuf[idx + 1] = g;
      outBuf[idx + 2] = b;
      outBuf[idx + 3] = 255;
    }
  }

  return encodePng(w, h, outBuf);
}

// Generate and write all formats
const targets = [
  { file: 'favicon-48x48.png', size: 48 },
  { file: 'favicon-96x96.png', size: 96 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'favicon-192x192.png', size: 192 },
  { file: 'favicon-512x512.png', size: 512 },
];

console.log('Generating high-resolution favicon PNGs and ICO...');
const publicDir = path.resolve('public');
const distDir = path.resolve('dist');
const docsDir = path.resolve('docs');

const png48 = renderShieldLogo(48);
const icoBuffer = createIco(png48, 48, 48);

const generated = {};
for (const t of targets) {
  const pngBuf = renderShieldLogo(t.size);
  generated[t.file] = pngBuf;
}
generated['favicon.ico'] = icoBuffer;
generated['og-image.png'] = renderShieldLogo(512);

const outputDirs = [publicDir, distDir, docsDir];
for (const dir of outputDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  for (const [filename, buffer] of Object.entries(generated)) {
    fs.writeFileSync(path.join(dir, filename), buffer);
  }
}

console.log('✅ Successfully generated all favicons & logos across public/, dist/, and docs/!');
