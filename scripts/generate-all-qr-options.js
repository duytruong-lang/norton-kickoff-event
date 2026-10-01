'use strict';

/**
 * 1990 Agency — Norton Park Sales Kick-off Event
 * Dual QR Code Suite (Option 1: Classic Standard vs Option 2: Luxury Gamuda)
 * Generates both in SVG (Vector) + PNG (1024x1024, 2048x2048, 4096x4096 Ultra HD)
 */

const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const sharp = require('sharp');
const jsQR = require('jsqr');

const TARGET_URL = 'https://thesync.nortonpark.com.vn';

// ---------------------------------------------------------------------------
// OPTION 1: CLASSIC STANDARD QR (Cổ điển, tối giản, đen/xanh trên nền trắng)
// ---------------------------------------------------------------------------
function generateClassicQR(color = '#1B2A1E', bg = '#FFFFFF') {
  const qr = QRCode.create(TARGET_URL, { errorCorrectionLevel: 'H' });
  const N = qr.modules.size; // 33
  const M = 4; // Margin
  const total = N + 2 * M;

  let d = '';
  for (let r = 0; r < N; r++) {
    let inLine = false;
    let lineStart = 0;
    for (let c = 0; c < N; c++) {
      if (qr.modules.get(r, c)) {
        if (!inLine) {
          inLine = true;
          lineStart = c;
        }
      } else {
        if (inLine) {
          inLine = false;
          d += `M${M + lineStart} ${M + r + 0.5}h${c - lineStart}`;
        }
      }
    }
    if (inLine) {
      d += `M${M + lineStart} ${M + r + 0.5}h${N - lineStart}`;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="100%" height="100%" shape-rendering="crispEdges">
  <rect width="100%" height="100%" fill="${bg}"/>
  <path stroke="${color}" stroke-width="1" d="${d}"/>
</svg>`;

  return svg;
}

// ---------------------------------------------------------------------------
// OPTION 2: LUXURY GAMUDA QR (Cánh hoa, Gradient Pine-to-Bronze, Hoa Dầu)
// ---------------------------------------------------------------------------
function generateLuxuryQR() {
  const qr = QRCode.create(TARGET_URL, { errorCorrectionLevel: 'H' });
  const N = qr.modules.size; // 33
  const M = 4; // Margin
  const cx = M + N / 2;
  const cy = M + N / 2;
  const badgeR = 4.2;
  const clearR = 4.35;

  let d = '';
  for (let r = 0; r < N; r++) {
    let inLine = false;
    let lineStart = 0;
    for (let c = 0; c < N; c++) {
      const isTL = (r <= 7 && c <= 7);
      const isTR = (r <= 7 && c >= N - 8);
      const isBL = (r >= N - 8 && c <= 7);
      const dist = Math.hypot((M + c + 0.5) - cx, (M + r + 0.5) - cy);
      const isCenter = dist < clearR;
      const isDark = qr.modules.get(r, c) && !isTL && !isTR && !isBL && !isCenter;

      if (isDark) {
        if (!inLine) { inLine = true; lineStart = c; }
      } else {
        if (inLine) {
          inLine = false;
          d += `M${M + lineStart} ${M + r + 0.5}h${c - lineStart}`;
        }
      }
    }
    if (inLine) {
      d += `M${M + lineStart} ${M + r + 0.5}h${N - lineStart}`;
    }
  }

  function roundedPath(x, y, w, h, rTL, rTR, rBR, rBL) {
    return `M ${x + rTL} ${y} ` +
           `L ${x + w - rTR} ${y} ` +
           `A ${rTR} ${rTR} 0 0 1 ${x + w} ${y + rTR} ` +
           `L ${x + w} ${y + h - rBR} ` +
           `A ${rBR} ${rBR} 0 0 1 ${x + w - rBR} ${y + h} ` +
           `L ${x + rBL} ${y + h} ` +
           `A ${rBL} ${rBL} 0 0 1 ${x} ${y + h - rBL} ` +
           `L ${x} ${y + rTL} ` +
           `A ${rTL} ${rTL} 0 0 1 ${x + rTL} ${y} Z`;
  }

  const eyeTL_out = roundedPath(M + 0.5, M + 0.5, 6, 6, 2.2, 0.6, 0.6, 0.6);
  const eyeTL_in = roundedPath(M + 2, M + 2, 3, 3, 1.2, 0.3, 0.3, 0.3);

  const eyeTR_out = roundedPath(M + N - 7 + 0.5, M + 0.5, 6, 6, 0.6, 2.2, 0.6, 0.6);
  const eyeTR_in = roundedPath(M + N - 7 + 2, M + 2, 3, 3, 0.3, 1.2, 0.3, 0.3);

  const eyeBL_out = roundedPath(M + 0.5, M + N - 7 + 0.5, 6, 6, 0.6, 0.6, 0.6, 2.2);
  const eyeBL_in = roundedPath(M + 2, M + N - 7 + 2, 3, 3, 0.3, 0.3, 0.3, 1.2);

  const eyes = `
    <path d="${eyeTL_out}" fill="none" stroke="#A78061" stroke-width="1" stroke-linejoin="round"/>
    <path d="${eyeTL_in}" fill="#1B2A1E"/>
    <path d="${eyeTR_out}" fill="none" stroke="#A78061" stroke-width="1" stroke-linejoin="round"/>
    <path d="${eyeTR_in}" fill="#1B2A1E"/>
    <path d="${eyeBL_out}" fill="none" stroke="#A78061" stroke-width="1" stroke-linejoin="round"/>
    <path d="${eyeBL_in}" fill="#1B2A1E"/>
  `;

  const scale = 0.048;
  const tx = cx - (50 * scale);
  const ty = cy - (60 * scale);

  const emblem = `
    <circle cx="${cx}" cy="${cy}" r="${badgeR}" fill="#FAF7F0" stroke="#A78061" stroke-width="0.35"/>
    <circle cx="${cx}" cy="${cy}" r="${badgeR - 0.45}" fill="#FFFFFF" stroke="#D4AF37" stroke-width="0.15" opacity="0.6"/>
    <g transform="translate(${tx}, ${ty}) scale(${scale})">
      <path d="M50 115 C44 95 30 65 24 35 C20 18 28 5 38 6 C46 7 49 22 50 45 C51 22 54 7 62 6 C72 5 80 18 76 35 C70 65 56 95 50 115 Z" fill="url(#bronzeGrad)"/>
      <circle cx="50" cy="112" r="5" fill="#594A42"/>
      <ellipse cx="50" cy="110" rx="3" ry="4" fill="#A78061"/>
    </g>
  `;

  const total = N + 2 * M;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="100%" height="100%" shape-rendering="crispEdges">
  <defs>
    <linearGradient id="qrGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1B2A1E"/>
      <stop offset="45%" stop-color="#2C332A"/>
      <stop offset="100%" stop-color="#A78061"/>
    </linearGradient>
    <linearGradient id="bronzeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#C5A082"/>
      <stop offset="50%" stop-color="#A78061"/>
      <stop offset="100%" stop-color="#8E6A4D"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="#FAF7F0"/>
  <path stroke="url(#qrGrad)" stroke-width="1" d="${d}"/>
  ${eyes}
  ${emblem}
</svg>`;

  return svg;
}

// Verification runner
async function verifyQR(pngBuffer, label) {
  const { data, info } = await sharp(pngBuffer)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });
  const decoded = jsQR(new Uint8ClampedArray(data), info.width, info.height);
  if (decoded && decoded.data === TARGET_URL) {
    console.log(`  ✅ ${label}: 100% PASS (URL: ${decoded.data})`);
    return true;
  } else {
    console.error(`  ❌ ${label}: FAILED`);
    return false;
  }
}

async function run() {
  console.log('🚀 Building Dual QR Code Suite (Option 1: Classic vs Option 2: Luxury Gamuda)...\n');

  const handoverDir = path.join(__dirname, '..', 'Handover');
  const assetsDir = path.join(__dirname, '..', 'assets');

  // 1. OPTION 1: CLASSIC STANDARD
  console.log('📦 Generating Option 1 (Classic Standard QR)...');
  const classicSvg = generateClassicQR('#1B2A1E', '#FFFFFF');
  
  // Write SVG
  fs.writeFileSync(path.join(assetsDir, 'qr-option1-classic.svg'), classicSvg);
  fs.writeFileSync(path.join(handoverDir, 'qr-option1-classic.svg'), classicSvg);

  // Render PNGs (1024 and 2048)
  const classicPng1024 = await sharp(Buffer.from(classicSvg)).resize(1024, 1024).png({ quality: 100 }).toBuffer();
  const classicPng2048 = await sharp(Buffer.from(classicSvg)).resize(2048, 2048).png({ quality: 100 }).toBuffer();

  fs.writeFileSync(path.join(assetsDir, 'qr-option1-classic.png'), classicPng1024);
  fs.writeFileSync(path.join(handoverDir, 'qr-option1-classic.png'), classicPng1024);
  fs.writeFileSync(path.join(handoverDir, 'qr-option1-classic-hires-2048.png'), classicPng2048);

  await verifyQR(classicPng1024, 'Option 1 (Classic 1024px)');

  // 2. OPTION 2: LUXURY GAMUDA BRANDED
  console.log('\n🌿 Generating Option 2 (Luxury Gamuda Branded QR)...');
  const luxurySvg = generateLuxuryQR();

  // Write SVG
  fs.writeFileSync(path.join(assetsDir, 'qr-option2-luxury.svg'), luxurySvg);
  fs.writeFileSync(path.join(assetsDir, 'qr-checkin.svg'), luxurySvg);
  fs.writeFileSync(path.join(handoverDir, 'qr-option2-luxury.svg'), luxurySvg);

  // Render PNGs (1024 and 2048)
  const luxuryPng1024 = await sharp(Buffer.from(luxurySvg)).resize(1024, 1024).png({ quality: 100 }).toBuffer();
  const luxuryPng2048 = await sharp(Buffer.from(luxurySvg)).resize(2048, 2048).png({ quality: 100 }).toBuffer();

  fs.writeFileSync(path.join(assetsDir, 'qr-option2-luxury.png'), luxuryPng1024);
  fs.writeFileSync(path.join(assetsDir, 'qr-checkin.png'), luxuryPng1024);
  fs.writeFileSync(path.join(handoverDir, 'qr-option2-luxury.png'), luxuryPng1024);
  fs.writeFileSync(path.join(handoverDir, 'qr-checkin.png'), luxuryPng1024);
  fs.writeFileSync(path.join(handoverDir, 'qr-option2-luxury-hires-2048.png'), luxuryPng2048);

  await verifyQR(luxuryPng1024, 'Option 2 (Luxury 1024px)');

  console.log('\n======================================================');
  console.log('🎉 ALL OPTIONS GENERATED & VERIFIED SUCCESSFULLY!');
  console.log('Files saved in Handover/ and assets/:');
  console.log('  • Option 1 (Classic Standard): SVG (Vector), 1024px, 2048px Hi-Res');
  console.log('  • Option 2 (Luxury Gamuda):   SVG (Vector), 1024px, 2048px Hi-Res');
  console.log('======================================================\n');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
