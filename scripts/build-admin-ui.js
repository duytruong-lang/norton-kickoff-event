'use strict';

/**
 * 1990 Agency — Norton Park Sales Kick-off Event
 * Admin Cockpit — Inline HTML Builder (auto-generated rebuild script)
 * 
 * Usage: node scripts/build-admin-ui.js
 * Reads admin.html, escapes for template literal, writes api/admin/index.js
 */

const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'admin.html');
const outputPath = path.join(__dirname, '..', 'api', 'admin', 'index.js');

const html = fs.readFileSync(htmlPath, 'utf8');

// Escape backticks and dollar signs for template literal embedding
const escaped = html.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');

const output = `'use strict';
const adminHTML = \`${escaped}\`;

module.exports = function handler(req, res) {
  const secretKey = process.env.ADMIN_SECRET || 'norton_admin_secret_2026';
  const url = new URL(req.url, 'http://localhost');
  const querySecret = url.searchParams.get('secret') || url.searchParams.get('adminSecret');
  if (!querySecret || querySecret !== secretKey) {
    return res.status(401).send('Unauthorized: Invalid admin secret.');
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(adminHTML);
};

module.exports.adminHTML = adminHTML;
`;

const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, output, 'utf8');
console.log('✅ Admin UI built successfully → ' + outputPath);
console.log('   HTML size: ' + (html.length / 1024).toFixed(1) + ' KB');
console.log('   Output size: ' + (output.length / 1024).toFixed(1) + ' KB');
