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
