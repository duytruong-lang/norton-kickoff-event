## Pattern: Real Scannable QR Codes for Event Check-in Demos
- **Date**: 2026-09-15
- **Mistake**: Using decorative/mock SVG matrix for ticket QR codes instead of real, camera-scannable dynamic QR codes.
- **Root Cause**: Assumed visual representation was sufficient for a kickoff demo without implementing dynamic QR generation and camera-to-URL validation.
- **Rule**: In any event check-in / ticket / lucky draw landing page, ALWAYS generate real scannable QR codes with valid verification query parameters, ensure zero-dependency client-side generation, support canvas export with scannable QR, and provide a dedicated shareable high-res QR for client demo pitching.

## Pattern: CSS aspect-ratio with max-height shrinking container width on Mobile
- **Date**: 2026-09-24
- **Mistake**: Adding `max-height` together with `aspect-ratio` on the hero art container without enforcing `width: 100%`, causing mobile browsers to calculate width = height * aspect-ratio (shrink from 360px down to 312px), leaving an asymmetric 40px gap on the right.
- **Root Cause**: Under CSS Box Sizing 4, `aspect-ratio` transfers height constraint to shrink inline width if inline size is not locked.
- **Rule**: On responsive mobile card layouts, NEVER combine `aspect-ratio` with `max-height` on a container intended to be full-width. Always enforce `width: 100%` and `margin: 0 auto` to maintain 100% alignment with adjacent elements.

## Pattern: Mobile Footer Links Word Wrapping (Rớt hàng chữ lẻ)
- **Date**: 2026-09-24
- **Mistake**: Missing `white-space: nowrap` on footer legal anchor links, causing words ("lệ", "mật", "BTC") to drop onto line 2 on small screens.
- **Root Cause**: Inline flex children without nowrap wrap words individually when container width is constrained.
- **Rule**: Always set `white-space: nowrap` on discrete action/legal links, and use compact font-size (10-10.5px) with small gap (6-8px) on mobile viewports (<480px) to guarantee a clean single-line presentation.

## Pattern: API Contract Mismatch on Admin Dispute Lookup
- **Date**: 2026-09-26
- **Mistake**: The redesigned `admin.html` sent `?q=` instead of `?query=` to `/api/admin/lookup`, and checked for `res.verdict === 'MATCH_FOUND'` and `res.records` instead of `res.matched`, causing all admin lookups to fail with 400 or fail to render results.
- **Root Cause**: During UI redesign/refactoring, frontend API client wrappers were reconstructed with assumed parameter names and payload structure rather than strictly verifying the existing backend route source code.
- **Rule**: Before writing or rewriting any frontend API calls, ALWAYS read the exact backend route handler (`req.query` parameters and `res.json()` payload shape). Add automated syntax/contract tests verifying frontend call signatures against backend expectations before marking tasks complete.

## Pattern: JavaScript Literal Newline in Single-Quoted Confirm Dialogs
- **Date**: 2026-09-26
- **Mistake**: `window.confirm()` strings contained raw newlines inside single quotes (`'⚠️ XÁC NHẬN:\n...'`), causing a silent `SyntaxError: Invalid or unexpected token` that broke the entire script execution in strict mode.
- **Root Cause**: Builder script or text template literal allowed unescaped multi-line text inside single quotes.
- **Rule**: NEVER use raw newlines inside single-quoted (`'...'`) or double-quoted (`"..."`) JavaScript strings. Always explicitly use escaped `\n` or use backtick template literals (`` `...` ``). Run automated `node -c` syntax validation on all inline HTML script tags as a mandatory pre-flight check.

## Pattern: High-Readability On-Site Event ERP (Eliminating Static Metadata & Field Bloat)
- **Date**: 2026-09-26
- **Mistake**: The Google Sheets ERP was bloated with 26 columns, including 12 redundant/boilerplate fields (hardcoded venue/event/project/developer text, split first/last names, duplicate E.164 phone, duplicate replay status, server latencies) that forced MCs and on-site check-in staff to horizontally scroll through clutter on iPads/mobile devices.
- **Root Cause**: Over-engineering by dumping all internal telemetry and static metadata into the spreadsheet without distinguishing between on-site human operational needs and backend technical tracking.
- **Rule**: On-site event ERP sheets must be strictly divided into 2 visual zones: Zone A (Operations: Time, Ticket #, Name, Phone, CCCD, Agency, Email, Status) visible immediately on 1 screen without scrolling, and Zone B (Tech/Audit: Lead ID, Receipt ID, CAPI Event ID, IP, UA) placed to the right. Never dump hardcoded static metadata (project name, developer name) across thousands of rows.

## Pattern: Unverified Asset Paths in HTML Templates
- **Date**: 2026-09-26
- **Mistake**: `admin.html` referenced `assets/logo-norton-park-official.png` which did not exist on disk, causing a broken image icon with alt text to render in the cockpit top bar.
- **Root Cause**: Builder script referenced a fictional asset filename instead of inspecting `assets/` to find the existing official file (`logo-norton-park-white.png`).
- **Rule**: NEVER hardcode image asset filenames without checking `ls assets/` first. Ensure all image tags have an existing source file and provide explicit `height`, `width: auto`, and `max-width` CSS constraints to prevent layout shifts.

## Pattern: Mobile-Friendly Cockpit & Prevent Deformed Pill Badges on Narrow Screens (<430px)
- **Date**: 2026-09-27
- **Mistake**: Flexible horizontal containers (Hero Gate Card row, Top Bar, Action Pills) squeezed status badges into deformed circles and broke short text into 2-3 single-word lines on 360px-430px mobile screens.
- **Root Cause**: Reliance on horizontal flex without media query breakpoints; missing `white-space: nowrap` and `flex-shrink: 0` on badges and button pills; multi-word labels inside small grid cells.
- **Rule**: For mobile admin cockpits (<640px), convert high-importance action cards to stacked column layouts with full-width (100%) touch buttons (thumb-friendly >=44px height). Always add `white-space: nowrap` to status badges, pills, and tab buttons. Keep micro-copy ultra-concise (1-2 words) to prevent text clipping.

## Pattern: Primary Deduplication Key Shift (CCCD 6-Digit vs Phone Number)
- **Date**: 2026-10-01
- **Mistake**: Relying on phone number as the primary idempotency key allowed an attendee with multiple SIM cards to claim multiple lucky tickets, violating the Gamuda Land 1 person = 1 ticket rule.
- **Root Cause**: Phone was used as the natural primary key early on due to easy validation, while CCCD was merely a secondary indexed set (`reg:cccd4:*`).
- **Rule**: In high-stakes lucky draw events, the legal unique identifier (CCCD/CMND) MUST be the primary Redis key (`reg:cccd6:{clean6Id}`). Phone numbers must only exist as a reverse lookup pointer (`idx:phone:{phoneLocal}` -> `clean6Id`). When changing idempotency keys, update all automated test suites, sheet reconciliation scripts, and add pattern `idx:*` to nuclear reset routines.

## Pattern: Clean URL Client-Side Password Gate vs URL Query Secrets for Admin
- **Date**: 2026-10-01
- **Mistake**: Enforcing URL query parameters (`?secret=...`) for server-side HTML rendering exposed credentials in browser history, bookmarks, and screen shares, while preventing clean bookmarking of `/admin`.
- **Root Cause**: Coupling the admin HTML page delivery with backend API authentication secrets.
- **Rule**: Serve the admin HTML shell cleanly on `/admin` without query secrets, gate the view client-side with a password modal (`sessionStorage` session lifecycle), and strictly enforce API tokens (`ADMIN_SECRET` in `Authorization` / `x-admin-secret` headers) on backend serverless API routes.

## Pattern: Print-Ready QR Codes for Event Standees & Collaterals
- **Date**: 2026-10-01
- **Mistake**: AI image generation models generate non-functional/unscannable QR art that cannot be read by smartphone cameras.
- **Root Cause**: Diffusion models treat QR codes as pixel textures rather than mathematical Reed-Solomon error correction matrices.
- **Rule**: NEVER rely on AI-generated QR codes for physical event collateral. Always use deterministic QR code libraries (`qrcode` npm) with Error Correction Level H (30% damage tolerance), dark high-contrast branding colors, export both 1024x1024 PNG and scalable SVG vector formats, and test camera scanning before sending to print.

## Pattern: Google Sheets Number Type Coercion Stripping Leading Zeros on Phone Numbers
- **Date**: 2026-10-01
- **Mistake**: Google Apps Script `appendRow` auto-coerced phone strings (e.g. `"0909008810"`) into JavaScript numbers (`909008810`), causing Google Sheets to display phone numbers without the leading zero.
- **Root Cause**: Default cell format in Google Sheets is "Automatic", which drops leading zeros from digit-only strings when appended.
- **Rule**: In Google Sheets ERPs, always enforce Plain Text (`@`) or a fixed 10-digit number pattern (`0000000000`) on phone number columns across the entire column. In Apps Script webhook handlers, explicitly call `cell.setNumberFormat('@').setValue(phone)` and provide a self-repairing `setupSheetStyle()` routine that checks and restores the leading `0` on existing rows.

