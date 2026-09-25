/**
 * Redesign Builder for admin.html
 * Converts admin.html into a Minimal Mobile-First Cockpit for BTC Norton Park
 * Adheres strictly to Brand Guidelines: Dark Forest Pine, Champagne Bronze Gold, SVN-The Seasons, JetBrains Mono
 */

const fs = require('fs');
const path = require('path');

const adminHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>BTC Điều Hành — The SYNC Show · Norton Park | Gamuda Land</title>
<meta name="description" content="Trung tâm điều hành Ban Tổ Chức sự kiện The SYNC Show — Norton Park (Gamuda Land): Kiểm soát cổng tiếp nhận, live stats, cấu hình pool số và tra cứu đối soát vé.">
<meta name="robots" content="noindex,nofollow">
<link rel="icon" type="image/svg+xml" href="assets/favicon.svg">

<!-- FONTS PRECONNECT & IMPORT -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">

<style>
/* ==========================================================================
   DESIGN TOKENS & GAMUDA LAND / NORTON PARK BRAND PALETTE
   ========================================================================== */
@font-face {
  font-family: 'SVN-The Seasons';
  src: url('fonts/SVN-TheSeasons-Regular.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'SVN-The Seasons';
  src: url('fonts/SVN-TheSeasons-Bold.ttf') format('truetype');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'SVN-Gotham';
  src: url('fonts/SVN-Gotham-Regular.otf') format('opentype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'SVN-Gotham';
  src: url('fonts/SVN-Gotham-Bold.otf') format('opentype');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'SFU Futura';
  src: url('fonts/SFUFuturaRegular.TTF') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

:root {
  /* Brand Master Palette */
  --pine-950: #0A140F;
  --pine-900: #0E1D16;
  --pine-850: #14271E;
  --pine-800: #1C3328;
  --pine-700: #2A483B;
  
  /* Champagne Bronze Gold */
  --bronze-200: #F3ECE0;
  --bronze-300: #EADBCA;
  --bronze-400: #DECAA7;
  --bronze-500: #C5A880;
  --bronze-600: #A8865F;
  --gold-glow: rgba(197, 168, 128, 0.25);
  --line-gold: rgba(197, 168, 128, 0.2);
  --line-gold-strong: rgba(222, 202, 167, 0.45);

  /* Status Signals */
  --emerald: #10B981;
  --emerald-bg: rgba(16, 185, 129, 0.12);
  --emerald-glow: rgba(16, 185, 129, 0.35);
  --rose: #EF4444;
  --rose-bg: rgba(239, 68, 68, 0.12);
  --rose-glow: rgba(239, 68, 68, 0.35);
  --amber: #F59E0B;
  --amber-bg: rgba(245, 158, 11, 0.12);

  /* Surfaces & Typography */
  --sand-50: #FAF7F0;
  --sand-200: #D8D2C2;
  --ink-soft: #9BAA9E;
  --card-bg: rgba(14, 29, 22, 0.75);
  --card-bg-elevated: rgba(20, 39, 30, 0.85);

  --serif: 'SVN-The Seasons', Georgia, serif;
  --sans: 'SVN-Gotham', 'Plus Jakarta Sans', -apple-system, sans-serif;
  --mono: 'JetBrains Mono', monospace;

  --r-sm: 8px;
  --r-md: 12px;
  --r-lg: 16px;
  --r-full: 9999px;
  --ease: cubic-bezier(0.16, 1, 0.3, 1);
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--sans);
  background-color: var(--pine-950);
  color: var(--sand-50);
  line-height: 1.45;
  min-height: 100vh;
  min-height: 100dvh;
  position: relative;
  background-image: 
    radial-gradient(circle at 80% 0%, rgba(197, 168, 128, 0.12) 0%, transparent 40%),
    radial-gradient(circle at 10% 60%, rgba(28, 51, 40, 0.4) 0%, transparent 50%),
    linear-gradient(180deg, #09120D 0%, #0E1D16 100%);
  background-attachment: fixed;
  -webkit-font-smoothing: antialiased;
}

/* Biophilic Ambient Grain Overlay */
body::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' seed='5'/><feColorMatrix values='0 0 0 0 0.35  0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.04 0'/></filter><rect width='100%' height='100%' filter='url(%23g)'/></svg>");
  opacity: 0.8;
}

.mono { font-family: var(--mono); }

/* ==========================================================================
   1. STICKY COCKPIT HEADER BAR
   ========================================================================== */
.cockpit-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 56px;
  background: rgba(10, 20, 15, 0.82);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--line-gold);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  padding-left: max(16px, env(safe-area-inset-left));
  padding-right: max(16px, env(safe-area-inset-right));
}

.bar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-monogram {
  display: flex;
  align-items: center;
  gap: 6px;
}

.brand-badge {
  font-family: var(--sans);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--bronze-300);
  background: rgba(197, 168, 128, 0.12);
  border: 1px solid rgba(197, 168, 128, 0.3);
  padding: 2px 8px;
  border-radius: var(--r-full);
}

.bar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.engine-status-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--r-full);
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 11px;
  font-weight: 600;
  color: var(--sand-200);
}

.engine-pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--emerald);
  box-shadow: 0 0 8px var(--emerald);
  animation: pulseGreen 2s infinite ease-in-out;
}
.engine-pulse-dot.offline {
  background: var(--amber);
  box-shadow: 0 0 8px var(--amber);
  animation: none;
}
@keyframes pulseGreen {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.45; transform: scale(0.85); }
}

.icon-btn {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--line-gold);
  color: var(--bronze-300);
  height: 34px;
  padding: 0 10px;
  border-radius: var(--r-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  cursor: pointer;
  font-size: 12px;
  font-family: var(--sans);
  font-weight: 600;
  transition: all 0.2s var(--ease);
}
.icon-btn:hover {
  background: rgba(197, 168, 128, 0.15);
  border-color: var(--bronze-400);
}

/* ==========================================================================
   2. APP SHELL CONTAINER
   ========================================================================== */
.cockpit-shell {
  position: relative;
  z-index: 1;
  max-width: 980px;
  margin: 0 auto;
  padding: 16px 14px 60px;
  padding-left: max(14px, env(safe-area-inset-left));
  padding-right: max(14px, env(safe-area-inset-right));
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Top Event Meta Tag */
.event-meta-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px;
  font-size: 12px;
  color: var(--ink-soft);
}
.event-meta-strip strong {
  color: var(--bronze-300);
  font-weight: 600;
}

/* ==========================================================================
   3. HERO GATE CAPSULE (HOT BUTTON)
   ========================================================================== */
.gate-hero-card {
  border-radius: var(--r-lg);
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  backdrop-filter: blur(12px);
  border: 1px solid var(--line-gold);
  transition: all 0.3s var(--ease);
}

.gate-hero-card.state-open {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.14) 0%, rgba(14, 29, 22, 0.85) 100%);
  border-color: rgba(16, 185, 129, 0.4);
  box-shadow: 0 10px 30px -10px var(--emerald-glow);
}
.gate-hero-card.state-closed {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(14, 29, 22, 0.85) 100%);
  border-color: rgba(239, 68, 68, 0.35);
  box-shadow: 0 10px 30px -10px var(--rose-glow);
}

.gate-info-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.gate-badge-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.gate-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--r-full);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.gate-status-pill.open {
  background: var(--emerald);
  color: #06261A;
}
.gate-status-pill.closed {
  background: var(--rose);
  color: #fff;
}
.gate-status-pill .gate-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.gate-time-text {
  font-size: 11px;
  color: var(--ink-soft);
}

.gate-title {
  font-family: var(--serif);
  font-size: 19px;
  color: var(--sand-50);
  font-weight: 600;
  line-height: 1.2;
}

.hot-button {
  flex-shrink: 0;
  height: 48px;
  padding: 0 20px;
  border-radius: var(--r-md);
  font-family: var(--sans);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.03em;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  border: none;
  transition: all 0.25s var(--ease);
  box-shadow: 0 8px 20px rgba(0,0,0,0.4);
}
.hot-button:active {
  transform: scale(0.97);
}
.hot-button.btn-open-gate {
  background: linear-gradient(135deg, #10B981, #059669);
  color: #032115;
}
.hot-button.btn-close-gate {
  background: linear-gradient(135deg, #EF4444, #DC2626);
  color: #fff;
}

/* Hidden desktop labels if any */
.gate-desc, .gate-alert-banner, .hot-button-hint {
  display: none;
}

/* ==========================================================================
   4. 2X2 KPI MATRIX (MOBILE-OPTIMIZED)
   ========================================================================== */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
  }
}

.kpi-card {
  background: var(--card-bg);
  border: 1px solid var(--line-gold);
  border-radius: var(--r-md);
  padding: 12px 14px;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.kpi-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.kpi-name {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--bronze-400);
}
.kpi-icon-wrap svg {
  stroke: var(--bronze-500);
  opacity: 0.7;
}

.kpi-value-row {
  display: flex;
  align-items: baseline;
  gap: 5px;
}
.kpi-number {
  font-family: var(--mono);
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}
.kpi-unit {
  font-size: 11px;
  color: var(--ink-soft);
}

.kpi-progress-bar-wrap {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  overflow: hidden;
}
.kpi-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--bronze-500), var(--bronze-300));
  transition: width 0.4s ease;
}

.kpi-sub-label {
  font-size: 11px;
  color: var(--ink-soft);
  display: flex;
  justify-content: space-between;
}

/* ==========================================================================
   5. QUICK ACTION TOOLBAR
   ========================================================================== */
.quick-action-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-action-pill {
  flex: 1;
  min-width: 105px;
  height: 38px;
  padding: 0 12px;
  border-radius: var(--r-md);
  font-family: var(--sans);
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s var(--ease);
}
.btn-action-pill:active {
  transform: scale(0.97);
}

.btn-sync {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
  color: var(--sand-50);
}
.btn-sync.spinning svg {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.btn-reset-counter {
  background: var(--amber-bg);
  border-color: rgba(245, 158, 11, 0.35);
  color: #FCD34D;
}
.btn-nuclear-reset {
  background: var(--rose-bg);
  border-color: rgba(239, 68, 68, 0.35);
  color: #FCA5A5;
}

/* ==========================================================================
   6. SEGMENTED NAVIGATION TABS
   ========================================================================== */
.tab-navigation-bar {
  display: flex;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid var(--line-gold);
  border-radius: var(--r-md);
  padding: 4px;
  gap: 4px;
  margin-top: 4px;
}

.nav-tab-btn {
  flex: 1;
  height: 38px;
  border: none;
  background: transparent;
  color: var(--ink-soft);
  font-family: var(--sans);
  font-size: 12.5px;
  font-weight: 700;
  border-radius: calc(var(--r-md) - 3px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s var(--ease);
}
.nav-tab-btn.active {
  background: var(--card-bg-elevated);
  color: var(--bronze-300);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--line-gold-strong);
}

.tab-panel {
  display: none;
}
.tab-panel.active {
  display: flex;
  flex-direction: column;
  gap: 14px;
  animation: fadeIn 0.25s var(--ease);
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ==========================================================================
   7. TAB 1: LOOKUP & DISPUTE SECTION
   ========================================================================== */
.lookup-card {
  background: var(--card-bg);
  border: 1px solid var(--line-gold);
  border-radius: var(--r-lg);
  padding: 16px;
  backdrop-filter: blur(12px);
}

.search-input-wrap {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.search-input {
  flex: 1;
  height: 48px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid var(--line-gold);
  border-radius: var(--r-md);
  padding: 0 14px;
  color: #fff;
  font-family: var(--mono);
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
}
.search-input:focus {
  border-color: var(--bronze-400);
  box-shadow: 0 0 15px var(--gold-glow);
}

.search-btn {
  height: 48px;
  padding: 0 20px;
  border-radius: var(--r-md);
  border: 1px solid var(--bronze-400);
  background: linear-gradient(135deg, var(--bronze-500), var(--bronze-600));
  color: #0B1611;
  font-family: var(--sans);
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.quick-chips-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 10px;
}
.quick-chips-label {
  font-size: 11px;
  color: var(--ink-soft);
}
.quick-sample-chip {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--bronze-300);
  font-family: var(--mono);
  font-size: 11px;
  padding: 3px 8px;
  border-radius: var(--r-full);
  cursor: pointer;
  transition: background 0.15s;
}
.quick-sample-chip:hover {
  background: rgba(197, 168, 128, 0.15);
}

/* Verdict Result Card */
.lookup-results-wrap {
  display: none;
}
.lookup-results-wrap.active {
  display: block;
}

.verdict-card {
  border-radius: var(--r-lg);
  padding: 16px;
  margin-top: 12px;
  border: 1px solid var(--line-gold);
  background: var(--card-bg-elevated);
}
.verdict-card.valid {
  border-color: rgba(16, 185, 129, 0.4);
  background: linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(20, 39, 30, 0.95) 100%);
}
.verdict-card.dispute {
  border-color: rgba(239, 68, 68, 0.45);
  background: linear-gradient(180deg, rgba(239, 68, 68, 0.1) 0%, rgba(20, 39, 30, 0.95) 100%);
}
.verdict-card.not-found {
  border-color: rgba(245, 158, 11, 0.35);
  background: rgba(0, 0, 0, 0.3);
}

.verdict-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.verdict-badge {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: var(--r-full);
}
.verdict-card.valid .verdict-badge { background: var(--emerald); color: #06261A; }
.verdict-card.dispute .verdict-badge { background: var(--rose); color: #fff; }
.verdict-card.not-found .verdict-badge { background: var(--amber); color: #06261A; }

.verdict-ticket-hero {
  font-family: var(--serif);
  font-size: 32px;
  font-weight: 700;
  color: var(--bronze-300);
  margin-bottom: 12px;
  letter-spacing: 0.02em;
}

.verdict-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  font-size: 12.5px;
}
.verdict-meta-item .label {
  color: var(--ink-soft);
  font-size: 11px;
}
.verdict-meta-item .val {
  color: #fff;
  font-weight: 600;
  margin-top: 2px;
}

/* Collapsible Receipt Details */
.receipt-accordion {
  margin-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 12px;
}
.receipt-toggle-btn {
  background: transparent;
  border: none;
  color: var(--bronze-400);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}
.receipt-details-body {
  display: none;
  margin-top: 10px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.35);
  border-radius: var(--r-md);
  font-size: 11.5px;
  color: var(--sand-200);
  line-height: 1.6;
}
.receipt-details-body.expanded {
  display: block;
}

/* ==========================================================================
   8. TAB 2: SETTINGS & POOL CONFIG
   ========================================================================== */
.settings-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}
@media (min-width: 768px) {
  .settings-grid {
    grid-template-columns: 1.2fr 0.8fr;
  }
}

.config-card {
  background: var(--card-bg);
  border: 1px solid var(--line-gold);
  border-radius: var(--r-lg);
  padding: 16px;
}
.card-section-title {
  font-family: var(--serif);
  font-size: 17px;
  color: var(--bronze-300);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.quota-pills-row {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}
.preset-pill {
  flex: 1;
  height: 36px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--line-gold);
  color: var(--sand-200);
  font-family: var(--sans);
  font-size: 12px;
  font-weight: 600;
  border-radius: var(--r-sm);
  cursor: pointer;
  transition: all 0.15s;
}
.preset-pill.active {
  background: rgba(197, 168, 128, 0.2);
  border-color: var(--bronze-400);
  color: #fff;
  font-weight: 700;
}

.mode-pills-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 8px;
}
.mode-pill-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  border-radius: var(--r-md);
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--line-gold);
  cursor: pointer;
  font-size: 12px;
  color: var(--sand-200);
}
.mode-pill-label.checked {
  border-color: var(--bronze-400);
  background: rgba(197, 168, 128, 0.15);
  color: #fff;
}

.btn-seed-pool {
  width: 100%;
  height: 44px;
  margin-top: 14px;
  background: linear-gradient(135deg, var(--bronze-500), var(--bronze-600));
  border: 1px solid var(--bronze-400);
  color: #06140E;
  font-family: var(--sans);
  font-weight: 700;
  font-size: 13px;
  border-radius: var(--r-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* ==========================================================================
   9. TAB 3: AUDIT STREAM (FEED CARDS ON MOBILE)
   ========================================================================== */
.audit-feed-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feed-card {
  background: var(--card-bg);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--r-md);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}
.feed-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.feed-time {
  color: var(--bronze-400);
  font-size: 11px;
}
.feed-action {
  font-weight: 700;
  color: #fff;
}
.feed-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--r-full);
}
.feed-badge.code-ok { background: var(--emerald-bg); color: #34D399; }
.feed-badge.code-err { background: var(--rose-bg); color: #F87171; }
.feed-badge.code-warn { background: var(--amber-bg); color: #FCD34D; }

.feed-detail {
  color: var(--sand-200);
  font-size: 11.5px;
}

/* Desktop Table View */
.table-responsive {
  display: none;
}
@media (min-width: 768px) {
  .table-responsive {
    display: block;
    width: 100%;
    overflow-x: auto;
  }
  .audit-feed-list {
    display: none;
  }
}
.audit-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  text-align: left;
}
.audit-table th {
  padding: 8px 10px;
  color: var(--bronze-400);
  border-bottom: 1px solid var(--line-gold);
  font-size: 11px;
  text-transform: uppercase;
}
.audit-table td {
  padding: 8px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: var(--sand-200);
}

/* ==========================================================================
   10. MODALS & TOASTS
   ========================================================================== */
.modal-overlay {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.modal-overlay.active {
  display: flex;
}

.modal-card {
  width: 100%;
  max-width: 440px;
  background: #0E1D16;
  border: 1px solid var(--line-gold);
  border-radius: var(--r-lg);
  padding: 20px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
}
.modal-title {
  font-family: var(--serif);
  font-size: 18px;
  color: var(--sand-50);
  margin-bottom: 8px;
}
.modal-body-text {
  font-size: 13px;
  color: var(--sand-200);
  line-height: 1.5;
  margin-bottom: 14px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
.btn-modal-cancel {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--line-gold);
  color: var(--sand-200);
  border-radius: var(--r-sm);
  font-size: 13px;
  cursor: pointer;
}
.btn-modal-primary {
  padding: 8px 18px;
  background: var(--bronze-500);
  border: 1px solid var(--bronze-400);
  color: #06140E;
  font-weight: 700;
  border-radius: var(--r-sm);
  font-size: 13px;
  cursor: pointer;
}
.btn-modal-danger {
  padding: 8px 18px;
  background: var(--rose);
  border: none;
  color: #fff;
  font-weight: 700;
  border-radius: var(--r-sm);
  font-size: 13px;
  cursor: pointer;
}

/* Toast Container */
.toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 340px;
  pointer-events: none;
}
@media (max-width: 640px) {
  .toast-container {
    bottom: 16px;
    left: 16px;
    right: 16px;
    max-width: none;
  }
}
.toast-item {
  background: #14271E;
  border: 1px solid var(--line-gold);
  border-radius: var(--r-md);
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  font-size: 12.5px;
  pointer-events: auto;
}
.toast-title { font-weight: 700; color: #fff; }
.toast-msg { color: var(--sand-200); font-size: 11.5px; }

/* Utility classes */
.hidden { display: none !important; }
</style>
</head>
<body>

<!-- 1. STICKY COCKPIT TOP BAR -->
<header class="cockpit-bar">
  <div class="bar-brand">
    <div class="brand-monogram">
      <img src="assets/logo-norton-park-official.png" alt="Norton Park" height="24" style="display:block; object-fit:contain;">
    </div>
    <span class="brand-badge">BTC Điều Hành</span>
  </div>

  <div class="bar-actions">
    <div class="engine-status-pill" id="engineStatusPill" title="Kết nối máy chủ Redis / Vercel API">
      <div class="engine-pulse-dot" id="enginePulseDot"></div>
      <span id="engineStatusText">Live API</span>
    </div>

    <!-- Sound FX -->
    <button type="button" class="icon-btn" id="soundToggleBtn" title="Bật/Tắt âm thanh">
      <svg id="soundIconOn" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
      <svg id="soundIconOff" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none;"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
    </button>

    <!-- Token Auth -->
    <button type="button" class="icon-btn" id="openAuthModalBtn" title="Cấu hình Token Admin">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      <span id="authKeyDisplay">Token</span>
    </button>
  </div>
</header>

<!-- 2. MAIN COCKPIT SHELL -->
<main class="cockpit-shell">
  <!-- Event Info Banner -->
  <div class="event-meta-strip">
    <span>The SYNC Show · <strong>08.10.2026</strong></span>
    <span>Rạp Xiếc Phú Thọ · <strong>Gamuda Land</strong></span>
  </div>

  <!-- HERO GATE CONTROL CAPSULE -->
  <section class="gate-hero-card state-closed" id="gateHeroCard">
    <div class="gate-info-col">
      <div class="gate-badge-wrap">
        <div class="gate-status-pill closed" id="gateStatusPill">
          <span class="gate-dot"></span>
          <span id="gateStatusPillText">ĐANG ĐÓNG CỔNG</span>
        </div>
        <span class="gate-time-text" id="gateLastChangeText">Cập nhật: --:--</span>
      </div>
      <h1 class="gate-title" id="gateHeadlineText">Cổng Check-in Tạm Khóa</h1>
    </div>

    <button type="button" class="hot-button btn-open-gate" id="hotGateBtn">
      <span id="hotGateIcon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg></span>
      <span id="hotGateBtnLabel">MỞ CỔNG CHECK-IN</span>
    </button>
  </section>

  <!-- 2X2 KPI MATRIX (MOBILE FIRST) -->
  <section class="stats-grid">
    <!-- Card 1: Total Check-in -->
    <div class="kpi-card">
      <div class="kpi-header">
        <span class="kpi-name">Tổng Đã Check-in</span>
        <div class="kpi-icon-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
      </div>
      <div class="kpi-value-row">
        <span class="kpi-number" id="statTotalCheckin">0</span>
        <span class="kpi-unit">chiến binh</span>
      </div>
      <div class="kpi-progress-bar-wrap">
        <div class="kpi-progress-fill" id="statProgressBar" style="width: 0%;"></div>
      </div>
      <div class="kpi-sub-label">
        <span id="statCheckinPercent">0% quota</span>
        <span class="mono">stats:total</span>
      </div>
    </div>

    <!-- Card 2: Pool Remaining -->
    <div class="kpi-card">
      <div class="kpi-header">
        <span class="kpi-name">Còn Lại Trong Pool</span>
        <div class="kpi-icon-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
        </div>
      </div>
      <div class="kpi-value-row">
        <span class="kpi-number" id="statPoolRemaining">1,000</span>
        <span class="kpi-unit">vé</span>
      </div>
      <div class="kpi-sub-label">
        <span id="statPoolAvailableStatus">Sẵn sàng cấp phát</span>
        <span class="mono">lucky:pool</span>
      </div>
    </div>

    <!-- Card 3: Pool Quota & Mode -->
    <div class="kpi-card">
      <div class="kpi-header">
        <span class="kpi-name">Quota Phát Hành</span>
        <div class="kpi-icon-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
      </div>
      <div class="kpi-value-row">
        <span class="kpi-number" id="statPoolMax">1,000</span>
        <span class="kpi-unit">vé tổng</span>
      </div>
      <div class="kpi-sub-label">
        <span id="statPoolModeTag">Chế độ: SHUFFLE</span>
      </div>
    </div>

    <!-- Card 4: Gate Status Indicator -->
    <div class="kpi-card">
      <div class="kpi-header">
        <span class="kpi-name">Trạng Thái Cổng</span>
        <div class="kpi-icon-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
        </div>
      </div>
      <div class="kpi-value-row">
        <span class="kpi-number" id="statGateKpiText" style="color: var(--rose); font-size: 22px;">CLOSED</span>
      </div>
      <div class="kpi-sub-label">
        <span>Kiểm soát trực tiếp</span>
        <span class="mono">config:gate</span>
      </div>
    </div>
  </section>

  <!-- QUICK ACTION TOOLBAR -->
  <div class="quick-action-bar">
    <button type="button" class="btn-action-pill btn-sync" id="manualSyncBtn" title="Đồng bộ số liệu ngay lập tức">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
      <span>Làm mới (3s)</span>
    </button>
    <button type="button" class="btn-action-pill btn-reset-counter" id="btnQuickResetCounter" title="Đặt lại số đếm check-in về 0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
      <span>Reset Số Đếm (0)</span>
    </button>
    <button type="button" class="btn-action-pill btn-nuclear-reset" id="btnQuickNuclearReset" title="Xóa toàn bộ dữ liệu & làm sạch database">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      <span>Làm Sạch DB</span>
    </button>
  </div>

  <!-- SEGMENTED TABS CONTROLLER -->
  <nav class="tab-navigation-bar" role="tablist">
    <button type="button" class="nav-tab-btn active" data-target="tabLookup">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <span>Tra Cứu Vé</span>
    </button>
    <button type="button" class="nav-tab-btn" data-target="tabSettings">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      <span>Cài Đặt &amp; Pool</span>
    </button>
    <button type="button" class="nav-tab-btn" data-target="tabAudit">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      <span>Nhật Ký Stream</span>
    </button>
  </nav>

  <!-- ====================================================================
       TAB 1 PANEL: TRA CỨU & ĐỐI SOÁT TRANH CHẤP
       ==================================================================== -->
  <div class="tab-panel active" id="tabLookup">
    <div class="lookup-card">
      <div class="card-section-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <span>Tra Cứu Hồ Sơ Check-in Đại Lý F1</span>
      </div>

      <form id="lookupForm">
        <div class="search-input-wrap">
          <input type="text" id="lookupQuery" class="search-input" placeholder="Nhập Số ĐT, 4 số CCCD hoặc Số vé (#088)..." autocomplete="off">
          <button type="submit" class="search-btn" id="lookupSubmitBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            <span>Tra cứu</span>
          </button>
        </div>
      </form>

      <!-- Quick Chips -->
      <div class="quick-chips-row">
        <span class="quick-chips-label">Mẫu nhanh:</span>
        <button type="button" class="quick-sample-chip" data-q="#088">#088</button>
        <button type="button" class="quick-sample-chip" data-q="0908168286">0908 168 286</button>
        <button type="button" class="quick-sample-chip" data-q="079092008888">CCCD ...8888</button>
        <button type="button" class="quick-sample-chip" id="chipClientSession" style="display:none; border-color:var(--bronze-400); color:#fff;"></button>
      </div>

      <!-- Verdict Result Container -->
      <div class="lookup-results-wrap" id="lookupResultsContainer">
        <div class="verdict-card" id="verdictCard">
          <div class="verdict-header">
            <span class="verdict-badge" id="verdictPill">HỢP LỆ</span>
            <span style="font-size:11px; color:var(--ink-soft);" id="verdictStatusText">Xác thực bởi máy chủ CĐT Gamuda Land</span>
          </div>

          <div class="verdict-ticket-hero" id="verdictTicketNumber">#088</div>

          <div class="verdict-meta-grid">
            <div class="verdict-meta-item">
              <div class="label">Họ và Tên</div>
              <div class="val" id="verdictName">--</div>
            </div>
            <div class="verdict-meta-item">
              <div class="label">Số Điện Thoại</div>
              <div class="val mono" id="verdictPhone">--</div>
            </div>
            <div class="verdict-meta-item">
              <div class="label">4 Số Cuối CCCD</div>
              <div class="val mono" id="verdictCccd">--</div>
            </div>
            <div class="verdict-meta-item">
              <div class="label">Đại Lý F1</div>
              <div class="val" id="verdictAgency" style="color:var(--bronze-300);">--</div>
            </div>
          </div>

          <!-- Collapsible Receipt Breakdown -->
          <div class="receipt-accordion" id="receiptCard">
            <button type="button" class="receipt-toggle-btn" id="toggleReceiptDetailsBtn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              <span>Biên lai số &amp; Chữ ký HMAC</span>
            </button>
            <div class="receipt-details-body" id="receiptDetailsBody">
              <div><strong>Receipt ID:</strong> <span class="mono" id="receiptIdText">--</span> <button type="button" id="copyReceiptBtn" style="background:none; border:none; color:var(--bronze-400); font-weight:700; cursor:pointer; margin-left:6px;">Copy</button></div>
              <div><strong>Thời gian cấp:</strong> <span id="receiptRespondedAt">--</span></div>
              <div><strong>Trạm check-in IP:</strong> <span class="mono" id="receiptClientIp">--</span></div>
              <div><strong>Thiết bị:</strong> <span id="receiptUserAgent">--</span></div>
              <div><strong>Cờ Replay:</strong> <span id="receiptReplayFlag">NO</span></div>
              <div style="word-break:break-all; margin-top:4px;"><strong>Chữ ký HMAC SHA-256:</strong> <span class="mono" id="receiptHash" style="font-size:10px; color:var(--bronze-400);">--</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ====================================================================
       TAB 2 PANEL: CÀI ĐẶT & SEED POOL
       ==================================================================== -->
  <div class="tab-panel" id="tabSettings">
    <div class="settings-grid">
      <div class="config-card">
        <div class="card-section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <span>Khởi Tạo Pool Vé May Mắn (Seed Pool)</span>
        </div>
        <p style="font-size:12px; color:var(--ink-soft);">Thiết lập số vé may mắn cấp phát tại hội trường. Nạp trực tiếp vào Redis List <code>lucky:pool</code>.</p>

        <!-- Quota presets -->
        <div style="margin-top:10px;">
          <label style="font-size:11px; font-weight:700; color:var(--bronze-300);">DUNG LƯỢNG VÉ PHÁT HÀNH</label>
          <input type="number" id="inputPoolMax" value="1000" min="10" max="10000" step="10" style="display:none;">
          <div class="quota-pills-row">
            <button type="button" class="preset-pill" data-val="500">500 vé</button>
            <button type="button" class="preset-pill active" data-val="1000">1,000 vé</button>
            <button type="button" class="preset-pill" data-val="1500">1,500 vé</button>
            <button type="button" class="preset-pill" data-val="2000">2,000 vé</button>
          </div>
        </div>

        <!-- Mode selector -->
        <div style="margin-top:12px;">
          <label style="font-size:11px; font-weight:700; color:var(--bronze-300);">CHẾ ĐỘ CẤP PHÁT</label>
          <div class="mode-pills-row">
            <label class="mode-pill-label checked" id="labelModeShuffle">
              <input type="radio" name="seedMode" value="SHUFFLE" checked style="display:none;">
              <span>🎲 SHUFFLE (Ngẫu nhiên)</span>
            </label>
            <label class="mode-pill-label" id="labelModeSequential">
              <input type="radio" name="seedMode" value="SEQUENTIAL" style="display:none;">
              <span>🔢 SEQUENTIAL (Tuần tự)</span>
            </label>
          </div>
        </div>

        <button type="button" class="btn-seed-pool" id="triggerSeedBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          <span>Khởi Tạo Lại Pool Số</span>
        </button>
      </div>

      <div class="config-card">
        <div class="card-section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span>Quy Chuẩn Kỹ Thuật</span>
        </div>
        <div style="font-size:12px; color:var(--sand-200); line-height:1.7;">
          <div>• <strong>Redis:</strong> Upstash Singapore (Atomic LPOP &lt;3.5ms)</div>
          <div>• <strong>Chống trùng:</strong> 1 CCCD = 1 số duy nhất</div>
          <div>• <strong>Dual-Tracking:</strong> Meta CAPI v22.0 + Sheets ERP</div>
          <div>• <strong>Event:</strong> The SYNC Show · 08.10.2026 Phú Thọ</div>
        </div>

        <!-- Hidden trigger for nuclear reset modal -->
        <button type="button" id="triggerResetBtn" style="margin-top:16px; width:100%; height:38px; background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.35); color:#FCA5A5; font-size:12px; font-weight:700; border-radius:var(--r-md); cursor:pointer;">
          🗑️ Mở Hộp Thoại Nuclear Reset
        </button>
      </div>
    </div>
  </div>

  <!-- ====================================================================
       TAB 3 PANEL: NHẬT KÝ SỰ KIỆN (AUDIT STREAM)
       ==================================================================== -->
  <div class="tab-panel" id="tabAudit">
    <div class="lookup-card" id="auditStreamCard">
      <div class="card-section-title" style="justify-content:space-between;">
        <div style="display:flex; align-items:center; gap:8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          <span>Nhật Ký Dòng Sự Kiện (Audit Stream)</span>
        </div>
        <span class="mono" style="font-size:10.5px; color:var(--ink-soft);">XADD audit:log</span>
      </div>

      <!-- Mobile Feed Cards -->
      <div class="audit-feed-list" id="auditFeedList">
        <!-- Rendered via JS -->
      </div>

      <!-- Desktop Table -->
      <div class="table-responsive">
        <table class="audit-table">
          <thead>
            <tr>
              <th style="width:120px;">Thời Gian</th>
              <th style="width:170px;">Hành Động</th>
              <th style="width:130px;">Kết Quả</th>
              <th style="width:120px;">Địa Chỉ IP</th>
              <th>Chi Tiết</th>
            </tr>
          </thead>
          <tbody id="auditTableBody">
            <!-- Rendered via JS -->
          </tbody>
        </table>
      </div>
    </div>
  </div>
</main>

<!-- ====================================================================
     MODALS
     ==================================================================== -->

<!-- 1. MODAL: NUCLEAR RESET CONFIRMATION -->
<div class="modal-overlay" id="confirmResetModal">
  <div class="modal-card">
    <h3 class="modal-title" style="color:var(--rose);">⚠️ Xác Nhận Xóa Toàn Bộ Dữ Liệu</h3>
    <p class="modal-body-text">
      Hành động này sẽ <strong>XÓA TOÀN BỘ</strong> dữ liệu check-in, vé đã phát, biên lai, và nhật ký kiểm toán. Kho vé 1.000 số sẽ được khởi tạo lại mới toanh.
    </p>

    <div style="margin-bottom:12px;">
      <label style="font-size:12px; color:var(--sand-200);">Gõ <strong style="color:var(--rose);">XÓA HẾT</strong> để xác nhận:</label>
      <input type="text" id="resetConfirmInput" class="search-input" placeholder="Gõ: XÓA HẾT" autocomplete="off" style="width:100%; height:40px; margin-top:6px; font-size:14px;">
    </div>

    <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
      <input type="checkbox" id="resetConfirmCheckbox" style="width:18px; height:18px; accent-color:var(--rose);">
      <label for="resetConfirmCheckbox" style="font-size:12px; color:var(--sand-200); cursor:pointer;">Tôi hiểu hành động này không thể hoàn tác</label>
    </div>

    <div class="modal-actions">
      <button type="button" class="btn-modal-cancel" id="cancelResetBtn">Hủy Bỏ</button>
      <button type="button" class="btn-modal-danger" id="executeResetBtn" disabled style="opacity:0.5; cursor:not-allowed;">🗑️ XÓA TOÀN BỘ</button>
    </div>
  </div>
</div>

<!-- 2. MODAL: SEED POOL CONFIRMATION -->
<div class="modal-overlay" id="seedConfirmModal">
  <div class="modal-card">
    <h3 class="modal-title" id="seedModalTitle" style="color:var(--amber);">⚠️ Khởi Tạo Lại Pool Số!</h3>
    <p class="modal-body-text">
      Thao tác này sẽ xóa toàn bộ số hiện tại trong <code>lucky:pool</code> và tạo mới <strong id="modalSeedCountPreview">1,000</strong> vé theo chế độ <strong id="modalSeedModePreview">SHUFFLE</strong>.
    </p>

    <div style="margin-bottom:12px;">
      <label for="confirmSeedInput" style="font-size:12px; color:var(--sand-200);">Nhập chữ <strong>XÁC NHẬN</strong>:</label>
      <input type="text" id="confirmSeedInput" class="search-input" placeholder="Nhập: XÁC NHẬN" autocomplete="off" style="width:100%; height:40px; margin-top:6px;">
    </div>

    <div class="modal-actions">
      <button type="button" class="btn-modal-cancel" id="cancelSeedBtn">Hủy Bỏ</button>
      <button type="button" class="btn-modal-primary" id="executeSeedBtn" disabled style="opacity:0.5; cursor:not-allowed;">Xác Nhận Seed</button>
    </div>
  </div>
</div>

<!-- 3. MODAL: AUTHENTICATION / ADMIN SECRET -->
<div class="modal-overlay" id="authModal">
  <div class="modal-card">
    <h3 class="modal-title">Xác Thực Quản Trị BTC</h3>
    <p class="modal-body-text">Nhập <code>ADMIN_SECRET</code> để xác thực quyền quản trị hệ thống.</p>

    <div style="margin-bottom:12px;">
      <input type="password" id="adminSecretInput" class="search-input" placeholder="Nhập ADMIN_SECRET..." style="width:100%; height:42px;">
      <div style="display:flex; justify-content:space-between; margin-top:8px;">
        <button type="button" id="useDefaultSecretBtn" style="background:none; border:none; font-size:11px; color:var(--bronze-400); text-decoration:underline; cursor:pointer;">Mặc định (norton_admin_secret_2026)</button>
        <button type="button" id="toggleSecretVisibilityBtn" style="background:none; border:none; font-size:11px; color:var(--ink-soft); cursor:pointer;">Hiện mật khẩu</button>
      </div>
    </div>

    <div class="modal-actions">
      <button type="button" class="btn-modal-cancel" id="cancelAuthBtn">Đóng</button>
      <button type="button" class="btn-modal-primary" id="saveAuthBtn">Lưu &amp; Xác Thực</button>
    </div>
  </div>
</div>

<!-- TOAST CONTAINER -->
<div class="toast-container" id="toastContainer" aria-live="polite"></div>

<!-- ====================================================================
     JAVASCRIPT: CLIENT CONTROLLER, DUAL-ENGINE (API + MOCK), AUDIT LOG
     ==================================================================== -->
<script>
(function() {
  'use strict';

  const STORAGE_SECRET_KEY = 'norton_admin_secret';
  const STORAGE_MOCK_STATE = 'norton_admin_mock_state_v1';
  const DEFAULT_SECRET = 'norton_admin_secret_2026';
  const CLIENT_TICKET_SESSION = 'norton_park_ticket_session';

  // Sound FX
  let soundEnabled = true;
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function playTone(type) {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      if (type === 'gate-open' || type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'gate-close') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(360, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {}
  }

  // Toast System
  function showToast(title, msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast-item ' + type;
    toast.innerHTML = '<div style="font-size:18px;">' + (type === 'success' ? '✅' : (type === 'error' ? '❌' : '⚠️')) + '</div>' +
      '<div><div class="toast-title">' + title + '</div><div class="toast-msg">' + msg + '</div></div>';
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Fallback MockEngine
  class MockEngine {
    static init() {
      let state = null;
      try {
        const saved = localStorage.getItem(STORAGE_MOCK_STATE);
        if (saved) state = JSON.parse(saved);
      } catch (e) {}
      if (!state) {
        state = {
          gateStatus: 'closed',
          poolMax: 1000,
          poolRemaining: 1000,
          totalCheckin: 0,
          mode: 'SHUFFLE',
          updatedAt: new Date().toISOString(),
          database: [
            {
              name: 'Nguyễn Thành Nam',
              phone: '0908168286',
              cccd: '079092008888',
              agency: 'ERA Vietnam',
              luckyNumber: '#088',
              checkedInAt: '2026-09-25T14:47:22.335Z',
              receiptId: 'rcpt_np2026_demo_088',
              isReplay: false,
              integrityHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
            }
          ]
        };
        MockEngine.save(state);
      }
      return state;
    }
    static get() { return MockEngine.init(); }
    static save(state) {
      try { localStorage.setItem(STORAGE_MOCK_STATE, JSON.stringify(state)); } catch (e) {}
    }
    static handle(path, options = {}) {
      const state = MockEngine.get();
      const method = (options.method || 'GET').toUpperCase();
      const urlObj = new URL(path, window.location.origin);
      const pathname = urlObj.pathname;

      if (pathname === '/api/admin/config' && method === 'GET') {
        return { status: 200, data: { success: true, ...state } };
      }
      if (pathname === '/api/admin/config' && method === 'POST') {
        let body = {};
        try { body = JSON.parse(options.body || '{}'); } catch (e) {}
        if (body.action === 'gate') state.gateStatus = body.value;
        if (body.action === 'reset_counter') state.totalCheckin = 0;
        if (body.action === 'reset') { state.totalCheckin = 0; state.poolRemaining = state.poolMax; }
        state.updatedAt = new Date().toISOString();
        MockEngine.save(state);
        return { status: 200, data: { success: true, ...state, message: 'Thao tác mô phỏng thành công' } };
      }
      if (pathname === '/api/admin/lookup') {
        return {
          status: 200,
          data: {
            success: true,
            verdict: 'MATCH_FOUND',
            record: state.database[0],
            receipt: state.database[0],
            auditLogs: []
          }
        };
      }
      return { status: 404, data: { success: false } };
    }
  }

  // API Fetch with Auth
  function getStoredSecret() {
    return localStorage.getItem(STORAGE_SECRET_KEY) || DEFAULT_SECRET;
  }

  async function apiFetch(path, options = {}) {
    const secret = getStoredSecret();
    const finalOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + secret,
        'x-admin-secret': secret,
        ...(options.headers || {})
      }
    };

    try {
      const resp = await fetch(path, finalOptions);
      if (resp.ok) {
        updateEngineBadge('Live API', true);
        return await resp.json();
      }
      if (resp.status === 401 || resp.status === 403) {
        showToast('Xác Thực Thất Bại', 'ADMIN_SECRET chưa chính xác.', 'error');
        openAuthModal();
        throw new Error('Unauthorized');
      }
      updateEngineBadge('Demo Sim', false);
      return MockEngine.handle(path, finalOptions).data;
    } catch (err) {
      updateEngineBadge('Demo Sim', false);
      return MockEngine.handle(path, finalOptions).data;
    }
  }

  function updateEngineBadge(text, isOnline) {
    const engineText = document.getElementById('engineStatusText');
    const engineDot = document.getElementById('enginePulseDot');
    if (engineText) engineText.textContent = text;
    if (engineDot) {
      if (isOnline) engineDot.classList.remove('offline');
      else engineDot.classList.add('offline');
    }
  }

  // DOM Elements
  let currentGateStatus = 'closed';
  let currentPoolMax = 1000;
  let currentMode = 'SHUFFLE';
  let pollIntervalId = null;

  const gateHeroCard = document.getElementById('gateHeroCard');
  const gateStatusPill = document.getElementById('gateStatusPill');
  const gateStatusPillText = document.getElementById('gateStatusPillText');
  const gateHeadlineText = document.getElementById('gateHeadlineText');
  const gateLastChangeText = document.getElementById('gateLastChangeText');
  const hotGateBtn = document.getElementById('hotGateBtn');
  const hotGateBtnLabel = document.getElementById('hotGateBtnLabel');
  const hotGateIcon = document.getElementById('hotGateIcon');

  const statTotalCheckin = document.getElementById('statTotalCheckin');
  const statCheckinPercent = document.getElementById('statCheckinPercent');
  const statProgressBar = document.getElementById('statProgressBar');
  const statPoolRemaining = document.getElementById('statPoolRemaining');
  const statPoolAvailableStatus = document.getElementById('statPoolAvailableStatus');
  const statPoolMax = document.getElementById('statPoolMax');
  const statPoolModeTag = document.getElementById('statPoolModeTag');
  const statGateKpiText = document.getElementById('statGateKpiText');

  const manualSyncBtn = document.getElementById('manualSyncBtn');
  const btnQuickResetCounter = document.getElementById('btnQuickResetCounter');
  const btnQuickNuclearReset = document.getElementById('btnQuickNuclearReset');

  // Render Gate
  function renderGateState(status, lastUpdated) {
    currentGateStatus = status === 'open' ? 'open' : 'closed';
    const isOpen = currentGateStatus === 'open';

    if (isOpen) {
      gateHeroCard.className = 'gate-hero-card state-open';
      gateStatusPill.className = 'gate-status-pill open';
      gateStatusPillText.textContent = 'ĐANG MỞ CỔNG';
      gateHeadlineText.textContent = 'Cổng Check-in Đang Mở';
      hotGateBtn.className = 'hot-button btn-close-gate';
      hotGateBtnLabel.textContent = 'ĐÓNG CỔNG';
      hotGateIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
      statGateKpiText.textContent = 'LIVE (OPEN)';
      statGateKpiText.style.color = 'var(--emerald)';
    } else {
      gateHeroCard.className = 'gate-hero-card state-closed';
      gateStatusPill.className = 'gate-status-pill closed';
      gateStatusPillText.textContent = 'ĐANG ĐÓNG CỔNG';
      gateHeadlineText.textContent = 'Cổng Check-in Tạm Khóa';
      hotGateBtn.className = 'hot-button btn-open-gate';
      hotGateBtnLabel.textContent = 'MỞ CỔNG CHECK-IN';
      hotGateIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>';
      statGateKpiText.textContent = 'CLOSED';
      statGateKpiText.style.color = 'var(--rose)';
    }

    if (lastUpdated) {
      try {
        const d = new Date(lastUpdated);
        gateLastChangeText.textContent = 'Cập nhật: ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      } catch (e) {}
    }
  }

  // Render Stats
  function renderStats(data) {
    const total = data.totalCheckin || 0;
    const poolMax = data.poolMax || 1000;
    const remaining = data.poolRemaining !== undefined ? data.poolRemaining : (poolMax - total);
    const mode = data.mode || 'SHUFFLE';

    currentPoolMax = poolMax;
    currentMode = mode;

    statTotalCheckin.textContent = total.toLocaleString('vi-VN');
    statPoolRemaining.textContent = remaining.toLocaleString('vi-VN');
    statPoolMax.textContent = poolMax.toLocaleString('vi-VN');
    statPoolModeTag.textContent = 'Chế độ: ' + mode;

    const percent = Math.min(100, Math.round((total / Math.max(1, poolMax)) * 100));
    statCheckinPercent.textContent = percent + '% quota';
    statProgressBar.style.width = percent + '%';

    if (remaining < 50) {
      statPoolRemaining.style.color = 'var(--rose)';
      statPoolAvailableStatus.textContent = '⚠️ Sắp cạn pool!';
    } else if (remaining < 200) {
      statPoolRemaining.style.color = 'var(--amber)';
      statPoolAvailableStatus.textContent = 'Còn dưới 20% quota';
    } else {
      statPoolRemaining.style.color = '#fff';
      statPoolAvailableStatus.textContent = 'Sẵn sàng cấp phát';
    }
  }

  // Sync Server
  async function fetchConfig(isManual = false) {
    if (isManual && manualSyncBtn) manualSyncBtn.classList.add('spinning');
    try {
      const data = await apiFetch('/api/admin/config');
      if (data && data.success) {
        renderGateState(data.gateStatus, data.updatedAt);
        renderStats(data);
        if (isManual) showToast('Đã Đồng Bộ', 'Chỉ số vận hành đã được cập nhật.', 'success');
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (manualSyncBtn) setTimeout(() => manualSyncBtn.classList.remove('spinning'), 400);
    }
  }

  // Hot Button Toggle
  hotGateBtn?.addEventListener('click', async () => {
    const nextVal = currentGateStatus === 'open' ? 'closed' : 'open';
    if (nextVal === 'closed') {
      if (!window.confirm('⚠️ XÁC NHẬN ĐÓNG CỔNG:\nBạn có chắc chắn muốn ngắt tiếp nhận check-in ngay bây giờ?')) return;
    }
    hotGateBtn.disabled = true;
    try {
      const res = await apiFetch('/api/admin/config', {
        method: 'POST',
        body: JSON.stringify({ action: 'gate', value: nextVal })
      });
      if (res && res.success) {
        renderGateState(res.gateStatus, res.updatedAt);
        renderStats(res);
        playTone(nextVal === 'open' ? 'gate-open' : 'gate-close');
        showToast(nextVal === 'open' ? 'Đã Mở Cổng' : 'Đã Đóng Cổng', res.message || '', 'success');
      }
    } catch (e) {
      showToast('Lỗi Thao Tác', e.message, 'error');
    } finally {
      hotGateBtn.disabled = false;
    }
  });

  // Quick Action Buttons
  manualSyncBtn?.addEventListener('click', () => fetchConfig(true));

  btnQuickResetCounter?.addEventListener('click', async () => {
    if (!window.confirm('⚠️ XÁC NHẬN:\nĐặt lại số đếm check-in (stats:total) về 0?')) return;
    btnQuickResetCounter.disabled = true;
    try {
      const res = await apiFetch('/api/admin/config', {
        method: 'POST',
        body: JSON.stringify({ action: 'reset_counter' })
      });
      if (res && res.success) {
        showToast('Reset Thành Công', res.message || 'Số đếm đã về 0.', 'success');
        playTone('success');
        fetchConfig(true);
      }
    } catch (e) {
      showToast('Lỗi Kết Nối', e.message, 'error');
    } finally {
      btnQuickResetCounter.disabled = false;
    }
  });

  // Tab Navigation Switching
  const navTabs = document.querySelectorAll('.nav-tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.target;
      navTabs.forEach(t => t.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(target)?.classList.add('active');
    });
  });

  // Tab 1: Lookup Form & Results
  const lookupForm = document.getElementById('lookupForm');
  const lookupQuery = document.getElementById('lookupQuery');
  const lookupSubmitBtn = document.getElementById('lookupSubmitBtn');
  const lookupResultsContainer = document.getElementById('lookupResultsContainer');
  const verdictCard = document.getElementById('verdictCard');
  const verdictPill = document.getElementById('verdictPill');
  const verdictStatusText = document.getElementById('verdictStatusText');
  const verdictTicketNumber = document.getElementById('verdictTicketNumber');
  const verdictName = document.getElementById('verdictName');
  const verdictPhone = document.getElementById('verdictPhone');
  const verdictCccd = document.getElementById('verdictCccd');
  const verdictAgency = document.getElementById('verdictAgency');

  const receiptIdText = document.getElementById('receiptIdText');
  const receiptRespondedAt = document.getElementById('receiptRespondedAt');
  const receiptClientIp = document.getElementById('receiptClientIp');
  const receiptUserAgent = document.getElementById('receiptUserAgent');
  const receiptReplayFlag = document.getElementById('receiptReplayFlag');
  const receiptHash = document.getElementById('receiptHash');
  const copyReceiptBtn = document.getElementById('copyReceiptBtn');
  const toggleReceiptDetailsBtn = document.getElementById('toggleReceiptDetailsBtn');
  const receiptDetailsBody = document.getElementById('receiptDetailsBody');

  toggleReceiptDetailsBtn?.addEventListener('click', () => {
    receiptDetailsBody.classList.toggle('expanded');
  });

  copyReceiptBtn?.addEventListener('click', () => {
    const text = receiptIdText.textContent.trim();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast('Đã Sao Chép', 'Receipt ID đã được lưu vào clipboard.', 'success');
    }
  });

  async function performLookup(query) {
    if (!query) {
      showToast('Thiếu Thông Tin', 'Vui lòng nhập SĐT, 4 số CCCD hoặc Số vé.', 'warning');
      return;
    }
    lookupSubmitBtn.disabled = true;
    lookupSubmitBtn.textContent = '...';

    try {
      const res = await apiFetch('/api/admin/lookup?q=' + encodeURIComponent(query));
      if (res && res.success && (res.verdict === 'MATCH_FOUND' || res.verdict === 'REPLAY_DETECTED')) {
        renderFoundVerdict(res);
        playTone('success');
      } else {
        renderNotFoundVerdict(res || { query });
      }
      lookupResultsContainer.classList.add('active');
    } catch (e) {
      showToast('Lỗi Tra Cứu', 'Không thể kết nối máy chủ.', 'error');
    } finally {
      lookupSubmitBtn.disabled = false;
      lookupSubmitBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg><span>Tra cứu</span>';
    }
  }

  function renderFoundVerdict(res) {
    const records = Array.isArray(res.records) ? res.records : (res.record ? [res.record] : [{}]);
    const rec = records[0];
    const rcpt = res.receipt || {};
    const isReplay = res.verdict === 'REPLAY_DETECTED' || records.length > 1;

    verdictCard.className = 'verdict-card ' + (isReplay ? 'dispute' : 'valid');
    verdictPill.textContent = isReplay ? 'CẢNH BÁO REPLAY' : 'HỢP LỆ';
    verdictStatusText.textContent = isReplay 
      ? \`Phát hiện \${records.length} hồ sơ trùng lặp!\` 
      : 'Lá vé chính chủ được bảo chứng bởi Gamuda Land';

    verdictTicketNumber.textContent = records.map(r => r.luckyNumber || r.ticketCode || '#---').join(', ');
    verdictName.textContent = rec.name || rec.fullName || '--';
    verdictPhone.textContent = rec.phone || '--';

    const cccdStr = rec.cccd || rec.cccdLast4 || '--';
    verdictCccd.textContent = cccdStr.length >= 4 ? ('•••• ' + cccdStr.slice(-4)) : cccdStr;
    verdictAgency.textContent = records.map(r => r.agency || '--').join(', ');

    receiptIdText.textContent = rcpt.receiptId || '--';
    receiptRespondedAt.textContent = rcpt.respondedAt ? new Date(rcpt.respondedAt).toLocaleString('vi-VN') : '--';
    receiptClientIp.textContent = rcpt.clientIp || rcpt.ip || '--';
    receiptUserAgent.textContent = rcpt.userAgent || rcpt.ua || '--';
    receiptReplayFlag.textContent = rcpt.isReplay ? 'YES (Cảnh báo trùng lặp)' : 'NO (Lần đầu)';
    receiptHash.textContent = rcpt.integrityHash || 'HMAC-SHA256 Master Key';

    renderAuditTable(res.auditLogs || []);
  }

  function renderNotFoundVerdict(res) {
    verdictCard.className = 'verdict-card not-found';
    verdictPill.textContent = 'KHÔNG TÌM THẤY';
    verdictStatusText.textContent = 'Chưa có thông tin cấp vé cho dữ liệu này';
    verdictTicketNumber.textContent = 'N/A';
    verdictName.textContent = '--';
    verdictPhone.textContent = res.query || '--';
    verdictCccd.textContent = '--';
    verdictAgency.textContent = '--';
  }

  function renderAuditTable(logs) {
    const feed = document.getElementById('auditFeedList');
    const tbody = document.getElementById('auditTableBody');
    if (feed) feed.innerHTML = '';
    if (tbody) tbody.innerHTML = '';

    if (!logs || !logs.length) {
      if (feed) feed.innerHTML = '<div style="text-align:center; color:var(--ink-soft); padding:16px;">Chưa có nhật ký phát sinh.</div>';
      if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--ink-soft); padding:16px;">Chưa có nhật ký phát sinh.</td></tr>';
      return;
    }

    logs.forEach(item => {
      const badgeClass = (item.resultCode && (item.resultCode.includes('CONFLICT') || item.resultCode.includes('403'))) ? 'code-err' : 'code-ok';
      // Feed card (mobile)
      if (feed) {
        const card = document.createElement('div');
        card.className = 'feed-card';
        card.innerHTML = \`
          <div class="feed-card-header">
            <span class="feed-time mono">\${item.timeStr || item.timestamp || ''}</span>
            <span class="feed-badge \${badgeClass}">\${item.resultCode || '200 OK'}</span>
          </div>
          <div class="feed-action">\${item.action || ''}</div>
          <div class="feed-detail">\${item.detail || ''} · <span class="mono">\${item.ip || ''}</span></div>
        \`;
        feed.appendChild(card);
      }
      // Table row (desktop)
      if (tbody) {
        const tr = document.createElement('tr');
        tr.innerHTML = \`
          <td class="mono" style="color:var(--bronze-300);">\${item.timeStr || item.timestamp || ''}</td>
          <td><strong>\${item.action || ''}</strong></td>
          <td><span class="feed-badge \${badgeClass}">\${item.resultCode || '200 OK'}</span></td>
          <td class="mono">\${item.ip || ''}</td>
          <td>\${item.detail || ''}</td>
        \`;
        tbody.appendChild(tr);
      }
    });
  }

  lookupForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    performLookup(lookupQuery.value.trim());
  });

  document.querySelectorAll('.quick-sample-chip').forEach(chip => {
    if (chip.id === 'chipClientSession') return;
    chip.addEventListener('click', () => {
      lookupQuery.value = chip.dataset.q;
      performLookup(chip.dataset.q);
    });
  });

  // Tab 2: Seed Pool
  const inputPoolMax = document.getElementById('inputPoolMax');
  const triggerSeedBtn = document.getElementById('triggerSeedBtn');
  const seedConfirmModal = document.getElementById('seedConfirmModal');
  const modalSeedCountPreview = document.getElementById('modalSeedCountPreview');
  const modalSeedModePreview = document.getElementById('modalSeedModePreview');
  const confirmSeedInput = document.getElementById('confirmSeedInput');
  const executeSeedBtn = document.getElementById('executeSeedBtn');
  const cancelSeedBtn = document.getElementById('cancelSeedBtn');

  document.querySelectorAll('.preset-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.preset-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      inputPoolMax.value = pill.dataset.val;
    });
  });

  const labelModeShuffle = document.getElementById('labelModeShuffle');
  const labelModeSequential = document.getElementById('labelModeSequential');
  labelModeShuffle?.addEventListener('click', () => {
    labelModeShuffle.classList.add('checked');
    labelModeSequential.classList.remove('checked');
    labelModeShuffle.querySelector('input').checked = true;
  });
  labelModeSequential?.addEventListener('click', () => {
    labelModeSequential.classList.add('checked');
    labelModeShuffle.classList.remove('checked');
    labelModeSequential.querySelector('input').checked = true;
  });

  triggerSeedBtn?.addEventListener('click', () => {
    const maxVal = inputPoolMax.value || 1000;
    const modeVal = document.querySelector('input[name="seedMode"]:checked')?.value || 'SHUFFLE';
    modalSeedCountPreview.textContent = Number(maxVal).toLocaleString('vi-VN');
    modalSeedModePreview.textContent = modeVal;
    confirmSeedInput.value = '';
    executeSeedBtn.disabled = true;
    executeSeedBtn.style.opacity = '0.5';
    executeSeedBtn.style.cursor = 'not-allowed';
    seedConfirmModal.classList.add('active');
  });

  confirmSeedInput?.addEventListener('input', () => {
    const ready = confirmSeedInput.value.trim().toUpperCase() === 'XÁC NHẬN' || confirmSeedInput.value.trim().toUpperCase() === 'XAC NHAN';
    executeSeedBtn.disabled = !ready;
    executeSeedBtn.style.opacity = ready ? '1' : '0.5';
    executeSeedBtn.style.cursor = ready ? 'pointer' : 'not-allowed';
  });

  cancelSeedBtn?.addEventListener('click', () => seedConfirmModal.classList.remove('active'));

  executeSeedBtn?.addEventListener('click', async () => {
    executeSeedBtn.disabled = true;
    executeSeedBtn.textContent = 'Đang seed...';
    try {
      const poolMax = parseInt(inputPoolMax.value, 10) || 1000;
      const mode = document.querySelector('input[name="seedMode"]:checked')?.value || 'SHUFFLE';
      const res = await apiFetch('/api/admin/config', {
        method: 'POST',
        body: JSON.stringify({ action: 'seed', poolMax, mode })
      });
      if (res && res.success) {
        showToast('Seed Thành Công', res.message || 'Đã nạp kho vé.', 'success');
        playTone('success');
        fetchConfig(true);
      }
    } catch (e) {
      showToast('Lỗi Seed Pool', e.message, 'error');
    } finally {
      seedConfirmModal.classList.remove('active');
      executeSeedBtn.disabled = false;
      executeSeedBtn.textContent = 'Xác Nhận Seed';
    }
  });

  // Nuclear Reset Modal Handlers
  const confirmResetModal = document.getElementById('confirmResetModal');
  const resetConfirmInput = document.getElementById('resetConfirmInput');
  const resetConfirmCheckbox = document.getElementById('resetConfirmCheckbox');
  const executeResetBtn = document.getElementById('executeResetBtn');
  const cancelResetBtn = document.getElementById('cancelResetBtn');
  const triggerResetBtn = document.getElementById('triggerResetBtn');

  function openResetModal() {
    if (resetConfirmInput) resetConfirmInput.value = '';
    if (resetConfirmCheckbox) resetConfirmCheckbox.checked = false;
    checkResetReady();
    confirmResetModal.classList.add('active');
  }

  btnQuickNuclearReset?.addEventListener('click', openResetModal);
  triggerResetBtn?.addEventListener('click', openResetModal);

  function checkResetReady() {
    const val = resetConfirmInput ? resetConfirmInput.value.trim().toUpperCase() : '';
    const textOk = val === 'XÓA HẾT' || val === 'XOA HET';
    const checkOk = resetConfirmCheckbox && resetConfirmCheckbox.checked;
    const ready = textOk && checkOk;
    if (executeResetBtn) {
      executeResetBtn.disabled = !ready;
      executeResetBtn.style.opacity = ready ? '1' : '0.5';
      executeResetBtn.style.cursor = ready ? 'pointer' : 'not-allowed';
    }
  }

  resetConfirmInput?.addEventListener('input', checkResetReady);
  resetConfirmCheckbox?.addEventListener('change', checkResetReady);
  cancelResetBtn?.addEventListener('click', () => confirmResetModal.classList.remove('active'));

  executeResetBtn?.addEventListener('click', async () => {
    executeResetBtn.disabled = true;
    executeResetBtn.textContent = '⏳ Đang xóa...';
    try {
      const poolMaxVal = parseInt(inputPoolMax.value, 10) || 1000;
      const modeVal = document.querySelector('input[name="seedMode"]:checked')?.value || 'SHUFFLE';
      const data = await apiFetch('/api/admin/config', {
        method: 'POST',
        body: JSON.stringify({ action: 'reset', confirm: 'XÓA HẾT', poolMax: poolMaxVal, mode: modeVal }),
      });
      if (data && data.success) {
        showToast('Đã Làm Sạch DB', data.message || 'Database đã được dọn sạch.', 'success');
        playTone('success');
        fetchConfig(true);
      } else {
        showToast('Lỗi Thao Tác', data?.message || 'Không thể xóa dữ liệu.', 'error');
      }
    } catch (err) {
      showToast('Lỗi Kết Nối', err.message, 'error');
    } finally {
      confirmResetModal.classList.remove('active');
      executeResetBtn.disabled = false;
      executeResetBtn.textContent = '🗑️ XÓA TOÀN BỘ';
    }
  });

  // Auth Secret Management
  const authModal = document.getElementById('authModal');
  const openAuthModalBtn = document.getElementById('openAuthModalBtn');
  const authKeyDisplay = document.getElementById('authKeyDisplay');
  const adminSecretInput = document.getElementById('adminSecretInput');
  const useDefaultSecretBtn = document.getElementById('useDefaultSecretBtn');
  const toggleSecretVisibilityBtn = document.getElementById('toggleSecretVisibilityBtn');
  const saveAuthBtn = document.getElementById('saveAuthBtn');
  const cancelAuthBtn = document.getElementById('cancelAuthBtn');

  function updateAuthKeyDisplay() {
    const s = getStoredSecret();
    const masked = s.length > 8 ? (s.substring(0, 5) + '***' + s.substring(s.length - 3)) : 'norton_***';
    if (authKeyDisplay) authKeyDisplay.textContent = masked;
  }

  function openAuthModal() {
    adminSecretInput.value = getStoredSecret();
    authModal.classList.add('active');
    adminSecretInput.focus();
  }

  openAuthModalBtn?.addEventListener('click', openAuthModal);
  cancelAuthBtn?.addEventListener('click', () => authModal.classList.remove('active'));
  useDefaultSecretBtn?.addEventListener('click', () => { adminSecretInput.value = DEFAULT_SECRET; });
  toggleSecretVisibilityBtn?.addEventListener('click', () => {
    adminSecretInput.type = adminSecretInput.type === 'password' ? 'text' : 'password';
  });

  saveAuthBtn?.addEventListener('click', () => {
    const val = adminSecretInput.value.trim();
    if (!val) {
      showToast('Thiếu Thông Tin', 'Vui lòng nhập ADMIN_SECRET.', 'warning');
      return;
    }
    localStorage.setItem(STORAGE_SECRET_KEY, val);
    updateAuthKeyDisplay();
    authModal.classList.remove('active');
    showToast('Đã Lưu Token', 'Mã xác thực mới đã được lưu.', 'success');
    fetchConfig(true);
  });

  // Sound Toggle
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIconOn = document.getElementById('soundIconOn');
  const soundIconOff = document.getElementById('soundIconOff');
  soundToggleBtn?.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundIconOn.style.display = soundEnabled ? '' : 'none';
    soundIconOff.style.display = soundEnabled ? 'none' : '';
    showToast(soundEnabled ? 'Bật Âm Thanh' : 'Tắt Âm Thanh', '', 'success');
  });

  // Polling every 3s
  function startPolling() {
    if (pollIntervalId) clearInterval(pollIntervalId);
    pollIntervalId = setInterval(() => fetchConfig(false), 3000);
  }

  // Init
  function initApp() {
    updateAuthKeyDisplay();
    try {
      const raw = sessionStorage.getItem(CLIENT_TICKET_SESSION);
      if (raw) {
        const p = JSON.parse(raw);
        if (p && p.luckyNumber) {
          const chip = document.getElementById('chipClientSession');
          if (chip) {
            chip.style.display = 'inline-block';
            chip.textContent = '⚡ ' + p.name + ' (' + p.luckyNumber + ')';
            chip.addEventListener('click', () => {
              lookupQuery.value = p.cccd || p.phone || p.luckyNumber;
              performLookup(lookupQuery.value);
            });
          }
        }
      }
    } catch (e) {}

    fetchConfig(false);
    startPolling();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, '..', 'admin.html'), adminHtml, 'utf8');
console.log('✅ Generated minimal mobile-friendly admin.html successfully!');
