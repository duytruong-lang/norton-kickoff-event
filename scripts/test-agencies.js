'use strict';

/**
 * 1990 Agency — Norton Park Sales Kick-off Event
 * Test suite: 49 Official Agencies & F1 Removal Verification
 *
 * Usage: node scripts/test-agencies.js
 * Exit code 0 if all pass, 1 on any failure.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
let failed = false;

function pass(name, details) {
  console.log(`✅ [PASS] ${name}${details ? ` (${details})` : ''}`);
}

function fail(name, err) {
  console.error(`❌ [FAIL] ${name}`);
  if (err) {
    console.error(`   Error: ${err.message || err}`);
  }
  failed = true;
}

console.log('--- Starting Agency Verification Suite ---\n');

// =============================================================================
// CHECK A: lib/agencies.js verification
// =============================================================================
try {
  const { AGENCIES, normalizeAgency } = require('../lib/agencies');

  assert(Array.isArray(AGENCIES), 'AGENCIES must be an array');
  assert.strictEqual(AGENCIES.length, 49, `Expected exactly 49 agencies, found ${AGENCIES.length}`);

  const uniqueSet = new Set(AGENCIES);
  assert.strictEqual(uniqueSet.size, 49, `Expected 49 unique agencies, found duplicate entries`);

  const expectedSorted = [...AGENCIES].sort((a, b) => a.localeCompare(b, 'vi'));
  assert.deepStrictEqual(AGENCIES, expectedSorted, 'AGENCIES array must be sorted A-Z according to Vietnamese locale (localeCompare vi)');

  pass('Check A: lib/agencies.js', '49 unique agencies, sorted A-Z Vietnamese collation');
} catch (err) {
  fail('Check A: lib/agencies.js', err);
}

// =============================================================================
// CHECK B: index.html <select id="agency"> dropdown verification
// =============================================================================
try {
  const { AGENCIES } = require('../lib/agencies');
  const indexHtmlPath = path.join(ROOT_DIR, 'index.html');
  assert(fs.existsSync(indexHtmlPath), 'index.html not found');

  const html = fs.readFileSync(indexHtmlPath, 'utf8');
  const startTag = '<select id="agency"';
  const endTag = '</select>';
  const startIdx = html.indexOf(startTag);
  assert(startIdx !== -1, 'Could not find <select id="agency" in index.html');

  const endIdx = html.indexOf(endTag, startIdx);
  assert(endIdx !== -1, 'Could not find closing </select> in index.html');

  const selectSubstring = html.substring(startIdx, endIdx);

  // Match all option tags: capture attributes and inner value
  const optionRegex = /<option([^>]*)>([\s\S]*?)<\/option>/gi;
  const options = [];
  let m;
  while ((m = optionRegex.exec(selectSubstring)) !== null) {
    const attrs = m[1];
    const valMatch = attrs.match(/value="([^"]*)"/i);
    const value = valMatch ? valMatch[1] : '';
    const isDisabled = /\bdisabled\b/i.test(attrs);
    options.push({ value, isDisabled, raw: m[0] });
  }

  assert(options.length >= 51, `Expected at least 51 options (placeholder + 49 agencies + Khác), found ${options.length}`);

  // Assert first option is empty disabled placeholder
  const firstOption = options[0];
  assert.strictEqual(firstOption.value, '', 'First option must have an empty value ("")');
  assert(firstOption.isDisabled, 'First option must have the "disabled" attribute');

  // Assert last option is "Khác"
  const lastOption = options[options.length - 1];
  assert.strictEqual(lastOption.value, 'Khác', 'Last option must have value="Khác"');

  // Decode &amp; -> &, drop empty placeholder and 'Khác' option
  const decodedAgencies = options
    .slice(1, -1)
    .map(opt => opt.value.replace(/&amp;/g, '&'));

  assert.deepStrictEqual(
    decodedAgencies,
    AGENCIES,
    'Dropdown options do not match AGENCIES array in order and content'
  );

  pass('Check B: index.html dropdown', '51 options total, placeholder & Khác correctly placed, 49 agencies match exact order');
} catch (err) {
  fail('Check B: index.html dropdown', err);
}

// =============================================================================
// CHECK C: normalizeAgency test cases
// =============================================================================
try {
  const { normalizeAgency } = require('../lib/agencies');

  const testCases = [
    { input: 'era ', expected: 'ERA' },
    { input: 'Đất xanh', expected: 'ĐẤT XANH' },
    { input: 'dat xanh', expected: 'ĐẤT XANH' },
    { input: 't&a', expected: 'T&A' },
    { input: 'Việt Nam Land', expected: 'VIỆT NAM LAND' },
    { input: 'viet nam property', expected: 'VIET NAM PROPERTY' },
    { input: 'Công ty ABC', expected: 'Công ty ABC' },
    { input: '', expected: '' },
  ];

  for (const { input, expected } of testCases) {
    const actual = normalizeAgency(input);
    assert.strictEqual(actual, expected, `normalizeAgency(${JSON.stringify(input)}) should be ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }

  // 200-char string truncation to length 80
  const longInput = 'A'.repeat(200);
  const normalizedLong = normalizeAgency(longInput);
  assert.strictEqual(normalizedLong.length, 80, `Expected 200-char input to be truncated to length 80, got ${normalizedLong.length}`);

  pass('Check C: normalizeAgency test cases', 'All 8 specific test cases + 80-char truncation passed');
} catch (err) {
  fail('Check C: normalizeAgency test cases', err);
}

// =============================================================================
// CHECK D: No standalone word F1 across target files
// =============================================================================
try {
  const targetFiles = [
    'index.html',
    'admin.html',
    'api/admin/index.js',
    'api/register.js',
    'lib/sheets.js',
    'lib/agencies.js',
    'scripts/google-apps-script-webhook.js',
    'scripts/test-scenarios.js',
    'README.md',
    'HANDOFF.md',
    'docs/EVENT_DAY_RUNBOOK.md',
    'docs/HANDOVER_SLIDE_THE_SYNC_SHOW.md'
  ];

  const f1Regex = /\bF1\b/i;
  const hits = [];

  for (const relPath of targetFiles) {
    const absPath = path.join(ROOT_DIR, relPath);
    if (!fs.existsSync(absPath)) {
      continue;
    }

    const lines = fs.readFileSync(absPath, 'utf8').split('\n');
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      // Skip the single allowed line in index.html containing get('f1')
      if (relPath === 'index.html' && line.includes("get('f1')")) {
        return;
      }
      if (f1Regex.test(line)) {
        hits.push({ file: relPath, line: lineNum, text: line.trim() });
      }
    });
  }

  if (hits.length > 0) {
    const details = hits.map(h => `   ${h.file}:${h.line}: ${h.text}`).join('\n');
    throw new Error(`Found ${hits.length} occurrence(s) of standalone word "F1":\n${details}`);
  }

  pass('Check D: F1 word removal', `Scanned ${targetFiles.length} files, 0 occurrences of standalone word "F1" found`);
} catch (err) {
  fail('Check D: F1 word removal', err);
}

// =============================================================================
// SUMMARY & EXIT
// =============================================================================
console.log('\n----------------------------------------');
if (failed) {
  console.error('❌ Verification suite FAILED. See details above.');
  process.exit(1);
} else {
  console.log('✅ All verification checks PASSED successfully.');
  process.exit(0);
}
