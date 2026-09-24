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
