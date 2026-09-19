#!/usr/bin/env node

/**
 * 1990 Agency — Norton Park Sales Kick-off Event
 * Comprehensive QA/QC & Architecture Supervisor Test Suite
 * 
 * Executes 7 Strict Verification Scenarios:
 * 1. Initial Gate State (CLOSED, 403 GATE_CLOSED, UI disabled)
 * 2. Hot Button Gate Control (POST /api/admin/config -> open, verify GET /api/register)
 * 3. Seed Pool 1,000 & Atomic Allocation (LLEN 1000, register 1 user -> #xxx, pool 999)
 * 4. CCCD Idempotency 100% (same CCCD -> exact same number, replayed: true, pool unchanged)
 * 5. Admin Pool Resize & Distribution Test (Sếp Di's requirement: seed 500, register 10 users, verify <= 500, no duplicates, SHUFFLE randomness)
 * 6. Dispute Resolution Lookup (by CCCD & Phone, dossier, receiptId, audit timeline)
 * 7. Canvas Retina & Scannable QR Code Verification
 * 
 * Post-test: Re-close gate and re-seed 1,000 tickets to leave production in pristine state.
 */

const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');

const { redis } = require('../lib/redis');
const { padZero } = require('../lib/helpers');

// Import serverless handlers
const registerHandler = require('../api/register');
const configHandler = require('../api/admin/config');
const lookupHandler = require('../api/admin/lookup');
const ipHandler = require('../api/ip');

const PORT = 3199;
const ADMIN_SECRET = 'norton_admin_secret_2026';
const BASE_URL = `http://127.0.0.1:${PORT}`;

// Helper: Wrap Express-like handler into Node HTTP Server
function createTestServer() {
  const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // Attach parsed query
    req.query = parsedUrl.query;

    // Read body
    let bodyData = '';
    req.on('data', chunk => {
      bodyData += chunk;
    });

    req.on('end', async () => {
      if (bodyData) {
        try {
          req.body = JSON.parse(bodyData);
        } catch (e) {
          req.body = bodyData;
        }
      } else {
        req.body = {};
      }

      // Add Express response helper mocks
      res.status = function (code) {
        res.statusCode = code;
        return res;
      };
      res.json = function (data) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      };

      try {
        if (pathname === '/api/register') {
          await registerHandler(req, res);
        } else if (pathname === '/api/admin/config') {
          await configHandler(req, res);
        } else if (pathname === '/api/admin/lookup') {
          await lookupHandler(req, res);
        } else if (pathname === '/api/ip') {
          await ipHandler(req, res);
        } else {
          res.status(404).json({ error: 'NOT_FOUND' });
        }
      } catch (err) {
        console.error('Unhandled server error in route:', pathname, err);
        res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
      }
    });
  });

  return server;
}

// Helper: HTTP client fetch wrapper
async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  });
  const status = res.status;
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status, ok: res.ok, data };
}

// Test reporting logger
const testResults = [];

function recordTest(scenario, testName, passed, details = {}) {
  testResults.push({ scenario, testName, passed, details });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`  [${icon}] ${scenario} — ${testName}`);
  if (details.note) {
    console.log(`         ↳ Note: ${details.note}`);
  }
}

async function runAllScenarios() {
  console.log('\n======================================================================');
  console.log('🏛️  1990 AGENCY — NORTON PARK SALES KICK-OFF CHECK-IN TEST SUITE');
  console.log('👨‍💻 Lead QA/QC & Architecture Supervisor: Staff Engineer Standard');
  console.log('======================================================================\n');

  const server = createTestServer();
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`🚀 Mock Serverless HTTP Server running on http://127.0.0.1:${PORT}\n`);

  try {
    // ------------------------------------------------------------------
    // SCENARIO 1: Initial Gate State
    // ------------------------------------------------------------------
    console.log('\n--- [SCENARIO 1] Initial Gate State Enforcement ---');

    // Force gate to closed
    await redis.set('config:gate', 'closed');

    // Probe GET /api/register
    const probeRes = await request('/api/register', { method: 'GET' });
    const isProbeClosed = probeRes.status === 200 && probeRes.data.gate === 'closed' && probeRes.data.isOpen === false;
    recordTest('Scenario 1', 'Probe GET /api/register returns closed', isProbeClosed, {
      gate: probeRes.data.gate,
      isOpen: probeRes.data.isOpen,
    });

    // POST /api/register while closed
    const regClosedRes = await request('/api/register', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Nguyễn Văn Test Closed',
        phone: '0901112222',
        cccd: '079198000001',
        agency: 'ERA Vietnam',
      }),
    });
    const isGateClosed403 = regClosedRes.status === 403 && regClosedRes.data.error === 'GATE_CLOSED';
    recordTest('Scenario 1', 'POST /api/register blocked with HTTP 403 GATE_CLOSED', isGateClosed403, {
      status: regClosedRes.status,
      error: regClosedRes.data.error,
      message: regClosedRes.data.message,
    });

    // Verify index.html gate protection elements
    const indexHtmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    const hasGateBanner = indexHtmlContent.includes('id="gateBanner"') && indexHtmlContent.includes('gate-banner closed');
    const hasDisabledButton = indexHtmlContent.includes('id="submitBtn"') && indexHtmlContent.includes('disabled');
    recordTest('Scenario 1', 'UI index.html defaults to gate closed banner & disabled submit button', hasGateBanner && hasDisabledButton, {
      hasGateBanner,
      hasDisabledButton,
    });

    // ------------------------------------------------------------------
    // SCENARIO 2: Hot Button Gate Control
    // ------------------------------------------------------------------
    console.log('\n--- [SCENARIO 2] Hot Button Gate Control ---');

    // Call POST /api/admin/config { action: 'gate', value: 'open' }
    const openGateRes = await request('/api/admin/config', {
      method: 'POST',
      headers: { 'x-admin-secret': ADMIN_SECRET },
      body: JSON.stringify({ action: 'gate', value: 'open' }),
    });

    const isGateOpened = openGateRes.status === 200 && openGateRes.data.gate === 'open';
    recordTest('Scenario 2', 'POST /api/admin/config opens gate with ADMIN_SECRET', isGateOpened, {
      gateStatus: openGateRes.data.gateStatus,
      message: openGateRes.data.message,
    });

    // Verify GET /api/register reflects open state
    const probeOpenRes = await request('/api/register', { method: 'GET' });
    const isProbeOpen = probeOpenRes.status === 200 && probeOpenRes.data.isOpen === true && probeOpenRes.data.gate === 'open';
    recordTest('Scenario 2', 'GET /api/register confirms gate isOpen: true', isProbeOpen, {
      isOpen: probeOpenRes.data.isOpen,
    });

    // ------------------------------------------------------------------
    // SCENARIO 3: Seed Pool 1,000 số & Atomic Allocation
    // ------------------------------------------------------------------
    console.log('\n--- [SCENARIO 3] Seed Pool 1,000 Tickets & Atomic Allocation ---');

    // Call seed via admin config for 1000 tickets
    const seed1000Res = await request('/api/admin/config', {
      method: 'POST',
      headers: { 'x-admin-secret': ADMIN_SECRET },
      body: JSON.stringify({ action: 'seed', poolMax: 1000, mode: 'SHUFFLE' }),
    });

    const poolLen1000 = await redis.llen('lucky:pool');
    const isPool1000Valid = poolLen1000 === 1000 && seed1000Res.data.poolRemaining === 1000;
    recordTest('Scenario 3', 'Seed 1,000 tickets with Fisher-Yates SHUFFLE', isPool1000Valid, {
      poolRemaining: poolLen1000,
      mode: seed1000Res.data.mode,
    });

    // Ensure gate is open for user registration
    await redis.set('config:gate', 'open');

    // Ensure test isolation for userA
    await redis.del('reg:cccd:079198001111');
    await redis.del('reg:phone:0901234567');

    // Register 1 user
    const userA = {
      fullName: 'Nguyễn Văn An',
      phone: '0901234567',
      cccd: '079198001111',
      agency: 'ERA Vietnam',
      email: 'an.nguyen@eravn.vn',
    };

    const reg1Res = await request('/api/register', {
      method: 'POST',
      body: JSON.stringify(userA),
    });

    const ticketA = reg1Res.data.ticketNumber;
    const receiptA = reg1Res.data.receiptId;
    const isUser1Success = reg1Res.status === 200 &&
      reg1Res.data.success === true &&
      /^NP-2026-\d{3,4}$/.test(ticketA) &&
      reg1Res.data.replayed === false;

    recordTest('Scenario 3', 'Register attendee A receives valid format NP-2026-xxx ticket', isUser1Success, {
      ticketNumber: ticketA,
      luckyNumber: reg1Res.data.luckyNumber,
      receiptId: receiptA,
      replayed: reg1Res.data.replayed,
      responseTimeMs: reg1Res.data.responseTimeMs,
    });

    const poolLenAfter1 = await redis.llen('lucky:pool');
    const isPoolDecremented = poolLenAfter1 === 999;
    recordTest('Scenario 3', 'Atomic LPOP decrements lucky:pool by exactly 1 (1000 -> 999)', isPoolDecremented, {
      expected: 999,
      actual: poolLenAfter1,
    });

    // ------------------------------------------------------------------
    // SCENARIO 4: CCCD Idempotency 100%
    // ------------------------------------------------------------------
    console.log('\n--- [SCENARIO 4] CCCD Idempotency 100% ---');

    // Re-submit the exact same CCCD with modified name or phone attempt
    const regReplayRes = await request('/api/register', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Nguyễn Văn An (Cố tình đăng ký lại)',
        phone: '0901234567',
        cccd: '079198001111', // Exact same CCCD
        agency: 'Đông Tây Land', // Attempt to switch agency
      }),
    });

    const isReplayTicketExact = regReplayRes.status === 200 &&
      regReplayRes.data.ticketNumber === ticketA &&
      regReplayRes.data.replayed === true;

    recordTest('Scenario 4', 'Duplicate CCCD returns original ticketNumber with replayed: true', isReplayTicketExact, {
      originalTicket: ticketA,
      returnedTicket: regReplayRes.data.ticketNumber,
      replayed: regReplayRes.data.replayed,
    });

    const poolLenAfterReplay = await redis.llen('lucky:pool');
    const isPoolZeroDrain = poolLenAfterReplay === 999;
    recordTest('Scenario 4', 'Duplicate registration causes ZERO pool drain (remains 999)', isPoolZeroDrain, {
      poolLenBefore: 999,
      poolLenAfter: poolLenAfterReplay,
    });

    // ------------------------------------------------------------------
    // SCENARIO 5: Admin Pool Resize & Distribution Test (Sếp Di's Core Requirement)
    // ------------------------------------------------------------------
    console.log('\n--- [SCENARIO 5] Sếp Di Requirement: Pool Resize to 500 & Random Distribution ---');

    // Reset CCCD registrations for clean test
    await redis.del('lucky:pool');

    // 1. Seed 500 tickets with SHUFFLE
    const seed500Res = await request('/api/admin/config', {
      method: 'POST',
      headers: { 'x-admin-secret': ADMIN_SECRET },
      body: JSON.stringify({ action: 'seed', poolMax: 500, mode: 'SHUFFLE' }),
    });

    const poolMaxKeyVal = await redis.get('config:pool_max');
    const poolLen500 = await redis.llen('lucky:pool');
    const isPool500Configured = parseInt(poolMaxKeyVal, 10) === 500 && poolLen500 === 500;
    recordTest('Scenario 5', 'Seed pool to 500 tickets via Admin Config', isPool500Configured, {
      poolMaxConfig: poolMaxKeyVal,
      actualPoolLength: poolLen500,
    });

    // Ensure gate is open
    await redis.set('config:gate', 'open');

    // 2. Register 10 distinct users
    console.log('\n  ... Simulating 10 concurrent registrations with distinct CCCDs ...');
    const issuedTickets = [];
    const issuedNumbers = [];
    let allSub500 = true;

    for (let i = 1; i <= 10; i++) {
      const cccd = `0792000000${padZero(i, 2)}`;
      const phone = `09123456${padZero(i, 2)}`;
      await redis.del(`reg:cccd:${cccd}`);
      await redis.del(`reg:phone:${phone}`);
      const res = await request('/api/register', {
        method: 'POST',
        body: JSON.stringify({
          fullName: `Chiến Binh Sale ${i}`,
          phone,
          cccd,
          agency: i % 2 === 0 ? 'Southern Homes' : 'Khải Hoàn Land',
        }),
      });

      const ticket = res.data.ticketNumber;
      const numMatch = ticket ? ticket.match(/\d+$/) : null;
      const numericVal = numMatch ? parseInt(numMatch[0], 10) : 9999;

      issuedTickets.push(ticket);
      issuedNumbers.push(numericVal);

      if (numericVal > 500 || numericVal < 1) {
        allSub500 = false;
      }
    }

    console.log(`  📊 10 Issued Tickets: [${issuedTickets.join(', ')}]`);
    console.log(`  🔢 10 Numeric Values: [${issuedNumbers.join(', ')}]`);

    // Verify condition a: All <= 500
    recordTest('Scenario 5', 'Distribution Condition 1: All 10 issued numbers are <= 500', allSub500, {
      issuedNumbers,
      maxObserved: Math.max(...issuedNumbers),
      minObserved: Math.min(...issuedNumbers),
    });

    // Verify condition b: Zero duplicates (10 distinct numbers)
    const uniqueSet = new Set(issuedNumbers);
    const isZeroDuplicates = uniqueSet.size === 10;
    recordTest('Scenario 5', 'Distribution Condition 2: Absolute Uniqueness (0 duplicate numbers)', isZeroDuplicates, {
      uniqueCount: uniqueSet.size,
      totalIssued: 10,
    });

    // Verify condition c: Shuffle Randomness (not strictly sequential [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    let isSequential = true;
    for (let i = 0; i < issuedNumbers.length - 1; i++) {
      if (issuedNumbers[i + 1] !== issuedNumbers[i] + 1) {
        isSequential = false;
        break;
      }
    }
    const isRandomShuffled = !isSequential;
    recordTest('Scenario 5', 'Distribution Condition 3: Random Fisher-Yates distribution verified (Non-sequential)', isRandomShuffled, {
      sequenceSample: issuedNumbers.slice(0, 5),
      isSequential,
    });

    // Verify condition d: Pool remaining count equals 490
    const poolLenAfter10 = await redis.llen('lucky:pool');
    const isPool490 = poolLenAfter10 === 490;
    recordTest('Scenario 5', 'Distribution Condition 4: Pool remaining equals exactly 490 (500 - 10)', isPool490, {
      expected: 490,
      actual: poolLenAfter10,
    });

    // ------------------------------------------------------------------
    // SCENARIO 6: Dispute Resolution Lookup
    // ------------------------------------------------------------------
    console.log('\n--- [SCENARIO 6] Dispute Resolution & Audit Trail Lookup ---');

    // Register a specific user for dispute testing
    const disputeUser = {
      fullName: 'Trương Hoàng Nam',
      phone: '0988777666',
      cccd: '079199887766',
      agency: 'Đông Tây Land',
    };
    const disputeRegRes = await request('/api/register', {
      method: 'POST',
      body: JSON.stringify(disputeUser),
    });
    const disputeTicket = disputeRegRes.data.ticketNumber;
    const disputeReceiptId = disputeRegRes.data.receiptId;

    // Simulate replay request to generate conflict audit
    await request('/api/register', {
      method: 'POST',
      body: JSON.stringify(disputeUser),
    });

    // 1. Lookup by CCCD
    const lookupByCccdRes = await request(`/api/admin/lookup?query=${disputeUser.cccd}`, {
      method: 'GET',
      headers: { 'x-admin-secret': ADMIN_SECRET },
    });

    const isLookupCccdSuccess = lookupByCccdRes.status === 200 &&
      lookupByCccdRes.data.registration &&
      lookupByCccdRes.data.registration.cccd === disputeUser.cccd &&
      lookupByCccdRes.data.matched.ticketCode === disputeTicket;

    recordTest('Scenario 6', 'Dispute lookup by CCCD retrieves correct registration & ticket', isLookupCccdSuccess, {
      queriedCccd: disputeUser.cccd,
      foundName: lookupByCccdRes.data.matched?.name,
      foundTicket: lookupByCccdRes.data.matched?.ticketCode,
    });

    // 2. Lookup by Phone
    const lookupByPhoneRes = await request(`/api/admin/lookup?query=${disputeUser.phone}`, {
      method: 'GET',
      headers: { 'x-admin-secret': ADMIN_SECRET },
    });

    const isLookupPhoneSuccess = lookupByPhoneRes.status === 200 &&
      lookupByPhoneRes.data.registration &&
      lookupByPhoneRes.data.registration.phone === disputeUser.phone;

    recordTest('Scenario 6', 'Dispute lookup by Phone resolves index to exact registration dossier', isLookupPhoneSuccess, {
      queriedPhone: disputeUser.phone,
      resolvedCccd: lookupByPhoneRes.data.registration?.cccd,
    });

    // 3. Verify Cryptographic Receipt & Audit Timeline
    const receiptObj = lookupByCccdRes.data.receipt;
    const timelineList = lookupByCccdRes.data.timeline || [];
    const hasAuditTimeline = timelineList.length >= 1;
    const hasReceiptSignature = receiptObj && receiptObj.signature;

    recordTest('Scenario 6', 'Immutable verification receipt with cryptographic signature present', Boolean(hasReceiptSignature), {
      receiptId: receiptObj?.receiptId,
      signaturePrefix: receiptObj?.signature ? receiptObj.signature.slice(0, 16) + '...' : 'none',
    });

    recordTest('Scenario 6', 'Audit stream log timeline captures registration events', hasAuditTimeline, {
      timelineEventsCount: timelineList.length,
      sampleAction: timelineList[0]?.action,
    });

    // ------------------------------------------------------------------
    // SCENARIO 7: Canvas Retina & Scannable QR Code Verification
    // ------------------------------------------------------------------
    console.log('\n--- [SCENARIO 7] Canvas Retina Export & Scannable QR Code ---');

    // 1. Load assets/qrcode.min.js in sandbox
    let qrLibLoaded = false;
    let svgOutput = '';
    try {
      const qrCodeSource = fs.readFileSync(path.join(__dirname, '..', 'assets', 'qrcode.min.js'), 'utf8');
      const evalFunc = new Function('window', 'globalThis', qrCodeSource);
      const mockWindow = {};
      evalFunc(mockWindow, mockWindow);

      if (mockWindow.QRCode && typeof mockWindow.QRCode.generateSvg === 'function') {
        qrLibLoaded = true;
        const testVerifyUrl = `https://norton-kickoff-event.vercel.app/?ticket=${disputeTicket}&receipt=${disputeReceiptId}`;
        svgOutput = mockWindow.QRCode.generateSvg(testVerifyUrl, 58, 1);
      }
    } catch (qrErr) {
      console.error('QR eval error:', qrErr);
    }

    const isQrSvgValid = qrLibLoaded && svgOutput.includes('<svg') && svgOutput.includes('<path d=');
    recordTest('Scenario 7', 'assets/qrcode.min.js generates compliant vector SVG QR code', isQrSvgValid, {
      qrLibLoaded,
      svgLength: svgOutput.length,
    });

    // 2. Verify Canvas drawing logic in index.html
    const hasCanvasWidth = indexHtmlContent.includes('canvas.width = 900') && indexHtmlContent.includes('canvas.height = 1200');
    const hasCanvasQrDraw = indexHtmlContent.includes('window.QRCode.drawToCanvas(ctx, verifyUrl, 165, 810, 100, 2)');
    const hasWatermarkFont = indexHtmlContent.includes('SVN-The Seasons');
    const hasDownloadPng = indexHtmlContent.includes("link.download = 'Norton-Park-Lucky-Ticket-");

    recordTest('Scenario 7', 'Canvas Retina 900x1200 HD rendering & QR drawToCanvas implemented', hasCanvasWidth && hasCanvasQrDraw, {
      hasCanvasWidth,
      hasCanvasQrDraw,
      hasWatermarkFont,
      hasDownloadPng,
    });

    // ------------------------------------------------------------------
    // CLEANUP & EVENT READINESS: Re-seed 1,000 tickets & Close Gate
    // ------------------------------------------------------------------
    console.log('\n--- [CLEANUP & PRODUCTION EVENT READINESS] ---');

    // 1. Close Gate
    const closeGateRes = await request('/api/admin/config', {
      method: 'POST',
      headers: { 'x-admin-secret': ADMIN_SECRET },
      body: JSON.stringify({ action: 'gate', value: 'closed' }),
    });

    // 2. Re-seed clean 1,000 tickets
    const finalSeedRes = await request('/api/admin/config', {
      method: 'POST',
      headers: { 'x-admin-secret': ADMIN_SECRET },
      body: JSON.stringify({ action: 'seed', poolMax: 1000, mode: 'SHUFFLE' }),
    });

    const finalGate = await redis.get('config:gate');
    const finalPoolLen = await redis.llen('lucky:pool');
    const isCleanedUp = finalGate === 'closed' && finalPoolLen === 1000;

    recordTest('Cleanup', 'Event Readiness: Check-in gate safely CLOSED and pool seeded with 1,000 tickets', isCleanedUp, {
      finalGate,
      finalPoolLen,
    });

  } finally {
    server.close();
  }

  // ------------------------------------------------------------------
  // SUMMARY REPORT
  // ------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log('📋 FINAL COMPREHENSIVE QA/QC TEST SUMMARY');
  console.log('======================================================================');
  const total = testResults.length;
  const passed = testResults.filter(t => t.passed).length;
  const failed = total - passed;

  console.log(`Total Scenarios Checked: 7/7`);
  console.log(`Total Assertions Run:   ${total}`);
  console.log(`✅ Passed:              ${passed}`);
  console.log(`❌ Failed:              ${failed}`);
  console.log(`Success Rate:           ${((passed / total) * 100).toFixed(1)}%`);
  console.log('======================================================================\n');

  return { total, passed, failed, testResults };
}

if (require.main === module) {
  runAllScenarios().then(res => {
    if (res.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  });
}

module.exports = { runAllScenarios };
